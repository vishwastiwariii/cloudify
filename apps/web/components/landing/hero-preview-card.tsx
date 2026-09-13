type FileRow = {
  name: string;
  meta: string;
  swatch: "rust" | "muted";
  link?: boolean;
};

const TABS = ["Client delivery", "Brand assets", "Contracts"];

const FILES: FileRow[] = [
  { name: "Stills — 24 photos", meta: "1.2 GB · shared", swatch: "rust", link: true },
  { name: "Final-cut-v4.mp4", meta: "842 MB", swatch: "muted" },
  { name: "Logo-pack.zip", meta: "18 MB", swatch: "muted" },
];

export function HeroPreviewCard() {
  return (
    <div className="rounded-t-[110px] rounded-b-[32px] bg-card p-6 pt-10 shadow-[0_30px_60px_-15px_rgba(28,23,18,0.25)] sm:p-8 sm:pt-12">
      <div className="text-center">
        <p className="font-mono text-xs uppercase tracking-widest text-ink-muted">
          Workspace / Client delivery
        </p>
        <p className="mt-3 font-display text-3xl font-semibold text-ink">
          4.1 <span className="font-display text-lg font-normal text-ink-muted">of 5 GB</span>
        </p>
        <div className="mx-auto mt-4 h-2 w-full max-w-sm rounded-full bg-line">
          <div className="h-full w-[82%] rounded-full bg-rust" />
        </div>
      </div>

      <div className="mt-6 flex flex-wrap gap-2">
        {TABS.map((tab, i) => (
          <span
            key={tab}
            className={`rounded-full px-4 py-2 text-sm font-medium ${
              i === 0 ? "bg-gold text-ink" : "bg-cream text-ink/70"
            }`}
          >
            {tab}
          </span>
        ))}
      </div>

      <div className="mt-4 space-y-2">
        {FILES.map((file) => (
          <div
            key={file.name}
            className={`flex items-center gap-4 rounded-2xl px-4 py-3.5 ${
              file.swatch === "rust" ? "bg-rust-tint" : "bg-cream"
            }`}
          >
            <span
              className={`h-9 w-9 shrink-0 rounded-lg ${
                file.swatch === "rust" ? "bg-rust" : "bg-line"
              }`}
              aria-hidden="true"
            />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-ink">{file.name}</p>
              <p className="mt-0.5 font-mono text-xs text-ink-muted">{file.meta}</p>
            </div>
            {file.link && (
              <span className="shrink-0 text-sm font-semibold text-rust">Link</span>
            )}
          </div>
        ))}
      </div>

      <div className="mt-4 flex items-center justify-between gap-4 rounded-2xl bg-ink px-5 py-4">
        <div className="min-w-0">
          <p className="font-mono text-[11px] uppercase tracking-widest text-gold">
            Share link
          </p>
          <p className="mt-1 truncate font-mono text-sm text-white/90">
            cloudify.to/d/9f2a-kite
          </p>
        </div>
        <span className="shrink-0 rounded-full bg-white px-4 py-2 font-mono text-xs font-semibold uppercase tracking-wide text-ink">
          Copy link
        </span>
      </div>
    </div>
  );
}
