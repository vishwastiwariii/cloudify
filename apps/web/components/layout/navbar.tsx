import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRightIcon } from "@/components/ui/icons";

const NAV_LINKS = [
  { label: "How it works", href: "#how-it-works" },
  { label: "Sharing", href: "#sharing" },
  { label: "Features", href: "#features" },
  { label: "FAQ", href: "#faq" },
];

export function Navbar() {
  return (
    <header className="sticky top-4 z-50 mx-auto w-full max-w-6xl px-4 sm:px-6">
      <div className="flex items-center justify-between rounded-full border border-ink/5 bg-cream-light/95 py-2.5 pl-4 pr-2.5 shadow-sm backdrop-blur">
        <Link href="/" className="flex items-center gap-2">
          <span className="h-6 w-6 rounded-full bg-rust" aria-hidden="true" />
          <span className="font-display text-xl font-semibold text-ink">Cloudify</span>
        </Link>

        <nav className="hidden items-center gap-8 md:flex">
          {NAV_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-sm font-medium text-ink/75 transition-colors hover:text-ink"
            >
              {link.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-5">
          <Link
            href="/login"
            className="hidden text-sm font-medium text-ink sm:inline-block"
          >
            Log in
          </Link>
          <Button href="/signup" variant="dark" className="px-5 py-2.5 text-sm">
            Get 5GB free
            <ArrowRightIcon />
          </Button>
        </div>
      </div>
    </header>
  );
}
