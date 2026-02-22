import { useColorScheme } from "react-native";
import { darkColors, lightColors, ThemeColors } from "../constants/theme";
import { useAppStore } from "../store/appStore";

export function useResolvedThemeMode(): "light" | "dark" {
  const scheme = useColorScheme();
  const themeMode = useAppStore((state) => state.themeMode);

  if (themeMode === "system") {
    return scheme === "light" ? "light" : "dark";
  }
  return themeMode;
}

export function useTheme(): ThemeColors {
  const mode = useResolvedThemeMode();
  return mode === "light" ? lightColors : darkColors;
}
