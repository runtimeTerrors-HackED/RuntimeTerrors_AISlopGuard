from dataclasses import dataclass

import requests

from app.core.config import settings
from app.db.memory_store import store


@dataclass
class CommunitySignal:
    score: float
    message: str
    strength: str
    has_votes: bool


def get_user_vote_weight(user_fingerprint: str) -> float:
    # Beginner-friendly baseline. Replace with trust reputation logic later.
    #if user_fingerprint.startswith("trusted_"):
     #   return 1.5
    return 1.0


def _channel_id_to_handle(channel_id, api_key):
    r = requests.get(
        "https://www.googleapis.com/youtube/v3/channels",
        params={
            "part": "snippet",
            "id": channel_id,
            "key": api_key
        }
    )
    data = r.json()
    if not data.get("items"):
        return None
    return data["items"][0]["snippet"].get("customUrl")

def get_community_signal(content_id: str) -> CommunitySignal:
    inBlockList = False
    inWarnList = False
    if ('youtube' in content_id) and settings.youtube_api_key:
        endpoint = "https://www.googleapis.com/youtube/v3/videos"
        params = {"part": "status,snippet", "id": content_id.split(':')[-1], "key": settings.youtube_api_key}

        try:
            response = requests.get(endpoint, params=params, timeout=5)
            response.raise_for_status()
            payload = response.json()
        except Exception:
            pass

        items = payload.get("items", [])

        snip = items[0].get("snippet", {})
        channelId = snip['channelId']
        handle = _channel_id_to_handle(channelId, settings.youtube_api_key)

        blocklist = requests.get("https://raw.githubusercontent.com/Override92/AiSList/refs/heads/main/AiSList/aislist_blocklist.txt")
        blocklist_parser = [i.lower() for i in blocklist.text.splitlines()]

        if handle in blocklist_parser:
            inBlockList = True
        else:
            warnlist = requests.get("https://raw.githubusercontent.com/Override92/AiSList/refs/heads/main/AiSList/aislist_warnlist.txt")
            warnlist_parser = [i.lower() for i in warnlist.text.splitlines()]

            if handle in warnlist_parser:
                inWarnList = True


    votes = store.get_votes_for_content(content_id)
    if not votes:
        if inBlockList:
            return CommunitySignal(
                score=1.0,
                message="No community votes yet, but channel is in blocklist.",
                strength="high",
                has_votes=False,
            )
        elif inWarnList:
            return CommunitySignal(
                score=0.5,
                message="No community votes yet, but channel is in warnlist.",
                strength="high",
                has_votes=False,
            )
        else:
            return CommunitySignal(
                score=0.5,
                message="No community votes yet.",
                strength="low",
                has_votes=False,
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
            has_votes=True,
        )

    score = (ai_weight + 0.5 * unsure_weight) / total
    if inBlockList:
        score += 3
    elif inWarnList:
        score += 1.5
    strength = "high" if total >= 10 else "medium" if total >= 4 else "low"

    if inBlockList:
        return CommunitySignal(
            score=score,
            message=(
                f"Community weighted votes -> ai: {ai_weight:.1f}, "
                f"not_ai: {not_ai_weight:.1f}, unsure: {unsure_weight:.1f}, channel is in blocklist."
            ),
            strength=strength,
            has_votes=True,
        )
    elif inWarnList:
        return CommunitySignal(
            score=score,
            message=(
                f"Community weighted votes -> ai: {ai_weight:.1f}, "
                f"not_ai: {not_ai_weight:.1f}, unsure: {unsure_weight:.1f}, channel is in warnlist."
            ),
            strength=strength,
            has_votes=True,
        )
    else:
        return CommunitySignal(
            score=score,
            message=(
                f"Community weighted votes -> ai: {ai_weight:.1f}, "
                f"not_ai: {not_ai_weight:.1f}, unsure: {unsure_weight:.1f}"
            ),
            strength=strength,
            has_votes=True,
        )
