import { useAppShell } from "@/components/app-shell/app-shell-context";
import { ModalBackdrop } from "@/components/app-shell/modal-backdrop";

export function UploadModal() {
  const { closeModal, uploads } = useAppShell();

  return (
    <ModalBackdrop onClose={closeModal}>
      <div className="p-7.5">
        <p className="mb-5.5 font-display text-[28px] leading-tight">
          {uploads.length === 0 ? "Upload files" : `Uploading ${uploads.length} file${uploads.length === 1 ? "" : "s"}`}
        </p>

        {uploads.length === 0 && <p className="mb-5 text-ink-muted">Choose files from the Upload button in the sidebar.</p>}

        {uploads.map((upload) => (
          <div key={upload.id} className="mb-4">
            <div className="mb-2 flex justify-between gap-3">
              <span className="min-w-0 truncate text-[15px]">{upload.name}</span>
              <span className="shrink-0 font-mono text-xs text-ink-muted">
                {upload.status === "error" ? "Failed" : `${upload.pct}%`}
              </span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-[#f0e8d6]">
              <span
                className={`block h-full rounded-full ${upload.status === "error" ? "bg-rust" : "bg-gold"}`}
                style={{ width: `${upload.pct}%` }}
              />
            </div>
            {upload.error && <p className="mt-1.5 text-xs text-rust">{upload.error}</p>}
          </div>
        ))}

        <button
          onClick={closeModal}
          className="mt-2.5 w-full rounded-full border border-[#dcd3c0] bg-paper py-3.25 text-[15px] font-semibold hover:border-ink"
        >
          Hide
        </button>
      </div>
    </ModalBackdrop>
  );
}
