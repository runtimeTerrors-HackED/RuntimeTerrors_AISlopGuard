from dataclasses import dataclass

from app.db.memory_store import store


@dataclass
class CommunitySignal:
    score: float
    message: str
    strength: str


def get_user_vote_weight(user_fingerprint: str) -> float:
    # Beginner-friendly baseline. Replace with trust reputation logic later.
    if user_fingerprint.startswith("trusted_"):
        return 1.5
    return 1.0


def get_community_signal(content_id: str) -> CommunitySignal:
    votes = store.get_votes_for_content(content_id)
    if not votes:
        return CommunitySignal(
            score=0.5,
            message="No community votes yet.",
            strength="low",
        )

    ai_weight = sum(v.weight for v in votes if v.vote == "ai")
    not_ai_weight = sum(v.weight for v in votes if v.vote == "not_ai")
    unsure_weight = sum(v.weight for v in votes if v.vote == "unsure")
    total = ai_weight + not_ai_weight + unsure_weight

    if total == 0:
        return CommunitySignal(
            score=0.5,
            message="Community votes exist, but no weighted signal available yet.",
            strength="low",
        )

    score = (ai_weight + 0.5 * unsure_weight) / total
    strength = "high" if total >= 10 else "medium" if total >= 4 else "low"

    return CommunitySignal(
        score=score,
        message=(
            f"Community weighted votes -> ai: {ai_weight:.1f}, "
            f"not_ai: {not_ai_weight:.1f}, unsure: {unsure_weight:.1f}"
        ),
        strength=strength,
    )
