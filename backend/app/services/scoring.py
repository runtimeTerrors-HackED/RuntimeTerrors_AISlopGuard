from app.schemas.api import ConfidenceBand, Verdict


def calculate_final_score(platform_score: float, community_score: float, model_score: float) -> float:
    final_score = (0.50 * platform_score) + (0.30 * community_score) + (0.20 * model_score)
    return max(0.0, min(1.0, final_score))


def decide_verdict(final_score: float, conservative_mode: bool = True) -> tuple[Verdict, ConfidenceBand]:
    likely_ai_threshold = 0.85 if conservative_mode else 0.80
    unclear_threshold = 0.60 if conservative_mode else 0.55

    if final_score >= likely_ai_threshold:
        return "likely_ai", "high"
    if final_score >= unclear_threshold:
        return "unclear", "medium"
    return "likely_human", "low"
