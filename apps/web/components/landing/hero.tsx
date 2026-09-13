import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowRightIcon } from "@/components/ui/icons";
import { HeroPreviewCard } from "@/components/landing/hero-preview-card";

export function Hero() {
  return (
    <section className="mx-auto w-full max-w-6xl px-4 pb-24 pt-16 sm:px-6 sm:pt-24">
      <div className="grid items-center gap-16 lg:grid-cols-2 lg:gap-12">
        <div>
          <Badge>Cloud storage for the handover</Badge>

          <h1 className="mt-8 font-display text-6xl font-semibold leading-[1.05] tracking-tight text-ink sm:text-7xl">
            Send the folder.
            <br />
            <span className="relative inline-block">
              <span className="absolute -inset-x-3 inset-y-1 -z-10 -rotate-1 rounded-2xl bg-gold" />
              Keep the keys.
            </span>
          </h1>

          <p className="mt-8 max-w-md text-lg leading-relaxed text-ink-muted">
            Cloudify gives every person 5GB of encrypted space on Google
            Cloud. Organise your work into real folders, then hand any file
            or folder to a client with one link. They don&apos;t need an
            account. You can take it back whenever you like.
          </p>

          <div className="mt-9 flex flex-wrap items-center gap-4">
            <Button href="/signup" variant="rust">
              Get 5GB free
              <ArrowRightIcon />
            </Button>
            <Button href="#sharing" variant="outline">
              See a share link
            </Button>
          </div>

          <p className="mt-8 font-mono text-xs uppercase tracking-widest text-ink-muted">
            Free forever · No card · AES-256 at rest
          </p>
        </div>

        <HeroPreviewCard />
      </div>
    </section>
  );
}
