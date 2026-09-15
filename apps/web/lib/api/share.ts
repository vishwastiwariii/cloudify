import { apiFetch } from "./client";
import type { PublicShare, PublicShareDownload } from "./types";

export function createShare(fileId: string, dto: { password?: string; expiresAt?: string } = {}) {
  return apiFetch<PublicShare>(`/files/${fileId}/share`, { method: "POST", body: dto });
}

export function getShare(fileId: string) {
  return apiFetch<PublicShare>(`/files/${fileId}/share`);
}

export function disableShare(fileId: string) {
  return apiFetch<null>(`/files/${fileId}/share`, { method: "DELETE" });
}

export function accessPublicShare(token: string, password?: string) {
  return apiFetch<PublicShareDownload>(`/share/${token}`, {
    method: "POST",
    body: { password },
  });
}
