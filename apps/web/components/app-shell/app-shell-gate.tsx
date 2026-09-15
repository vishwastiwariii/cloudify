"use client";

import { useAppShell } from "@/components/app-shell/app-shell-context";

export function AppShellGate({ children }: { children: React.ReactNode }) {
  const { userLoading, user } = useAppShell();

  if (userLoading || !user) {
    return <div className="flex min-h-screen items-center justify-center text-ink-muted">Loading…</div>;
  }

  return <>{children}</>;
}
