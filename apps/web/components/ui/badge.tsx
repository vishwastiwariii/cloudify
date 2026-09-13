export function Badge({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-ink/10 bg-cream-light px-4 py-2 font-mono text-[11px] font-medium uppercase tracking-widest text-ink">
      <span className="h-1.5 w-1.5 rounded-full bg-rust" aria-hidden="true" />
      {children}
    </span>
  );
}
