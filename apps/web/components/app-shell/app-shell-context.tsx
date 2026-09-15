"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { getMe } from "@/lib/api/user";
import { uploadFile } from "@/lib/api/uploads";
import type { ApiFile, ApiUser } from "@/lib/api/types";

type Modal =
  | { type: "preview"; file: ApiFile }
  | { type: "share"; file: ApiFile }
  | { type: "rename"; file: ApiFile }
  | { type: "move"; file: ApiFile }
  | { type: "upload" }
  | { type: "newFolder"; parentId: string | null }
  | null;

export type UploadTask = {
  id: string;
  name: string;
  pct: number;
  status: "uploading" | "done" | "error";
  error?: string;
};

type AppShellContextValue = {
  user: ApiUser | null;
  userLoading: boolean;
  refreshUser: () => Promise<void>;
  modal: Modal;
  openPreview: (file: ApiFile) => void;
  openShare: (file: ApiFile) => void;
  openRename: (file: ApiFile) => void;
  openMove: (file: ApiFile) => void;
  openUpload: () => void;
  openNewFolder: (parentId: string | null) => void;
  closeModal: () => void;
  uploads: UploadTask[];
  startUpload: (files: FileList | File[], folderId: string | null) => void;
  filesVersion: number;
  notifyFilesChanged: () => void;
};

const AppShellContext = createContext<AppShellContextValue | null>(null);

export function AppShellProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<ApiUser | null>(null);
  const [userLoading, setUserLoading] = useState(true);
  const [modal, setModal] = useState<Modal>(null);
  const [uploads, setUploads] = useState<UploadTask[]>([]);
  const [filesVersion, setFilesVersion] = useState(0);

  const refreshUser = useCallback(async () => {
    const me = await getMe();
    setUser(me);
  }, []);

  useEffect(() => {
    refreshUser()
      .catch(() => router.replace("/login"))
      .finally(() => setUserLoading(false));
  }, [refreshUser, router]);

  const notifyFilesChanged = useCallback(() => setFilesVersion((v) => v + 1), []);

  const startUpload = useCallback(
    (fileList: FileList | File[], folderId: string | null) => {
      const files = Array.from(fileList);
      if (files.length === 0) return;

      setModal({ type: "upload" });

      files.forEach((file) => {
        const id = `${file.name}-${file.size}-${Date.now()}-${Math.random()}`;
        setUploads((prev) => [...prev, { id, name: file.name, pct: 0, status: "uploading" }]);

        uploadFile(file, folderId, (pct) => {
          setUploads((prev) => prev.map((task) => (task.id === id ? { ...task, pct } : task)));
        })
          .then(() => {
            setUploads((prev) => prev.map((task) => (task.id === id ? { ...task, pct: 100, status: "done" } : task)));
            notifyFilesChanged();
          })
          .catch((error: unknown) => {
            setUploads((prev) =>
              prev.map((task) =>
                task.id === id
                  ? { ...task, status: "error", error: error instanceof Error ? error.message : "Upload failed" }
                  : task,
              ),
            );
          });
      });
    },
    [notifyFilesChanged],
  );

  const value = useMemo<AppShellContextValue>(
    () => ({
      user,
      userLoading,
      refreshUser,
      modal,
      openPreview: (file) => setModal({ type: "preview", file }),
      openShare: (file) => setModal({ type: "share", file }),
      openRename: (file) => setModal({ type: "rename", file }),
      openMove: (file) => setModal({ type: "move", file }),
      openUpload: () => setModal({ type: "upload" }),
      openNewFolder: (parentId) => setModal({ type: "newFolder", parentId }),
      closeModal: () => setModal(null),
      uploads,
      startUpload,
      filesVersion,
      notifyFilesChanged,
    }),
    [user, userLoading, refreshUser, modal, uploads, startUpload, filesVersion, notifyFilesChanged],
  );

  return <AppShellContext.Provider value={value}>{children}</AppShellContext.Provider>;
}

export function useAppShell() {
  const ctx = useContext(AppShellContext);
  if (!ctx) throw new Error("useAppShell must be used within AppShellProvider");
  return ctx;
}
