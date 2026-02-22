import { Image, StyleSheet, Text, View, useWindowDimensions } from "react-native";
import { useTheme } from "../hooks/useTheme";
import { ThemeColors } from "../constants/theme";
import { ScanResponse } from "../types/api";
import { confidenceLabel, verdictColor, verdictLabel } from "../utils/verdict";

type Props = {
  result: ScanResponse;
};

function VerdictPill({ verdict, colors }: { verdict: ScanResponse["verdict"]; colors: ThemeColors }) {
  const color = verdictColor(verdict, colors);
  const label = verdictLabel(verdict);
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

export function ScanResultCard({ result }: Props) {
  const colors = useTheme();
  const styles = makeStyles(colors);
  const { width } = useWindowDimensions();
  const imgWidth = width - 48 - 32;
  const imgHeight = Math.round(imgWidth * (9 / 16));

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
          <VerdictPill verdict={result.verdict} colors={colors} />
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
        </>
      )}

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
