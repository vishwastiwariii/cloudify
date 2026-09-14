import { Button } from "@/components/ui/button";
import { Highlight } from "@/components/ui/highlight";
import { ArrowRightIcon } from "@/components/ui/icons";

export function Cta() {
  return (
    <section className="px-6 pt-25">
      <div className="relative mx-auto max-w-[1240px] overflow-hidden rounded-[160px_160px_34px_34px] bg-ink text-paper shadow-[0_50px_90px_-50px_rgba(35,26,10,0.9)]">
        <div
          className="pointer-events-none absolute top-[-120px] left-1/2 h-[340px] w-[620px] -translate-x-1/2 bg-[radial-gradient(ellipse_at_center,rgba(245,213,71,0.28),rgba(20,18,14,0)_70%)]"
          aria-hidden="true"
        />

        <div className="relative px-7 py-13 text-center sm:px-18 sm:py-21">
          <p className="mb-5 font-mono text-[11px] uppercase tracking-[0.16em] text-gold">Start now</p>
          <h2 className="mx-auto max-w-[760px] font-display text-[clamp(34px,5vw,60px)] leading-[1.04] tracking-[-0.02em]">
            5 GB, encrypted, yours in <Highlight className="text-ink">a minute.</Highlight>
          </h2>
          <p className="mx-auto mt-6 max-w-[460px] text-[17px] leading-relaxed text-[#e4ddcd]">
            Make an account, drag in your first folder, send the link. That&apos;s the whole
            product.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3.5">
            <Button href="/signup" variant="rust-to-gold">
              Get 5GB free
              <ArrowRightIcon className="h-[15px] w-[15px]" />
            </Button>
            <Button href="/login" variant="ghost">
              Log in
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
