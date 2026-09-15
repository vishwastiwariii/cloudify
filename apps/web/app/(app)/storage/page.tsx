"use client";

import { useEffect, useState } from "react";
import { useAppShell } from "@/components/app-shell/app-shell-context";
import { getDashboard } from "@/lib/api/dashboard";
import { search } from "@/lib/api/search";
import { formatBytes, colorForName } from "@/lib/format";
import type { ApiFile, DashboardFileType, DashboardResponse } from "@/lib/api/types";

const TYPE_LABEL: Record<DashboardFileType, string> = {
  video: "Video",
  image: "Images",
  audio: "Audio",
  document: "Documents",
  archive: "Archives",
  other: "Other",
};

const TYPE_COLOR: Record<DashboardFileType, string> = {
  video: "bg-rust",
  image: "bg-gold",
  audio: "bg-[#8a8067]",
  document: "bg-[#d9cfb4]",
  archive: "bg-stone",
  other: "bg-[#e0d6bc]",
};

export default function StoragePage() {
  const { filesVersion } = useAppShell();
  const [dashboard, setDashboard] = useState<DashboardResponse | null>(null);
  const [biggest, setBiggest] = useState<ApiFile[]>([]);

  useEffect(() => {
    getDashboard().then(setDashboard);
    search({ sortBy: "size", sortOrder: "desc", limit: 5 }).then((res) => setBiggest(res.items));
  }, [filesVersion]);

  if (!dashboard) return <p className="text-ink-muted">Loading…</p>;

  const used = Number(dashboard.storage.used) || 1;
  const bars = dashboard.fileType
    .filter((t) => Number(t.size) > 0)
    .sort((a, b) => Number(b.size) - Number(a.size));

  return (
    <div className="max-w-250">
      <h1 className="font-display text-[clamp(28px,3.2vw,38px)] tracking-[-0.02em]">
        Where your {formatBytes(dashboard.storage.limit)} went
      </h1>

      <div className="mt-7 rounded-[28px] border border-[#e9e1ce] bg-paper p-7.5 shadow-[0_30px_60px_-50px_rgba(35,26,10,0.7)]">
        <div className="flex flex-wrap items-baseline justify-between gap-x-5 gap-y-2.5">
          <p className="font-display text-4xl leading-none">
            {formatBytes(dashboard.storage.used)}{" "}
            <span className="text-[19px] text-ink-muted">of {formatBytes(dashboard.storage.limit)} used</span>
          </p>
          <p className="font-mono text-xs text-ink-muted">{formatBytes(dashboard.storage.available)} free</p>
        </div>

        {bars.length > 0 ? (
          <>
            <div className="mt-5.5 flex h-4 gap-0.75 overflow-hidden rounded-full bg-[#eae1cd]">
              {bars.map((bar) => (
                <span
                  key={bar.type}
                  className={`h-full ${TYPE_COLOR[bar.type]}`}
                  style={{ width: `${Math.max(2, (Number(bar.size) / used) * 100)}%` }}
                />
              ))}
            </div>
            <div className="mt-5 flex flex-wrap gap-x-7 gap-y-3">
              {bars.map((bar) => (
                <span key={bar.type} className="inline-flex items-center gap-2.25 text-[15px] text-ink-soft">
                  <span className={`h-2.75 w-2.75 rounded-full ${TYPE_COLOR[bar.type]}`} />
                  {TYPE_LABEL[bar.type]} <span className="font-mono text-xs text-ink-muted">{formatBytes(bar.size)}</span>
                </span>
              ))}
            </div>
          </>
        ) : (
          <p className="mt-5.5 text-ink-muted">No files yet.</p>
        )}
      </div>

      <div className="mt-5.5 overflow-hidden rounded-[26px] border border-[#e9e1ce] bg-paper">
        <p className="border-b border-[#efe7d6] px-6 py-4.5 font-mono text-[11px] uppercase tracking-[0.14em] text-ink-muted">
          Biggest items
        </p>
        {biggest.length === 0 && <p className="px-6 py-6 text-ink-muted">No files yet.</p>}
        {biggest.map((file) => (
          <div key={file.id} className="flex items-center gap-4 border-b border-[#f4eedf] px-6 py-4">
            <span className={`h-8 w-7 shrink-0 rounded-[9px] ${colorForName(file.name)}`} />
            <span className="min-w-30 flex-1 truncate text-base font-medium">{file.name}</span>
            <span className="h-2 min-w-25 flex-2 overflow-hidden rounded-full bg-[#f0e8d6]">
              <span
                className="block h-full rounded-full bg-rust"
                style={{ width: `${Math.min(100, (Number(file.size) / Number(biggest[0]?.size ?? 1)) * 100)}%` }}
              />
            </span>
            <span className="shrink-0 font-mono text-[13px] text-ink-soft">{formatBytes(file.size)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
