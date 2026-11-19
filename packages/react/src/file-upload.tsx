import { useEffect, useId, useRef, useState, type CSSProperties, type DragEvent } from "react";
import { tokens } from "@kjun-ui/tokens";
import { KjunButton, KjunIcon } from "./button";
import { useKjunField } from "./input";
import { FileUploadRow, FileUploadTile } from "./file-upload-row";
import { mergeIds } from "../../../shared/package-runtime/aria-ids";
import { componentIcons } from "../../../shared/package-runtime/component-icons";
import { IconFallbacks } from "../../../shared/package-runtime/icon-context";
import { useKjunMessageScope } from "../../../shared/package-runtime/messages-context";
import {
  acceptText, dragCopy, dragVerdict, focusAfterRemove, formatBytes, rejectionLines, screenFiles, uploadRoom, uploadStatuses, uploadSummary,
  uploadTransitions, type DragState, type KjunRejectedFile, type KjunUploadFile, type KjunUploadLayout, type KjunUploadSize, type KjunUploadTrigger,
} from "../../../shared/package-runtime/file-upload";

export type {
  KjunUploadFile, KjunUploadStatus, KjunRejectedFile, KjunRejectReason, KjunUploadSize, KjunUploadTrigger, KjunUploadLayout,
} from "../../../shared/package-runtime/file-upload";

export interface KjunFileUploadProps {
  /** The app's files. Empty shows the pick zone; any file folds it into a list with an add row. */
  files?: KjunUploadFile[];
  /** <input accept> rules such as ".pdf,image/*". Also lists the allowed types in the hint. */
  accept?: string;
  /** Largest file in bytes. */
  maxSize?: number;
  maxFiles?: number;
  /** false: one file; a new pick replaces it. */
  multiple?: boolean;
  disabled?: boolean;
  /** Second line of the zone; built from accept, maxSize and maxFiles when left out. */
  hint?: string;
  /** "compact": the empty field is the one-line add row (80px card) instead of the tall zone. */
  size?: KjunUploadSize;
  /** "button": a "Choose files" button at the end of a text line picks instead of a pressable area; drops still land on the card. */
  trigger?: KjunUploadTrigger;
  /** "grid": files show as square tiles (photos) with an add tile, instead of rows. */
  layout?: KjunUploadLayout;
  /** Picks that passed the pre-screen, and the ones that did not. The app adds `accepted` to `files` and uploads them. */
  onSelect: (accepted: File[], rejected: KjunRejectedFile<File>[]) => void;
  /** The × on a row: cancels a waiting or uploading file, removes a finished one. Server-side deletion is the app's call. */
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

export function KjunFileUpload({
  files = [], accept, maxSize, maxFiles, multiple = true, disabled = false, hint, size = "md", trigger = "area", layout = "list",
  onSelect, onRemove, onRetry, id, className, style, ariaLabel, ariaDescribedBy,
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
  const types = acceptText(m, accept);
  const sizeText = maxSize == null ? undefined : formatBytes(maxSize, intl);
  const zoneHint = hint ?? m.uploadHint(types, sizeText, multiple ? maxFiles : undefined);
  const addHint = full ? m.uploadFullHint : hint ?? m.uploadHint(types, sizeText);
  const filled = files.length > 0, invalid = !!field?.error || undefined;
  const describedBy = mergeIds(hintId, field?.describedBy, ariaDescribedBy);

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
    (next || root.current?.querySelector<HTMLElement>("[data-pick]"))?.focus();
  }, [files]);

  function select(list: File[]) {
    if (!list.length) return;
    const result = screenFiles(list, limits);
    setRejected(result.rejected);
    if (result.rejected.length) setLive(rejectionLines(m, result.rejected, sizeText).join(" "));
    onSelect(result.accepted, result.rejected);
  }
  const open = () => { if (!disabled && !full) input.current?.click(); };
  const remove = onRemove && ((fileId: string) => {
    pendingFocus.current = { removed: fileId, next: focusAfterRemove(files.map(file => file.id), fileId) };
    onRemove(fileId);
  });
  const retryFailed = onRetry && (() => files.filter(file => file.status === "error").forEach(file => onRetry(file.id)));

  const carriesFiles = (event: DragEvent) => !disabled && Array.from(event.dataTransfer.types).includes("Files");
  const copy = dragCopy(m, drag, types, maxFiles);
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
      event.dataTransfer.dropEffect = copy?.blocked ? "none" : "copy";
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

  const iconSize = tokens.extensions.fileUpload.iconSize;
  const summary = uploadSummary(files);
  const lines = rejectionLines(m, rejected, sizeText);
  const button = trigger === "button", grid = layout === "grid";
  const pickButton = (label: string, blocked: boolean) => (
    <KjunButton size="sm" variant="secondary" disabled={disabled || blocked} data-pick="" aria-invalid={invalid}
      aria-describedby={describedBy} onClick={open}>{label}</KjunButton>
  );
  // Pressable add row: the compact empty field and the foot of a filled list.
  const addRow = (icon: string, title: string, rowHint: string) => (
    <button type="button" className="kjun-file-upload-add" data-pick="" aria-disabled={disabled || full || undefined} aria-invalid={invalid}
      aria-labelledby={titleId} aria-describedby={describedBy} onClick={open}>
      <span className="kjun-file-upload-icon"><KjunIcon name={icon} size={iconSize} /></span>
      <span className="kjun-file-upload-text">
        <span className="kjun-file-upload-title" id={titleId}>{title}</span>
        <span className="kjun-file-upload-hint" id={hintId}>{rowHint}</span>
      </span>
    </button>
  );
  // The foot line under a list only says what may still be added (or that the field is full): the button next to it names the action.
  const triggerLine = (title: string | null, lineHint: string, label: string) => (
    <div className="kjun-file-upload-trigger">
      <span className="kjun-file-upload-text">
        {title ? <span className="kjun-file-upload-title">{title}</span> : null}
        <span className="kjun-file-upload-hint" id={hintId}>{lineHint}</span>
      </span>
      {pickButton(label, full)}
    </div>
  );
  const fullTitle = full && maxFiles != null ? m.uploadFull(maxFiles) : undefined;

  let empty = null;
  if (!filled) {
    empty = button ? triggerLine(m.uploadEmpty, zoneHint, m.uploadSelect)
      : size === "compact" ? addRow(copy?.icon ?? "cloud-upload", copy?.title ?? m.uploadDropOrSelect, copy?.hint ?? zoneHint)
      : (
        <button type="button" className="kjun-file-upload-zone" data-pick="" aria-disabled={disabled || undefined} aria-invalid={invalid}
          aria-labelledby={titleId} aria-describedby={describedBy} onClick={open}>
          <span className="kjun-file-upload-icon"><KjunIcon name={copy?.icon ?? "cloud-upload"} size={iconSize} /></span>
          <span className="kjun-file-upload-title" id={titleId}>{copy?.title ?? m.uploadDropOrSelect}</span>
          <span className="kjun-file-upload-hint" id={hintId}>{copy?.hint ?? zoneHint}</span>
        </button>
      );
  }
  // In a grid the add tile follows the tiles (a single file gets a replace tile); a button trigger keeps its foot line.
  const addTile = grid && (multiple ? !button : true) ? (
    <button type="button" className="kjun-file-upload-add" data-tile="" data-pick="" aria-disabled={disabled || full || undefined}
      aria-invalid={invalid} aria-labelledby={titleId} aria-describedby={describedBy} onClick={open}>
      <span className="kjun-file-upload-icon"><KjunIcon name={multiple ? "plus" : "refresh"} size={iconSize} /></span>
      {multiple && maxFiles != null && <span className="kjun-file-upload-num" aria-hidden="true">{files.length}/{maxFiles}</span>}
      <span className="kjun-sr-only" id={titleId}>{multiple ? fullTitle ?? m.uploadAddOrDrop : m.uploadReplaceFile(files[0]?.name ?? "")}</span>
      <span className="kjun-sr-only" id={hintId}>{multiple ? addHint : zoneHint}</span>
    </button>
  ) : null;

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
        data-drag={!copy ? "none" : copy.blocked ? "blocked" : "over"}
        data-size={size}
        data-trigger={trigger}
        data-layout={layout}
        data-invalid={invalid}
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
        {empty}
        {filled && (
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
            {grid ? (
              <div className="kjun-file-upload-grid" role="list">
                {files.map(file => <FileUploadTile key={file.id} file={file} m={m} disabled={disabled} onRemove={remove} onRetry={onRetry} />)}
                {addTile}
              </div>
            ) : (
              <div className="kjun-file-upload-list" role="list">
                {files.map(file => (
                  <FileUploadRow key={file.id} file={file} m={m} intl={intl} disabled={disabled}
                    onRemove={remove} onRetry={onRetry} onReplace={multiple ? undefined : open} />
                ))}
              </div>
            )}
            {multiple && (button || !grid) && (
              <div className="kjun-file-upload-foot">
                {button ? triggerLine(fullTitle ?? null, addHint, m.uploadAdd)
                  : addRow("plus", fullTitle ?? m.uploadAddOrDrop, addHint)}
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
        {copy && (filled || button) && (
          <div className="kjun-file-upload-veil" aria-hidden="true">
            <span className="kjun-file-upload-icon"><KjunIcon name={copy.icon} size={iconSize} /></span>
            <span className="kjun-file-upload-title">{copy.title}</span>
            <span className="kjun-file-upload-hint">{copy.hint}</span>
          </div>
        )}
        <div className="kjun-sr-only" aria-live="polite">{live}</div>
      </div>
    </IconFallbacks>
  );
}
