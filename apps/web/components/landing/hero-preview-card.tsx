"use client";

import { useState } from "react";

type FileRow = {
  name: string;
  meta: string;
  emphasis?: boolean;
  link?: boolean;
};

const TABS = ["Client delivery", "Brand assets", "Contracts"];

const FILES: FileRow[] = [
  { name: "Stills — 24 photos", meta: "620 MB · shared", emphasis: true, link: true },
  { name: "Final-cut-v4.mp4", meta: "842 MB" },
  { name: "Logo-pack.zip", meta: "18 MB" },
];

export function HeroPreviewCard() {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  return (
    <div className="relative">
      <div
        className="absolute inset-[34px_-14px_-18px_26px] rotate-[2.4deg] rounded-[200px_200px_30px_30px] bg-[#efe7d6]"
        aria-hidden="true"
      />
      <div className="relative overflow-hidden rounded-[190px_190px_26px_26px] border border-line bg-paper shadow-[0_40px_80px_-46px_rgba(35,26,10,0.6)]">
        <div className="bg-[linear-gradient(#f7f1e2,#fffcf5)] px-6.5 pt-7.5 pb-4.5 text-center">
          <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-ink-muted">
            Workspace / Client delivery
          </p>
          <p className="mt-2.5 font-display text-[34px] leading-none text-ink">
            1.6 <span className="text-xl text-ink-muted">of 2 GB</span>
          </p>
          <div className="mx-auto mt-3.5 h-2.5 w-full max-w-[260px] overflow-hidden rounded-full bg-[#eae1cd]">
            <div className="h-full w-[80%] rounded-full bg-rust" />
          </div>
        </div>

        <div className="px-3.5 pt-1.5 pb-3.5">
          <div className="flex flex-wrap gap-2 px-2 py-2.5">
            {TABS.map((tab, i) => (
              <span
                key={tab}
                className={`rounded-full px-3.5 py-1.75 text-[13px] font-semibold ${
                  i === 0 ? "bg-gold text-ink" : "bg-tint text-ink-soft"
                }`}
              >
                {tab}
              </span>
            ))}
          </div>

          <div className="space-y-2">
            {FILES.map((file) => (
              <div
                key={file.name}
                className={`flex items-center gap-3 rounded-2xl px-3.5 py-3 ${
                  file.emphasis ? "bg-paper-soft" : "bg-paper-warm"
                }`}
              >
                <span
                  className={`h-6.5 w-7.5 shrink-0 rounded-lg ${file.emphasis ? "bg-rust" : "bg-stone"}`}
                  aria-hidden="true"
                />
                <div className="min-w-0 flex-1">
                  <p
                    className={`truncate text-[15px] ${file.emphasis ? "font-semibold text-ink" : "text-ink"}`}
                  >
                    {file.name}
                  </p>
                  <p className="mt-0.5 truncate font-mono text-[11px] text-ink-muted">{file.meta}</p>
                </div>
                {file.link && <span className="shrink-0 text-[13px] font-semibold text-rust">Link</span>}
              </div>
            ))}
          </div>
        </div>

        <div className="mx-3.5 mb-4 flex flex-wrap items-center justify-between gap-3 rounded-[20px] bg-ink px-3.5 py-3.5">
          <div className="min-w-0">
            <p className="mb-0.5 font-mono text-[10px] uppercase tracking-[0.14em] text-gold">Share link</p>
            <p className="truncate font-mono text-[13px] text-paper">cloudify.to/d/9f2a-kite</p>
          </div>
          <button
            onClick={handleCopy}
            className="shrink-0 rounded-full bg-paper px-4.5 py-2.5 font-mono text-[11px] uppercase tracking-[0.12em] text-ink transition-colors duration-200 hover:bg-rust hover:text-paper"
          >
            {copied ? "Copied" : "Copy link"}
          </button>
        </div>
      </div>
    </div>
  );
}
