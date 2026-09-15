import { apiFetch } from "./client";
import type { ApiFile } from "./types";

export function getFile(fileId: string) {
  return apiFetch<ApiFile>(`/files/${fileId}`);
}

export function renameFile(fileId: string, name: string) {
  return apiFetch<ApiFile>(`/files/${fileId}`, { method: "POST", body: { name } });
}

export function moveFile(fileId: string, folderId: string | null) {
  return apiFetch<ApiFile>(`/files/${fileId}/move`, { method: "PATCH", body: { folderId } });
}

export function deleteFile(fileId: string) {
  return apiFetch<ApiFile>(`/files/${fileId}`, { method: "DELETE" });
}

export function getDownloadUrl(fileId: string) {
  return apiFetch<{ downloadUrl: string; expiresAt: string; file: ApiFile }>(`/files/${fileId}/download`);
}
