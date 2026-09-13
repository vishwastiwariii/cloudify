type FileCard = {
  label: string;
  rotate: string;
  offset: string;
  swatch: "gold" | "rust" | "sand" | "tan" | "stone" | "dark";
};

const FILES: FileCard[] = [
  { label: "brief.pdf", swatch: "gold", rotate: "-rotate-6", offset: "translate-y-6" },
  { label: "stills / 24", swatch: "rust", rotate: "rotate-3", offset: "-translate-y-5" },
  { label: "logo-pack.zip", swatch: "sand", rotate: "-rotate-3", offset: "translate-y-3" },
  { label: "encrypted", swatch: "dark", rotate: "-rotate-1", offset: "-translate-y-9" },
  { label: "invoice-0042", swatch: "tan", rotate: "rotate-4", offset: "translate-y-4" },
  { label: "contract.docx", swatch: "stone", rotate: "-rotate-4", offset: "-translate-y-1" },
];

const SWATCH_CLASSES: Record<FileCard["swatch"], string> = {
  gold: "bg-gold",
  rust: "bg-rust",
  sand: "bg-swatch-sand",
  tan: "bg-swatch-tan",
  stone: "bg-swatch-stone",
  dark: "bg-ink",
};

export function FileStrip() {
  return (
    <section className="relative overflow-hidden bg-band py-28">
      <div
        className="absolute inset-x-0 top-1/2 -z-0 border-t border-dashed border-ink-muted/25"
        aria-hidden="true"
      />

      <div className="relative mx-auto flex w-full max-w-5xl flex-wrap items-center justify-center gap-2 px-4 sm:px-6 sm:gap-3">
        {FILES.map((file) =>
          file.swatch === "dark" ? (
            <div
              key={file.label}
              className={`relative flex h-36 w-36 shrink-0 flex-col justify-end rounded-3xl bg-ink p-4 shadow-[0_20px_40px_-12px_rgba(28,23,18,0.35)] ${file.rotate} ${file.offset}`}
            >
              <span className="absolute right-4 top-4 h-8 w-8 rounded-full border-2 border-gold" />
              <span className="font-mono text-sm text-gold">{file.label}</span>
            </div>
          ) : (
            <div
              key={file.label}
              className={`shrink-0 rounded-2xl bg-white p-3 shadow-[0_20px_40px_-15px_rgba(28,23,18,0.25)] ${file.rotate} ${file.offset}`}
            >
              <div className={`h-20 w-32 rounded-xl ${SWATCH_CLASSES[file.swatch]}`} />
              <p className="mt-2 font-mono text-xs text-ink">{file.label}</p>
            </div>
          ),
        )}
      </div>
    </section>
  );
}
