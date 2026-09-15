import { apiFetch } from "./client";
import type { ApiUser } from "./types";

export function signup(dto: { name: string; email: string; password: string }) {
  return apiFetch<{ user: ApiUser; token: string }>("/auth/signup", { method: "POST", body: dto });
}

export function login(dto: { email: string; password: string }) {
  return apiFetch<{ user: ApiUser; token: string }>("/auth/login", { method: "POST", body: dto });
}

export function logout() {
  return apiFetch<null>("/auth/logout", { method: "POST" });
}
