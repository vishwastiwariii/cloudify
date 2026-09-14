"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRightIcon } from "@/components/ui/icons";
import { useActiveSection } from "@/hooks/use-active-section";

const NAV_LINKS = [
  { label: "How it works", id: "how" },
  { label: "Sharing", id: "sharing" },
  { label: "Features", id: "features" },
  { label: "FAQ", id: "faq" },
];

const SECTION_IDS = NAV_LINKS.map((link) => link.id);

export function Navbar() {
  const active = useActiveSection(SECTION_IDS);

  return (
    <header className="sticky top-3.5 z-50 flex justify-center px-5">
      <div className="flex w-full max-w-[1240px] flex-wrap items-center justify-between gap-3 rounded-full border border-line bg-paper/[0.82] py-2.5 pr-2.5 pl-[18px] shadow-[0_18px_44px_-28px_rgba(35,26,10,0.55)] backdrop-blur-xl">
        <Link href="#top" className="flex items-center gap-2.5 pr-1.5">
          <span className="block h-6 w-[26px] rounded-[50%_50%_30%_30%/60%_60%_40%_40%] bg-rust" aria-hidden="true" />
          <span className="font-display text-[22px] tracking-tight text-ink">Cloudify</span>
        </Link>

        <nav className="flex flex-wrap items-center gap-1">
          {NAV_LINKS.map((link) => (
            <a
              key={link.id}
              href={`#${link.id}`}
              className="inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-[15px] font-medium text-ink-soft transition-colors duration-200 hover:bg-tint hover:text-ink"
            >
              {active === link.id && <span className="h-1.5 w-1.5 rounded-full bg-rust" aria-hidden="true" />}
              {link.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-2.5">
          <Link
            href="/login"
            className="rounded-full px-3.5 py-2.5 text-[15px] font-medium text-ink-soft transition-colors duration-200 hover:bg-tint"
          >
            Log in
          </Link>
          <Button href="/signup" variant="dark" className="px-5 py-2.5 text-[15px]">
            Get 5GB free
            <ArrowRightIcon className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    </header>
  );
}
