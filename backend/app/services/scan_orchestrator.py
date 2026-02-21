from datetime import datetime, timezone

from app.db.memory_store import store
from app.schemas.api import EvidenceItem, ScanResponse
from app.services.community import get_community_signal
from app.services.model_client import get_model_signal
from app.services.platform_signals import get_platform_signal
from app.services.scoring import calculate_final_score, decide_verdict
from app.services.url_parser import parse_content

def run_scan(url: str, user_fingerprint: str, conservative_mode: bool = True) -> ScanResponse:
    parsed = parse_content(url)
    user_list_value = store.get_creator_list_value(user_fingerprint, parsed.creator_id)

    evidence: list[EvidenceItem] = []

    if user_list_value == "allow":
        response = ScanResponse(
            contentId=parsed.content_id,
            platform=parsed.platform,
            canonicalId=parsed.canonical_id,
            creatorId=parsed.creator_id,
            verdict="likely_human",
            finalScore=0.0,
            confidenceBand="high",
            platformScore=0.0,
            communityScore=0.0,
            modelScore=0.0,
            evidence=[
                EvidenceItem(
                    source="user_list",
                    message="Creator is on your allow list, so content is allowed.",
                    strength="high",
                )
            ],
            scannedAt=datetime.now(timezone.utc),
        )
        store.add_scan_history(response.contentId, user_fingerprint, response.model_dump())
        return response

    if user_list_value == "block":
        response = ScanResponse(
            contentId=parsed.content_id,
            platform=parsed.platform,
            canonicalId=parsed.canonical_id,
            creatorId=parsed.creator_id,
            verdict="likely_ai",
            finalScore=1.0,
            confidenceBand="high",
            platformScore=1.0,
            communityScore=1.0,
            modelScore=1.0,
            evidence=[
                EvidenceItem(
                    source="user_list",
                    message="Creator is on your block list, so content is blocked.",
                    strength="high",
                )
            ],
            scannedAt=datetime.now(timezone.utc),
        )
        store.add_scan_history(response.contentId, user_fingerprint, response.model_dump())
        return response

    platform_signal = get_platform_signal(parsed)
    community_signal = get_community_signal(parsed.content_id)
    model_signal = get_model_signal(parsed)

    evidence.append(
        EvidenceItem(
            source="platform",
            message=platform_signal.message,
            strength=platform_signal.strength,
        )
    )
    evidence.append(
        EvidenceItem(
            source="community",
            message=community_signal.message,
            strength=community_signal.strength,
        )
    )
    evidence.append(
        EvidenceItem(
            source="model",
            message=model_signal.message,
            strength=model_signal.strength,
        )
    )
    evidence.append(
        EvidenceItem(
            source="settings",
            message=(
                "Conservative mode is ON (stricter AI threshold)."
                if conservative_mode
                else "Conservative mode is OFF (faster to label AI)."
            ),
            strength="medium",
        )
    )

    final_score = calculate_final_score(
        platform_score=platform_signal.score,
        community_score=community_signal.score,
        model_score=model_signal.score,
    )
    verdict, confidence_band = decide_verdict(final_score, conservative_mode=conservative_mode)

    response = ScanResponse(
        contentId=parsed.content_id,
        platform=parsed.platform,
        canonicalId=parsed.canonical_id,
        creatorId=parsed.creator_id,
        verdict=verdict,
        finalScore=final_score,
        confidenceBand=confidence_band,
        platformScore=platform_signal.score,
        communityScore=community_signal.score,
        modelScore=model_signal.score,
        evidence=evidence,
        scannedAt=datetime.now(timezone.utc),
    )

    store.add_scan_history(response.contentId, user_fingerprint, response.model_dump())
    return response
