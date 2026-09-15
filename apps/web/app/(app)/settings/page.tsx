"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAppShell } from "@/components/app-shell/app-shell-context";
import { ModalBackdrop } from "@/components/app-shell/modal-backdrop";
import { updateName, updateAvatar } from "@/lib/api/user";
import { getStorageUsage } from "@/lib/api/storage";
import { formatBytes } from "@/lib/format";
import type { StorageUsage } from "@/lib/api/types";

export default function SettingsPage() {
  const { user, refreshUser } = useAppShell();
  const [name, setName] = useState(user?.name ?? "");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [showAvatarModal, setShowAvatarModal] = useState(false);
  const [storage, setStorage] = useState<StorageUsage | null>(null);

  useEffect(() => {
    if (user) setName(user.name);
  }, [user]);

  useEffect(() => {
    getStorageUsage().then(setStorage);
  }, []);

  if (!user) return null;

  const handleSave = async () => {
    setSaving(true);
    setSaved(false);
    try {
      await refreshUserAfter(() => updateName(name.trim()));
      setSaved(true);
    } finally {
      setSaving(false);
    }
  };

  async function refreshUserAfter(action: () => Promise<unknown>) {
    await action();
    await refreshUser();
  }

  return (
    <div className="max-w-205">
      <h1 className="font-display text-[clamp(28px,3.2vw,38px)] tracking-[-0.02em]">Account</h1>

      <div className="mt-7 flex flex-wrap items-center gap-5.5 rounded-[28px] border border-[#e9e1ce] bg-paper p-7">
        <span className="flex h-23 w-21 shrink-0 items-center justify-center overflow-hidden rounded-[50%_50%_20px_20px] bg-gold font-display text-[34px]">
          {user.avatar ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={user.avatar} alt="" className="h-full w-full object-cover" />
          ) : (
            user.name.charAt(0).toUpperCase()
          )}
        </span>
        <div className="min-w-55 flex-1">
          <p className="font-display text-[26px]">{user.name}</p>
          <p className="mt-1.5 text-[15px] text-ink-muted">{user.email}</p>
        </div>
        <button
          onClick={() => setShowAvatarModal(true)}
          className="rounded-full border border-[#dcd3c0] bg-paper px-5.5 py-3 text-[15px] font-semibold transition-colors duration-200 hover:border-ink"
        >
          Change photo
        </button>
      </div>

      <div className="mt-5 rounded-[28px] border border-[#e9e1ce] bg-paper p-7">
        <label className="mb-4.5 block">
          <span className="mb-2 block text-sm font-semibold">Display name</span>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-2xl border border-[#dcd3c0] bg-paper-warm px-4.5 py-3.5 text-base"
          />
        </label>
        <label className="mb-5.5 block">
          <span className="mb-2 block text-sm font-semibold">Email</span>
          <input
            type="text"
            value={user.email}
            readOnly
            className="w-full rounded-2xl border border-line bg-cream px-4.5 py-3.5 text-base text-ink-muted"
          />
        </label>
        <button
          onClick={handleSave}
          disabled={saving || !name.trim() || name.trim() === user.name}
          className="rounded-full bg-ink px-6.5 py-3.25 text-[15px] font-semibold text-paper transition-colors duration-200 hover:bg-rust disabled:opacity-50"
        >
          {saving ? "Saving…" : saved ? "Saved" : "Save changes"}
        </button>
      </div>

      <div className="mt-5 rounded-[28px] border border-[#e9e1ce] bg-paper p-7">
        <p className="mb-1.5 font-display text-[22px]">Storage</p>
        <p className="mb-4.5 text-[15px] text-ink-soft">
          {storage ? `${formatBytes(storage.used)} of your ${formatBytes(storage.limit)} plan.` : "Loading…"}
        </p>
        <div className="h-2.5 overflow-hidden rounded-full bg-[#eae1cd]">
          <span className="block h-full rounded-full bg-rust" style={{ width: `${storage?.percentage ?? 0}%` }} />
        </div>
        <Link href="/storage" className="mt-4 inline-block text-[15px] font-semibold text-rust">
          See the breakdown →
        </Link>
      </div>

      {showAvatarModal && (
        <AvatarModal
          currentUrl={user.avatar}
          onClose={() => setShowAvatarModal(false)}
          onSave={async (url) => {
            await refreshUserAfter(() => updateAvatar(url));
            setShowAvatarModal(false);
          }}
        />
      )}
    </div>
  );
}

function AvatarModal({
  currentUrl,
  onClose,
  onSave,
}: {
  currentUrl: string | null;
  onClose: () => void;
  onSave: (url: string) => Promise<void>;
}) {
  const [url, setUrl] = useState(currentUrl ?? "");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      await onSave(url.trim());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not update your photo");
      setSaving(false);
    }
  };

  return (
    <ModalBackdrop onClose={onClose} width="max-w-[440px]">
      <div className="p-7.5">
        <p className="mb-5 font-display text-[28px]">Change photo</p>
        {/* Avatars are set from a URL; there's no image upload for them yet. */}
        <input
          type="text"
          autoFocus
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://example.com/photo.jpg"
          className="w-full rounded-2xl border border-[#dcd3c0] bg-paper-warm px-4.5 py-3.75 text-base"
        />
        {error && <p className="mt-2.5 text-sm text-rust">{error}</p>}
        <div className="mt-5.5 flex gap-2.5">
          <button
            onClick={onClose}
            className="flex-1 rounded-full border border-[#dcd3c0] bg-paper py-3.25 text-[15px] font-semibold hover:border-ink"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving || !url.trim()}
            className="flex-1 rounded-full bg-ink py-3.25 text-[15px] font-semibold text-paper hover:bg-rust disabled:opacity-50"
          >
            {saving ? "Saving…" : "Save"}
          </button>
        </div>
      </div>
    </ModalBackdrop>
  );
}
