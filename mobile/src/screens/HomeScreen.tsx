import { useMutation } from "@tanstack/react-query";
import { useState, useCallback } from "react";
import { useFocusEffect } from "@react-navigation/native";
import Ionicons from "@expo/vector-icons/Ionicons";
import * as Clipboard from "expo-clipboard";
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
import { useResolvedThemeMode, useTheme } from "../hooks/useTheme";
import { ThemeColors } from "../constants/theme";
import { useAppStore } from "../store/appStore";
import { RootStackParamList } from "../navigation/types";
import AppLogo from "../../assets/AISlopGuard-logo.svg";

type Props = NativeStackScreenProps<RootStackParamList, "Home">;
const BLOCKED_ACCENT = "#FFB000";

export function HomeScreen({ navigation }: Props) {
  const [url, setUrl] = useState("");
  const [showScanHint, setShowScanHint] = useState(false);
  const resolvedThemeMode = useResolvedThemeMode();
  const colors = useTheme();
  const styles = makeStyles(colors);
  const userFingerprint = useAppStore((state) => state.userFingerprint);
  const conservativeMode = useAppStore((state) => state.conservativeMode);
  const setConservativeMode = useAppStore((state) => state.setConservativeMode);
  const setThemeMode = useAppStore((state) => state.setThemeMode);

  const scanMutation = useMutation({
    mutationFn: scanContent,
    onSuccess: (result) => navigation.navigate("Result", { result }),
  });

  useFocusEffect(
    useCallback(() => {
      setUrl("");
      setShowScanHint(false);
      scanMutation.reset();
    }, [])
  );

  const canScan = !!url.trim() && !scanMutation.isPending;

  const handlePasteFromClipboard = async () => {
    const clipboardText = await Clipboard.getStringAsync();
    if (!clipboardText.trim()) {
      return;
    }
    setUrl(clipboardText.trim());
    setShowScanHint(false);
  };

  const handleToggleTheme = () => {
    setThemeMode(resolvedThemeMode === "dark" ? "light" : "dark");
  };

  const handleUrlChange = (value: string) => {
    setUrl(value);
    if (value.trim()) {
      setShowScanHint(false);
    }
  };

  const handleScanPress = () => {
    if (!url.trim()) {
      setShowScanHint(true);
      return;
    }
    if (scanMutation.isPending) {
      return;
    }
    setShowScanHint(false);
    scanMutation.mutate({ url, userFingerprint, conservativeMode });
  };

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <View style={styles.container}>
        <Pressable
          style={({ pressed }) => [
            styles.themeToggleButton,
            pressed && styles.buttonPressed,
          ]}
          android_ripple={{ color: "rgba(255,255,255,0.08)", borderless: true }}
          onPress={handleToggleTheme}
          accessibilityRole="button"
          accessibilityLabel={
            resolvedThemeMode === "dark"
              ? "Switch to light mode"
              : "Switch to dark mode"
          }
          accessibilityHint="Changes app appearance between light and dark themes"
        >
          <Ionicons
            name={resolvedThemeMode === "dark" ? "sunny-outline" : "moon-outline"}
            size={18}
            color={colors.text}
          />
        </Pressable>

        {/* Brand */}
        <View style={styles.brand}>
          <AppLogo
            width={199}
            height={72}
            style={styles.logoSvg}
            accessible
            accessibilityRole="image"
            accessibilityLabel="AISlopGuard logo"
          />
          <Text style={styles.tagline}>
            Detect AI-generated videos and images{"\n"}from any social media link.
          </Text>
        </View>

        {/* Form */}
        <View style={styles.form}>
          <TextInput
            value={url}
            onChangeText={handleUrlChange}
            placeholder="Paste a YouTube, Instagram or TikTok link..."
            placeholderTextColor={colors.placeholder}
            accessibilityLabel="Content URL input"
            accessibilityHint="Paste a YouTube, Instagram, or TikTok link to scan"
            style={styles.input}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="url"
            multiline={false}
          />

          {/* Paste from clipboard button */}
          <Pressable
            style={({ pressed }) => [
              styles.pasteButton,
              pressed && styles.buttonPressed,
            ]}
            android_ripple={{ color: "rgba(255,255,255,0.08)", borderless: false }}
            onPress={handlePasteFromClipboard}
            accessibilityRole="button"
            accessibilityLabel="Paste from clipboard"
            accessibilityHint="Pastes text from your clipboard into the URL input"
          >
            <Text style={styles.pasteButtonText}>Paste from Clipboard</Text>
          </Pressable>

          <View style={styles.switchRow}>
            <View>
              <Text style={styles.switchLabel}>Conservative mode</Text>
              <Text style={styles.switchCaption}>Fewer false positives</Text>
            </View>
            <Switch
              value={conservativeMode}
              onValueChange={setConservativeMode}
              accessibilityLabel="Conservative mode"
              accessibilityHint="When enabled, reduces false positives"
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
              pressed && styles.buttonPressed,
            ]}
            android_ripple={{ color: "rgba(255,255,255,0.15)", borderless: false }}
            onPress={handleScanPress}
            accessibilityRole="button"
            accessibilityLabel="Scan content"
            accessibilityHint="Runs AI-content detection for the pasted link"
            accessibilityState={{ disabled: !canScan, busy: scanMutation.isPending }}
          >
            <View
              style={[
                styles.scanButtonFace,
                canScan ? styles.scanButtonFaceEnabled : styles.scanButtonFaceDisabled,
              ]}
            >
              <View style={styles.scanButtonContent}>
                {scanMutation.isPending ? (
                  <ActivityIndicator
                    color={canScan ? colors.primary : colors.subtext}
                    size="small"
                  />
                ) : (
                  <>
                    <Ionicons
                      name="sparkles-outline"
                      size={16}
                      color={canScan ? colors.primary : colors.subtext}
                      style={styles.secondaryIcon}
                    />
                    <Text
                      style={[
                        styles.scanButtonText,
                        canScan ? styles.scanButtonTextEnabled : styles.scanButtonTextDisabled,
                      ]}
                    >
                      Scan Content
                    </Text>
                  </>
                )}
              </View>
            </View>
          </Pressable>
          {showScanHint ? (
            <View style={styles.scanHintRow}>
              <Ionicons
                name="information-circle-outline"
                size={14}
                color={colors.subtext}
                style={styles.scanHintIcon}
              />
              <Text style={styles.scanHintText}>Paste a link above to enable scanning.</Text>
            </View>
          ) : null}

          <View style={styles.secondaryRow}>
            <Pressable
              style={({ pressed }) => [
                styles.secondaryButton,
                pressed && styles.buttonPressed,
              ]}
              android_ripple={{ color: "rgba(255,255,255,0.08)", borderless: false }}
              onPress={() => navigation.navigate("History")}
              accessibilityRole="button"
              accessibilityLabel="View scan history"
              accessibilityHint="Opens your previous scans"
            >
              <View style={[styles.secondaryButtonFace, styles.historyButton]}>
                <View style={styles.secondaryButtonContent}>
                  <Ionicons
                    name="time-outline"
                    size={16}
                    color={colors.primary}
                    style={styles.secondaryIcon}
                  />
                  <Text style={[styles.secondaryButtonText, styles.historyButtonText]}>
                    History
                  </Text>
                </View>
              </View>
            </Pressable>
            <Pressable
              style={({ pressed }) => [
                styles.secondaryButton,
                pressed && styles.buttonPressed,
              ]}
              android_ripple={{ color: "rgba(255,255,255,0.08)", borderless: false }}
              onPress={() => navigation.navigate("Blacklist")}
              accessibilityRole="button"
              accessibilityLabel="View blocked creators"
              accessibilityHint="Opens your blocked creators list"
            >
              <View style={[styles.secondaryButtonFace, styles.blockedButton]}>
                <View style={styles.secondaryButtonContent}>
                  <Ionicons
                    name="shield-outline"
                    size={16}
                    color={BLOCKED_ACCENT}
                    style={styles.secondaryIcon}
                  />
                  <Text style={[styles.secondaryButtonText, styles.blockedButtonText]}>
                    Blocked
                  </Text>
                </View>
              </View>
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
      paddingTop: 90,
      paddingBottom: 36,
      gap: 28,
    },
    brand: {
      gap: 10,
      paddingBottom: 4,
      alignItems: "center",
    },
    logoSvg: {
      marginBottom: 4,
      alignSelf: "center",
    },
    themeToggleButton: {
      position: "absolute",
      top: 45,
      right: 15,
      width: 40,
      height: 40,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: colors.panelBorder,
      backgroundColor: colors.panel,
      alignItems: "center",
      justifyContent: "center",
      zIndex: 10,
    },
    tagline: {
      color: colors.subtext,
      fontSize: 15,
      lineHeight: 22,
      textAlign: "center",
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
    pasteButton: {
      backgroundColor: colors.panel,
      borderWidth: 1,
      borderColor: colors.panelBorder,
      paddingVertical: 12,
      borderRadius: 12,
      alignItems: "center",
    },
    pasteButtonText: {
      color: colors.text,
      fontWeight: "500",
      fontSize: 14,
    },
    actions: {
      gap: 10,
      // marginTop: "auto",
    },
    scanButton: {
      alignItems: "stretch",
      justifyContent: "center",
    },
    scanButtonFace: {
      borderWidth: 1,
      borderColor: colors.panelBorder,
      borderRadius: 6,
      alignItems: "center",
      justifyContent: "center",
      transform: [{ skewX: "-16deg" }],
    },
    scanButtonContent: {
      flexDirection: "row",
      alignItems: "center",
      paddingVertical: 16,
      paddingHorizontal: 16,
      transform: [{ skewX: "16deg" }],
    },
    scanButtonFaceEnabled: {
      borderColor: colors.primary + "66",
      backgroundColor: colors.primaryDim,
    },
    scanButtonFaceDisabled: {
      backgroundColor: colors.panel,
    },
    scanButtonTextEnabled: {
      color: colors.primary,
    },
    scanButtonTextDisabled: {
      color: colors.subtext,
    },
    scanButtonText: {
      fontWeight: "600",
      fontSize: 15,
      letterSpacing: 0.1,
    },
    scanHintRow: {
      flexDirection: "row",
      alignItems: "center",
      alignSelf: "center",
      marginTop: 2,
    },
    scanHintIcon: {
      marginRight: 4,
    },
    scanHintText: {
      color: colors.subtext,
      fontSize: 12,
    },
    secondaryRow: {
      flexDirection: "row",
      gap: 10,
    },
    secondaryButton: {
      flex: 1,
    },
    secondaryButtonFace: {
      backgroundColor: colors.panel,
      borderWidth: 1,
      borderColor: colors.panelBorder,
      paddingVertical: 14,
      borderRadius: 6,
      alignItems: "center",
      transform: [{ skewX: "-12deg" }],
    },
    secondaryButtonContent: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 12,
      transform: [{ skewX: "12deg" }],
    },
    secondaryIcon: {
      marginRight: 6,
    },
    historyButton: {
      borderColor: colors.primary + "66",
      backgroundColor: colors.primaryDim,
    },
    blockedButton: {
      borderColor: BLOCKED_ACCENT + "66",
      backgroundColor: "rgba(255,176,0,0.10)",
    },
    secondaryButtonText: {
      color: colors.subtext,
      fontWeight: "500",
      fontSize: 14,
    },
    historyButtonText: {
      color: colors.primary,
    },
    blockedButtonText: {
      color: BLOCKED_ACCENT,
    },
    buttonPressed: {
      opacity: 0.72,
      transform: [{ scale: 0.977 }],
    },
  });
}
