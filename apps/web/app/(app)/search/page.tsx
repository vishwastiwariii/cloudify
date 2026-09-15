"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useAppShell } from "@/components/app-shell/app-shell-context";
import { FileIcon } from "@/components/app-shell/file-icon";
import { search } from "@/lib/api/search";
import { formatBytes, formatRelativeTime, colorForName } from "@/lib/format";
import type { ApiFile } from "@/lib/api/types";

const FILTERS = ["All", "Images"] as const;
type Filter = (typeof FILTERS)[number];

function SearchResults() {
  const searchParams = useSearchParams();
  const q = searchParams.get("q") ?? "";
  const { openPreview } = useAppShell();
  const [filter, setFilter] = useState<Filter>("All");
  const [results, setResults] = useState<ApiFile[] | null>(null);

  useEffect(() => {
    setResults(null);
    search({ q: q || undefined, limit: 50 }).then((res) => setResults(res.items));
  }, [q]);

  const filtered = useMemo(() => {
    if (!results) return [];
    if (filter === "Images") return results.filter((file) => file.mimeType.startsWith("image/"));
    return results;
  }, [results, filter]);

  return (
    <div className="max-w-285">
      <h1 className="font-display text-[clamp(28px,3.2vw,38px)] tracking-[-0.02em]">
        {results === null ? "Searching…" : q ? `${filtered.length} results for "${q}"` : `${filtered.length} files`}
      </h1>

      <div className="mt-5.5 flex flex-wrap gap-2.5">
        {FILTERS.map((label) => (
          <button
            key={label}
            onClick={() => setFilter(label)}
            className={`rounded-full border px-4.5 py-2.25 text-sm font-medium transition-colors duration-200 ${
              filter === label ? "border-ink bg-ink text-paper" : "border-[#dcd3c0] bg-paper text-ink-soft hover:border-ink"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="mt-6 flex flex-col gap-3">
        {filtered.map((file) => (
          <button
            key={file.id}
            onClick={() => openPreview(file)}
            className="flex flex-wrap items-center gap-4 rounded-[22px] border border-[#e9e1ce] bg-paper px-5.5 py-4.5 text-left transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_24px_44px_-34px_rgba(35,26,10,0.7)]"
          >
            <FileIcon color={colorForName(file.name)} className="h-9.5 w-8.5" />
            <span className="min-w-45 flex-1">
              <span className="block text-[17px] font-semibold">{file.name}</span>
            </span>
            <span className="shrink-0 font-mono text-xs text-ink-soft">{formatBytes(file.size)}</span>
            <span className="shrink-0 text-sm text-ink-muted">{formatRelativeTime(file.updatedAt)}</span>
          </button>
        ))}
        {results !== null && filtered.length === 0 && (
          <p className="rounded-[22px] border border-dashed border-[#dcd3c0] px-5.5 py-8 text-center text-ink-muted">
            Nothing matches that search.
          </p>
        )}
      </div>
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense>
      <SearchResults />
    </Suspense>
  );
}
