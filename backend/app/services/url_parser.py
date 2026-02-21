from dataclasses import dataclass
from hashlib import sha1
from urllib.parse import parse_qs, urlparse
import requests

from app.core.config import settings


@dataclass
class ParsedContent:
    platform: str
    canonical_id: str
    creator_id: str
    normalized_url: str

    @property
    def content_id(self) -> str:
        return f"{self.platform}:{self.canonical_id}"


def _youtube_id(url: str) -> str | None:
    parsed = urlparse(url)
    host = parsed.netloc.lower()
    path = parsed.path.strip("/")
    query = parse_qs(parsed.query)

    if "youtu.be" in host and path:
        return path.split("/")[0]

    if "youtube.com" in host:
        if path == "watch" and query.get("v"):
            return query["v"][0]
        if path.startswith("shorts/"):
            return path.split("/")[1]
        if path.startswith("live/"):
            return path.split("/")[1]

    return None


def parse_content(url: str) -> ParsedContent:
    parsed = urlparse(url)
    host = parsed.netloc.lower()

    if "youtube.com" in host or "youtu.be" in host:
        video_id = _youtube_id(url) or sha1(url.encode("utf-8")).hexdigest()[:16]
        channelId = "undefined"
        if settings.youtube_api_key:
            api_get = requests.get(f"https://www.googleapis.com/youtube/v3/videos?part=snippet&id={video_id}&key={settings.youtube_api_key}")
            api_json = api_get.json()
            for item in api_json['items']:
                channelId = item['snippet']['channelId']
                break
        return ParsedContent(
            platform="youtube",
            canonical_id=video_id,
            creator_id=f"youtube_creator_{channelId}",
            normalized_url=url,
        )

    if "instagram.com" in host:
        short_id = parsed.path.strip("/").replace("/", "_") or sha1(url.encode("utf-8")).hexdigest()[:16]
        return ParsedContent(
            platform="instagram",
            canonical_id=short_id,
            creator_id=f"instagram_creator_{short_id[:8]}",
            normalized_url=url,
        )

    if "tiktok.com" in host:
        short_id = parsed.path.strip("/").replace("/", "_") or sha1(url.encode("utf-8")).hexdigest()[:16]
        return ParsedContent(
            platform="tiktok",
            canonical_id=short_id,
            creator_id=f"tiktok_creator_{short_id[:8]}",
            normalized_url=url,
        )

    hashed = sha1(url.encode("utf-8")).hexdigest()[:16]
    return ParsedContent(
        platform="other",
        canonical_id=hashed,
        creator_id=f"creator_{hashed[:8]}",
        normalized_url=url,
    )
