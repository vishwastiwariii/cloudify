import { apiFetch } from "./client";
import type { ApiFolder, FileListResponse } from "./types";

export function listFolders() {
  return apiFetch<ApiFolder[]>("/folders");
}

export function getFolder(folderId: string) {
  return apiFetch<ApiFolder>(`/folders/${folderId}`);
}

export function createFolder(dto: { name: string; parentId?: string }) {
  return apiFetch<ApiFolder>("/folders", { method: "POST", body: dto });
}

export function updateFolder(folderId: string, name: string) {
  return apiFetch<ApiFolder>(`/folders/${folderId}`, { method: "PATCH", body: { name } });
}

export function moveFolder(folderId: string, parentId: string) {
  return apiFetch<ApiFolder[]>(`/folders/${folderId}/move`, { method: "POST", body: { folderId, parentId } });
}

export function deleteFolder(folderId: string) {
  return apiFetch<{ count: number }>(`/folders/${folderId}`, { method: "DELETE" });
}

export function listFolderFiles(folderId: string, params: { search?: string; page?: number; limit?: number } = {}) {
  const query = new URLSearchParams();
  if (params.search) query.set("search", params.search);
  if (params.page) query.set("page", String(params.page));
  if (params.limit) query.set("limit", String(params.limit));
  const qs = query.toString();
  return apiFetch<FileListResponse>(`/folders/${folderId}/files${qs ? `?${qs}` : ""}`);
}
