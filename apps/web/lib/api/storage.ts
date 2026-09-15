import { apiFetch } from "./client";
import type { StorageUsage } from "./types";

export function getStorageUsage() {
  return apiFetch<StorageUsage>("/storage");
}
