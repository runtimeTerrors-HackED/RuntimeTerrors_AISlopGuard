from dataclasses import dataclass

import requests

from app.core.config import settings
from app.services.url_parser import ParsedContent


@dataclass
class ModelSignal:
    score: float
    message: str
    strength: str


def _looks_like_image(url: str) -> bool:
    lower = url.lower()
    return lower.endswith((".jpg", ".jpeg", ".png", ".webp"))


def get_model_signal(parsed_content: ParsedContent) -> ModelSignal:
    endpoint = "/infer-image" if _looks_like_image(parsed_content.normalized_url) else "/infer-video"
    payload = (
        {"imageUrl": parsed_content.normalized_url}
        if endpoint == "/infer-image"
        else {"videoUrl": parsed_content.normalized_url}
    )

    try:
        response = requests.post(
            f"{settings.model_service_url}{endpoint}",
            json=payload,
            timeout=settings.model_timeout_seconds,
        )
        response.raise_for_status()
        body = response.json()
        score = float(body.get("score", 0.5))
        score = max(0.0, min(1.0, score))
        confidence_band = body.get("confidenceBand", "low")
        return ModelSignal(
            score=score,
            message=f"Model score {score:.2f} ({confidence_band}).",
            strength=confidence_band,
        )
    except Exception:
        return ModelSignal(
            score=0.5,
            message="Model service unavailable, using neutral model score.",
            strength="low",
        )
