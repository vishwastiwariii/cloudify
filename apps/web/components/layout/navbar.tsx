"use client";

import { useEffect, useState } from "react";
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
  const [menuOpen, setMenuOpen] = useState(false);

  // Close the mobile menu if the viewport grows past the breakpoint where the inline nav shows.
  useEffect(() => {
    const query = window.matchMedia("(min-width: 1024px)");
    const handleChange = (e: MediaQueryListEvent) => {
      if (e.matches) setMenuOpen(false);
    };
    query.addEventListener("change", handleChange);
    return () => query.removeEventListener("change", handleChange);
  }, []);

  useEffect(() => {
    if (!menuOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMenuOpen(false);
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [menuOpen]);

  return (
    <header className="sticky top-2.5 z-50 flex justify-center px-3 sm:top-3.5 sm:px-5">
      <div
        className={`w-full max-w-[1240px] border border-line bg-paper/[0.92] shadow-[0_18px_44px_-28px_rgba(35,26,10,0.55)] backdrop-blur-xl transition-[border-radius] duration-200 ${
          menuOpen ? "rounded-[26px]" : "rounded-[30px] lg:rounded-full"
        }`}
      >
        <div className="flex items-center justify-between gap-3 py-2 pr-2 pl-4 sm:py-2.5 sm:pr-2.5 sm:pl-[18px]">
          <Link href="#top" className="flex shrink-0 items-center gap-2.5 pr-1.5" onClick={() => setMenuOpen(false)}>
            <span className="block h-6 w-[26px] rounded-[50%_50%_30%_30%/60%_60%_40%_40%] bg-rust" aria-hidden="true" />
            <span className="font-display text-[20px] tracking-tight text-ink sm:text-[22px]">Cloudify</span>
          </Link>

          <nav className="hidden items-center gap-1 lg:flex">
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

          <div className="flex items-center gap-1.5 sm:gap-2.5">
            <Link
              href="/login"
              className="hidden rounded-full px-3.5 py-2.5 text-[15px] font-medium text-ink-soft transition-colors duration-200 hover:bg-tint sm:inline-flex"
            >
              Log in
            </Link>
            <Button href="/signup" variant="dark" className="px-4 py-2.5! text-[14px] sm:px-5 sm:text-[15px]">
              <span className="sm:hidden">Sign up</span>
              <span className="hidden sm:inline">Get 2GB free</span>
              <ArrowRightIcon className="hidden h-3.5 w-3.5 sm:block" />
            </Button>
            <button
              type="button"
              onClick={() => setMenuOpen((open) => !open)}
              aria-expanded={menuOpen}
              aria-controls="mobile-nav"
              aria-label={menuOpen ? "Close menu" : "Open menu"}
              className="flex h-10.5 w-10.5 shrink-0 items-center justify-center rounded-full bg-tint text-ink transition-colors duration-200 hover:bg-stone lg:hidden"
            >
              <svg viewBox="0 0 20 20" fill="none" className="h-5 w-5" aria-hidden="true">
                {menuOpen ? (
                  <path d="M5 5l10 10M15 5L5 15" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                ) : (
                  <path d="M3.5 6.5h13M3.5 13.5h13" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                )}
              </svg>
            </button>
          </div>
        </div>

        {menuOpen && (
          <nav id="mobile-nav" className="border-t border-line px-2.5 pt-2 pb-3 lg:hidden">
            {NAV_LINKS.map((link) => (
              <a
                key={link.id}
                href={`#${link.id}`}
                onClick={() => setMenuOpen(false)}
                className="flex items-center justify-between rounded-2xl px-3.5 py-3 text-base font-medium text-ink-soft transition-colors duration-200 hover:bg-tint hover:text-ink"
              >
                {link.label}
                {active === link.id && <span className="h-1.5 w-1.5 rounded-full bg-rust" aria-hidden="true" />}
              </a>
            ))}
            <div className="mx-3.5 my-1.5 border-t border-line sm:hidden" aria-hidden="true" />
            <Link
              href="/login"
              onClick={() => setMenuOpen(false)}
              className="flex rounded-2xl px-3.5 py-3 text-base font-medium text-ink-soft transition-colors duration-200 hover:bg-tint hover:text-ink sm:hidden"
            >
              Log in
            </Link>
          </nav>
        )}
      </div>
    </header>
  );
}
