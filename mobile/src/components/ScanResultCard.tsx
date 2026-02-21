import {Image, StyleSheet, Text, View} from "react-native";
import { colors } from "../constants/theme";
import { ScanResponse } from "../types/api";
import { confidenceLabel, verdictColor, verdictLabel } from "../utils/verdict";

type Props = {
  result: ScanResponse;
};

export function ScanResultCard({ result }: Props) {
    if (result.contentId.startsWith("youtube"))
    {
        return (
            <View style={styles.card}>
                <Image source={{uri: `https://img.youtube.com/vi/${result.canonicalId}/default.jpg`}}
                       style={{width: 256, height: 144}} />
                <Text style={[styles.verdict, { color: verdictColor(result.verdict) }]}>
                    {verdictLabel(result.verdict)}
                </Text>
                <Text style={styles.score}>Final Score: {(result.finalScore * 100).toFixed(1)}%</Text>
                <Text style={styles.meta}>
                    Confidence: {confidenceLabel(result.confidenceBand)} | Platform: {result.platform}
                </Text>
                <Text style={styles.sectionTitle}>Why this result</Text>
                {result.evidence.map((evidence, idx) => (
                    <Text style={styles.reason} key={`${evidence.source}-${idx}`}>
                        - [{evidence.source}] {evidence.message} ({evidence.strength})
                    </Text>
                ))}
            </View>
        );
    }
    else
    {
        return (
            <View style={styles.card}>
                <Text style={[styles.verdict, { color: verdictColor(result.verdict) }]}>
                    {verdictLabel(result.verdict)}
                </Text>
                <Text style={styles.score}>Final Score: {(result.finalScore * 100).toFixed(1)}%</Text>
                <Text style={styles.meta}>
                    Confidence: {confidenceLabel(result.confidenceBand)} | Platform: {result.platform}
                </Text>
                <Text style={styles.sectionTitle}>Why this result</Text>
                {result.evidence.map((evidence, idx) => (
                    <Text style={styles.reason} key={`${evidence.source}-${idx}`}>
                        - [{evidence.source}] {evidence.message} ({evidence.strength})
                    </Text>
                ))}
            </View>
        );
    }

}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.panel,
    borderRadius: 12,
    padding: 16,
    gap: 8,
    borderColor: "#1e293b",
    borderWidth: 1,
  },
  verdict: {
    fontSize: 22,
    fontWeight: "700",
  },
  score: {
    color: colors.text,
    fontSize: 16,
    fontWeight: "600",
  },
  meta: {
    color: colors.subtext,
    fontSize: 14,
  },
  sectionTitle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: "600",
    marginTop: 6,
  },
  reason: {
    color: colors.text,
    fontSize: 14,
    lineHeight: 20,
  },
});
