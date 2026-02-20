from dataclasses import dataclass
from typing import Literal

import requests

from app.core.config import settings
from app.services.url_parser import ParsedContent

SignalStrength = Literal["high", "medium", "low"]


@dataclass
class PlatformSignal:
    score: float
    message: str
    strength: SignalStrength


def _youtube_synthetic_signal(video_id: str) -> PlatformSignal:
    if not settings.youtube_api_key:
        return PlatformSignal(
            score=0.5,
            message="YouTube API key not configured, platform signal unavailable.",
            strength="low",
        )

    endpoint = "https://www.googleapis.com/youtube/v3/videos"
    params = {"part": "status", "id": video_id, "key": settings.youtube_api_key}

    try:
        response = requests.get(endpoint, params=params, timeout=5)
        response.raise_for_status()
        payload = response.json()
    except Exception:
        return PlatformSignal(
            score=0.5,
            message="Could not fetch YouTube disclosure signal in time.",
            strength="low",
        )

    items = payload.get("items", [])
    if not items:
        return PlatformSignal(
            score=0.5,
            message="No YouTube metadata found for this content.",
            strength="low",
        )

    status = items[0].get("status", {})
    contains_synthetic = status.get("containsSyntheticMedia")
    if contains_synthetic is True:
        return PlatformSignal(
            score=1.0,
            message="YouTube containsSyntheticMedia is true.",
            strength="high",
        )

    if contains_synthetic is False:
        return PlatformSignal(
            score=0.2,
            message="YouTube containsSyntheticMedia is false.",
            strength="high",
        )

    return PlatformSignal(
        score=0.5,
        message="YouTube synthetic disclosure not available for this video.",
        strength="low",
    )


def get_platform_signal(parsed_content: ParsedContent) -> PlatformSignal:
    if parsed_content.platform == "youtube":
        return _youtube_synthetic_signal(parsed_content.canonical_id)

    return PlatformSignal(
        score=0.5,
        message=f"No strong platform disclosure available for {parsed_content.platform}.",
        strength="low",
    )
