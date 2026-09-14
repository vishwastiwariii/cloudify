import Link from "next/link";

const FOOTER_LINKS = [
  { label: "How it works", href: "#how" },
  { label: "Sharing", href: "#sharing" },
  { label: "Features", href: "#features" },
  { label: "FAQ", href: "#faq" },
  { label: "Security", href: "/security" },
];

export function Footer() {
  return (
    <footer className="mt-20 border-t border-line px-6 py-11">
      <div className="mx-auto flex max-w-[1240px] flex-wrap items-center justify-between gap-5.5">
        <Link href="#top" className="flex items-center gap-2.5">
          <span className="block h-5 w-5.5 rounded-[50%_50%_30%_30%/60%_60%_40%_40%] bg-rust" aria-hidden="true" />
          <span className="font-display text-xl text-ink">Cloudify</span>
        </Link>

        <nav className="flex flex-wrap gap-2">
          {FOOTER_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="rounded-full px-3.5 py-2 text-[15px] text-ink-soft transition-colors duration-200 hover:bg-tint"
            >
              {link.label}
            </a>
          ))}
        </nav>

        <p className="font-mono text-[11px] uppercase tracking-[0.12em] text-ink-muted">
          Stored on Google Cloud · © 2026
        </p>
      </div>
    </footer>
  );
}
