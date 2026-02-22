import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { ConfidenceBand, ScanResponse, Verdict } from "../types/api";

export type FeedbackVote = "ai" | "not_ai" | "unsure";
export type BiasSnapshot = {
  global: number;
  creator: number;
};

type ModelScoreSnapshot = {
  raw: number;
  personalized: number;
};

export function makeScanKey(contentId: string, scannedAt: string) {
  return `${contentId}::${scannedAt}`;
}

// We only gate creator-bias re-training within a single app runtime.
// This matches the UX expectation that after restart, prior "seen content" locks should not block updates.
const FEEDBACK_SESSION_SCOPE = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

function makeCreatorContentKey(creatorId: string, contentId: string) {
  return `${creatorId}::${FEEDBACK_SESSION_SCOPE}::${contentId}`;
}

function parseCreatorNameFromUrl(url: string, platform: string) {
  try {
    const parsed = new URL(url);
    const segments = parsed.pathname.split("/").filter(Boolean);
    if (platform === "tiktok") {
      const handle = segments.find((segment) => segment.startsWith("@"));
      if (handle && handle.length > 1) return handle.slice(1);
    }
    if (platform === "instagram") {
      const first = segments[0];
      if (!first) return undefined;
      const reserved = new Set(["p", "reel", "reels", "tv", "stories", "explore"]);
      if (reserved.has(first.toLowerCase())) return undefined;
      return first.replace(/^@/, "");
    }
    if (platform === "youtube") {
      const first = segments[0];
      if (first?.startsWith("@") && first.length > 1) return first.slice(1);
    }
    return undefined;
  } catch {
    return undefined;
  }
}

function deriveCreatorName(result: ScanResponse, contentUrl?: string) {
  if (result.creatorName?.trim()) return result.creatorName.trim();
  const sourceUrl = contentUrl ?? result.contentUrl ?? "";
  if (!sourceUrl) return undefined;
  return parseCreatorNameFromUrl(sourceUrl, result.platform);
}

type PersonalizationState = {
  globalBias: number;
  creatorBias: Record<string, number>;
  creatorNames: Record<string, string>;
  contentFeedback: Record<string, FeedbackVote>;
  scanFeedback: Record<string, FeedbackVote>;
  contentBiasSnapshot: Record<string, BiasSnapshot>;
  creatorBiasContentApplied: Record<string, true>;
  scanModelScores: Record<string, ModelScoreSnapshot>;
  scanContentUrls: Record<string, string>;
  captureScanContext: (result: ScanResponse, contentUrl?: string) => void;
  recordFeedback: (result: ScanResponse, vote: FeedbackVote) => void;
  applyPersonalization: (result: ScanResponse, conservativeMode: boolean) => ScanResponse;
  clearGlobalBias: () => void;
  removeCreatorBias: (creatorId: string) => void;
  resetPersonalization: () => void;
};

const GLOBAL_STEP = 0.01;
const CREATOR_STEP = 0.1;
const GLOBAL_MIN = -1;
const GLOBAL_MAX = 1;
const CREATOR_MIN = -1;
const CREATOR_MAX = 1;

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function predictedLabelFromScore(score: number): Exclude<FeedbackVote, "unsure"> {
  return score >= 0.5 ? "ai" : "not_ai";
}

function correctionDirection(
  predicted: Exclude<FeedbackVote, "unsure">,
  vote: FeedbackVote
) {
  if (vote === "unsure") return 0;
  if (vote === predicted) return 0;
  return vote === "ai" ? 1 : -1;
}

function extractBiasSnapshotFromEvidence(result: ScanResponse): BiasSnapshot | null {
  const settingsLine = result.evidence.find(
    (entry) => entry.source === "settings" && entry.message.startsWith("Personalization bias applied")
  );
  if (!settingsLine) return null;

  const match = settingsLine.message.match(/global:\s*(-?\d+(?:\.\d+)?),\s*creator:\s*(-?\d+(?:\.\d+)?)/i);
  if (!match) return null;

  const global = Number.parseFloat(match[1]);
  const creator = Number.parseFloat(match[2]);
  if (Number.isNaN(global) || Number.isNaN(creator)) return null;

  return { global, creator };
}

function isLowSignalMode(result: ScanResponse) {
  const platformUnavailable =
    result.platformScore === 0.5 &&
    result.evidence.some((item) => item.source === "platform" && item.strength === "low");
  const noCommunityVotes = result.evidence.some(
    (item) => item.source === "community" && item.message.toLowerCase().includes("no community votes yet")
  );
  return platformUnavailable && noCommunityVotes;
}

function decideVerdict(
  finalScore: number,
  conservativeMode: boolean,
  lowSignalMode: boolean
): { verdict: Verdict; confidenceBand: ConfidenceBand } {
  const likelyAiThreshold = conservativeMode ? 0.85 : 0.8;
  const unclearThreshold = lowSignalMode ? 0.45 : conservativeMode ? 0.6 : 0.55;

  if (finalScore >= likelyAiThreshold) {
    return { verdict: "likely_ai", confidenceBand: "high" };
  }
  if (finalScore >= unclearThreshold) {
    return { verdict: "unclear", confidenceBand: "medium" };
  }
  return { verdict: "likely_human", confidenceBand: "low" };
}

export const usePersonalizationStore = create<PersonalizationState>()(
  persist(
    (set, get) => ({
      globalBias: 0,
      creatorBias: {},
      creatorNames: {},
      contentFeedback: {},
      scanFeedback: {},
      contentBiasSnapshot: {},
      creatorBiasContentApplied: {},
      scanModelScores: {},
      scanContentUrls: {},
      captureScanContext: (result, contentUrl) => {
        const state = get();
        const creatorId = result.creatorId;
        const scanKey = makeScanKey(result.contentId, result.scannedAt);
        const rawModelScore = result.rawModelScore ?? result.modelScore;
        const snapshotFromResult = extractBiasSnapshotFromEvidence(result);
        const creatorBiasAtScan = state.creatorBias[creatorId] ?? 0;
        const biasSnapshot = snapshotFromResult ?? {
          global: state.globalBias,
          creator: creatorBiasAtScan,
        };
        const creatorName = deriveCreatorName(result, contentUrl);
        const nextCreatorNames = creatorName
          ? {
              ...state.creatorNames,
              [creatorId]: creatorName,
            }
          : state.creatorNames;

        set({
          contentBiasSnapshot: {
            ...state.contentBiasSnapshot,
            [scanKey]: state.contentBiasSnapshot[scanKey] ?? biasSnapshot,
          },
          scanModelScores: {
            ...state.scanModelScores,
            [scanKey]: {
              raw: rawModelScore,
              personalized: result.modelScore,
            },
          },
          scanContentUrls: contentUrl
            ? {
                ...state.scanContentUrls,
                [scanKey]: contentUrl,
              }
            : state.scanContentUrls,
          creatorNames: nextCreatorNames,
        });
      },
      recordFeedback: (result, vote) => {
        const state = get();
        const rawModelScore = result.rawModelScore ?? result.modelScore;
        const predicted = predictedLabelFromScore(rawModelScore);
        const contentId = result.contentId;
        const creatorId = result.creatorId;
        const creatorContentKey = makeCreatorContentKey(creatorId, contentId);
        const scanKey = makeScanKey(contentId, result.scannedAt);
        const creatorName = deriveCreatorName(result);
        const nextCreatorNames = creatorName
          ? {
              ...state.creatorNames,
              [creatorId]: creatorName,
            }
          : state.creatorNames;
        const snapshotFromResult = extractBiasSnapshotFromEvidence(result);
        const existingSnapshot =
          state.contentBiasSnapshot[scanKey] ?? state.contentBiasSnapshot[contentId];
        const creatorBiasAtVote = state.creatorBias[creatorId] ?? 0;
        const biasSnapshot =
          existingSnapshot ??
          snapshotFromResult ?? {
            global: state.globalBias,
            creator: creatorBiasAtVote,
          };

        const voteDirection = correctionDirection(predicted, vote);
        const creatorBiasMissing = !(creatorId in state.creatorBias);
        const canApplyCreatorBiasForContent =
          voteDirection !== 0 &&
          (!state.creatorBiasContentApplied[creatorContentKey] || creatorBiasMissing);
        const creatorDirectionDelta = canApplyCreatorBiasForContent ? voteDirection : 0;

        const nextBaseState = {
          contentFeedback: {
            ...state.contentFeedback,
            [contentId]: vote,
          },
          scanFeedback: {
            ...state.scanFeedback,
            [scanKey]: vote,
          },
          contentBiasSnapshot: {
            ...state.contentBiasSnapshot,
            [scanKey]: biasSnapshot,
            [contentId]: state.contentBiasSnapshot[contentId] ?? biasSnapshot,
          },
          creatorNames: nextCreatorNames,
        };

        if (voteDirection === 0 && creatorDirectionDelta === 0) {
          set(nextBaseState);
          return;
        }

        const nextGlobalBias = clamp(
          state.globalBias + voteDirection * GLOBAL_STEP,
          GLOBAL_MIN,
          GLOBAL_MAX
        );
        const currentCreatorBias = state.creatorBias[creatorId] ?? 0;
        const nextCreatorBias = clamp(
          currentCreatorBias + creatorDirectionDelta * CREATOR_STEP,
          CREATOR_MIN,
          CREATOR_MAX
        );

        set({
          ...nextBaseState,
          globalBias: nextGlobalBias,
          creatorBias:
            creatorDirectionDelta === 0
              ? state.creatorBias
              : {
                  ...state.creatorBias,
                  [creatorId]: nextCreatorBias,
                },
          creatorBiasContentApplied:
            creatorDirectionDelta === 0
              ? state.creatorBiasContentApplied
              : {
                  ...state.creatorBiasContentApplied,
                  [creatorContentKey]: true,
                },
        });
      },
      applyPersonalization: (result, conservativeMode) => {
        const state = get();
        const creatorAdjustment = state.creatorBias[result.creatorId] ?? 0;
        const totalModelBias = state.globalBias + creatorAdjustment;
        const baseModelScore = result.rawModelScore ?? result.modelScore;
        const hasUserListOverride = result.evidence.some((item) => item.source === "user_list");
        const filteredEvidence = result.evidence.filter(
          (item) =>
            !(item.source === "settings" && item.message.startsWith("Personalization bias applied"))
        );

        if (hasUserListOverride) {
          return {
            ...result,
            rawModelScore: baseModelScore,
            modelScore: baseModelScore,
          };
        }

        if (Math.abs(totalModelBias) < 1e-9) {
          const nextEvidence = filteredEvidence.map((item) => {
            if (item.source !== "model") return item;
            return {
              ...item,
              message: `Model score ${baseModelScore.toFixed(2)} (raw; no personalization delta). Higher the model score, higher the likelihood that the model thinks the content is AI Slop. Model Score is just one factor of the final score calculated above. Vote down below if you think the model score seems wrong.`,
            };
          });
          return {
            ...result,
            rawModelScore: baseModelScore,
            modelScore: baseModelScore,
            evidence: [
              ...nextEvidence,
              {
                source: "settings",
                strength: "low",
                message: `Personalization bias applied (global: ${state.globalBias.toFixed(2)}, creator: ${creatorAdjustment.toFixed(2)}).`,
              },
            ],
          };
        }

        const adjustedModelForDecision = clamp(baseModelScore + totalModelBias, 0, 1);
        const adjustedFinalScore = clamp(
          0.5 * result.platformScore + 0.3 * result.communityScore + 0.2 * adjustedModelForDecision,
          0,
          1
        );
        const { verdict, confidenceBand } = decideVerdict(
          adjustedFinalScore,
          conservativeMode,
          isLowSignalMode(result)
        );

        const nextEvidence = filteredEvidence.map((item) => {
          if (item.source !== "model") return item;
          return {
            ...item,
            message: `Model score ${adjustedModelForDecision.toFixed(2)} (personalized; raw ${baseModelScore.toFixed(2)}). Higher the model score, higher the likelihood that the model thinks the content is AI Slop. Model Score is just one factor of the final score calculated above. Vote down below if you think the model score seems wrong.`,
          };
        });

        return {
          ...result,
          rawModelScore: baseModelScore,
          modelScore: adjustedModelForDecision,
          finalScore: adjustedFinalScore,
          verdict,
          confidenceBand,
          evidence: [
            ...nextEvidence,
            {
              source: "settings",
              strength: "low",
              message: `Personalization bias applied (global: ${state.globalBias.toFixed(2)}, creator: ${creatorAdjustment.toFixed(2)}).`,
            },
          ],
        };
      },
      clearGlobalBias: () =>
        set({
          globalBias: 0,
        }),
      removeCreatorBias: (creatorId) => {
        const state = get();
        const nextCreatorBias = { ...state.creatorBias };
        const nextCreatorNames = { ...state.creatorNames };
        const nextCreatorBiasContentApplied = { ...state.creatorBiasContentApplied };
        delete nextCreatorBias[creatorId];
        delete nextCreatorNames[creatorId];
        for (const key of Object.keys(nextCreatorBiasContentApplied)) {
          if (key.startsWith(`${creatorId}::`)) {
            delete nextCreatorBiasContentApplied[key];
          }
        }
        set({
          creatorBias: nextCreatorBias,
          creatorNames: nextCreatorNames,
          creatorBiasContentApplied: nextCreatorBiasContentApplied,
        });
      },
      resetPersonalization: () =>
        set({
          globalBias: 0,
          creatorBias: {},
          creatorNames: {},
          contentFeedback: {},
          scanFeedback: {},
          contentBiasSnapshot: {},
          creatorBiasContentApplied: {},
          scanModelScores: {},
          scanContentUrls: {},
        }),
    }),
    {
      name: "ai-content-guardian-personalization",
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
