import { Linking, Image, Pressable, StyleSheet, Text, View, useWindowDimensions } from "react-native";
import { useTheme } from "../hooks/useTheme";
import { ThemeColors } from "../constants/theme";
import { ScanResponse } from "../types/api";
import { confidenceLabel, verdictColor, verdictLabel } from "../utils/verdict";
import { type BiasSnapshot, type FeedbackVote } from "../store/personalizationStore";

type Props = {
  result: ScanResponse;
  appliedBiasSnapshot?: BiasSnapshot;
  historyMeta?: {
    vote?: FeedbackVote;
    biasSnapshot?: BiasSnapshot;
    contentUrl?: string;
    rawModelScore?: number;
    personalizedModelScore?: number;
  };
};

function VerdictPill({ verdict, final_score, colors }: { verdict: ScanResponse["verdict"]; final_score: number; colors: ThemeColors }) {
  const color = verdictColor(verdict, colors, final_score);
  const label = verdictLabel(verdict, final_score);
  return (
    <View style={[pillStyles.pill, { backgroundColor: color + "18", borderColor: color + "30" }]}>
      <View style={[pillStyles.dot, { backgroundColor: color }]} />
      <Text style={[pillStyles.text, { color }]}>{label}</Text>
    </View>
  );
}

const pillStyles = StyleSheet.create({
  pill: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    borderWidth: 1,
    borderRadius: 100,
    paddingHorizontal: 12,
    paddingVertical: 6,
    gap: 7,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  text: {
    fontSize: 13,
    fontWeight: "600",
    letterSpacing: 0.1,
  },
});

function fallbackContentUrl(result: ScanResponse) {
  if (!result.canonicalId) return undefined;
  if (result.platform === "youtube") {
    return `https://www.youtube.com/watch?v=${result.canonicalId}`;
  }
  if (result.platform === "instagram") {
    return `https://www.instagram.com/${result.canonicalId.replace(/_/g, "/")}`;
  }
  if (result.platform === "tiktok") {
    return `https://www.tiktok.com/${result.canonicalId.replace(/_/g, "/")}`;
  }
  return undefined;
}

function voteLabel(vote?: FeedbackVote) {
  if (!vote) return "Not voted";
  if (vote === "ai") return "AI";
  if (vote === "not_ai") return "Human";
  return "Unsure";
}

function signed(value: number) {
  return `${value > 0 ? "+" : ""}${value.toFixed(2)}`;
}

export function ScanResultCard({ result, appliedBiasSnapshot, historyMeta }: Props) {
  const colors = useTheme();
  const styles = makeStyles(colors);
  const { width } = useWindowDimensions();
  const imgWidth = width - 48 - 32;
  const imgHeight = Math.round(imgWidth * (9 / 16));
  const rawModelScore = historyMeta?.rawModelScore ?? result.rawModelScore ?? result.modelScore;
  const personalizedModelScore = historyMeta?.personalizedModelScore ?? result.modelScore;
  const resolvedContentUrl = historyMeta?.contentUrl ?? result.contentUrl ?? fallbackContentUrl(result);
  const creatorDisplayName = result.creatorName?.trim() || result.creatorId;
  const effectiveBiasSnapshot = historyMeta?.biasSnapshot ?? appliedBiasSnapshot;
  const hasModelDelta = Math.abs(personalizedModelScore - rawModelScore) > 1e-6;
  const scannedAtLabel = Number.isNaN(Date.parse(result.scannedAt))
    ? result.scannedAt
    : new Date(result.scannedAt).toLocaleString();
  const appliedBiasText = effectiveBiasSnapshot
    ? `Global ${signed(effectiveBiasSnapshot.global)} | Creator ${signed(effectiveBiasSnapshot.creator)} | Total ${signed(effectiveBiasSnapshot.global + effectiveBiasSnapshot.creator)}`
    : "No bias snapshot";

  const isBlocked = result.evidence.some(
    (e) => e.source === "user_list" && e.message.toLowerCase().includes("block")
  );

  return (
    <View style={styles.card}>
      {result.platform === "youtube" && result.canonicalId ? (
        <Image
          source={{ uri: `https://img.youtube.com/vi/${result.canonicalId}/hqdefault.jpg` }}
          style={[styles.thumbnail, { width: imgWidth, height: imgHeight }]}
          resizeMode="cover"
        />
      ) : null}

      {isBlocked ? (
        <View style={styles.blockedBanner}>
          <View style={[styles.pillDot, { backgroundColor: colors.danger }]} />
          <Text style={[styles.blockedText, { color: colors.danger }]}>
            This creator is blocked
          </Text>
        </View>
      ) : (
        <>
          <VerdictPill verdict={result.verdict} final_score={result.finalScore} colors={colors} />
          <View style={styles.statsRow}>
            <View style={styles.stat}>
              <Text style={styles.statValue}>{(result.finalScore * 100).toFixed(0)}%</Text>
              <Text style={styles.statLabel}>AI Score</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.stat}>
              <Text style={styles.statValue}>{confidenceLabel(result.confidenceBand)}</Text>
              <Text style={styles.statLabel}>Confidence</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.stat}>
              <Text style={styles.statValue}>{result.platform}</Text>
              <Text style={styles.statLabel}>Platform</Text>
            </View>
          </View>
          <View style={styles.modelRow}>
            <View style={styles.modelStat}>
              <Text style={styles.modelValue}>{rawModelScore.toFixed(2)}</Text>
              <Text style={styles.modelLabel}>Raw model</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.modelStat}>
              <Text style={styles.modelValue}>{personalizedModelScore.toFixed(2)}</Text>
              <Text style={styles.modelLabel}>
                {hasModelDelta ? "Personalized model" : "Model (no bias)"}
              </Text>
            </View>
          </View>
          {effectiveBiasSnapshot ? (
            <View style={styles.biasRow}>
              <Text style={styles.biasLabel}>Applied bias</Text>
              <Text style={styles.biasValue}>{appliedBiasText}</Text>
            </View>
          ) : null}
        </>
      )}

      {historyMeta ? (
        <View style={styles.historySection}>
          <Text style={styles.historyTitle}>History details</Text>
          <View style={styles.historyItem}>
            <Text style={styles.historyLabel}>Creator</Text>
            <Text style={styles.historyValue}>{creatorDisplayName}</Text>
          </View>
          <View style={styles.historyItem}>
            <Text style={styles.historyLabel}>Content</Text>
            {resolvedContentUrl ? (
              <Pressable onPress={() => void Linking.openURL(resolvedContentUrl)}>
                <Text style={styles.linkText} numberOfLines={1}>
                  {resolvedContentUrl}
                </Text>
              </Pressable>
            ) : (
              <Text style={styles.historyValue}>{result.contentId}</Text>
            )}
          </View>
          <View style={styles.historyItem}>
            <Text style={styles.historyLabel}>Vote</Text>
            <Text style={styles.historyValue}>{voteLabel(historyMeta.vote)}</Text>
          </View>
          <View style={styles.historyItem}>
            <Text style={styles.historyLabel}>Scanned at</Text>
            <Text style={styles.historyValue}>{scannedAtLabel}</Text>
          </View>
          <View style={styles.historyItem}>
            <Text style={styles.historyLabel}>Bias applied to scan</Text>
            <Text style={styles.historyValue}>{appliedBiasText}</Text>
          </View>
        </View>
      ) : null}

      {result.evidence.length > 0 && !isBlocked ? (
        <View style={styles.evidenceSection}>
          <Text style={styles.evidenceTitle}>Evidence</Text>
          {result.evidence.map((e, idx) => (
            <View key={`${e.source}-${idx}`} style={styles.evidenceItem}>
              <Text style={styles.evidenceSource}>{e.source}</Text>
              <Text style={styles.evidenceMessage}>{e.message}</Text>
            </View>
          ))}
        </View>
      ) : null}
    </View>
  );
}

function makeStyles(colors: ThemeColors) {
  return StyleSheet.create({
    card: {
      backgroundColor: colors.panel,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colors.panelBorder,
      padding: 16,
      gap: 14,
      overflow: "hidden",
    },
    thumbnail: {
      borderRadius: 8,
      alignSelf: "center",
    },
    blockedBanner: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      backgroundColor: colors.dangerDim,
      borderWidth: 1,
      borderColor: colors.danger + "35",
      borderRadius: 10,
      paddingHorizontal: 14,
      paddingVertical: 12,
    },
    pillDot: {
      width: 7,
      height: 7,
      borderRadius: 4,
    },
    blockedText: {
      fontSize: 14,
      fontWeight: "600",
    },
    statsRow: {
      flexDirection: "row",
      backgroundColor: colors.bg,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: colors.panelBorder,
      paddingVertical: 14,
    },
    stat: {
      flex: 1,
      alignItems: "center",
      gap: 3,
    },
    statValue: {
      color: colors.text,
      fontSize: 16,
      fontWeight: "600",
      letterSpacing: -0.2,
    },
    statLabel: {
      color: colors.subtext,
      fontSize: 11,
    },
    statDivider: {
      width: 1,
      backgroundColor: colors.panelBorder,
      alignSelf: "stretch",
    },
    modelRow: {
      flexDirection: "row",
      backgroundColor: colors.bg,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: colors.panelBorder,
      paddingVertical: 12,
    },
    modelStat: {
      flex: 1,
      alignItems: "center",
      gap: 2,
    },
    modelValue: {
      color: colors.text,
      fontSize: 15,
      fontWeight: "600",
    },
    modelLabel: {
      color: colors.subtext,
      fontSize: 11,
      textAlign: "center",
      paddingHorizontal: 8,
    },
    biasRow: {
      gap: 4,
      paddingHorizontal: 10,
      paddingVertical: 10,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: colors.panelBorder,
      backgroundColor: colors.bg,
    },
    biasLabel: {
      color: colors.subtext,
      fontSize: 11,
      fontWeight: "600",
      textTransform: "uppercase",
      letterSpacing: 0.5,
    },
    biasValue: {
      color: colors.text,
      fontSize: 12,
      lineHeight: 18,
    },
    historySection: {
      gap: 9,
      padding: 12,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: colors.panelBorder,
      backgroundColor: colors.bg,
    },
    historyTitle: {
      color: colors.subtext,
      fontSize: 11,
      fontWeight: "600",
      textTransform: "uppercase",
      letterSpacing: 0.6,
    },
    historyItem: {
      gap: 3,
    },
    historyLabel: {
      color: colors.subtext,
      fontSize: 11,
      fontWeight: "500",
    },
    historyValue: {
      color: colors.text,
      fontSize: 13,
      lineHeight: 19,
    },
    linkText: {
      color: colors.primary,
      fontSize: 13,
      textDecorationLine: "underline",
    },
    evidenceSection: {
      gap: 10,
    },
    evidenceTitle: {
      color: colors.subtext,
      fontSize: 11,
      fontWeight: "600",
      textTransform: "uppercase",
      letterSpacing: 0.8,
    },
    evidenceItem: {
      gap: 2,
    },
    evidenceSource: {
      color: colors.primary,
      fontSize: 11,
      fontWeight: "600",
      textTransform: "uppercase",
      letterSpacing: 0.4,
    },
    evidenceMessage: {
      color: colors.text,
      fontSize: 14,
      lineHeight: 20,
      opacity: 0.85,
    },
  });
}
