import Link from "next/link";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid min-h-screen [grid-template-columns:repeat(auto-fit,minmax(340px,1fr))]">
      <div className="relative flex flex-col justify-between gap-12 overflow-hidden bg-band px-10 pt-11 pb-14">
        <div
          className="pointer-events-none absolute -top-35 -right-30 h-105 w-105 rounded-full"
          style={{ background: "radial-gradient(circle at 40% 40%, rgba(245,213,71,0.5), rgba(239,233,219,0) 70%)" }}
          aria-hidden="true"
        />
        <Link href="/" className="relative flex items-center gap-2.75">
          <span className="block h-6 w-[26px] rounded-[50%_50%_30%_30%/60%_60%_40%_40%] bg-rust" aria-hidden="true" />
          <span className="font-display text-[22px] tracking-tight">Cloudify</span>
        </Link>

        <div className="relative max-w-105">
          <p className="mb-4 font-mono text-[11px] tracking-[0.16em] text-rust uppercase">2 GB free · no card</p>
          <h2 className="font-display text-[clamp(32px,3.6vw,46px)] leading-[1.06] tracking-[-0.015em]">
            Send the folder. Keep the keys.
          </h2>
          <p className="mt-5 text-[17px] leading-relaxed text-ink-soft">
            Encrypted storage on Google Cloud, real folders, and share links you can pull back whenever the job is
            done.
          </p>
        </div>

        <div className="relative flex items-end">
          <div className="z-0 -mr-3 w-30 rotate-[-6deg] rounded-[22px] bg-paper p-3.25 shadow-[0_24px_44px_-30px_rgba(35,26,10,0.7)]">
            <div className="h-14 rounded-[14px] bg-gold" />
            <p className="mt-2.5 font-mono text-[10px] text-ink-muted">brief.pdf</p>
          </div>
          <div className="z-10 w-34.5 -translate-y-2.5 rotate-4 rounded-[24px] bg-ink p-3.5 shadow-[0_28px_50px_-28px_rgba(35,26,10,0.85)]">
            <div className="flex h-16 items-center justify-center rounded-[15px] bg-[#2c2519]">
              <span className="h-6 w-6 rounded-full border-[3px] border-gold" />
            </div>
            <p className="mt-2.75 font-mono text-[10px] text-gold">encrypted</p>
          </div>
          <div className="z-0 -ml-2.5 w-29 translate-y-2 rotate-[-3deg] rounded-[22px] bg-paper p-3.25 shadow-[0_24px_44px_-30px_rgba(35,26,10,0.7)]">
            <div className="h-13 rounded-[14px] bg-stone" />
            <p className="mt-2.5 font-mono text-[10px] text-ink-muted">stills / 24</p>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-center px-6 py-14">
        <div className="w-full max-w-110">{children}</div>
      </div>
    </div>
  );
}
