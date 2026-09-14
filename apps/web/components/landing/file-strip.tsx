type FileCard = {
  label: string;
  rotate: string;
  translate: string;
  swatch: string;
  dark?: boolean;
};

const FILES: FileCard[] = [
  { label: "brief.pdf", rotate: "-rotate-[7deg]", translate: "translate-y-2.5", swatch: "bg-gold" },
  { label: "stills / 24", rotate: "rotate-3", translate: "-translate-y-3.5", swatch: "bg-rust" },
  { label: "logo-pack.zip", rotate: "-rotate-3", translate: "translate-y-4.5", swatch: "bg-stone" },
  { label: "encrypted", rotate: "rotate-6", translate: "-translate-y-1.5", swatch: "", dark: true },
  { label: "invoice-0042", rotate: "-rotate-[5deg]", translate: "translate-y-3.5", swatch: "bg-[#efe0ba]" },
  { label: "contract.docx", rotate: "rotate-[4deg]", translate: "-translate-y-3", swatch: "bg-[#d9cfb4]" },
];

const TRUST_NAMES = ["Northline", "Parcelly", "Hale & Co", "Fieldnote"];

export function FileStrip() {
  return (
    <section className="pt-19">
      <div className="relative overflow-hidden bg-band py-11">
        <svg
          viewBox="0 0 1200 120"
          preserveAspectRatio="none"
          className="absolute inset-x-0 top-1/2 h-[120px] w-full -translate-y-[40%] text-[#c9bea2]"
          aria-hidden="true"
        >
          <path
            d="M-20 92 C 180 24, 380 108, 600 62 S 1020 20, 1220 76"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeDasharray="10 12"
            strokeLinecap="round"
          />
        </svg>

        <div className="relative flex flex-wrap items-center justify-center px-3">
          {FILES.map((file) =>
            file.dark ? (
              <div
                key={file.label}
                className={`relative -mx-2.5 flex h-36 w-[158px] shrink-0 flex-col justify-end rounded-[26px] bg-ink p-[15px] shadow-[0_30px_54px_-28px_rgba(35,26,10,0.8)] ${file.rotate} ${file.translate}`}
              >
                <span className="absolute top-3.5 right-3.5 h-6.5 w-6.5 rounded-full border-[3px] border-gold" />
                <span className="font-mono text-[10px] tracking-[0.08em] text-gold">{file.label}</span>
              </div>
            ) : (
              <div
                key={file.label}
                className={`-mx-2.5 shrink-0 rounded-[22px] border border-transparent bg-paper p-3.5 shadow-[0_24px_44px_-30px_rgba(35,26,10,0.7)] ${file.rotate} ${file.translate}`}
              >
                <div className={`h-[62px] w-[124px] rounded-[14px] ${file.swatch}`} />
                <p className="mt-2.5 font-mono text-[10px] tracking-[0.08em] text-ink-muted">{file.label}</p>
              </div>
            ),
          )}
        </div>

        <div className="relative mx-auto mt-10 flex max-w-[1240px] flex-wrap items-center justify-between gap-4.5 px-6">
          <p className="font-mono text-[11px] uppercase tracking-[0.12em] text-ink-muted">
            Studios handing work over with Cloudify
          </p>
          <div className="flex flex-wrap items-center gap-3.5 font-display text-[19px] text-ink-soft">
            <span className="inline-flex items-center gap-2.5">
              <span className="h-3.5 w-3.5 rounded-full border-[3px] border-rust" />
              Google Cloud
            </span>
            {TRUST_NAMES.map((name) => (
              <span key={name}>{name}</span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
