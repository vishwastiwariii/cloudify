"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAppShell } from "@/components/app-shell/app-shell-context";
import { FileIcon } from "@/components/app-shell/file-icon";
import { getDashboard } from "@/lib/api/dashboard";
import { formatBytes, formatRelativeTime, colorForName } from "@/lib/format";
import type { DashboardResponse } from "@/lib/api/types";

export default function DashboardPage() {
  const { openPreview, openUpload, user, filesVersion } = useAppShell();
  const [dashboard, setDashboard] = useState<DashboardResponse | null>(null);
  const firstName = user?.name.split(" ")[0] ?? "";

  useEffect(() => {
    getDashboard().then(setDashboard);
  }, [filesVersion]);

  const percentage = dashboard?.storage.percentage ?? 0;

  return (
    <div className="max-w-285">
      <h1 className="font-display text-[clamp(30px,3.4vw,42px)] leading-[1.05] tracking-[-0.02em]">
        Afternoon, {firstName}.
      </h1>
      <p className="mt-3 text-[17px] text-ink-soft">Here&apos;s what&apos;s new in your workspace.</p>

      <div className="mt-7.5 grid gap-5 [grid-template-columns:repeat(auto-fit,minmax(230px,1fr))]">
        <div className="rounded-[26px] border border-[#e9e1ce] bg-paper p-6 shadow-[0_30px_60px_-48px_rgba(35,26,10,0.7)]">
          <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-muted">Storage used</p>
          <p className="mt-3 font-display text-[34px] leading-none">
            {dashboard ? formatBytes(dashboard.storage.used) : "…"}{" "}
            <span className="text-[17px] text-ink-muted">of {dashboard ? formatBytes(dashboard.storage.limit) : "…"}</span>
          </p>
          <div className="mt-3.5 h-2.25 overflow-hidden rounded-full bg-[#eae1cd]">
            <span className="block h-full rounded-full bg-rust" style={{ width: `${percentage}%` }} />
          </div>
        </div>
        <div className="rounded-[26px] border border-[#e9e1ce] bg-paper p-6 shadow-[0_30px_60px_-48px_rgba(35,26,10,0.7)]">
          <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-muted">Files &amp; folders</p>
          <p className="mt-3 font-display text-[34px] leading-none">{dashboard?.statistics.files ?? "…"}</p>
          <p className="mt-2.5 text-sm text-ink-soft">{dashboard?.statistics.folder ?? "…"} folders</p>
        </div>
      </div>

      <button
        onClick={openUpload}
        className="mt-5.5 w-full rounded-[26px] border-2 border-dashed border-[#c9bea2] bg-paper-warm p-7.5 text-center transition-colors duration-200 hover:border-rust hover:bg-paper-soft"
      >
        <p className="font-display text-xl">Drop files or folders here</p>
        <p className="mt-2 text-[15px] text-ink-muted">
          {dashboard ? `${formatBytes(dashboard.storage.available)} left in your plan` : "Click to upload"}
        </p>
      </button>

      <div className="mt-5.5 grid gap-5.5 [grid-template-columns:repeat(auto-fit,minmax(320px,1fr))]">
        <div className="overflow-hidden rounded-[26px] border border-[#e9e1ce] bg-paper">
          <div className="flex items-center justify-between gap-2.5 border-b border-[#efe7d6] px-5.5 py-4.5">
            <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-ink-muted">Recent files</p>
            <Link href="/files" className="text-sm font-semibold text-rust">
              All files
            </Link>
          </div>
          {dashboard?.recentFiles.length === 0 && <p className="px-5.5 py-5 text-ink-muted">No files yet.</p>}
          {dashboard?.recentFiles.map((file) => (
            <button
              key={file.id}
              onClick={() => openPreview(file)}
              className="flex w-full items-center gap-3.25 border-b border-[#f4eedf] px-5.5 py-3.25 text-left transition-colors duration-200 hover:bg-paper-warm"
            >
              <FileIcon color={colorForName(file.name)} />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[15px] font-medium">{file.name}</span>
                <span className="block font-mono text-[11px] text-ink-muted">
                  {formatBytes(file.size)} · {formatRelativeTime(file.updatedAt)}
                </span>
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
