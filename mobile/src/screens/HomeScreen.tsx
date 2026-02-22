import { useMutation } from "@tanstack/react-query";
import { useState, useCallback } from "react";
import { useFocusEffect } from "@react-navigation/native";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { scanContent } from "../api/scan";
import { useTheme } from "../hooks/useTheme";
import { ThemeColors } from "../constants/theme";
import { useAppStore } from "../store/appStore";
import { RootStackParamList } from "../navigation/types";
import AppLogo from "../../assets/AISlopGuard-logo.svg";

type Props = NativeStackScreenProps<RootStackParamList, "Home">;

export function HomeScreen({ navigation }: Props) {
  const [url, setUrl] = useState("");
  const colors = useTheme();
  const styles = makeStyles(colors);
  const userFingerprint = useAppStore((state) => state.userFingerprint);
  const conservativeMode = useAppStore((state) => state.conservativeMode);
  const setConservativeMode = useAppStore((state) => state.setConservativeMode);

  const scanMutation = useMutation({
    mutationFn: scanContent,
    onSuccess: (result) => navigation.navigate("Result", { result }),
  });

  useFocusEffect(
    useCallback(() => {
      setUrl("");
      scanMutation.reset();
    }, [])
  );

  const canScan = !!url.trim() && !scanMutation.isPending;

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <View style={styles.container}>

        {/* Brand */}
        <View style={styles.brand}>
          <AppLogo width={199} height={72} style={styles.logoSvg} />
          <Text style={styles.tagline}>
            Detect AI-generated videos and images{"\n"}from any social media link.
          </Text>
        </View>

        {/* Form */}
        <View style={styles.form}>
          <TextInput
            value={url}
            onChangeText={setUrl}
            placeholder="Paste a YouTube, Instagram or TikTok link..."
            placeholderTextColor={colors.placeholder}
            style={styles.input}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="url"
            multiline={false}
          />

          <View style={styles.switchRow}>
            <View>
              <Text style={styles.switchLabel}>Conservative mode</Text>
              <Text style={styles.switchCaption}>Fewer false positives</Text>
            </View>
            <Switch
              value={conservativeMode}
              onValueChange={setConservativeMode}
              thumbColor="#fff"
              trackColor={{ false: colors.panelBorder, true: colors.primary }}
            />
          </View>

          {scanMutation.isError ? (
            <Text style={styles.errorText}>
              {(scanMutation.error as Error).message}
            </Text>
          ) : null}
        </View>

        {/* Actions */}
        <View style={styles.actions}>
          <Pressable
            style={({ pressed }) => [
              styles.scanButton,
              !canScan && styles.scanButtonDisabled,
              pressed && canScan && styles.buttonPressed,
            ]}
            android_ripple={{ color: "rgba(255,255,255,0.15)", borderless: false }}
            onPress={() =>
              scanMutation.mutate({ url, userFingerprint, conservativeMode })
            }
            disabled={!canScan}
          >
            {scanMutation.isPending ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text style={styles.scanButtonText}>Scan Content</Text>
            )}
          </Pressable>

          <View style={styles.secondaryRow}>
            <Pressable
              style={({ pressed }) => [
                styles.secondaryButton,
                pressed && styles.buttonPressed,
              ]}
              android_ripple={{ color: "rgba(255,255,255,0.08)", borderless: false }}
              onPress={() => navigation.navigate("History")}
            >
              <Text style={styles.secondaryButtonText}>History</Text>
            </Pressable>
            <Pressable
              style={({ pressed }) => [
                styles.secondaryButton,
                pressed && styles.buttonPressed,
              ]}
              android_ripple={{ color: "rgba(255,255,255,0.08)", borderless: false }}
              onPress={() => navigation.navigate("Blacklist")}
            >
              <Text style={styles.secondaryButtonText}>Blocked</Text>
            </Pressable>
          </View>
        </View>

      </View>
    </KeyboardAvoidingView>
  );
}

function makeStyles(colors: ThemeColors) {
  return StyleSheet.create({
    root: {
      flex: 1,
      backgroundColor: colors.bg,
    },
    container: {
      flex: 1,
      paddingHorizontal: 24,
      paddingTop: 32,
      paddingBottom: 36,
      gap: 28,
    },
    brand: {
      gap: 10,
      paddingBottom: 4,
    },
    logoSvg: {
      marginBottom: 4,
    },
    tagline: {
      color: colors.subtext,
      fontSize: 15,
      lineHeight: 22,
    },
    form: {
      gap: 12,
    },
    input: {
      backgroundColor: colors.panel,
      borderWidth: 1,
      borderColor: colors.panelBorder,
      borderRadius: 12,
      paddingHorizontal: 16,
      paddingVertical: 15,
      color: colors.text,
      fontSize: 15,
    },
    switchRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 4,
      paddingVertical: 4,
    },
    switchLabel: {
      color: colors.text,
      fontSize: 14,
      fontWeight: "500",
    },
    switchCaption: {
      color: colors.subtext,
      fontSize: 12,
      marginTop: 2,
    },
    errorText: {
      color: colors.danger,
      fontSize: 13,
      paddingHorizontal: 2,
    },
    actions: {
      gap: 10,
      marginTop: "auto",
    },
    scanButton: {
      backgroundColor: colors.primary,
      paddingVertical: 16,
      borderRadius: 12,
      alignItems: "center",
      shadowColor: colors.primary,
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.3,
      shadowRadius: 14,
      elevation: 5,
    },
    scanButtonDisabled: {
      opacity: 0.35,
      shadowOpacity: 0,
    },
    scanButtonText: {
      color: "#fff",
      fontWeight: "600",
      fontSize: 15,
      letterSpacing: 0.1,
    },
    secondaryRow: {
      flexDirection: "row",
      gap: 10,
    },
    secondaryButton: {
      flex: 1,
      backgroundColor: colors.panel,
      borderWidth: 1,
      borderColor: colors.panelBorder,
      paddingVertical: 14,
      borderRadius: 12,
      alignItems: "center",
    },
    secondaryButtonText: {
      color: colors.subtext,
      fontWeight: "500",
      fontSize: 14,
    },
    buttonPressed: {
      opacity: 0.72,
      transform: [{ scale: 0.977 }],
    },
  });
}
