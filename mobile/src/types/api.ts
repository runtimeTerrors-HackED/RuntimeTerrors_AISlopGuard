export type Verdict = "likely_ai" | "unclear" | "likely_human";
export type ConfidenceBand = "high" | "medium" | "low";

export type EvidenceItem = {
  source: "platform" | "community" | "model" | "user_list" | "settings";
  message: string;
  strength: ConfidenceBand;
};

export type ScanRequest = {
  url: string;
  userFingerprint: string;
  conservativeMode: boolean;
};

export type ScanResponse = {
  contentId: string;
  platform: string;
  canonicalId: string;
  creatorId: string;
  verdict: Verdict;
  finalScore: number;
  confidenceBand: ConfidenceBand;
  platformScore: number;
  communityScore: number;
  modelScore: number;
  evidence: EvidenceItem[];
  scannedAt: string;
};

export type VoteRequest = {
  contentId: string;
  userFingerprint: string;
  vote: "ai" | "not_ai" | "unsure";
};

export type VoteResponse = {
  ok: boolean;
  updatedCommunityScore: number;
};

export type UpdateListRequest = {
  creatorId: string;
  userFingerprint: string;
  listType: "allow" | "block";
};

export type UpdateListResponse = {
  ok: boolean;
};
