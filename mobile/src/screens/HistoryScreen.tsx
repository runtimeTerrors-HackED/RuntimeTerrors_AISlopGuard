import { useQuery } from "@tanstack/react-query";
import { ActivityIndicator, RefreshControl, ScrollView, StyleSheet, Text, View } from "react-native";
import { fetchHistory } from "../api/scan";
import { ScanResultCard } from "../components/ScanResultCard";
import { useTheme } from "../hooks/useTheme";
import { ThemeColors } from "../constants/theme";
import { useAppStore } from "../store/appStore";

export function HistoryScreen() {
  const colors = useTheme();
  const styles = makeStyles(colors);
  const userFingerprint = useAppStore((state) => state.userFingerprint);

  const historyQuery = useQuery({
    queryKey: ["history", userFingerprint],
    queryFn: () => fetchHistory(userFingerprint),
  });

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl
          refreshing={historyQuery.isRefetching}
          onRefresh={historyQuery.refetch}
          tintColor={colors.subtext}
        />
      }
    >
      {historyQuery.isLoading ? (
        <View style={styles.centered}>
          <ActivityIndicator color={colors.primary} />
          <Text style={styles.centeredText}>Loading...</Text>
        </View>
      ) : null}

      {historyQuery.isError ? (
        <View style={styles.centered}>
          <Text style={styles.errorText}>
            {(historyQuery.error as Error).message}
          </Text>
        </View>
      ) : null}

      {!historyQuery.isLoading && historyQuery.data?.length === 0 ? (
        <View style={styles.centered}>
          <Text style={styles.emptyText}>No scans yet</Text>
          <Text style={styles.emptyCaption}>
            Scan a link from the home screen to see it here.
          </Text>
        </View>
      ) : null}

      {historyQuery.data?.map((item) => (
        <ScanResultCard key={item.contentId} result={item} />
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
      gap: 12,
      paddingBottom: 48,
    },
    centered: {
      alignItems: "center",
      justifyContent: "center",
      gap: 6,
      paddingVertical: 80,
    },
    centeredText: {
      color: colors.subtext,
      fontSize: 14,
    },
    errorText: {
      color: colors.danger,
      fontSize: 14,
      textAlign: "center",
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
  });
}
