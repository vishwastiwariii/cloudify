"use client";

import { useState } from "react";
import { useAppShell } from "@/components/app-shell/app-shell-context";
import { ModalBackdrop } from "@/components/app-shell/modal-backdrop";
import { createFolder } from "@/lib/api/folders";

export function NewFolderModal({ parentId }: { parentId: string | null }) {
  const { closeModal, notifyFilesChanged } = useAppShell();
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const handleCreate = async () => {
    if (!name.trim()) return;
    setSaving(true);
    setError(null);
    try {
      await createFolder({ name: name.trim(), ...(parentId && { parentId }) });
      notifyFilesChanged();
      closeModal();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create this folder");
      setSaving(false);
    }
  };

  return (
    <ModalBackdrop onClose={closeModal} width="max-w-[440px]">
      <div className="p-7.5">
        <p className="mb-5 font-display text-[28px]">New folder</p>
        <input
          type="text"
          autoFocus
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Folder name"
          className="w-full rounded-2xl border border-[#dcd3c0] bg-paper-warm px-4.5 py-3.75 text-base"
        />
        {error && <p className="mt-2.5 text-sm text-rust">{error}</p>}
        <div className="mt-5.5 flex gap-2.5">
          <button
            onClick={closeModal}
            className="flex-1 rounded-full border border-[#dcd3c0] bg-paper py-3.25 text-[15px] font-semibold hover:border-ink"
          >
            Cancel
          </button>
          <button
            onClick={handleCreate}
            disabled={saving || !name.trim()}
            className="flex-1 rounded-full bg-ink py-3.25 text-[15px] font-semibold text-paper hover:bg-rust disabled:opacity-50"
          >
            {saving ? "Creating…" : "Create"}
          </button>
        </div>
      </div>
    </ModalBackdrop>
  );
}
