"use client";

import { useState } from "react";
import { useAppShell } from "@/components/app-shell/app-shell-context";
import { ModalBackdrop } from "@/components/app-shell/modal-backdrop";
import { renameFile } from "@/lib/api/files";
import type { ApiFile } from "@/lib/api/types";

export function RenameModal({ file }: { file: ApiFile }) {
  const { closeModal, notifyFilesChanged } = useAppShell();
  const [name, setName] = useState(file.name);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const handleRename = async () => {
    setSaving(true);
    setError(null);
    try {
      await renameFile(file.id, name.trim());
      notifyFilesChanged();
      closeModal();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not rename this file");
      setSaving(false);
    }
  };

  return (
    <ModalBackdrop onClose={closeModal} width="max-w-[440px]">
      <div className="p-7.5">
        <p className="mb-5 font-display text-[28px]">Rename file</p>
        <input
          type="text"
          autoFocus
          value={name}
          onChange={(e) => setName(e.target.value)}
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
            onClick={handleRename}
            disabled={saving || !name.trim()}
            className="flex-1 rounded-full bg-ink py-3.25 text-[15px] font-semibold text-paper hover:bg-rust disabled:opacity-50"
          >
            {saving ? "Saving…" : "Save"}
          </button>
        </div>
      </div>
    </ModalBackdrop>
  );
}
