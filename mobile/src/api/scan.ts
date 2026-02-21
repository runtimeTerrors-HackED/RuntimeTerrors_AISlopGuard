import { apiRequest } from "./client";
import {
    GetListRequest, GetListResponse,
    ScanRequest,
    ScanResponse,
    UpdateListRequest,
    UpdateListResponse,
    VoteRequest,
    VoteResponse,
} from "../types/api";

export function scanContent(payload: ScanRequest) {
  return apiRequest<ScanResponse>("/api/scan", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function submitVote(payload: VoteRequest) {
  return apiRequest<VoteResponse>("/api/vote", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function updateCreatorList(payload: UpdateListRequest) {
  return apiRequest<UpdateListResponse>("/api/list", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function getCreatorList(payload: GetListRequest) {
    return apiRequest<GetListResponse>("/api/list", {
        method: "GET",
        body: JSON.stringify(payload),
    });
}

export function fetchHistory(userFingerprint: string) {
  const query = encodeURIComponent(userFingerprint);
  return apiRequest<ScanResponse[]>(`/api/history?userFingerprint=${query}`);
}
