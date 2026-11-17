import { useEffect, useId, useRef, useState, type CSSProperties, type DragEvent } from "react";
import { tokens } from "@kjun-ui/tokens";
import { KjunButton, KjunIcon } from "./button";
import { useKjunField } from "./input";
import { FileUploadRow } from "./file-upload-row";
import { mergeIds } from "../../../shared/package-runtime/aria-ids";
import { componentIcons } from "../../../shared/package-runtime/component-icons";
import { IconFallbacks } from "../../../shared/package-runtime/icon-context";
import { useKjunMessageScope } from "../../../shared/package-runtime/messages-context";
import {
  acceptLabels, dragVerdict, focusAfterRemove, formatBytes, screenFiles, uploadRoom, uploadStatuses, uploadSummary, uploadTransitions,
  type DragVerdict, type KjunRejectedFile, type KjunUploadFile,
} from "../../../shared/package-runtime/file-upload";

export type { KjunUploadFile, KjunUploadStatus, KjunRejectedFile, KjunRejectReason } from "../../../shared/package-runtime/file-upload";

export interface KjunFileUploadProps {
  /** The app's files. Empty shows the wide pick zone; any file folds it into a list with an add row. */
  files?: KjunUploadFile[];
  /** <input accept> rules such as ".pdf,image/*". Also lists the allowed types in the hint. */
  accept?: string;
  /** Largest file in bytes. */
  maxSize?: number;
  maxFiles?: number;
  /** false: one file; a new pick asks to replace it. */
  multiple?: boolean;
  disabled?: boolean;
  /** Second line of the zone; built from accept, maxSize and maxFiles when left out. */
  hint?: string;
  /** Picks that passed the pre-screen, and the ones that did not. The app adds `accepted` to `files` and uploads them. */
  onSelect: (accepted: File[], rejected: KjunRejectedFile<File>[]) => void;
  /** The × on a row. Whether the file is also deleted on the server is the app's call. */
  onRemove?: (id: string) => void;
  /** Retry on a failed row; the head's retry calls it for each failed row. */
  onRetry?: (id: string) => void;
  /** Id of the hidden file input, for an outside <label for>; defaults to the FormGroup's id. */
  id?: string;
  className?: string;
  style?: CSSProperties;
  /** Names the field when no FormGroup label does. */
  ariaLabel?: string;
  /** Extra description ids, merged with the FormGroup's hint and error. */
  ariaDescribedBy?: string;
}

type DragState = { verdict: DragVerdict; count: number; room: number } | null;
const REJECTION_LINES = 3;

export function KjunFileUpload({
  files = [], accept, maxSize, maxFiles, multiple = true, disabled = false, hint, onSelect, onRemove, onRetry,
  id, className, style, ariaLabel, ariaDescribedBy,
}: KjunFileUploadProps) {
  const { messages: m, intl } = useKjunMessageScope();
  const field = useKjunField();
  const uid = "kjun-file-upload-" + useId().replace(/:/g, "");
  const inputId = id || field?.id || uid + "-input", titleId = uid + "-title", hintId = uid + "-hint";
  const root = useRef<HTMLDivElement>(null), input = useRef<HTMLInputElement>(null), depth = useRef(0);
  const [drag, setDrag] = useState<DragState>(null);
  const [rejected, setRejected] = useState<KjunRejectedFile<File>[]>([]);
  const [live, setLive] = useState("");
  const limits = { accept, maxSize, maxFiles, multiple, current: files.length };
  const full = multiple && uploadRoom(limits) <= 0;
  const { labels, groups } = acceptLabels(accept);
  const types = [...labels, ...groups.map(m.uploadGroup)].join(", ");
  const sizeText = maxSize == null ? undefined : formatBytes(maxSize, intl);
  const zoneHint = hint ?? m.uploadHint(types, sizeText, multiple ? maxFiles : undefined);
  const filled = files.length > 0;

  // Announce rows that just finished or failed; progress ticks stay quiet.
  const statuses = useRef(uploadStatuses(files));
  useEffect(() => {
    const changed = uploadTransitions(statuses.current, files);
    statuses.current = uploadStatuses(files);
    if (changed.length) setLive(changed.map(file => m.uploadAnnounce(file.name, file.status)).join(" "));
  }, [files, m]);

  // After a remove, focus moves once the app has taken the file out.
  const pendingFocus = useRef<{ removed: string; next: string | null } | null>(null);
  useEffect(() => {
    const pending = pendingFocus.current;
    if (!pending || files.some(file => file.id === pending.removed)) return;
    pendingFocus.current = null;
    const next = pending.next && root.current?.querySelector<HTMLElement>(`[data-file-id="${CSS.escape(pending.next)}"] [data-action="remove"]`);
    (next || root.current?.querySelector<HTMLElement>(".kjun-file-upload-add, .kjun-file-upload-zone"))?.focus();
  }, [files]);

  function select(list: File[]) {
    if (!list.length) return;
    const result = screenFiles(list, limits);
    setRejected(result.rejected);
    if (result.rejected.length) setLive(rejectionLines(result.rejected).join(" "));
    onSelect(result.accepted, result.rejected);
  }
  function rejectionLines(list: KjunRejectedFile<File>[]) {
    const lines = list.slice(0, REJECTION_LINES).map(({ file, reason }) => m.uploadRejected(file.name, reason, sizeText ?? ""));
    if (list.length > REJECTION_LINES) lines.push(m.uploadRejectedMore(list.length - REJECTION_LINES));
    return lines;
  }
  const open = () => { if (!disabled && !full) input.current?.click(); };
  const remove = onRemove && ((fileId: string) => {
    pendingFocus.current = { removed: fileId, next: focusAfterRemove(files.map(file => file.id), fileId) };
    onRemove(fileId);
  });
  const retryFailed = onRetry && (() => files.filter(file => file.status === "error").forEach(file => onRetry(file.id)));

  const carriesFiles = (event: DragEvent) => !disabled && Array.from(event.dataTransfer.types).includes("Files");
  const blocked = drag && (drag.verdict === "type" || (drag.verdict === "count" && drag.room === 0));
  const dragHandlers = {
    onDragEnter(event: DragEvent) {
      if (!carriesFiles(event)) return;
      event.preventDefault();
      depth.current++;
      setDrag(dragVerdict(Array.from(event.dataTransfer.items), limits));
    },
    onDragOver(event: DragEvent) {
      if (!carriesFiles(event)) return;
      event.preventDefault();
      event.dataTransfer.dropEffect = blocked ? "none" : "copy";
    },
    onDragLeave(event: DragEvent) {
      if (!carriesFiles(event)) return;
      depth.current = Math.max(0, depth.current - 1);
      if (!depth.current) setDrag(null);
    },
    onDrop(event: DragEvent) {
      if (!carriesFiles(event)) return;
      event.preventDefault();
      depth.current = 0;
      setDrag(null);
      select(Array.from(event.dataTransfer.files));
    },
  };

  // What the zone (empty) or the veil (filled) says while files are dragged over the card.
  const dragTitle = !drag ? null
    : drag.verdict === "type" ? m.uploadTypeBlockedTitle
    : blocked && maxFiles != null ? m.uploadFull(maxFiles)
    : m.uploadDropHere;
  const dragHint = !drag ? null
    : drag.verdict === "type" ? m.uploadTypeBlocked(types)
    : drag.verdict === "count" && drag.room > 0 ? m.uploadDropOverflow(drag.room, drag.count - drag.room)
    : blocked ? m.uploadFullHint
    : m.uploadDropCount(drag.count);
  const dragIcon = drag?.verdict === "type" ? "ban" : "arrow-down";
  const iconSize = tokens.extensions.fileUpload.iconSize;
  const summary = uploadSummary(files);
  const lines = rejectionLines(rejected);

  return (
    <IconFallbacks icons={componentIcons}>
      <div
        ref={root}
        className={className ? "kjun-file-upload " + className : "kjun-file-upload"}
        style={style}
        role="group"
        aria-label={field?.labelId ? undefined : ariaLabel}
        aria-labelledby={field?.labelId}
        aria-describedby={mergeIds(field?.describedBy, ariaDescribedBy)}
        data-state={filled ? "filled" : "empty"}
        data-drag={!drag ? "none" : blocked ? "blocked" : "over"}
        data-disabled={disabled || undefined}
        {...dragHandlers}
      >
        <input
          ref={input}
          id={inputId}
          type="file"
          hidden
          tabIndex={-1}
          accept={accept}
          multiple={multiple}
          disabled={disabled}
          onChange={event => { select(Array.from(event.currentTarget.files ?? [])); event.currentTarget.value = ""; }}
        />
        {!filled ? (
          <button type="button" className="kjun-file-upload-zone" aria-disabled={disabled || undefined}
            aria-labelledby={titleId} aria-describedby={hintId} onClick={open}>
            <span className="kjun-file-upload-icon"><KjunIcon name={drag ? dragIcon : "cloud-upload"} size={iconSize} /></span>
            <span className="kjun-file-upload-title" id={titleId}>{dragTitle ?? m.uploadDropOrSelect}</span>
            <span className="kjun-file-upload-hint" id={hintId}>{dragHint ?? zoneHint}</span>
          </button>
        ) : (
          <>
            {(files.length > 1 || summary.failed > 0) && (
              <div className="kjun-file-upload-head">
                <span className="kjun-file-upload-head-title">{m.uploadFiles}</span>
                <span className="kjun-file-upload-num">{multiple && maxFiles != null ? `${files.length}/${maxFiles}` : files.length}</span>
                <span className="kjun-file-upload-head-spacer" />
                {summary.failed > 0 && <span>{m.uploadFailedCount(summary.failed)}</span>}
                {summary.failed > 0 && retryFailed && (
                  <KjunButton size="xs" variant="secondary" disabled={disabled} ariaLabel={m.uploadRetryFailed} onClick={retryFailed}>
                    {m.retry}
                  </KjunButton>
                )}
              </div>
            )}
            <div className="kjun-file-upload-list" role="list">
              {files.map(file => (
                <FileUploadRow key={file.id} file={file} m={m} intl={intl} disabled={disabled}
                  onRemove={remove} onRetry={onRetry} onReplace={multiple ? undefined : open} />
              ))}
            </div>
            {multiple && (
              <div className="kjun-file-upload-foot">
                <button type="button" className="kjun-file-upload-add" aria-disabled={disabled || full || undefined}
                  aria-labelledby={titleId} aria-describedby={hintId} onClick={open}>
                  <span className="kjun-file-upload-icon"><KjunIcon name="plus" size={iconSize} /></span>
                  <span className="kjun-file-upload-text">
                    <span className="kjun-file-upload-title" id={titleId}>{full && maxFiles != null ? m.uploadFull(maxFiles) : m.uploadAddOrDrop}</span>
                    <span className="kjun-file-upload-hint" id={hintId}>{full ? m.uploadFullHint : hint ?? m.uploadHint(types, sizeText)}</span>
                  </span>
                </button>
              </div>
            )}
          </>
        )}
        {lines.length > 0 && (
          <div className="kjun-file-upload-notice">
            <KjunIcon name="alert-circle" size={tokens.extensions.form.messageIconSize} />
            <span className="kjun-file-upload-notice-text">
              {lines.map(line => <span key={line}>{line}</span>)}
            </span>
            <button type="button" className="kjun-file-upload-action" data-action="dismiss" aria-label={m.close} onClick={() => setRejected([])}>
              <KjunIcon name="x" size={tokens.extensions.form.messageIconSize} />
            </button>
          </div>
        )}
        {filled && drag && (
          <div className="kjun-file-upload-veil" aria-hidden="true">
            <span className="kjun-file-upload-icon"><KjunIcon name={dragIcon} size={iconSize} /></span>
            <span className="kjun-file-upload-title">{dragTitle}</span>
            <span className="kjun-file-upload-hint">{dragHint}</span>
          </div>
        )}
        <div className="kjun-sr-only" aria-live="polite">{live}</div>
      </div>
    </IconFallbacks>
  );
}
