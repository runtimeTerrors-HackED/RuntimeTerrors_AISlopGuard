import { useQuery } from "@tanstack/react-query";
import { ActivityIndicator, RefreshControl, ScrollView, StyleSheet, Text, View } from "react-native";
import { fetchHistory } from "../api/scan";
import { ScanResultCard } from "../components/ScanResultCard";
import { colors } from "../constants/theme";
import { useAppStore } from "../store/appStore";

export function HistoryScreen() {
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
        <RefreshControl refreshing={historyQuery.isRefetching} onRefresh={historyQuery.refetch} />
      }
    >
      {historyQuery.isLoading ? (
        <View style={styles.centered}>
          <ActivityIndicator color={colors.primary} />
          <Text style={styles.loadingText}>Loading history...</Text>
        </View>
      ) : null}

      {historyQuery.isError ? (
        <Text style={styles.error}>Could not load history: {(historyQuery.error as Error).message}</Text>
      ) : null}

      {!historyQuery.isLoading && historyQuery.data?.length === 0 ? (
        <Text style={styles.empty}>No scans yet. Scan something from the home screen first.</Text>
      ) : null}

      {historyQuery.data?.map((item) => (
        <ScanResultCard key={item.contentId} result={item} />
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  content: {
    padding: 16,
    gap: 12,
  },
  centered: {
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 24,
  },
  loadingText: {
    color: colors.text,
  },
  error: {
    color: colors.danger,
    fontSize: 14,
  },
  empty: {
    color: colors.subtext,
    fontSize: 14,
  },
});
