import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { submitVote, updateCreatorList } from "../api/scan";
import { ScanResultCard } from "../components/ScanResultCard";
import { colors } from "../constants/theme";
import { RootStackParamList } from "../navigation/types";
import { useAppStore } from "../store/appStore";

type Props = NativeStackScreenProps<RootStackParamList, "Result">;

export function ResultScreen({ route }: Props) {
  const { result } = route.params;
  const userFingerprint = useAppStore((state) => state.userFingerprint);
  const queryClient = useQueryClient();

  const voteMutation = useMutation({
    mutationFn: submitVote,
    onSuccess: () => Alert.alert("Thanks", "Your feedback has been recorded."),
  });

  const listMutation = useMutation({
    mutationFn: updateCreatorList,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["creatorList", userFingerprint] });
      Alert.alert("Updated", "Your creator list preference is saved.");
    },
  });

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <ScanResultCard result={result} />

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <Pressable
          style={styles.actionButton}
          onPress={() =>
            listMutation.mutate({
              creatorId: result.creatorId,
              userFingerprint,
              listType: "allow",
            })
          }
        >
          <Text style={styles.actionText}>Always Allow This Creator</Text>
        </Pressable>
        <Pressable
          style={[styles.actionButton, styles.dangerButton]}
          onPress={() =>
            listMutation.mutate({
              creatorId: result.creatorId,
              userFingerprint,
              listType: "block",
            })
          }
        >
          <Text style={[styles.actionText, styles.dangerText]}>Always Block This Creator</Text>
        </Pressable>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Improve the model</Text>
        <Pressable
          style={styles.actionButton}
          onPress={() =>
            voteMutation.mutate({
              contentId: result.contentId,
              userFingerprint,
              vote: "ai",
            })
          }
        >
          <Text style={styles.actionText}>Mark as AI-generated</Text>
        </Pressable>
        <Pressable
          style={styles.actionButton}
          onPress={() =>
            voteMutation.mutate({
              contentId: result.contentId,
              userFingerprint,
              vote: "not_ai",
            })
          }
        >
          <Text style={styles.actionText}>Mark as Not AI-generated</Text>
        </Pressable>
        <Pressable
          style={styles.actionButton}
          onPress={() =>
            voteMutation.mutate({
              contentId: result.contentId,
              userFingerprint,
              vote: "unsure",
            })
          }
        >
          <Text style={styles.actionText}>Mark as Unsure</Text>
        </Pressable>
      </View>
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
    gap: 16,
  },
  section: {
    backgroundColor: colors.panel,
    borderColor: "#1e293b",
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    gap: 10,
  },
  sectionTitle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: "700",
  },
  actionButton: {
    borderColor: "#334155",
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  dangerButton: {
    borderColor: "#7f1d1d",
    backgroundColor: "#1f1010",
  },
  actionText: {
    color: colors.text,
    fontWeight: "600",
  },
  dangerText: {
    color: "#fca5a5",
  },
});
