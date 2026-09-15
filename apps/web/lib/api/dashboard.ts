import { apiFetch } from "./client";
import type { DashboardResponse } from "./types";

export function getDashboard() {
  return apiFetch<DashboardResponse>("/dashboard");
}
