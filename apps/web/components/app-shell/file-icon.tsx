export function FileIcon({ color, className = "h-7.5 w-7" }: { color: string; className?: string }) {
  return <span className={`shrink-0 rounded-[9px] ${color} ${className}`} aria-hidden="true" />;
}
