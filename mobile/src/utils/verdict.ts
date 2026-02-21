import { ConfidenceBand, Verdict } from "../types/api";
import { ThemeColors } from "../constants/theme";

export function verdictLabel(verdict: Verdict) {
  if (verdict === "likely_ai") return "Likely AI-Generated";
  if (verdict === "likely_human") return "Likely Human-Made";
  return "Unclear";
}

export function verdictColor(verdict: Verdict, colors: ThemeColors) {
  if (verdict === "likely_ai") return colors.danger;
  if (verdict === "likely_human") return colors.success;
  return colors.warning;
}

export function confidenceLabel(confidenceBand: ConfidenceBand) {
  if (confidenceBand === "high") return "High";
  if (confidenceBand === "low") return "Low";
  return "Medium";
}
