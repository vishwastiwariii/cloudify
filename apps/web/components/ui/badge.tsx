export function Badge({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-2.5 rounded-full border border-line bg-paper px-4 py-2 font-mono text-[11px] uppercase tracking-[0.14em] text-ink-muted shadow-[0_10px_24px_-18px_rgba(35,26,10,0.6)]">
      <span className="h-[7px] w-[7px] rounded-full bg-rust" aria-hidden="true" />
      {children}
    </span>
  );
}
