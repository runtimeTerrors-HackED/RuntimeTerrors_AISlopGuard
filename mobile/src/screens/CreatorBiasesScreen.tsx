import { useQuery } from "@tanstack/react-query";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { fetchHistory } from "../api/scan";
import { ThemeColors } from "../constants/theme";
import { useTheme } from "../hooks/useTheme";
import { useAppStore } from "../store/appStore";
import { makeScanKey, usePersonalizationStore } from "../store/personalizationStore";

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

export function CreatorBiasesScreen() {
  const colors = useTheme();
  const styles = makeStyles(colors);
  const userFingerprint = useAppStore((state) => state.userFingerprint);
  const creatorBias = usePersonalizationStore((state) => state.creatorBias);
  const creatorNames = usePersonalizationStore((state) => state.creatorNames);
  const globalBias = usePersonalizationStore((state) => state.globalBias);
  const removeCreatorBias = usePersonalizationStore((state) => state.removeCreatorBias);
  const clearGlobalBias = usePersonalizationStore((state) => state.clearGlobalBias);
  const scanContentUrls = usePersonalizationStore((state) => state.scanContentUrls);
  const historyQuery = useQuery({
    queryKey: ["history", userFingerprint],
    queryFn: () => fetchHistory(userFingerprint),
  });

  const creatorNamesById = new Map<string, string>();
  for (const [creatorId, name] of Object.entries(creatorNames)) {
    creatorNamesById.set(creatorId, name);
  }
  for (const item of historyQuery.data ?? []) {
    const scanKey = makeScanKey(item.contentId, item.scannedAt);
    const candidateUrl = item.contentUrl ?? scanContentUrls[scanKey];
    const derivedName =
      item.creatorName?.trim() || (candidateUrl ? parseCreatorNameFromUrl(candidateUrl, item.platform) : undefined);
    if (derivedName && !creatorNamesById.has(item.creatorId)) {
      creatorNamesById.set(item.creatorId, derivedName);
    }
  }

  const entries = Object.entries(creatorBias)
    .sort((a, b) => Math.abs(b[1]) - Math.abs(a[1]))
    .map(([creatorId, bias]) => ({ creatorId, bias }));

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.globalCard}>
        <Text style={styles.globalLabel}>Global bias</Text>
        <Text style={styles.globalValue}>{globalBias.toFixed(2)}</Text>
        <Pressable
          style={({ pressed }) => [styles.clearButton, pressed && styles.buttonPressed]}
          onPress={clearGlobalBias}
          android_ripple={{ color: "rgba(255,255,255,0.08)", borderless: false }}
        >
          <Text style={styles.clearButtonText}>Clear Global Bias</Text>
        </Pressable>
      </View>

      {entries.length === 0 ? (
        <View style={styles.emptyWrap}>
          <Text style={styles.emptyText}>No creator-specific biases yet</Text>
          <Text style={styles.emptyCaption}>
            Creator biases will appear here after you correct model votes.
          </Text>
        </View>
      ) : null}

      {entries.map((item) => (
        <View key={item.creatorId} style={styles.row}>
          <View style={styles.rowInfo}>
            <Text style={styles.rowLabel}>Creator</Text>
            <Text style={styles.rowName} numberOfLines={1}>
              {creatorNamesById.get(item.creatorId) ?? item.creatorId}
            </Text>
            {creatorNamesById.get(item.creatorId) ? <Text style={styles.rowId}>{item.creatorId}</Text> : null}
            <Text style={styles.rowBias}>
              Bias: {item.bias > 0 ? "+" : ""}
              {item.bias.toFixed(2)}
            </Text>
          </View>
          <Pressable
            style={({ pressed }) => [styles.removeButton, pressed && styles.buttonPressed]}
            onPress={() => removeCreatorBias(item.creatorId)}
            android_ripple={{ color: "rgba(255,255,255,0.08)", borderless: false }}
          >
            <Text style={styles.removeText}>Remove</Text>
          </Pressable>
        </View>
      ))}
    </ScrollView>
  );
}

function makeStyles(colors: ThemeColors) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.bg,
    },
    content: {
      padding: 24,
      gap: 10,
      paddingBottom: 48,
    },
    globalCard: {
      backgroundColor: colors.panel,
      borderWidth: 1,
      borderColor: colors.panelBorder,
      borderRadius: 14,
      paddingVertical: 14,
      paddingHorizontal: 16,
      gap: 8,
    },
    globalLabel: {
      color: colors.subtext,
      fontSize: 11,
      fontWeight: "600",
      textTransform: "uppercase",
      letterSpacing: 0.6,
    },
    globalValue: {
      color: colors.text,
      fontSize: 20,
      fontWeight: "700",
    },
    clearButton: {
      borderWidth: 1,
      borderColor: colors.panelBorder,
      borderRadius: 8,
      paddingVertical: 8,
      alignItems: "center",
      justifyContent: "center",
    },
    clearButtonText: {
      color: colors.text,
      fontWeight: "500",
      fontSize: 13,
    },
    emptyWrap: {
      alignItems: "center",
      justifyContent: "center",
      gap: 6,
      paddingVertical: 52,
    },
    emptyText: {
      color: colors.text,
      fontSize: 16,
      fontWeight: "600",
    },
    emptyCaption: {
      color: colors.subtext,
      fontSize: 14,
      textAlign: "center",
    },
    row: {
      backgroundColor: colors.panel,
      borderWidth: 1,
      borderColor: colors.panelBorder,
      borderRadius: 14,
      padding: 14,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 12,
    },
    rowInfo: {
      flex: 1,
      gap: 3,
    },
    rowLabel: {
      color: colors.subtext,
      fontSize: 11,
      fontWeight: "600",
      textTransform: "uppercase",
      letterSpacing: 0.6,
    },
    rowName: {
      color: colors.text,
      fontSize: 14,
      fontWeight: "500",
    },
    rowId: {
      color: colors.subtext,
      fontSize: 11,
    },
    rowBias: {
      color: colors.subtext,
      fontSize: 12,
    },
    removeButton: {
      borderWidth: 1,
      borderColor: colors.panelBorder,
      borderRadius: 8,
      paddingVertical: 7,
      paddingHorizontal: 14,
    },
    removeText: {
      color: colors.text,
      fontWeight: "500",
      fontSize: 13,
    },
    buttonPressed: {
      opacity: 0.6,
      transform: [{ scale: 0.97 }],
    },
  });
}
