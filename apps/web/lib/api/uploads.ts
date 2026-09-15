import { apiFetch } from "./client";
import type { ApiFile } from "./types";

interface InitiateUploadResponse {
  uploadId: string;
  objectKey: string;
  uploadUrl: string;
  expiresAt: string;
}

function initiateUpload(dto: { fileName: string; mimeType: string; size: number; folderId?: string }) {
  return apiFetch<InitiateUploadResponse>("/uploads/initiate", { method: "POST", body: dto });
}

function completeUpload(uploadId: string) {
  return apiFetch<{ file: ApiFile }>("/uploads/complete", { method: "POST", body: { uploadId } });
}

// The signed URL expects a PUT with the exact bytes and Content-Type used to
// sign it. XHR (not fetch) is used here because it's the only way to get
// upload progress events in the browser.
function putToSignedUrl(uploadUrl: string, file: File, onProgress: (pct: number) => void) {
  return new Promise<void>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", uploadUrl);
    xhr.setRequestHeader("Content-Type", file.type || "application/octet-stream");
    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) onProgress(Math.round((event.loaded / event.total) * 100));
    };
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) return resolve();
      // GCS replies with an XML error whose <Code> (AccessDenied, SignatureDoesNotMatch,
      // ExpiredToken...) says which part of the storage setup is wrong.
      const code = xhr.responseText.match(/<Code>(.*?)<\/Code>/)?.[1];
      reject(new Error(`Upload to storage failed (${xhr.status}${code ? ` ${code}` : ""})`));
    };
    // No status at all means the browser blocked the request before it could be
    // read, which for a signed URL is almost always the bucket's CORS config.
    xhr.onerror = () =>
      reject(new Error("Upload to storage was blocked by the browser; check the bucket's CORS allows this origin"));
    xhr.send(file);
  });
}

export async function uploadFile(
  file: File,
  folderId: string | null,
  onProgress: (pct: number) => void,
): Promise<ApiFile> {
  const { uploadId, uploadUrl } = await initiateUpload({
    fileName: file.name,
    mimeType: file.type || "application/octet-stream",
    size: file.size,
    ...(folderId && { folderId }),
  });

  await putToSignedUrl(uploadUrl, file, onProgress);

  const { file: created } = await completeUpload(uploadId);
  return created;
}
