"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useAppShell } from "@/components/app-shell/app-shell-context";
import { FileIcon } from "@/components/app-shell/file-icon";
import { FileRowMenu } from "@/components/app-shell/file-row-menu";
import { listFolders, listFolderFiles } from "@/lib/api/folders";
import { ApiError } from "@/lib/api/client";
import { formatBytes, formatRelativeTime, fileKindFromMime, colorForName } from "@/lib/format";
import type { ApiFile, ApiFolder } from "@/lib/api/types";

const FOLDER_COLORS = ["bg-rust", "bg-gold", "bg-stone", "bg-[#d9cfb4]", "bg-[#e0d6bc]"];

export default function FolderPage() {
  const { folderId } = useParams<{ folderId: string }>();
  const { openPreview, openUpload, openNewFolder, startUpload, filesVersion } = useAppShell();
  const [allFolders, setAllFolders] = useState<ApiFolder[]>([]);
  const [files, setFiles] = useState<ApiFile[]>([]);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    setNotFound(false);
    listFolders().then(setAllFolders);
    listFolderFiles(folderId)
      .then((res) => setFiles(res.files))
      .catch((err) => {
        if (err instanceof ApiError && err.status === 404) setNotFound(true);
      });
  }, [folderId, filesVersion]);

  const current = allFolders.find((f) => f.id === folderId);
  const subfolders = allFolders.filter((f) => f.parentId === folderId);

  const breadcrumb: ApiFolder[] = [];
  let walker = current;
  while (walker) {
    breadcrumb.unshift(walker);
    walker = allFolders.find((f) => f.id === walker!.parentId);
  }

  if (notFound) {
    return (
      <div className="max-w-285">
        <p className="text-ink-muted">This folder doesn&apos;t exist, or isn&apos;t yours.</p>
        <Link href="/files" className="mt-3 inline-block font-semibold text-rust">
          Back to my files
        </Link>
      </div>
    );
  }

  return (
    <div
      className="max-w-285"
      onDragOver={(e) => {
        e.preventDefault();
        setDragOver(true);
      }}
      onDragLeave={() => setDragOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragOver(false);
        if (e.dataTransfer.files.length) startUpload(e.dataTransfer.files, folderId);
      }}
    >
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="mb-2.5 font-mono text-[11px] tracking-[0.14em] text-ink-muted">
            <Link href="/files" className="text-ink-muted">
              My files
            </Link>
            {breadcrumb.map((folder, i) => (
              <span key={folder.id}>
                {" "}
                /{" "}
                {i === breadcrumb.length - 1 ? (
                  <span className="text-rust">{folder.name}</span>
                ) : (
                  <Link href={`/files/${folder.id}`} className="text-ink-muted">
                    {folder.name}
                  </Link>
                )}
              </span>
            ))}
          </p>
          <h1 className="font-display text-[clamp(28px,3.2vw,38px)] tracking-[-0.02em]">{current?.name ?? "…"}</h1>
          <p className="mt-2.5 text-base text-ink-soft">
            {subfolders.length} folder{subfolders.length === 1 ? "" : "s"} · {files.length} file
            {files.length === 1 ? "" : "s"}
          </p>
        </div>
        <div className="flex flex-wrap gap-2.5">
          <button
            onClick={() => openNewFolder(folderId)}
            className="rounded-full border border-[#dcd3c0] bg-paper px-5 py-2.75 text-[15px] font-semibold transition-colors duration-200 hover:border-ink"
          >
            New folder
          </button>
          <button
            onClick={openUpload}
            className="rounded-full bg-ink px-5.5 py-2.75 text-[15px] font-semibold text-paper transition-colors duration-200 hover:bg-rust"
          >
            Upload
          </button>
        </div>
      </div>

      {subfolders.length > 0 && (
        <div className="mt-6 grid gap-3 [grid-template-columns:repeat(auto-fit,minmax(220px,1fr))]">
          {subfolders.map((folder, i) => (
            <Link
              key={folder.id}
              href={`/files/${folder.id}`}
              className="flex items-center gap-3 rounded-[20px] border border-[#e9e1ce] bg-paper px-4.5 py-4 transition-colors duration-200 hover:border-ink"
            >
              <span className={`h-8 w-9 shrink-0 rounded-[9px] ${FOLDER_COLORS[i % FOLDER_COLORS.length]}`} />
              <span className="min-w-0 truncate text-base font-medium">{folder.name}</span>
            </Link>
          ))}
        </div>
      )}

      <div
        className={`mt-6 overflow-hidden rounded-[26px] border bg-paper shadow-[0_30px_60px_-50px_rgba(35,26,10,0.7)] ${
          dragOver ? "border-rust" : "border-[#e9e1ce]"
        }`}
      >
        <div className="grid grid-cols-[minmax(0,3fr)_1fr_1fr_1.1fr_44px] gap-3.5 border-b border-[#efe7d6] px-5.5 py-3.5 font-mono text-[10px] tracking-[0.14em] text-ink-muted uppercase">
          <span>Name</span>
          <span>Size</span>
          <span>Kind</span>
          <span>Modified</span>
          <span />
        </div>
        {files.length === 0 && <p className="px-5.5 py-8 text-center text-ink-muted">No files in this folder yet.</p>}
        {files.map((file) => (
          <div
            key={file.id}
            className="relative grid grid-cols-[minmax(0,3fr)_1fr_1fr_1.1fr_44px] items-center gap-3.5 border-b border-[#f4eedf] px-5.5 py-3.5"
          >
            <button onClick={() => openPreview(file)} className="flex min-w-0 items-center gap-3.25 text-left">
              <FileIcon color={colorForName(file.name)} className="h-7.5 w-7" />
              <span className="min-w-0 truncate text-base font-medium">{file.name}</span>
            </button>
            <span className="font-mono text-[13px] text-ink-soft">{formatBytes(file.size)}</span>
            <span className="text-sm text-ink-muted">{fileKindFromMime(file.mimeType)}</span>
            <span className="text-sm text-ink-muted">{formatRelativeTime(file.updatedAt)}</span>
            <button
              onClick={() => setOpenMenuId((id) => (id === file.id ? null : file.id))}
              className="h-8 w-8 justify-self-end rounded-full text-lg text-ink-muted transition-colors duration-200 hover:bg-[#f0e8d6]"
            >
              ⋯
            </button>
            {openMenuId === file.id && <FileRowMenu file={file} onClose={() => setOpenMenuId(null)} />}
          </div>
        ))}
        <button
          onClick={openUpload}
          className="mx-5.5 my-5.5 block w-[calc(100%-44px)] rounded-[20px] border-2 border-dashed border-[#c9bea2] bg-paper-warm p-6.5 text-center transition-colors duration-200 hover:border-rust"
        >
          <p className="text-base font-semibold">Drag files or a folder here to upload</p>
        </button>
      </div>
    </div>
  );
}
