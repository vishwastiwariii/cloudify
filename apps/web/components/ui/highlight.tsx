export function Highlight({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span className={`relative isolate inline-block ${className}`}>
      <span className="absolute -inset-x-2.5 inset-y-[12%] -z-10 rounded-full bg-gold" aria-hidden="true" />
      <span className="relative">{children}</span>
    </span>
  );
}
