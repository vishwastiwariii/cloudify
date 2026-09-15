export function formatBytes(bytes: string | number) {
  const value = typeof bytes === "string" ? Number(bytes) : bytes;
  if (!Number.isFinite(value) || value <= 0) return "0 B";

  const units = ["B", "KB", "MB", "GB", "TB"];
  const exponent = Math.min(Math.floor(Math.log(value) / Math.log(1024)), units.length - 1);
  const scaled = value / 1024 ** exponent;

  return `${exponent === 0 ? scaled : scaled.toFixed(scaled >= 10 ? 0 : 1)} ${units[exponent]}`;
}

export function formatRelativeTime(iso: string) {
  const date = new Date(iso);
  const seconds = Math.round((date.getTime() - Date.now()) / 1000);
  const divisions: [number, Intl.RelativeTimeFormatUnit][] = [
    [60, "second"],
    [60, "minute"],
    [24, "hour"],
    [7, "day"],
    [4.34524, "week"],
    [12, "month"],
    [Number.POSITIVE_INFINITY, "year"],
  ];

  const formatter = new Intl.RelativeTimeFormat("en", { numeric: "auto" });
  let duration = seconds;

  for (const [amount, unit] of divisions) {
    if (Math.abs(duration) < amount) return formatter.format(Math.round(duration), unit);
    duration /= amount;
  }

  return formatter.format(Math.round(duration), "year");
}

export function fileKindFromMime(mimeType: string) {
  if (mimeType.startsWith("image/")) return "Image";
  if (mimeType.startsWith("video/")) return "Video";
  if (mimeType.startsWith("audio/")) return "Audio";
  if (mimeType === "application/pdf") return "PDF";
  if (mimeType.includes("zip") || mimeType.includes("rar") || mimeType.includes("7z") || mimeType.includes("tar")) {
    return "Archive";
  }
  if (mimeType.includes("document") || mimeType.startsWith("text/")) return "Doc";
  return "File";
}

const FILE_COLORS = ["bg-rust", "bg-gold", "bg-stone", "bg-[#d9cfb4]", "bg-[#efe0ba]", "bg-[#8a8067]"];

export function colorForName(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) >>> 0;
  return FILE_COLORS[hash % FILE_COLORS.length]!;
}
