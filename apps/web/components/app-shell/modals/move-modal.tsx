"use client";

import { useEffect, useState } from "react";
import { useAppShell } from "@/components/app-shell/app-shell-context";
import { ModalBackdrop } from "@/components/app-shell/modal-backdrop";
import { listFolders } from "@/lib/api/folders";
import { moveFile } from "@/lib/api/files";
import type { ApiFile, ApiFolder } from "@/lib/api/types";

export function MoveModal({ file }: { file: ApiFile }) {
  const { closeModal, notifyFilesChanged } = useAppShell();
  const [folders, setFolders] = useState<ApiFolder[]>([]);
  const [selected, setSelected] = useState<string | null>(file.folderId);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    listFolders().then(setFolders);
  }, []);

  const handleMove = async () => {
    setSaving(true);
    setError(null);
    try {
      await moveFile(file.id, selected);
      notifyFilesChanged();
      closeModal();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not move this file");
      setSaving(false);
    }
  };

  return (
    <ModalBackdrop onClose={closeModal} width="max-w-[440px]">
      <div className="p-7.5">
        <p className="mb-5 font-display text-[28px]">Move {file.name}</p>

        <div className="flex max-h-70 flex-col gap-1.5 overflow-auto rounded-2xl border border-line bg-paper p-2">
          <button
            onClick={() => setSelected(null)}
            className={`flex items-center justify-between rounded-xl px-3.5 py-2.75 text-left text-[15px] ${
              selected === null ? "bg-ink text-paper" : "hover:bg-paper-soft"
            }`}
          >
            My files (root)
          </button>
          {folders.map((folder) => (
            <button
              key={folder.id}
              onClick={() => setSelected(folder.id)}
              style={{ paddingLeft: 14 + folder.depth * 16 }}
              className={`flex items-center justify-between rounded-xl py-2.75 pr-3.5 text-left text-[15px] ${
                selected === folder.id ? "bg-ink text-paper" : "hover:bg-paper-soft"
              }`}
            >
              {folder.name}
            </button>
          ))}
        </div>

        {error && <p className="mt-2.5 text-sm text-rust">{error}</p>}
        <div className="mt-5.5 flex gap-2.5">
          <button
            onClick={closeModal}
            className="flex-1 rounded-full border border-[#dcd3c0] bg-paper py-3.25 text-[15px] font-semibold hover:border-ink"
          >
            Cancel
          </button>
          <button
            onClick={handleMove}
            disabled={saving || selected === file.folderId}
            className="flex-1 rounded-full bg-ink py-3.25 text-[15px] font-semibold text-paper hover:bg-rust disabled:opacity-50"
          >
            {saving ? "Moving…" : "Move"}
          </button>
        </div>
      </div>
    </ModalBackdrop>
  );
}
