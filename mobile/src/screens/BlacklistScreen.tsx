import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { fetchCreatorList, removeCreatorFromList } from "../api/scan";
import { colors } from "../constants/theme";
import { useAppStore } from "../store/appStore";

export function BlacklistScreen() {
  const userFingerprint = useAppStore((state) => state.userFingerprint);
  const queryClient = useQueryClient();

  const blacklistQuery = useQuery({
    queryKey: ["creatorList", userFingerprint, "block"],
    queryFn: () => fetchCreatorList(userFingerprint, "block"),
  });

  const unblockMutation = useMutation({
    mutationFn: removeCreatorFromList,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["creatorList", userFingerprint] });
      Alert.alert("Updated", "Creator removed from your block list.");
    },
  });

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl refreshing={blacklistQuery.isRefetching} onRefresh={blacklistQuery.refetch} />
      }
    >
      {blacklistQuery.isLoading ? (
        <View style={styles.centered}>
          <ActivityIndicator color={colors.primary} />
          <Text style={styles.loadingText}>Loading blocked creators...</Text>
        </View>
      ) : null}

      {blacklistQuery.isError ? (
        <Text style={styles.error}>
          Could not load block list: {(blacklistQuery.error as Error).message}
        </Text>
      ) : null}

      {!blacklistQuery.isLoading && blacklistQuery.data?.length === 0 ? (
        <Text style={styles.empty}>No blocked creators yet.</Text>
      ) : null}

      {blacklistQuery.data?.map((item) => (
        <View key={item.creatorId} style={styles.blockedRow}>
          <View style={styles.blockedInfo}>
            <Text style={styles.creatorLabel}>Creator</Text>
            <Text style={styles.creatorId}>{item.creatorId}</Text>
          </View>
          <Pressable
            style={[styles.unblockButton, unblockMutation.isPending && styles.buttonDisabled]}
            onPress={() =>
              unblockMutation.mutate({
                userFingerprint,
                creatorId: item.creatorId,
              })
            }
            disabled={unblockMutation.isPending}
          >
            <Text style={styles.unblockText}>Unblock</Text>
          </Pressable>
        </View>
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
  blockedRow: {
    backgroundColor: colors.panel,
    borderColor: "#1e293b",
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    gap: 10,
  },
  blockedInfo: {
    gap: 4,
  },
  creatorLabel: {
    color: colors.subtext,
    fontSize: 12,
    textTransform: "uppercase",
  },
  creatorId: {
    color: colors.text,
    fontSize: 15,
    fontWeight: "600",
  },
  unblockButton: {
    alignSelf: "flex-start",
    borderColor: "#334155",
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  unblockText: {
    color: colors.text,
    fontWeight: "600",
  },
  buttonDisabled: {
    opacity: 0.7,
  },
});
