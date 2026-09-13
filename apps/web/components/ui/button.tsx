import type { AnchorHTMLAttributes, ButtonHTMLAttributes } from "react";

type Variant = "rust" | "dark" | "outline" | "pill";

const baseClasses =
  "inline-flex items-center justify-center gap-2 rounded-full px-6 py-3.5 text-sm font-semibold transition-colors whitespace-nowrap";

const variantClasses: Record<Variant, string> = {
  rust: "bg-rust text-white hover:bg-rust-dark",
  dark: "bg-ink text-white hover:bg-ink/90",
  outline: "bg-cream-light text-ink border border-ink/15 hover:bg-white",
  pill: "bg-white text-ink hover:bg-neutral-100",
};

type ButtonProps = {
  variant?: Variant;
  className?: string;
} & (
  | ({ href: string } & AnchorHTMLAttributes<HTMLAnchorElement>)
  | ({ href?: undefined } & ButtonHTMLAttributes<HTMLButtonElement>)
);

export function Button({
  variant = "rust",
  className = "",
  href,
  children,
  ...props
}: ButtonProps) {
  const classes = `${baseClasses} ${variantClasses[variant]} ${className}`;

  if (href) {
    return (
      <a
        href={href}
        className={classes}
        {...(props as AnchorHTMLAttributes<HTMLAnchorElement>)}
      >
        {children}
      </a>
    );
  }

  return (
    <button className={classes} {...(props as ButtonHTMLAttributes<HTMLButtonElement>)}>
      {children}
    </button>
  );
}
