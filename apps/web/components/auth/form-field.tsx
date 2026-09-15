import type { InputHTMLAttributes } from "react";

export function FormField({
  label,
  className = "mb-4.5",
  ...props
}: { label: string; className?: string } & InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className={`block ${className}`}>
      <span className="mb-2 block text-sm font-semibold">{label}</span>
      <input
        {...props}
        className="w-full rounded-2xl border border-[#dcd3c0] bg-paper px-4.5 py-3.75 text-base text-ink focus:outline-2 focus:outline-rust focus:outline-offset-1"
      />
    </label>
  );
}
