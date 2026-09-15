"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { accessPublicShare } from "@/lib/api/share";
import { ApiError } from "@/lib/api/client";

type State =
  | { status: "checking" }
  | { status: "needs-password" }
  | { status: "ready"; downloadUrl: string }
  | { status: "error"; message: string };

export default function PublicSharePage() {
  const { token } = useParams<{ token: string }>();
  const [state, setState] = useState<State>({ status: "checking" });
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const attemptAccess = (pwd?: string) => {
    accessPublicShare(token, pwd)
      .then(({ downloadUrl }) => setState({ status: "ready", downloadUrl }))
      .catch((err: unknown) => {
        if (err instanceof ApiError && err.status === 401) {
          setState({ status: "needs-password" });
        } else {
          setState({ status: "error", message: err instanceof Error ? err.message : "This link isn't available." });
        }
      })
      .finally(() => setSubmitting(false));
  };

  useEffect(() => {
    attemptAccess();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    attemptAccess(password);
  };

  return (
    <div className="flex min-h-screen flex-col px-6 pt-8 pb-20">
      <div className="mx-auto flex w-full max-w-310 items-center justify-between">
        <Link href="/" className="flex items-center gap-2.75">
          <span className="block h-6 w-[26px] rounded-[50%_50%_30%_30%/60%_60%_40%_40%] bg-rust" aria-hidden="true" />
          <span className="font-display text-[22px]">Cloudify</span>
        </Link>
        <Link
          href="/signup"
          className="rounded-full border border-[#dcd3c0] bg-paper px-5 py-2.75 text-[15px] font-semibold"
        >
          Get started free
        </Link>
      </div>

      <div className="mx-auto mt-20 w-full max-w-110 text-center">
        <span className="inline-flex h-24 w-21.5 items-center justify-center rounded-[50%_50%_22px_22px] bg-rust">
          <span className="block h-8.5 w-7.5 rounded-[9px_9px_10px_10px/11px_11px_10px_10px] bg-paper" />
        </span>

        {state.status === "checking" && <p className="mt-7 text-lg text-ink-soft">Checking this link…</p>}

        {state.status === "needs-password" && (
          <form onSubmit={handlePasswordSubmit} className="mt-7 text-left">
            <p className="mb-2 text-center font-display text-[26px]">This file is password protected</p>
            <p className="mb-6 text-center text-ink-soft">Enter the password to get a download link.</p>
            <label className="block">
              <span className="mb-2 block text-sm font-semibold">Password</span>
              <input
                type="password"
                autoFocus
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-2xl border border-[#dcd3c0] bg-paper px-4.5 py-3.5 text-base"
              />
            </label>
            <button
              type="submit"
              disabled={submitting || !password}
              className="mt-5 w-full rounded-full bg-rust py-4 text-[17px] font-semibold text-paper transition-colors duration-200 hover:bg-ink disabled:opacity-50"
            >
              {submitting ? "Checking…" : "Unlock"}
            </button>
          </form>
        )}

        {state.status === "ready" && (
          <>
            <h1 className="mt-7 font-display text-[32px] leading-tight">Your file is ready</h1>
            <p className="mt-3 text-ink-soft">This download link is only valid for 5 minutes.</p>
            <a
              href={state.downloadUrl}
              className="mt-7 inline-flex items-center gap-2.5 rounded-full bg-rust px-8.5 py-4.25 text-[17px] font-semibold text-paper shadow-[0_18px_36px_-18px_rgba(178,60,11,0.85)] transition-all duration-200 hover:-translate-y-0.5 hover:bg-ink"
            >
              Download <span className="text-[15px]">↓</span>
            </a>
            <p className="mt-5 font-mono text-[11px] tracking-[0.1em] text-ink-muted uppercase">No account needed</p>
          </>
        )}

        {state.status === "error" && (
          <>
            <h1 className="mt-7 font-display text-[28px] leading-tight">This link isn&apos;t available</h1>
            <p className="mt-3 text-ink-soft">{state.message}</p>
          </>
        )}
      </div>
    </div>
  );
}
