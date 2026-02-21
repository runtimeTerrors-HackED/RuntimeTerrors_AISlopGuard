from datetime import datetime
from typing import Literal
from pydantic import BaseModel, Field


Verdict = Literal["likely_ai", "unclear", "likely_human"]
ConfidenceBand = Literal["high", "medium", "low"]
EvidenceSource = Literal["platform", "community", "model", "user_list", "settings"]
VoteType = Literal["ai", "not_ai", "unsure"]
ListType = Literal["allow", "block"]


class ScanRequest(BaseModel):
    url: str = Field(min_length=3)
    userFingerprint: str = Field(min_length=3)
    conservativeMode: bool = True


class EvidenceItem(BaseModel):
    source: EvidenceSource
    message: str
    strength: ConfidenceBand


class ScanResponse(BaseModel):
    contentId: str
    platform: str
    canonicalId: str
    creatorId: str
    verdict: Verdict
    finalScore: float
    confidenceBand: ConfidenceBand
    platformScore: float
    communityScore: float
    modelScore: float
    evidence: list[EvidenceItem]
    scannedAt: datetime


class VoteRequest(BaseModel):
    contentId: str
    userFingerprint: str
    vote: VoteType


class VoteResponse(BaseModel):
    ok: bool
    updatedCommunityScore: float


class UpdateListRequest(BaseModel):
    creatorId: str
    userFingerprint: str
    listType: ListType

class CreatorListEntry(BaseModel):
    creatorId: str
    listType: ListType

class UpdateListResponse(BaseModel):
    ok: bool
