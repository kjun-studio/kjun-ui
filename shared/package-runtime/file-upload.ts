// KjunFileUpload state rules shared by Vue 3, React and Native. The app owns the files and the upload itself;
// these helpers only pre-screen picks, read drags and shape what the rows show.
import type { KjunMessages } from "./messages";

export type KjunUploadStatus = "queued" | "uploading" | "done" | "error";
export interface KjunUploadFile {
  id: string;
  name: string;
  /** Bytes. */
  size: number;
  status: KjunUploadStatus;
  /** 0–100 while uploading; leave it out for an indeterminate bar. */
  progress?: number;
  /** Text shown on a failed row; the default message is used without it. */
  error?: string;
  /** Image thumbnail; the extension is shown without it. */
  previewUrl?: string;
  type?: string;
}
export type KjunRejectReason = "type" | "size" | "count";
export interface KjunRejectedFile<T> { file: T; reason: KjunRejectReason }
/** What a Native picker returns; Web hands over File objects instead. */
export interface KjunPickedFile { name: string; size: number; type?: string; uri?: string }
export interface UploadLimits { accept?: string; maxSize?: number; maxFiles?: number; multiple?: boolean; current: number }
export type DragVerdict = "ok" | "type" | "count" | "unknown";

const acceptParts = (accept?: string) => (accept ?? "").split(",").map(part => part.trim().toLowerCase()).filter(Boolean);

/** Splits a name at its last dot; a leading dot (".env") is part of the name, not an extension. */
function splitExt(name: string) {
  const dot = name.lastIndexOf(".");
  return dot > 0 ? { stem: name.slice(0, dot), ext: name.slice(dot) } : { stem: name, ext: "" };
}

/** The <input accept> rules: ".ext" by name, "type/*" and "type/sub" by MIME. An empty accept takes anything. */
export function matchesAccept(name: string, type: string | undefined, accept?: string): boolean {
  const parts = acceptParts(accept);
  if (!parts.length) return true;
  const lower = name.toLowerCase(), mime = (type ?? "").toLowerCase();
  return parts.some(part => part.startsWith(".") ? lower.endsWith(part)
    : part.endsWith("/*") ? !!mime && mime.startsWith(part.slice(0, -1))
    : !!mime && mime === part);
}

/** Free places: one in single-file mode (the pick replaces the file), unlimited without maxFiles. */
export function uploadRoom({ maxFiles, multiple, current }: UploadLimits): number {
  if (multiple === false) return 1;
  return maxFiles == null ? Infinity : Math.max(0, maxFiles - current);
}

/** Checks type, then size, then fills the free places in order; the rest are rejected as count. */
export function screenFiles<T extends { name: string; size: number; type?: string }>(files: T[], limits: UploadLimits) {
  const accepted: T[] = [], rejected: KjunRejectedFile<T>[] = [];
  let room = uploadRoom(limits);
  for (const file of files) {
    if (!matchesAccept(file.name, file.type, limits.accept)) rejected.push({ file, reason: "type" });
    else if (limits.maxSize != null && file.size > limits.maxSize) rejected.push({ file, reason: "size" });
    else if (room <= 0) rejected.push({ file, reason: "count" });
    else { accepted.push(file); room--; }
  }
  return { accepted, rejected };
}

/** What a drag can tell before the drop: the number of files and, in some browsers, their MIME types. Never size. */
export function dragVerdict(items: { kind: string; type: string }[], limits: UploadLimits): { verdict: DragVerdict; count: number; room: number } {
  const files = items.filter(item => item.kind === "file");
  const count = files.length, room = uploadRoom(limits);
  // A drag carries no names, so ".ext" rules cannot be checked: only an accept made of MIME rules can block a drag.
  const parts = acceptParts(limits.accept), byMime = parts.length > 0 && parts.every(part => !part.startsWith("."));
  const known = byMime ? files.filter(item => item.type) : [];
  if (known.length && known.length === count && known.every(item => !matchesAccept("", item.type, limits.accept)))
    return { verdict: "type", count, room };
  if (count > room) return { verdict: "count", count, room };
  // Neutral when the accept rules could not be checked against every file; with no rules there is nothing to check.
  return { verdict: parts.length > 0 && known.length < count ? "unknown" : "ok", count, room };
}

/** Middle truncation: the head may be cut, the tail (last 4 stem characters and the extension) always shows. */
export function splitFileName(name: string): { head: string; tail: string } {
  const { stem, ext } = splitExt(name);
  const chars = Array.from(stem), cut = Math.max(0, chars.length - 4);
  return { head: chars.slice(0, cut).join(""), tail: chars.slice(cut).join("") + ext };
}

/** Thumbnail text for a file without a preview: the extension in capitals, at most 4 letters. */
export function extensionLabel(name: string, _type?: string): string {
  const { ext } = splitExt(name);
  return ext ? Array.from(ext.slice(1).toUpperCase()).slice(0, 4).join("") : "FILE";
}

const byteUnits = ["B", "KB", "MB", "GB"];
/** 1024 steps; one decimal under 100, none from 100 up; no space before the unit. */
export function formatBytes(bytes: number, intl?: string): string {
  let value = Math.max(0, bytes), unit = 0;
  while (value >= 1024 && unit < byteUnits.length - 1) { value /= 1024; unit++; }
  const digits = unit === 0 || value >= 100 ? 0 : 1;
  return new Intl.NumberFormat(intl, { maximumFractionDigits: digits, useGrouping: false }).format(value) + byteUnits[unit];
}

export function clampProgress(progress: number | undefined): number | undefined {
  if (progress == null || !Number.isFinite(progress)) return undefined;
  return Math.min(100, Math.max(0, progress));
}

export function uploadSummary(files: { status: KjunUploadStatus }[]) {
  const count = (status: KjunUploadStatus) => files.filter(file => file.status === status).length;
  return { total: files.length, done: count("done"), failed: count("error"), uploading: count("uploading"), queued: count("queued") };
}

/** Rows that just became done or failed, for the live region. The first render (no previous state) announces nothing. */
export function uploadTransitions(prev: Record<string, KjunUploadStatus>, files: KjunUploadFile[]) {
  const out: { id: string; name: string; status: "done" | "error" }[] = [];
  for (const file of files) {
    const before = prev[file.id];
    if (before && before !== file.status && (file.status === "done" || file.status === "error")) out.push({ id: file.id, name: file.name, status: file.status });
  }
  return out;
}

export const uploadStatuses = (files: KjunUploadFile[]) => Object.fromEntries(files.map(file => [file.id, file.status])) as Record<string, KjunUploadStatus>;

/** After a row is removed, focus the next row, else the previous one; null means the add button. */
export function focusAfterRemove(ids: string[], removed: string): string | null {
  const index = ids.indexOf(removed);
  if (index < 0) return null;
  return ids[index + 1] ?? ids[index - 1] ?? null;
}

/** ".pdf,image/png,video/*" → labels ["PDF","PNG"], groups ["video"]; groups are named by the messages. */
export function acceptLabels(accept?: string): { labels: string[]; groups: string[] } {
  const labels: string[] = [], groups: string[] = [];
  for (const part of acceptParts(accept)) {
    if (part.startsWith(".")) labels.push(part.slice(1).toUpperCase());
    else if (part.endsWith("/*")) groups.push(part.slice(0, -2));
    else labels.push((part.split("/")[1] ?? part).toUpperCase());
  }
  return { labels, groups };
}

export type KjunUploadSize = "md" | "compact";
export type KjunUploadTrigger = "area" | "button";
export type KjunUploadLayout = "list" | "grid";
export type DragState = { verdict: DragVerdict; count: number; room: number } | null;

/** How many rejected files are listed by name; the rest fold into one "n more" line. */
export const REJECTION_LINES = 3;

/** The rejection notice (and its announcement): the first three by name, then one "n more" line. */
export function rejectionLines<T extends { name: string }>(m: KjunMessages, list: KjunRejectedFile<T>[], sizeText?: string): string[] {
  const lines = list.slice(0, REJECTION_LINES).map(({ file, reason }) => m.uploadRejected(file.name, reason, sizeText ?? ""));
  if (list.length > REJECTION_LINES) lines.push(m.uploadRejectedMore(list.length - REJECTION_LINES));
  return lines;
}

/** A drag that cannot add anything: a refused type, or no room left at all. */
export const dragBlocked = (drag: DragState) => !!drag && (drag.verdict === "type" || (drag.verdict === "count" && drag.room === 0));

/** What the zone (empty) or the veil (filled) says and shows while files are dragged over the card. */
export function dragCopy(m: KjunMessages, drag: DragState, types: string, maxFiles?: number) {
  if (!drag) return null;
  const blocked = dragBlocked(drag);
  const title = drag.verdict === "type" ? m.uploadTypeBlockedTitle : blocked && maxFiles != null ? m.uploadFull(maxFiles) : m.uploadDropHere;
  const hint = drag.verdict === "type" ? m.uploadTypeBlocked(types)
    : drag.verdict === "count" && drag.room > 0 ? m.uploadDropOverflow(drag.room, drag.count - drag.room)
    : blocked ? m.uploadFullHint
    : m.uploadDropCount(drag.count);
  return { title, hint, icon: drag.verdict === "type" ? "ban" : "arrow-down", blocked };
}

/** The allowed types in words: extensions and exact MIME in capitals, wildcard groups named by the messages. */
export function acceptText(m: KjunMessages, accept?: string): string {
  const { labels, groups } = acceptLabels(accept);
  return [...labels, ...groups.map(m.uploadGroup)].join(", ");
}

/** The row's × cancels a file still waiting or uploading and removes one that finished or failed. */
export const removeLabel = (m: KjunMessages, file: { name: string; status: KjunUploadStatus }) =>
  file.status === "queued" || file.status === "uploading" ? m.uploadCancel(file.name) : m.remove(file.name);

/** A tile's name for assistive tech: the file name, then its state in words. */
export function tileLabel(m: KjunMessages, file: KjunUploadFile): string {
  const progress = file.status === "uploading" ? clampProgress(file.progress) : undefined;
  const state = file.status === "queued" ? m.uploadQueued : file.status === "done" ? m.uploadDone
    : file.status === "error" ? file.error || m.uploadFailed : progress === undefined ? "" : Math.round(progress) + "%";
  return state ? `${file.name}, ${state}` : file.name;
}

/** Grid columns that keep every tile at least `min` wide, and the tile width that fills the row. */
export function gridColumns(width: number, min: number, gap: number) {
  const columns = Math.max(1, Math.floor((width + gap) / (min + gap)));
  return { columns, tile: Math.max(0, (width - gap * (columns - 1)) / columns) };
}
