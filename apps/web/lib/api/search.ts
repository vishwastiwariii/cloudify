import { apiFetch } from "./client";
import type { SearchParams, SearchResponse } from "./types";

export function search(params: SearchParams = {}) {
  const query = new URLSearchParams();
  if (params.q) query.set("q", params.q);
  if (params.folderId) query.set("folderId", params.folderId);
  if (params.mimeType) query.set("mimeType", params.mimeType);
  if (params.sortBy) query.set("sortBy", params.sortBy);
  if (params.sortOrder) query.set("sortOrder", params.sortOrder);
  if (params.page) query.set("page", String(params.page));
  if (params.limit) query.set("limit", String(params.limit));
  const qs = query.toString();
  return apiFetch<SearchResponse>(`/search${qs ? `?${qs}` : ""}`);
}
