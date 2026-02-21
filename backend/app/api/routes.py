from typing import Literal

from fastapi import APIRouter, Query

from app.db.supabase import store
from app.schemas.api import (
    ScanRequest,
    ScanResponse,
    UpdateListRequest,
    UpdateListResponse,
    VoteRequest,
    VoteResponse, ListType, GetListRequest, GetListResponse,
)
from app.services.community import get_community_signal, get_user_vote_weight
from app.services.scan_orchestrator import run_scan

router = APIRouter(prefix="/api", tags=["api"])


@router.get("/health")
def health():
    return {"ok": True}


@router.post("/scan", response_model=ScanResponse)
def scan_content(payload: ScanRequest):
    return run_scan(
        url=payload.url,
        user_fingerprint=payload.userFingerprint,
        conservative_mode=payload.conservativeMode,
    )


@router.post("/vote", response_model=VoteResponse)
def vote_content(payload: VoteRequest):
    weight = get_user_vote_weight(payload.userFingerprint)
    store.upsert_vote(
        content_id=payload.contentId,
        user_fingerprint=payload.userFingerprint,
        vote=payload.vote,
        weight=weight,
    )
    updated = get_community_signal(payload.contentId)
    return VoteResponse(ok=True, updatedCommunityScore=updated.score)


@router.post("/list", response_model=UpdateListResponse)
def update_creator_list(payload: UpdateListRequest):
    store.set_creator_list(
        user_fingerprint=payload.userFingerprint,
        creator_id=payload.creatorId,
        list_type=payload.listType,
    )
    return UpdateListResponse(ok=True)

@router.get("/list", response_model=list[GetListResponse])
def get_history(userFingerprint: GetListRequest):
    rows = store.get_creator_list(userFingerprint.userFingerprint)
    return rows

@router.get("/history", response_model=list[ScanResponse])
def get_history(userFingerprint: str = Query(min_length=3)):
    rows = store.get_user_history(userFingerprint)
    return [ScanResponse(**row) for row in rows]
