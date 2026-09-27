import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Highlight } from "@/components/ui/highlight";
import { ArrowRightIcon } from "@/components/ui/icons";
import { HeroPreviewCard } from "@/components/landing/hero-preview-card";

export function Hero() {
  return (
    <section id="top" className="relative overflow-x-clip px-5 pt-10 sm:px-6 sm:pt-14">
      <div
        className="pointer-events-none absolute top-[-80px] left-1/2 h-[460px] w-[min(900px,120%)] -translate-x-1/2 bg-[radial-gradient(ellipse_at_center,rgba(245,213,71,0.34),rgba(244,240,230,0)_68%)]"
        aria-hidden="true"
      />

      <div className="relative mx-auto grid max-w-[1240px] items-center gap-11 sm:gap-[52px] [grid-template-columns:repeat(auto-fit,minmax(min(320px,100%),1fr))]">
        <div>
          <Badge>Cloud storage for the handover</Badge>

          <h1 className="mt-[22px] font-display text-[clamp(44px,6.6vw,80px)] leading-[1.0] tracking-[-0.02em] text-ink">
            Send the folder.
            <br />
            <Highlight>Keep the keys.</Highlight>
          </h1>

          <p className="mt-6 max-w-[500px] text-[17px] leading-[1.62] sm:text-[19px] text-ink-soft">
            Cloudify gives every person 2GB of encrypted space on Google Cloud. Organise your work
            into real folders, then hand any file or folder to a client with one link. They
            don&apos;t need an account. You can take it back whenever you like.
          </p>

          <div className="mt-[34px] flex flex-wrap gap-3.5">
            <Button href="/signup" variant="rust">
              Get 2GB free
              <ArrowRightIcon className="h-[15px] w-[15px]" />
            </Button>
            <Button href="#sharing" variant="outline">
              See a share link
            </Button>
          </div>

          <p className="mt-5 font-mono text-[11px] uppercase tracking-[0.12em] text-ink-muted">
            Free forever · No card · AES-256 at rest
          </p>
        </div>

        <HeroPreviewCard />
      </div>
    </section>
  );
}
