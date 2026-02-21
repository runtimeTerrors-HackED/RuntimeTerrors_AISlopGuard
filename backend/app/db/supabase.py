from collections import defaultdict
from dataclasses import dataclass, field
from datetime import datetime, timezone
from typing import Literal

from app.schemas.api import GetListResponse
from supabase import create_client, Client

ListType = Literal["allow", "block"]
VoteType = Literal["ai", "not_ai", "unsure"]

def json_safe(obj):
    if isinstance(obj, datetime):
        return obj.isoformat()
    if isinstance(obj, dict):
        return {k: json_safe(v) for k, v in obj.items()}
    if isinstance(obj, list):
        return [json_safe(v) for v in obj]
    return obj

@dataclass
class CommunityVote:
    content_id: str
    user_fingerprint: str
    vote: VoteType
    weight: float
    created_at: str


@dataclass
class ScanRecord:
    content_id: str
    user_fingerprint: str
    payload: dict
    created_at: str

class SupaStore:
    def __init__(self):
        self.user_lists: dict[str, dict[str, ListType]] = defaultdict(dict)
        self.community_votes: dict[str, dict[str, CommunityVote]] = defaultdict(dict)
        self.scan_history_by_user: dict[str, list[ScanRecord]] = defaultdict(list)
        self.supabase: Client = create_client("https://mmtznevbcwepapjilusz.supabase.co", "sb_secret_7Xyq3nEkZc8w8HQgzb-lPA_vnoJVdXh")

    def set_creator_list(self, user_fingerprint: str, creator_id: str, list_type: ListType):
        self.supabase.table("user_lists").insert({
            "username": user_fingerprint,
            "userlist": {creator_id: list_type}
        }).execute()
        #self.user_lists[user_fingerprint][creator_id] = list_type

    def get_creator_list(self, user_fingerprint: str) -> list[GetListResponse]:
        response = (
            self.supabase
            .table("user_lists")
            .select("userlist")
            .eq("username", user_fingerprint)
            .execute()
        )

        if not response.data:
            return []

        result: list[GetListResponse] = []

        for row in response.data:
            userlist = row["userlist"] or {}
            for creator_id, list_type in userlist.items():
                result.append(
                    GetListResponse(
                        channelID=creator_id,
                        blockType=list_type
                    )
                )

        return result

    def get_creator_list_value(
            self,
            user_fingerprint: str,
            creator_id: str
    ) -> ListType | None:
        response = (
            self.supabase
            .table("user_lists")
            .select("userlist")
            .eq("username", user_fingerprint)
            .execute()
        )

        if not response.data:
            return None

        userlist = response.data[0]["userlist"] or {}
        return userlist.get(creator_id)

    def upsert_vote(self, content_id: str, user_fingerprint: str, vote: VoteType, weight: float):
        self.supabase.table("community_votes").insert({
            "content_id": content_id,
            "data": {user_fingerprint: {
                "content_id": content_id,
                "user_fingerprint": user_fingerprint,
                "vote": vote,
                "weight": weight
            }}
            #"data": {user_fingerprint: CommunityVote(
            #content_id=content_id,
            #user_fingerprint=user_fingerprint,
            #vote=vote,
            #weight=weight)}
        }).execute()

    def get_votes_for_content(self, content_id: str) -> list[CommunityVote]:
        response = (
            self.supabase
            .table("community_votes")
            .select("data")
            .eq("content_id", content_id)
            .execute()
        )

        votes: list[CommunityVote] = []

        for row in response.data or []:
            data = row["data"] or {}
            for v in data.values():
                votes.append(
                    CommunityVote(
                        content_id=v["content_id"],
                        user_fingerprint=v["user_fingerprint"],
                        vote=v["vote"],
                        weight=v["weight"],
                        created_at=v.get(
                            "created_at",
                            datetime.now(timezone.utc).isoformat()
                        )
                    )
                )

        return votes

    def add_scan_history(self, content_id: str, user_fingerprint: str, payload: dict):
        self.supabase.table("scan_history_by_user").insert({
            "username": user_fingerprint,
            "scan_rec": {
                "content_id": content_id,
                "user_fingerprint": user_fingerprint,
                "payload": json_safe(payload),
                "created_at": datetime.now(timezone.utc).isoformat()
            }
        }).execute()

    def get_user_history(self, user_fingerprint: str) -> list[dict]:
        response = (
            self.supabase
            .table("scan_history_by_user")
            .select("scan_rec")
            .eq("username", user_fingerprint)
            .order("scan_rec->>created_at", desc=True)
            .execute()
        )

        history: list[dict] = []

        for row in response.data or []:
            scan_rec = row["scan_rec"]
            if scan_rec and "payload" in scan_rec:
                history.append(scan_rec["payload"])

        return history


store = SupaStore()
