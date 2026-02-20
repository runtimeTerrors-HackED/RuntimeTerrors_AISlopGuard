import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { scanContent } from "../api/scan";
import { colors } from "../constants/theme";
import { useAppStore } from "../store/appStore";
import { RootStackParamList } from "../navigation/types";

type Props = NativeStackScreenProps<RootStackParamList, "Home">;

export function HomeScreen({ navigation }: Props) {
  const [url, setUrl] = useState("");
  const userFingerprint = useAppStore((state) => state.userFingerprint);
  const conservativeMode = useAppStore((state) => state.conservativeMode);
  const setConservativeMode = useAppStore((state) => state.setConservativeMode);

  const scanMutation = useMutation({
    mutationFn: scanContent,
    onSuccess: (result) => navigation.navigate("Result", { result }),
  });

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Scan a Reel, Short, Image, or Video Link</Text>
      <Text style={styles.subtitle}>
        Paste a URL from YouTube, Instagram, TikTok, or a direct image/video link.
      </Text>

      <TextInput
        value={url}
        onChangeText={setUrl}
        placeholder="https://youtube.com/shorts/..."
        placeholderTextColor="#64748b"
        style={styles.input}
        autoCapitalize="none"
        autoCorrect={false}
      />

      <View style={styles.switchRow}>
        <Text style={styles.switchLabel}>Conservative mode (fewer false positives)</Text>
        <Switch
          value={conservativeMode}
          onValueChange={setConservativeMode}
          thumbColor={conservativeMode ? colors.primary : "#94a3b8"}
        />
      </View>

      <Pressable
        style={[styles.button, scanMutation.isPending && styles.buttonDisabled]}
        onPress={() => scanMutation.mutate({ url, userFingerprint, conservativeMode })}
        disabled={scanMutation.isPending || !url.trim()}
      >
        {scanMutation.isPending ? (
          <ActivityIndicator color="#0f172a" />
        ) : (
          <Text style={styles.buttonText}>Scan Content</Text>
        )}
      </Pressable>

      {scanMutation.isError ? (
        <Text style={styles.errorText}>
          Scan failed: {(scanMutation.error as Error).message}
        </Text>
      ) : null}

      <Pressable style={styles.secondaryButton} onPress={() => navigation.navigate("History")}>
        <Text style={styles.secondaryButtonText}>Open History</Text>
      </Pressable>

      <Text style={styles.footer}>User ID: {userFingerprint}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: colors.bg,
    gap: 12,
  },
  title: {
    color: colors.text,
    fontSize: 22,
    fontWeight: "700",
  },
  subtitle: {
    color: colors.subtext,
    fontSize: 14,
    lineHeight: 20,
  },
  input: {
    borderColor: "#334155",
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 12,
    color: colors.text,
    backgroundColor: "#0b1220",
  },
  switchRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  switchLabel: {
    color: colors.text,
    fontSize: 14,
    flex: 1,
  },
  button: {
    backgroundColor: colors.primary,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: "#0f172a",
    fontWeight: "700",
    fontSize: 16,
  },
  secondaryButton: {
    borderColor: "#334155",
    borderWidth: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
  },
  secondaryButtonText: {
    color: colors.text,
    fontWeight: "600",
  },
  errorText: {
    color: colors.danger,
  },
  footer: {
    marginTop: "auto",
    color: "#64748b",
    fontSize: 12,
  },
});
