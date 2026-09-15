"use client";

import { useAppShell } from "@/components/app-shell/app-shell-context";
import { PreviewModal } from "@/components/app-shell/modals/preview-modal";
import { ShareModal } from "@/components/app-shell/modals/share-modal";
import { RenameModal } from "@/components/app-shell/modals/rename-modal";
import { MoveModal } from "@/components/app-shell/modals/move-modal";
import { UploadModal } from "@/components/app-shell/modals/upload-modal";
import { NewFolderModal } from "@/components/app-shell/modals/new-folder-modal";

export function ModalRoot() {
  const { modal } = useAppShell();

  if (!modal) return null;
  if (modal.type === "preview") return <PreviewModal file={modal.file} />;
  if (modal.type === "share") return <ShareModal file={modal.file} />;
  if (modal.type === "rename") return <RenameModal file={modal.file} />;
  if (modal.type === "move") return <MoveModal file={modal.file} />;
  if (modal.type === "upload") return <UploadModal />;
  if (modal.type === "newFolder") return <NewFolderModal parentId={modal.parentId} />;
  return null;
}
