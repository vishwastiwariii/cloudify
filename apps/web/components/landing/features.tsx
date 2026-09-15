import { Eyebrow } from "@/components/ui/eyebrow";

type Feature = {
  title: string;
  body: string;
  cardClass: string;
  iconClass: string;
  bodyClass: string;
  titleClass?: string;
};

const FEATURES: Feature[] = [
  {
    title: "2 GB, free forever",
    body: "Enough for a full client delivery. No trial clock, no card, no drip of upgrade nags.",
    cardClass: "border border-[#ede5d2] bg-paper",
    iconClass: "bg-gold",
    bodyClass: "text-ink-soft",
  },
  {
    title: "Encrypted end to end",
    body: "Encrypted in your browser, stored encrypted with AES-256. We hold ciphertext, never your content.",
    cardClass: "border border-[#e7c63c] bg-gold",
    iconClass: "bg-ink",
    bodyClass: "text-[#2e2a1c]",
  },
  {
    title: "Real file management",
    body: "Nest, move, rename, bulk-select, restore from trash. It behaves the way your desktop does.",
    cardClass: "border border-[#ede5d2] bg-paper",
    iconClass: "bg-stone",
    bodyClass: "text-ink-soft",
  },
  {
    title: "Anyone can receive",
    body: "No account, no app, no explaining. A link and a browser is the whole requirement.",
    cardClass: "border border-[#ede5d2] bg-paper",
    iconClass: "bg-[#efe0ba]",
    bodyClass: "text-ink-soft",
  },
  {
    title: "Built on Google Cloud",
    body: "Multi-region buckets keep uploads quick and your files where they're supposed to be.",
    cardClass: "border border-[#ede5d2] bg-paper",
    iconClass: "bg-[#d9cfb4]",
    bodyClass: "text-ink-soft",
  },
  {
    title: "Take it back anytime",
    body: "Revoke a link, rotate it, or let it expire on its own. The file stays; the access doesn't.",
    cardClass: "bg-ink text-paper",
    iconClass: "bg-rust",
    bodyClass: "text-[#e4ddcd]",
    titleClass: "text-paper",
  },
];

export function Features() {
  return (
    <section id="features" className="px-6 pt-23">
      <div className="mx-auto max-w-[1240px]">
        <Eyebrow>03 / What you get</Eyebrow>
        <h2 className="max-w-[700px] font-display text-[clamp(32px,4.4vw,52px)] leading-[1.05] tracking-[-0.015em] text-ink">
          Small enough to be free. Serious enough to trust.
        </h2>

        <div className="mt-12 grid gap-4.5 [grid-template-columns:repeat(auto-fit,minmax(268px,1fr))]">
          {FEATURES.map((feature) => (
            <div key={feature.title} className={`rounded-[26px] p-6.5 ${feature.cardClass}`}>
              <span className={`mb-4.5 block h-11 w-10 rounded-[50%_50%_12px_12px] ${feature.iconClass}`} />
              <h3 className={`mb-2 font-display text-[22px] ${feature.titleClass ?? "text-ink"}`}>
                {feature.title}
              </h3>
              <p className={`text-base leading-relaxed ${feature.bodyClass}`}>{feature.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
