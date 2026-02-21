import { useColorScheme } from "react-native";
import { darkColors, lightColors, ThemeColors } from "../constants/theme";

export function useTheme(): ThemeColors {
  const scheme = useColorScheme();
  return scheme === "light" ? lightColors : darkColors;
}
