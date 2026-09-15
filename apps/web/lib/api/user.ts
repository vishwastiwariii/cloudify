import { apiFetch } from "./client";
import type { ApiUser } from "./types";

export function getMe() {
  return apiFetch<ApiUser>("/user/me");
}

export function updateName(name: string) {
  return apiFetch<ApiUser>("/user/name", { method: "PATCH", body: { name } });
}

export function updateAvatar(avatarUrl: string) {
  return apiFetch<ApiUser>("/user/avatar", { method: "PATCH", body: { avatarUrl } });
}
