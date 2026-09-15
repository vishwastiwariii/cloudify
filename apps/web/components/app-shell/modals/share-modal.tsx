"use client";

import { useEffect, useState } from "react";
import { useAppShell } from "@/components/app-shell/app-shell-context";
import { ModalBackdrop } from "@/components/app-shell/modal-backdrop";
import { createShare, disableShare, getShare } from "@/lib/api/share";
import type { ApiFile, PublicShare } from "@/lib/api/types";

export function ShareModal({ file }: { file: ApiFile }) {
  const { closeModal } = useAppShell();
  const [loading, setLoading] = useState(true);
  const [share, setShare] = useState<PublicShare | null>(null);
  const [password, setPassword] = useState("");
  const [expires, setExpires] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getShare(file.id)
      .then((existing) => setShare(existing.isActive ? existing : null))
      .catch(() => setShare(null))
      .finally(() => setLoading(false));
  }, [file.id]);

  const handleCreate = async () => {
    setSaving(true);
    setError(null);
    try {
      const created = await createShare(file.id, {
        ...(password.trim() && { password: password.trim() }),
        ...(expires && { expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() }),
      });
      setShare(created);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create a share link");
    } finally {
      setSaving(false);
    }
  };

  const handleRevoke = async () => {
    setSaving(true);
    try {
      await disableShare(file.id);
      setShare(null);
    } finally {
      setSaving(false);
    }
  };

  const handleCopy = () => {
    if (!share) return;
    navigator.clipboard?.writeText(share.shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  };

  return (
    <ModalBackdrop onClose={closeModal}>
      <div className="p-7.5">
        <p className="font-display text-[28px] leading-tight">Share {file.name}</p>

        {loading ? (
          <p className="mt-6 text-ink-muted">Checking for an existing link…</p>
        ) : share ? (
          <>
            <div className="mt-5.5 flex items-center gap-2.5 rounded-[18px] bg-ink px-4 py-3.5 text-paper">
              <span className="min-w-0 flex-1 truncate font-mono text-[13px]">{share.shareUrl}</span>
              <button
                onClick={handleCopy}
                className="shrink-0 rounded-full bg-paper px-4 py-2.25 font-mono text-[10px] tracking-[0.1em] text-ink uppercase transition-colors duration-200 hover:bg-rust hover:text-paper"
              >
                {copied ? "Copied" : "Copy"}
              </button>
            </div>
            <div className="mt-4 flex flex-wrap gap-2 text-sm text-ink-soft">
              <span className="rounded-full bg-paper-soft px-3 py-1.5">
                {share.hasPassword ? "Password protected" : "No password"}
              </span>
              <span className="rounded-full bg-paper-soft px-3 py-1.5">
                {share.expiresAt ? `Expires ${new Date(share.expiresAt).toLocaleDateString()}` : "No expiry"}
              </span>
            </div>
            <div className="mt-6 flex gap-2.5">
              <button
                onClick={handleRevoke}
                disabled={saving}
                className="flex-1 rounded-full border border-[#e8c4b2] bg-[#fdf1eb] py-3.25 text-[15px] font-semibold text-rust hover:bg-rust hover:text-paper disabled:opacity-50"
              >
                Revoke
              </button>
              <a
                href={share.shareUrl}
                target="_blank"
                rel="noreferrer"
                className="flex-1 rounded-full bg-rust py-3.25 text-center text-[15px] font-semibold text-paper hover:bg-ink"
              >
                Preview link
              </a>
            </div>
          </>
        ) : (
          <>
            <label className="mt-6 block">
              <span className="mb-2 block text-sm font-semibold">Password (optional)</span>
              <input
                type="text"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Leave blank for no password"
                className="w-full rounded-2xl border border-[#dcd3c0] bg-paper px-4.5 py-3.5 text-base"
              />
            </label>
            <label className="mt-4 flex items-center gap-2.5 text-[15px] text-ink-soft">
              <input
                type="checkbox"
                checked={expires}
                onChange={(e) => setExpires(e.target.checked)}
                className="h-5 w-5 accent-rust"
              />
              Expire in 7 days
            </label>
            {error && <p className="mt-3 text-sm text-rust">{error}</p>}
            <div className="mt-6 flex gap-2.5">
              <button
                onClick={closeModal}
                className="flex-1 rounded-full border border-[#dcd3c0] bg-paper py-3.25 text-[15px] font-semibold hover:border-ink"
              >
                Cancel
              </button>
              <button
                onClick={handleCreate}
                disabled={saving}
                className="flex-1 rounded-full bg-rust py-3.25 text-[15px] font-semibold text-paper hover:bg-ink disabled:opacity-50"
              >
                {saving ? "Creating…" : "Create link"}
              </button>
            </div>
          </>
        )}
      </div>
    </ModalBackdrop>
  );
}
