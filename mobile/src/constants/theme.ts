export type ThemeColors = {
  bg: string;
  panel: string;
  panelBorder: string;
  text: string;
  subtext: string;
  placeholder: string;
  primary: string;
  primaryDim: string;
  danger: string;
  dangerDim: string;
  warning: string;
  warningDim: string;
  success: string;
  successDim: string;
};

export const darkColors: ThemeColors = {
  bg: "#080b12",
  panel: "#0e1521",
  panelBorder: "#1b2537",
  text: "#eef2f7",
  subtext: "#64768a",
  placeholder: "#374858",
  primary: "#648FFF",
  primaryDim: "rgba(100,143,255,0.12)",
  danger: "#e8474a",
  dangerDim: "rgba(232,71,74,0.12)",
  warning: "#f5a623",
  warningDim: "rgba(245,166,35,0.12)",
  success: "#1db96b",
  successDim: "rgba(29,185,107,0.12)",
};

export const lightColors: ThemeColors = {
  bg: "#f5f7fa",
  panel: "#ffffff",
  panelBorder: "#e4e9f0",
  text: "#0d1520",
  subtext: "#6b7a8d",
  placeholder: "#aab4c0",
  primary: "#648FFF",
  primaryDim: "rgba(100,143,255,0.10)",
  danger: "#e8474a",
  dangerDim: "rgba(232,71,74,0.10)",
  warning: "#f5a623",
  warningDim: "rgba(245,166,35,0.10)",
  success: "#1db96b",
  successDim: "rgba(29,185,107,0.10)",
};

// fallback for files not yet migrated to useTheme
export const colors = darkColors;
