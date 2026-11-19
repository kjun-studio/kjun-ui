import { tokens } from "@kjun-ui/tokens";
import { KjunButton, KjunIcon } from "./button";
import type { KjunMessages } from "../../../shared/package-runtime/messages";
import {
  clampProgress, extensionLabel, formatBytes, removeLabel, splitFileName, tileLabel, type KjunUploadFile,
} from "../../../shared/package-runtime/file-upload";

// Mirrors packages/react/src/file-upload-row.tsx: same DOM, classes and aria.
const g = tokens.extensions.fileUpload;
const icon = g.iconSize;
// A preview that fails to load steps aside for the extension under it; the key remounts it when the URL changes.
const hideBroken = (event: Event) => { (event.currentTarget as HTMLImageElement).hidden = true; };

export interface FileUploadRowProps {
  file: KjunUploadFile;
  m: KjunMessages;
  intl?: string;
  disabled: boolean;
  onRemove?: (id: string) => void;
  onRetry?: (id: string) => void;
  onReplace?: () => void;
}

const thumb = (file: KjunUploadFile) => [
  <span class="kjun-file-upload-ext">{extensionLabel(file.name, file.type)}</span>,
  file.previewUrl ? <img key={file.previewUrl} src={file.previewUrl} alt="" onError={hideBroken} /> : null,
];

export function fileUploadRow({ file, m, intl, disabled, onRemove, onRetry, onReplace }: FileUploadRowProps) {
  const { head, tail } = splitFileName(file.name);
  const progress = file.status === "uploading" ? clampProgress(file.progress) : undefined;
  const size = formatBytes(file.size, intl);
  const errorText = file.error || m.uploadFailed;
  return (
    <div key={file.id} class="kjun-file-upload-row" role="listitem" data-status={file.status} data-file-id={file.id}>
      <span class="kjun-file-upload-thumb" aria-hidden="true">{thumb(file)}</span>
      <div class="kjun-file-upload-body">
        <div class="kjun-file-upload-name" title={file.name}>
          <span class="kjun-file-upload-name-head">{head}</span>
          <span class="kjun-file-upload-name-tail">{tail}</span>
        </div>
        <div class="kjun-file-upload-meta">
          {file.status === "uploading" && progress !== undefined ? [
            <span class="kjun-file-upload-num">{formatBytes(file.size * progress / 100, intl)} / {size}</span>,
            <span aria-hidden="true">·</span>,
            <span class="kjun-file-upload-num">{Math.round(progress)}%</span>,
          ] : [
            <span class="kjun-file-upload-num">{size}</span>,
            file.status !== "uploading" ? <span aria-hidden="true">·</span> : null,
            file.status === "queued" ? <span class="kjun-file-upload-status">{m.uploadQueued}</span> : null,
            file.status === "done" ? <span class="kjun-file-upload-status" data-tone="done">{m.uploadDone}</span> : null,
            file.status === "error" ? <span class="kjun-file-upload-status" data-tone="error" title={errorText}>{errorText}</span> : null,
          ]}
        </div>
        {file.status === "uploading" ? (
          <div class="kjun-file-upload-bar" role="progressbar" aria-label={m.uploadProgress(file.name)}
            aria-valuemin={0} aria-valuemax={100} aria-valuenow={progress === undefined ? undefined : Math.round(progress)}>
            <div style={progress === undefined ? undefined : { width: progress + "%" }} />
          </div>
        ) : null}
      </div>
      <div class="kjun-file-upload-actions">
        {onReplace ? (
          <KjunButton size="xs" variant="secondary" disabled={disabled} ariaLabel={m.uploadReplaceFile(file.name)} onClick={onReplace}>
            {m.uploadReplace}
          </KjunButton>
        ) : null}
        {file.status === "error" && onRetry ? (
          <button type="button" class="kjun-file-upload-action" data-action="retry" disabled={disabled}
            aria-label={m.uploadRetry(file.name)} onClick={() => onRetry(file.id)}>
            <KjunIcon name="refresh" size={icon} />
          </button>
        ) : null}
        {onRemove ? (
          <button type="button" class="kjun-file-upload-action" data-action="remove" disabled={disabled}
            aria-label={removeLabel(m, file)} onClick={() => onRemove(file.id)}>
            <KjunIcon name="x" size={icon} />
          </button>
        ) : null}
      </div>
    </div>
  );
}

export function fileUploadTile({ file, m, disabled, onRemove, onRetry }: Omit<FileUploadRowProps, "intl" | "onReplace">) {
  const progress = file.status === "uploading" ? clampProgress(file.progress) : undefined;
  return (
    <div key={file.id} class="kjun-file-upload-tile" role="listitem" title={file.name} data-status={file.status} data-file-id={file.id}>
      <span class="kjun-sr-only">{tileLabel(m, file)}</span>
      <span class="kjun-file-upload-thumb" aria-hidden="true">{thumb(file)}</span>
      {file.status === "uploading" ? (
        <div class="kjun-file-upload-bar" role="progressbar" aria-label={m.uploadProgress(file.name)}
          aria-valuemin={0} aria-valuemax={100} aria-valuenow={progress === undefined ? undefined : Math.round(progress)}>
          <div style={progress === undefined ? undefined : { width: progress + "%" }} />
        </div>
      ) : null}
      {file.status === "error" ? (
        <span class="kjun-file-upload-tile-error">
          {onRetry ? (
            <button type="button" class="kjun-file-upload-action" data-action="retry" disabled={disabled}
              aria-label={m.uploadRetry(file.name)} onClick={() => onRetry(file.id)}>
              <KjunIcon name="refresh" size={icon} />
            </button>
          ) : null}
          {!onRetry ? <span class="kjun-file-upload-status" data-tone="error" aria-hidden="true">{m.uploadFailed}</span> : null}
        </span>
      ) : null}
      {onRemove ? (
        <button type="button" class="kjun-file-upload-tile-remove" data-action="remove" disabled={disabled}
          aria-label={removeLabel(m, file)} onClick={() => onRemove(file.id)}>
          <span><KjunIcon name="x" size={g.tileRemoveIcon} /></span>
        </button>
      ) : null}
    </div>
  );
}
