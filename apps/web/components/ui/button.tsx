import type { AnchorHTMLAttributes, ButtonHTMLAttributes } from "react";

type Variant = "dark" | "rust" | "rust-to-gold" | "outline" | "ghost";

const baseClasses =
  "inline-flex items-center justify-center gap-2.5 rounded-full px-[30px] py-4 text-[17px] font-semibold whitespace-nowrap transition-all duration-200";

const variantClasses: Record<Variant, string> = {
  dark: "bg-ink text-paper shadow-[0_10px_22px_-12px_rgba(20,18,14,0.7)] hover:bg-rust",
  rust: "bg-rust text-paper shadow-[0_18px_36px_-18px_rgba(178,60,11,0.85)] hover:bg-ink hover:-translate-y-0.5",
  "rust-to-gold":
    "bg-rust text-paper hover:bg-gold hover:text-ink hover:-translate-y-0.5",
  outline:
    "bg-paper text-ink border border-[#dcd3c0] hover:border-ink hover:-translate-y-0.5",
  ghost: "border border-[#4b4335] text-paper hover:border-paper hover:-translate-y-0.5",
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
      <a href={href} className={classes} {...(props as AnchorHTMLAttributes<HTMLAnchorElement>)}>
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
