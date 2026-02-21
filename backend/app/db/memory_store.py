from collections import defaultdict
from dataclasses import dataclass, field
from datetime import datetime, timezone
from typing import Literal

ListType = Literal["allow", "block"]
VoteType = Literal["ai", "not_ai", "unsure"]


@dataclass
class CommunityVote:
    content_id: str
    user_fingerprint: str
    vote: VoteType
    weight: float
    created_at: datetime = field(default_factory=lambda: datetime.now(timezone.utc))


@dataclass
class ScanRecord:
    content_id: str
    user_fingerprint: str
    payload: dict
    created_at: datetime = field(default_factory=lambda: datetime.now(timezone.utc))


class MemoryStore:
    def __init__(self):
        self.user_lists: dict[str, dict[str, ListType]] = defaultdict(dict)
        self.community_votes: dict[str, dict[str, CommunityVote]] = defaultdict(dict)
        self.scan_history_by_user: dict[str, list[ScanRecord]] = defaultdict(list)

    def set_creator_list(self, user_fingerprint: str, creator_id: str, list_type: ListType):
        self.user_lists[user_fingerprint][creator_id] = list_type

    def get_creator_list(self, user_fingerprint: str, list_type: ListType | None = None) -> list[dict]:
        entries: list[dict] = []
        for creator_id, creator_list_type in self.user_lists[user_fingerprint].items():
            if list_type is not None and creator_list_type != list_type:
                continue
            entries.append({"creatorId": creator_id, "listType": creator_list_type})
        return entries

    def remove_creator_from_list(self, user_fingerprint: str, creator_id: str):
        self.user_lists[user_fingerprint].pop(creator_id, None)

    def get_creator_list_value(self, user_fingerprint: str, creator_id: str) -> ListType | None:
        return self.user_lists[user_fingerprint].get(creator_id)

    def upsert_vote(self, content_id: str, user_fingerprint: str, vote: VoteType, weight: float):
        self.community_votes[content_id][user_fingerprint] = CommunityVote(
            content_id=content_id,
            user_fingerprint=user_fingerprint,
            vote=vote,
            weight=weight,
        )

    def get_votes_for_content(self, content_id: str) -> list[CommunityVote]:
        return list(self.community_votes[content_id].values())

    def add_scan_history(self, content_id: str, user_fingerprint: str, payload: dict):
        self.scan_history_by_user[user_fingerprint].insert(
            0,
            ScanRecord(content_id=content_id, user_fingerprint=user_fingerprint, payload=payload),
        )
        self.scan_history_by_user[user_fingerprint] = self.scan_history_by_user[user_fingerprint][:100]

    def get_user_history(self, user_fingerprint: str) -> list[dict]:
        return [record.payload for record in self.scan_history_by_user[user_fingerprint]]


store = MemoryStore()
