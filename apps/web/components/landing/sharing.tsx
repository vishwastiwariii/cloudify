import { Eyebrow } from "@/components/ui/eyebrow";
import { Highlight } from "@/components/ui/highlight";

const PERMISSIONS = [
  "View only, or allow downloads",
  "Password and expiry on any link",
  "See who opened it, and when",
  "Revoke access without deleting a thing",
];

const OPENED_BY = [
  { initial: "M", email: "maya@northline.studio", when: "2h ago", avatarClass: "bg-rust text-paper" },
  { initial: "P", email: "print@haleco.com", when: "Yesterday", avatarClass: "bg-stone text-ink" },
];

export function Sharing() {
  return (
    <section id="sharing" className="px-6 pt-23">
      <div className="mx-auto grid max-w-[1240px] items-center gap-13 [grid-template-columns:repeat(auto-fit,minmax(310px,1fr))]">
        <div>
          <Eyebrow>02 / Sharing</Eyebrow>
          <h2 className="font-display text-[clamp(32px,4.4vw,52px)] leading-[1.06] tracking-[-0.015em] text-ink">
            One link, and <Highlight>you own it</Highlight> the whole way.
          </h2>
          <p className="mt-5.5 max-w-[470px] text-[17px] leading-relaxed text-ink-soft">
            A client on a phone, a printer on an old browser, a friend who&apos;s never heard of
            us — they can all open a Cloudify link. What they&apos;re allowed to do with it stays
            your call.
          </p>

          <ul className="mt-7 flex flex-col gap-2.5">
            {PERMISSIONS.map((item, i) => (
              <li
                key={item}
                className="flex items-center gap-3.5 rounded-[18px] border border-[#ede5d2] bg-paper px-4.5 py-3.75 text-base"
              >
                <span className="flex h-6.5 w-6.5 shrink-0 items-center justify-center rounded-full bg-tint font-mono text-[10px] text-ink-muted">
                  {String(i + 1).padStart(2, "0")}
                </span>
                {item}
              </li>
            ))}
          </ul>
        </div>

        <div className="relative">
          <div
            className="absolute inset-[-16px_22px_30px_-14px] -rotate-[2.2deg] rounded-[34px] bg-[#efe7d6]"
            aria-hidden="true"
          />
          <div className="relative overflow-hidden rounded-[30px] border border-line bg-paper shadow-[0_40px_76px_-46px_rgba(35,26,10,0.65)]">
            <div className="flex items-center justify-between gap-3 bg-paper-soft px-5 py-3.5 font-mono text-[11px] uppercase tracking-[0.12em] text-ink-muted">
              <span>Link settings / Stills</span>
              <span className="text-rust">Live</span>
            </div>

            <div className="p-6">
              <p className="mb-2.5 font-mono text-[10px] uppercase tracking-[0.14em] text-ink-muted">
                Anyone with the link can
              </p>
              <div className="flex gap-1.5 rounded-full bg-tint p-1.5">
                <span className="flex-1 rounded-full bg-ink py-2.5 text-center text-[15px] font-semibold text-paper">
                  View
                </span>
                <span className="flex-1 rounded-full bg-paper py-2.5 text-center text-[15px] font-semibold text-ink">
                  Download
                </span>
                <span className="flex-1 py-2.5 text-center text-[15px] text-ink-muted">Upload</span>
              </div>

              <div className="mt-5 grid gap-3 [grid-template-columns:repeat(auto-fit,minmax(130px,1fr))]">
                <div className="rounded-[18px] bg-paper-soft px-4 py-3.5">
                  <p className="mb-1.5 font-mono text-[10px] uppercase tracking-[0.14em] text-ink-muted">
                    Expires
                  </p>
                  <p className="text-base font-semibold text-ink">In 7 days</p>
                </div>
                <div className="rounded-[18px] bg-paper-soft px-4 py-3.5">
                  <p className="mb-1.5 font-mono text-[10px] uppercase tracking-[0.14em] text-ink-muted">
                    Password
                  </p>
                  <p className="text-base tracking-[0.22em] text-ink">••••••••</p>
                </div>
              </div>

              <div className="mt-5 rounded-[22px] bg-paper-soft p-4.5">
                <p className="mb-3 font-mono text-[10px] uppercase tracking-[0.14em] text-ink-muted">
                  Opened by
                </p>
                <div className="flex flex-col gap-3">
                  {OPENED_BY.map((entry) => (
                    <div key={entry.email} className="flex items-center gap-3">
                      <span
                        className={`flex h-7.5 w-7.5 shrink-0 items-center justify-center rounded-full text-[13px] font-semibold ${entry.avatarClass}`}
                      >
                        {entry.initial}
                      </span>
                      <span className="min-w-0 flex-1 truncate text-[15px] text-ink">{entry.email}</span>
                      <span className="shrink-0 font-mono text-[11px] text-ink-muted">{entry.when}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
