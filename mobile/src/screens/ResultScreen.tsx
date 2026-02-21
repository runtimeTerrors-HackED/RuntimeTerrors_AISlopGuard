import { useMutation } from "@tanstack/react-query";
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { submitVote, updateCreatorList } from "../api/scan";
import { ScanResultCard } from "../components/ScanResultCard";
import { useTheme } from "../hooks/useTheme";
import { ThemeColors } from "../constants/theme";
import { RootStackParamList } from "../navigation/types";
import { useAppStore } from "../store/appStore";

type Props = NativeStackScreenProps<RootStackParamList, "Result">;

export function ResultScreen({ route }: Props) {
  const { result } = route.params;
  const colors = useTheme();
  const styles = makeStyles(colors);
  const userFingerprint = useAppStore((state) => state.userFingerprint);

  const voteMutation = useMutation({
    mutationFn: submitVote,
    onSuccess: () => Alert.alert("Thanks", "Your feedback has been recorded."),
  });

  const listMutation = useMutation({
    mutationFn: updateCreatorList,
    onSuccess: () => Alert.alert("Updated", "Your creator list preference is saved."),
  });

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <ScanResultCard result={result} />

      <View style={styles.section}>
        <Text style={styles.sectionLabel}>Creator</Text>
        <Pressable
          style={styles.actionButton}
          onPress={() =>
            listMutation.mutate({ creatorId: result.creatorId, userFingerprint, listType: "allow" })
          }
        >
          <Text style={styles.actionText}>Always Allow This Creator</Text>
        </Pressable>
        <Pressable
          style={[styles.actionButton, styles.dangerButton]}
          onPress={() =>
            listMutation.mutate({ creatorId: result.creatorId, userFingerprint, listType: "block" })
          }
        >
          <Text style={[styles.actionText, styles.dangerText]}>Always Block This Creator</Text>
        </Pressable>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionLabel}>Improve the model</Text>
        <View style={styles.voteRow}>
          <Pressable
            style={[styles.voteButton, { backgroundColor: colors.dangerDim, borderColor: colors.danger + "35" }]}
            onPress={() =>
              voteMutation.mutate({ contentId: result.contentId, userFingerprint, vote: "ai" })
            }
          >
            <Text style={[styles.voteText, { color: colors.danger }]}>AI</Text>
          </Pressable>
          <Pressable
            style={[styles.voteButton, { backgroundColor: colors.successDim, borderColor: colors.success + "35" }]}
            onPress={() =>
              voteMutation.mutate({ contentId: result.contentId, userFingerprint, vote: "not_ai" })
            }
          >
            <Text style={[styles.voteText, { color: colors.success }]}>Human</Text>
          </Pressable>
          <Pressable
            style={[styles.voteButton, { borderColor: colors.panelBorder }]}
            onPress={() =>
              voteMutation.mutate({ contentId: result.contentId, userFingerprint, vote: "unsure" })
            }
          >
            <Text style={[styles.voteText, { color: colors.subtext }]}>Unsure</Text>
          </Pressable>
        </View>
      </View>
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
      gap: 14,
      paddingBottom: 48,
    },
    section: {
      backgroundColor: colors.panel,
      borderWidth: 1,
      borderColor: colors.panelBorder,
      borderRadius: 16,
      padding: 16,
      gap: 10,
    },
    sectionLabel: {
      color: colors.subtext,
      fontSize: 11,
      fontWeight: "600",
      textTransform: "uppercase",
      letterSpacing: 0.8,
      marginBottom: 2,
    },
    actionButton: {
      borderColor: colors.panelBorder,
      borderWidth: 1,
      borderRadius: 10,
      paddingVertical: 13,
      paddingHorizontal: 14,
    },
    dangerButton: {
      borderColor: colors.danger + "35",
      backgroundColor: colors.dangerDim,
    },
    actionText: {
      color: colors.text,
      fontWeight: "500",
      fontSize: 14,
    },
    dangerText: {
      color: colors.danger,
    },
    voteRow: {
      flexDirection: "row",
      gap: 8,
    },
    voteButton: {
      flex: 1,
      borderWidth: 1,
      borderRadius: 10,
      paddingVertical: 13,
      alignItems: "center",
    },
    voteText: {
      fontSize: 13,
      fontWeight: "600",
    },
  });
}
