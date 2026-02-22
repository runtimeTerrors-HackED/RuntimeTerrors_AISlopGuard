import { apiRequest } from "./client";
import {
  CreatorListEntry,
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

export function fetchHistory(userFingerprint: string) {
  const query = encodeURIComponent(userFingerprint);
  return apiRequest<ScanResponse[]>(`/api/history?userFingerprint=${query}`);
}

export function fetchCreatorList(
  userFingerprint: string,
  listType: "allow" | "block" | null = null
) {
  const params = new URLSearchParams({ userFingerprint });
  if (listType) {
    params.set("listType", listType);
  }
  return apiRequest<CreatorListEntry[]>(`/api/list?${params.toString()}`);
}

type RemoveCreatorListRequest = {
  userFingerprint: string;
  creatorId: string;
};

export function removeCreatorFromList(payload: RemoveCreatorListRequest) {
  const params = new URLSearchParams(payload);
  return apiRequest<UpdateListResponse>(`/api/list?${params.toString()}`, {
    method: "DELETE",
  });
}
