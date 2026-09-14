import { Eyebrow } from "@/components/ui/eyebrow";

type Step = {
  number: string;
  badgeClass: string;
  title: string;
  body: string;
  dark?: boolean;
  offsetClass: string;
};

const STEPS: Step[] = [
  {
    number: "1",
    badgeClass: "bg-gold text-ink",
    title: "Drop it in",
    body: "Drag in a file or a whole folder. It's encrypted in your browser before it ever reaches Google Cloud.",
    offsetClass: "",
  },
  {
    number: "2",
    badgeClass: "bg-[#efe0ba] text-ink",
    title: "Keep it tidy",
    body: "Nest folders as deep as you like, rename, move, tag. The structure your client sees is the one you built.",
    offsetClass: "mt-6",
  },
  {
    number: "3",
    badgeClass: "bg-rust text-paper",
    title: "Hand it over",
    body: "Send one link. It opens in any browser with no sign-up. Set an expiry, or pull it back when the job's done.",
    dark: true,
    offsetClass: "mt-12",
  },
];

export function HowItWorks() {
  return (
    <section id="how" className="px-6 pt-21">
      <div className="mx-auto max-w-[1240px]">
        <div className="flex flex-wrap items-end justify-between gap-5">
          <div>
            <Eyebrow>01 / How it works</Eyebrow>
            <h2 className="max-w-[620px] font-display text-[clamp(32px,4.4vw,52px)] leading-[1.04] tracking-[-0.015em] text-ink">
              Three steps, then it&apos;s out of your hands.
            </h2>
          </div>
          <p className="max-w-[300px] text-base leading-relaxed text-ink-soft">
            Upload, tidy up, hand over. Most people are done inside a minute of signing up.
          </p>
        </div>

        <div className="mt-13 grid items-start gap-6.5 [grid-template-columns:repeat(auto-fit,minmax(270px,1fr))]">
          {STEPS.map((step) => (
            <div
              key={step.number}
              className={`rounded-[28px] p-7 ${step.offsetClass} ${
                step.dark
                  ? "bg-ink text-paper shadow-[0_34px_64px_-40px_rgba(35,26,10,0.9)]"
                  : "border border-[#e9e1ce] bg-paper shadow-[0_30px_60px_-44px_rgba(35,26,10,0.7)]"
              }`}
            >
              <span
                className={`inline-flex h-15 w-13.5 items-center justify-center rounded-[50%_50%_16px_16px] font-display text-[26px] ${step.badgeClass}`}
              >
                {step.number}
              </span>
              <h3 className={`mt-5 mb-2 font-display text-[23px] ${step.dark ? "text-paper" : "text-ink"}`}>
                {step.title}
              </h3>
              <p className={`text-base leading-relaxed ${step.dark ? "text-[#e4ddcd]" : "text-ink-soft"}`}>
                {step.body}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
