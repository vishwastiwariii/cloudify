"use client";

import { useEffect, useState } from "react";
import { useAppShell } from "@/components/app-shell/app-shell-context";
import { ModalBackdrop } from "@/components/app-shell/modal-backdrop";
import { FileIcon } from "@/components/app-shell/file-icon";
import { getDownloadUrl, deleteFile } from "@/lib/api/files";
import { getFolder } from "@/lib/api/folders";
import { getShare } from "@/lib/api/share";
import { formatBytes, formatRelativeTime, fileKindFromMime, colorForName } from "@/lib/format";
import type { ApiFile, PublicShare } from "@/lib/api/types";

export function PreviewModal({ file }: { file: ApiFile }) {
  const { closeModal, notifyFilesChanged, openShare, openRename, openMove } = useAppShell();
  const [location, setLocation] = useState("My files");
  const [shared, setShared] = useState<boolean | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (file.folderId) {
      getFolder(file.folderId)
        .then((folder) => setLocation(folder.name))
        .catch(() => setLocation("My files"));
    }

    getShare(file.id)
      .then((share: PublicShare) => setShared(share.isActive))
      .catch(() => setShared(false));
  }, [file.folderId, file.id]);

  const handleDownload = async () => {
    const { downloadUrl } = await getDownloadUrl(file.id);
    // The URL responds with Content-Disposition: attachment, so navigating to it
    // saves the file without leaving the page (a new tab would stay blank).
    window.location.assign(downloadUrl);
  };

  const handleDelete = async () => {
    if (!window.confirm(`Delete ${file.name}? This can't be undone from here.`)) return;
    setDeleting(true);
    await deleteFile(file.id);
    notifyFilesChanged();
    closeModal();
  };

  const meta: [string, string][] = [
    ["Kind", fileKindFromMime(file.mimeType)],
    ["Size", formatBytes(file.size)],
    ["Modified", formatRelativeTime(file.updatedAt)],
    ["Location", location],
    ["Encryption", "AES-256 at rest"],
    ["Share status", shared === null ? "Checking…" : shared ? "Link live" : "Private"],
  ];

  return (
    <ModalBackdrop onClose={closeModal} width="max-w-[940px]">
      <div className="max-h-[86vh] overflow-auto">
        <div className="flex flex-wrap items-center gap-3.5 border-b border-[#efe7d6] px-6.5 py-5">
          <FileIcon color={colorForName(file.name)} className="h-8.5 w-7.5" />
          <div className="min-w-35 flex-1">
            <p className="text-lg font-semibold">{file.name}</p>
          </div>
          <button
            onClick={() => openShare(file)}
            className="rounded-full border border-[#dcd3c0] bg-paper px-5 py-2.5 text-sm font-semibold hover:border-ink"
          >
            Share
          </button>
          <button
            onClick={handleDownload}
            className="rounded-full bg-ink px-5 py-2.5 text-sm font-semibold text-paper hover:bg-rust"
          >
            Download
          </button>
          <button
            onClick={closeModal}
            className="flex h-8.5 w-8.5 items-center justify-center rounded-full text-lg text-ink-muted hover:bg-[#f0e8d6]"
          >
            ✕
          </button>
        </div>

        <div className="grid [grid-template-columns:repeat(auto-fit,minmax(260px,1fr))]">
          <div className="flex min-h-85 items-center justify-center bg-band p-7.5">
            <div
              className="flex aspect-4/3 w-full max-w-95 items-center justify-center rounded-[22px] shadow-[0_30px_60px_-34px_rgba(35,26,10,0.8)]"
              style={{ background: "linear-gradient(150deg, #d9cfb4, #b9aa8a)" }}
            >
              <span className="font-mono text-[11px] tracking-[0.16em] text-paper uppercase">Preview</span>
            </div>
          </div>
          <div className="p-7 pt-6.5">
            <p className="mb-4.5 font-mono text-[11px] uppercase tracking-[0.14em] text-ink-muted">Details</p>
            {meta.map(([key, value]) => (
              <div key={key} className="flex justify-between gap-4 border-b border-[#f2ebda] py-2.75">
                <span className="text-[15px] text-ink-muted">{key}</span>
                <span className="text-right text-[15px] font-medium">{value}</span>
              </div>
            ))}
            <div className="mt-5.5 flex flex-wrap gap-2.5">
              <button
                onClick={() => openRename(file)}
                className="rounded-full border border-[#dcd3c0] bg-paper px-4.5 py-2.5 text-sm hover:border-ink"
              >
                Rename
              </button>
              <button
                onClick={() => openMove(file)}
                className="rounded-full border border-[#dcd3c0] bg-paper px-4.5 py-2.5 text-sm hover:border-ink"
              >
                Move
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="rounded-full border border-[#e8c4b2] bg-[#fdf1eb] px-4.5 py-2.5 text-sm text-rust hover:bg-rust hover:text-paper disabled:opacity-50"
              >
                {deleting ? "Deleting…" : "Delete"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </ModalBackdrop>
  );
}
