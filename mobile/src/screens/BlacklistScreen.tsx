import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { fetchCreatorList, removeCreatorFromList } from "../api/scan";
import { useTheme } from "../hooks/useTheme";
import { ThemeColors } from "../constants/theme";
import { useAppStore } from "../store/appStore";

export function BlacklistScreen() {
  const colors = useTheme();
  const styles = makeStyles(colors);
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
    },
  });

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl
          refreshing={blacklistQuery.isRefetching}
          onRefresh={blacklistQuery.refetch}
          tintColor={colors.subtext}
        />
      }
    >
      {blacklistQuery.isLoading ? (
        <View style={styles.centered}>
          <ActivityIndicator color={colors.primary} />
          <Text style={styles.centeredText}>Loading...</Text>
        </View>
      ) : null}

      {blacklistQuery.isError ? (
        <View style={styles.centered}>
          <Text style={styles.errorText}>
            {(blacklistQuery.error as Error).message}
          </Text>
        </View>
      ) : null}

      {!blacklistQuery.isLoading && blacklistQuery.data?.length === 0 ? (
        <View style={styles.centered}>
          <Text style={styles.emptyText}>No blocked creators</Text>
          <Text style={styles.emptyCaption}>
            Creators you block will appear here.
          </Text>
        </View>
      ) : null}

      {blacklistQuery.data?.map((item) => (
        <View key={item.creatorId} style={styles.row}>
          <View style={styles.rowFace}>
            <View style={styles.rowContent}>
              <View style={styles.rowInfo}>
                <Text style={styles.rowLabel}>Creator</Text>
                <Text style={styles.rowId} numberOfLines={1}>{item.creatorId}</Text>
              </View>
              <Pressable
                style={({ pressed }) => [
                  styles.unblockButton,
                  pressed && styles.buttonPressed,
                  unblockMutation.isPending && styles.buttonDisabled,
                ]}
                android_ripple={{ color: "rgba(255,255,255,0.08)", borderless: false }}
                onPress={() => unblockMutation.mutate({ userFingerprint, creatorId: item.creatorId })}
                disabled={unblockMutation.isPending}
              >
                <Text style={styles.unblockText}>Unblock</Text>
              </Pressable>
            </View>
          </View>
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
    row: {
      paddingHorizontal: 2,
    },
    rowFace: {
      backgroundColor: colors.panel,
      borderWidth: 1,
      borderColor: colors.panelBorder,
      borderRadius: 8,
      transform: [{ skewX: "-10deg" }],
      overflow: "hidden",
    },
    rowContent: {
      transform: [{ skewX: "10deg" }],
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
    rowId: {
      color: colors.text,
      fontSize: 14,
      fontWeight: "500",
    },
    unblockButton: {
      borderWidth: 1,
      borderColor: colors.panelBorder,
      borderRadius: 8,
      paddingVertical: 7,
      paddingHorizontal: 14,
    },
    unblockText: {
      color: colors.text,
      fontWeight: "500",
      fontSize: 13,
    },
    buttonPressed: {
      opacity: 0.6,
      transform: [{ scale: 0.97 }],
    },
    buttonDisabled: {
      opacity: 0.4,
    },
  });
}
