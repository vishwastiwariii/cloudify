"use client";

import { useState } from "react";
import { Eyebrow } from "@/components/ui/eyebrow";

const FAQS = [
  {
    q: "Is 2GB really free?",
    a: "Yes. Every account gets 2GB at no cost and it doesn't expire. If you outgrow it you can add more, but nothing you've already stored gets locked behind a paywall.",
  },
  {
    q: "Do recipients need an account?",
    a: "No. A Cloudify link opens in any browser. They see your folder structure, preview files, and download whatever you've allowed — without signing up for anything.",
  },
  {
    q: "What does “encrypted” mean here?",
    a: "Files are encrypted in your browser before upload and stored encrypted with AES-256 on Google Cloud. Transfers use TLS. We hold the ciphertext, not your content.",
  },
  {
    q: "Where is my data stored?",
    a: "In multi-region Google Cloud Storage. An account can be pinned to a single region if you need data residency for client work.",
  },
  {
    q: "Can I take a shared link back?",
    a: "Any time. Revoke it, rotate it to a new URL, or set an expiry when you create it. The file stays in your folder — only access changes.",
  },
];

export function Faq() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <section id="faq" className="px-6 pt-23">
      <div className="mx-auto grid max-w-[1240px] items-start gap-11 [grid-template-columns:repeat(auto-fit,minmax(290px,1fr))]">
        <div>
          <Eyebrow>04 / Questions</Eyebrow>
          <h2 className="font-display text-[clamp(30px,4vw,46px)] leading-[1.06] tracking-[-0.015em] text-ink">
            The things people ask us first.
          </h2>
          <p className="mt-5 max-w-[360px] text-base leading-relaxed text-ink-soft">
            Still unsure? Write to{" "}
            <a
              href="mailto:hello@cloudify.to"
              className="underline decoration-2 underline-offset-[3px] hover:text-rust"
            >
              hello@cloudify.to
            </a>{" "}
            and a person answers.
          </p>
        </div>

        <div className="flex flex-col gap-2.5">
          {FAQS.map((item, i) => {
            const open = openIndex === i;
            return (
              <div key={item.q} className="overflow-hidden rounded-[22px] border border-[#ede5d2] bg-paper">
                <button
                  onClick={() => setOpenIndex(open ? null : i)}
                  className="flex w-full items-center justify-between gap-4.5 px-5.5 py-5 text-left font-display text-ink transition-colors duration-200 hover:text-rust"
                >
                  <span className="text-[19px]">{item.q}</span>
                  <span className="flex h-7.5 w-7.5 shrink-0 items-center justify-center rounded-full bg-tint font-mono text-base text-rust">
                    {open ? "−" : "+"}
                  </span>
                </button>
                {open && (
                  <p className="max-w-[540px] px-5.5 pb-5.5 text-base leading-relaxed text-ink-soft">
                    {item.a}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
