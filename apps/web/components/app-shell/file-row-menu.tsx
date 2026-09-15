import { useAppShell } from "@/components/app-shell/app-shell-context";
import { deleteFile, getDownloadUrl } from "@/lib/api/files";
import type { ApiFile } from "@/lib/api/types";

export function FileRowMenu({ file, onClose }: { file: ApiFile; onClose: () => void }) {
  const { openPreview, openShare, openRename, openMove, notifyFilesChanged } = useAppShell();

  const items: { label: string; key: string; danger?: boolean; onSelect: () => void }[] = [
    { label: "Open", key: "↵", onSelect: () => openPreview(file) },
    { label: "Share link", key: "⌘S", onSelect: () => openShare(file) },
    {
      label: "Download",
      key: "⌘D",
      onSelect: async () => {
        const { downloadUrl } = await getDownloadUrl(file.id);
        // The URL responds with Content-Disposition: attachment, so navigating to it
        // saves the file without leaving the page (a new tab would stay blank).
        window.location.assign(downloadUrl);
      },
    },
    { label: "Rename", key: "F2", onSelect: () => openRename(file) },
    { label: "Move to…", key: "⌘M", onSelect: () => openMove(file) },
    {
      label: "Delete",
      key: "⌫",
      danger: true,
      onSelect: async () => {
        if (!window.confirm(`Delete ${file.name}? This can't be undone from here.`)) return;
        await deleteFile(file.id);
        notifyFilesChanged();
      },
    },
  ];

  return (
    <div className="absolute top-full right-0 z-30 mt-1.5 w-59 rounded-[20px] border border-line bg-paper p-2 shadow-[0_30px_60px_-34px_rgba(35,26,10,0.7)]">
      {items.map((item) => (
        <button
          key={item.label}
          onClick={() => {
            item.onSelect();
            onClose();
          }}
          className={`flex w-full items-center justify-between gap-3 rounded-xl px-3.5 py-2.5 text-left text-[15px] transition-colors duration-200 hover:bg-paper-soft ${
            item.danger ? "text-rust" : "text-ink"
          }`}
        >
          {item.label}
          <span className="font-mono text-[10px] text-[#a0967d]">{item.key}</span>
        </button>
      ))}
    </div>
  );
}
