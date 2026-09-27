"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAppShell } from "@/components/app-shell/app-shell-context";
import { listFolders } from "@/lib/api/folders";
import { search } from "@/lib/api/search";
import { formatBytes } from "@/lib/format";
import type { ApiFolder } from "@/lib/api/types";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/files", label: "My files" },
  { href: "/search", label: "Search" },
  { href: "/storage", label: "Storage" },
  { href: "/settings", label: "Account" },
];

const FOLDER_COLORS = [
  "bg-rust",
  "bg-gold",
  "bg-stone",
  "bg-[#d9cfb4]",
  "bg-[#e0d6bc]",
];

export function Sidebar() {
  const pathname = usePathname();
  const {
    user,
    openNewFolder,
    startUpload,
    filesVersion,
    sidebarOpen,
    setSidebarOpen,
  } = useAppShell();
  const [folders, setFolders] = useState<ApiFolder[]>([]);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);

  const currentFolderId = pathname.startsWith("/files/")
    ? (pathname.split("/")[2] ?? null)
    : null;

  useEffect(() => {
    listFolders().then((all) => {
      setFolders(all);

      // One search call per folder, run in parallel — fine at sidebar scale,
      // but this won't scale to accounts with hundreds of folders.
      Promise.all(
        all.map((folder) => search({ folderId: folder.id, limit: 1 })),
      ).then((results) => {
        const next: Record<string, number> = {};
        all.forEach((folder, i) => {
          next[folder.id] = results[i]!.pagination.total;
        });
        setCounts(next);
      });
    });
  }, [filesVersion]);

  // Close the mobile drawer whenever the route changes.
  useEffect(() => {
    setSidebarOpen(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  useEffect(() => {
    if (!sidebarOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setSidebarOpen(false);
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [sidebarOpen, setSidebarOpen]);

  const storageUsed = user ? Number(user.storageUsed) : 0;
  const storageLimit = user ? Number(user.storageLimit) : 0;
  const storagePercent =
    storageLimit > 0 ? Math.round((storageUsed / storageLimit) * 100) : 0;

  return (
    <>
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-ink/40 backdrop-blur-[2px] lg:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-[min(288px,86vw)] flex-col gap-6.5 overflow-y-auto border-r border-line bg-band px-4.5 pt-6.5 pb-7.5 transition-transform duration-200 lg:sticky lg:top-0 lg:bottom-auto lg:z-auto lg:h-screen lg:w-auto lg:translate-x-0 ${
          sidebarOpen
            ? "translate-x-0 shadow-[0_0_60px_-10px_rgba(35,26,10,0.5)]"
            : "-translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between gap-2">
          <Link href="/dashboard" className="flex items-center gap-2.5 px-2">
            <span
              className="block h-6 w-[26px] rounded-[50%_50%_30%_30%/60%_60%_40%_40%] bg-rust"
              aria-hidden="true"
            />
            <span className="font-display text-[21px] text-ink">Cloudify</span>
          </Link>
          <button
            type="button"
            onClick={() => setSidebarOpen(false)}
            aria-label="Close menu"
            className="flex h-9 w-9 items-center justify-center rounded-full text-ink-soft transition-colors duration-200 hover:bg-paper-soft lg:hidden"
          >
            <svg
              viewBox="0 0 20 20"
              fill="none"
              className="h-4.5 w-4.5"
              aria-hidden="true"
            >
              <path
                d="M5 5l10 10M15 5L5 15"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          multiple
          className="hidden"
          onChange={(e) => {
            if (e.target.files) startUpload(e.target.files, currentFolderId);
            setSidebarOpen(false);
            e.target.value = "";
          }}
        />
        <button
          onClick={() => fileInputRef.current?.click()}
          className="w-full rounded-full bg-rust py-3.5 text-[15px] font-semibold text-paper shadow-[0_14px_28px_-16px_rgba(178,60,11,0.9)] transition-colors duration-200 hover:bg-ink"
        >
          Upload
        </button>

        <nav className="flex flex-col gap-0.75">
          {NAV_ITEMS.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-2.75 rounded-[14px] px-3.5 py-2.75 text-[15px] font-medium transition-colors duration-200 hover:bg-paper-soft ${
                  active ? "bg-paper text-ink" : "text-ink-soft"
                }`}
              >
                <span
                  className={`h-[7px] w-[7px] rounded-full ${active ? "bg-rust" : "bg-[#d2c8b0]"}`}
                  aria-hidden="true"
                />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div>
          <p className="mb-2.5 px-3.5 font-mono text-[10px] uppercase tracking-[0.14em] text-ink-muted">
            Folders
          </p>
          <div className="flex flex-col gap-0.5">
            {folders.map((folder, i) => (
              <Link
                key={folder.id}
                href={`/files/${folder.id}`}
                style={{ marginLeft: folder.depth * 16 }}
                className="flex items-center gap-2.5 rounded-xl px-3.5 py-2.25 text-[15px] text-ink-soft transition-colors duration-200 hover:bg-paper-soft"
              >
                <span
                  className={`h-3.5 w-[17px] shrink-0 rounded-[4px_4px_5px_5px] ${FOLDER_COLORS[i % FOLDER_COLORS.length]}`}
                  aria-hidden="true"
                />
                <span className="min-w-0 flex-1 truncate">{folder.name}</span>
                <span className="shrink-0 font-mono text-[11px] text-[#8a8067]">
                  {counts[folder.id] ?? ""}
                </span>
              </Link>
            ))}
            <button
              onClick={() => {
                setSidebarOpen(false);
                openNewFolder(currentFolderId);
              }}
              className="flex items-center gap-2.5 rounded-xl px-3.5 py-2.25 text-left text-[15px] text-[#8a8067] transition-colors duration-200 hover:bg-paper-soft hover:text-ink"
            >
              + New folder
            </button>
          </div>
        </div>

        <div className="mt-auto rounded-[20px] border border-line bg-paper p-4">
          <div className="flex items-baseline justify-between gap-2">
            <p className="font-display text-xl text-ink">
              {formatBytes(storageUsed)}
              <span className="text-[13px] text-ink-muted">
                {" "}
                / {formatBytes(storageLimit)}
              </span>
            </p>
            <span className="font-mono text-[11px] text-rust">
              {storagePercent}%
            </span>
          </div>
          <div className="mt-2.5 h-2 overflow-hidden rounded-full bg-[#eae1cd]">
            <span
              className="block h-full rounded-full bg-rust"
              style={{ width: `${storagePercent}%` }}
            />
          </div>
          <Link
            href="/storage"
            className="mt-3 inline-block text-[13px] font-semibold text-rust"
          >
            Manage storage
          </Link>
        </div>
      </aside>
    </>
  );
}
