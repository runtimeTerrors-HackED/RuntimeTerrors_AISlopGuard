import { useMutation } from "@tanstack/react-query";
import { useEffect, useLayoutEffect, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { updateCreatorList, removeCreatorFromList } from "../api/scan";
import { ScanResultCard } from "../components/ScanResultCard";
import { useTheme } from "../hooks/useTheme";
import { ThemeColors } from "../constants/theme";
import { RootStackParamList } from "../navigation/types";
import { useAppStore } from "../store/appStore";
import { makeScanKey, usePersonalizationStore } from "../store/personalizationStore";

type Props = NativeStackScreenProps<RootStackParamList, "Result">;
type VoteOption = "ai" | "not_ai" | "unsure";

export function ResultScreen({ route, navigation }: Props) {
  const { result, contentUrl } = route.params;
  const colors = useTheme();
  const styles = makeStyles(colors);
  const userFingerprint = useAppStore((state) => state.userFingerprint);
  const scanKey = makeScanKey(result.contentId, result.scannedAt);
  const recordFeedback = usePersonalizationStore((state) => state.recordFeedback);
  const captureScanContext = usePersonalizationStore((state) => state.captureScanContext);
  const appliedBiasSnapshot = usePersonalizationStore(
    (state) => state.contentBiasSnapshot[scanKey] ?? state.contentBiasSnapshot[result.contentId]
  );

  const alreadyBlocked = result.evidence.some(
    (e) => e.source === "user_list" && e.message.toLowerCase().includes("block")
  );

  const [selectedVote, setSelectedVote] = useState<VoteOption | null>(null);
  const [isBlocked, setIsBlocked] = useState(alreadyBlocked);

  const blockMutation = useMutation({ mutationFn: updateCreatorList });
  const unblockMutation = useMutation({ mutationFn: removeCreatorFromList });

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <Pressable
          onPress={() => navigation.goBack()}
          style={({ pressed }) => ({
            opacity: pressed ? 0.5 : 1,
            marginRight: 1,
            width: 32,
            height: 32,
            alignItems: "center",
            justifyContent: "center",
          })}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <Ionicons name="checkmark-sharp" size={22} color={colors.primary} style={{ transform: [{ translateX: 1 }] }} />
        </Pressable>
      ),
    });
  }, [navigation, colors]);

  useEffect(() => {
    captureScanContext(result, contentUrl ?? result.contentUrl ?? undefined);
  }, [captureScanContext, contentUrl, result]);

  const handleVote = (vote: VoteOption) => {
    setSelectedVote(vote);
    recordFeedback(result, vote);
  };

  const handleBlockToggle = () => {
    if (isBlocked) {
      setIsBlocked(false);
      unblockMutation.mutate({ creatorId: result.creatorId, userFingerprint });
    } else {
      setIsBlocked(true);
      blockMutation.mutate({ creatorId: result.creatorId, userFingerprint, listType: "block" });
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <ScanResultCard result={result} appliedBiasSnapshot={appliedBiasSnapshot} />

      <View style={styles.section}>
        <Text style={styles.sectionLabel}>Creator</Text>

        <Pressable
          style={({ pressed }) => [
            styles.creatorButton,
            pressed && styles.buttonPressed,
          ]}
          android_ripple={{ color: "rgba(232,71,74,0.15)", borderless: false }}
          onPress={handleBlockToggle}
        >
          <View style={[styles.creatorButtonFace, isBlocked && styles.creatorButtonFaceBlocked]}>
            <View style={styles.creatorButtonContent}>
              <Text style={[styles.creatorButtonText, isBlocked && { color: colors.danger }]}>
                {isBlocked ? "Unblock This Creator" : "Block This Creator"}
              </Text>
              {isBlocked && <View style={[styles.selectedDot, { backgroundColor: colors.danger }]} />}
            </View>
          </View>
        </Pressable>
      </View>

      {!isBlocked && <View style={styles.section}>
        <Text style={styles.sectionLabel}>Improve the model - Only select an option if the model score is unexpected, not the final score</Text>
        <View style={styles.voteRow}>

          <Pressable
            style={({ pressed }) => [
              styles.voteButton,
              pressed && styles.buttonPressed,
            ]}
            android_ripple={{ color: "rgba(255,100,100,0.2)", borderless: false }}
            onPress={() => handleVote("ai")}
          >
            <View
              style={[
                styles.voteButtonFace,
                selectedVote === "ai"
                  ? { backgroundColor: colors.danger, borderColor: colors.danger }
                  : { backgroundColor: colors.panel, borderColor: colors.panelBorder },
              ]}
            >
              <View style={styles.voteButtonContent}>
                <Text style={[styles.voteText, { color: selectedVote === "ai" ? "#fff" : colors.danger }]}>
                  AI
                </Text>
              </View>
            </View>
          </Pressable>

          <Pressable
            style={({ pressed }) => [
              styles.voteButton,
              pressed && styles.buttonPressed,
            ]}
            android_ripple={{ color: "rgba(100,255,150,0.2)", borderless: false }}
            onPress={() => handleVote("not_ai")}
          >
            <View
              style={[
                styles.voteButtonFace,
                selectedVote === "not_ai"
                  ? { backgroundColor: colors.success, borderColor: colors.success }
                  : { backgroundColor: colors.panel, borderColor: colors.panelBorder },
              ]}
            >
              <View style={styles.voteButtonContent}>
                <Text style={[styles.voteText, { color: selectedVote === "not_ai" ? "#fff" : colors.success }]}>
                  Human
                </Text>
              </View>
            </View>
          </Pressable>

          <Pressable
            style={({ pressed }) => [
              styles.voteButton,
              pressed && styles.buttonPressed,
            ]}
            android_ripple={{ color: "rgba(255,255,255,0.1)", borderless: false }}
            onPress={() => handleVote("unsure")}
          >
            <View
              style={[
                styles.voteButtonFace,
                selectedVote === "unsure"
                  ? { backgroundColor: colors.subtext, borderColor: colors.subtext }
                  : { backgroundColor: colors.panel, borderColor: colors.panelBorder },
              ]}
            >
              <View style={styles.voteButtonContent}>
                <Text style={[styles.voteText, { color: selectedVote === "unsure" ? "#fff" : colors.subtext }]}>
                  Unsure
                </Text>
              </View>
            </View>
          </Pressable>
        </View>
      </View>}

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
    creatorButton: {
      alignItems: "stretch",
    },
    creatorButtonFace: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      borderWidth: 1,
      borderColor: colors.panelBorder,
      borderRadius: 10,
      paddingVertical: 13,
      paddingHorizontal: 14,
      backgroundColor: colors.panel,
      transform: [{ skewX: "-12deg" }],
    },
    creatorButtonFaceBlocked: {
      borderColor: colors.danger,
      backgroundColor: colors.dangerDim,
    },
    creatorButtonContent: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      transform: [{ skewX: "12deg" }],
      width: "100%",
    },
    creatorButtonText: {
      color: colors.text,
      fontWeight: "500",
      fontSize: 14,
    },
    selectedDot: {
      width: 7,
      height: 7,
      borderRadius: 4,
    },
    voteRow: {
      flexDirection: "row",
      gap: 8,
    },
    voteButton: {
      flex: 1,
      alignItems: "stretch",
    },
    voteButtonFace: {
      borderWidth: 1,
      borderRadius: 10,
      paddingVertical: 13,
      alignItems: "center",
      justifyContent: "center",
      transform: [{ skewX: "-12deg" }],
    },
    voteButtonContent: {
      transform: [{ skewX: "12deg" }],
    },
    voteText: {
      fontSize: 13,
      fontWeight: "600",
    },
    buttonPressed: {
      opacity: 0.72,
      transform: [{ scale: 0.977 }],
    },
  });
}
