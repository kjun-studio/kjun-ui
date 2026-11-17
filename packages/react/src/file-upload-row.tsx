import { tokens } from "@kjun-ui/tokens";
import { KjunButton, KjunIcon } from "./button";
import type { KjunMessages } from "../../../shared/package-runtime/messages";
import {
  clampProgress, extensionLabel, formatBytes, splitFileName, type KjunUploadFile,
} from "../../../shared/package-runtime/file-upload";

const icon = tokens.extensions.fileUpload.iconSize;

export interface FileUploadRowProps {
  file: KjunUploadFile;
  m: KjunMessages;
  intl?: string;
  disabled: boolean;
  onRemove?: (id: string) => void;
  onRetry?: (id: string) => void;
  /** Single-file mode: opens the picker to replace this file. */
  onReplace?: () => void;
}

/** One file: thumbnail, middle-truncated name, size and status in words, a bar while uploading, then its actions. */
export function FileUploadRow({ file, m, intl, disabled, onRemove, onRetry, onReplace }: FileUploadRowProps) {
  const { head, tail } = splitFileName(file.name);
  const progress = file.status === "uploading" ? clampProgress(file.progress) : undefined;
  const size = formatBytes(file.size, intl);
  return (
    <div className="kjun-file-upload-row" role="listitem" data-status={file.status} data-file-id={file.id}>
      <span className="kjun-file-upload-thumb" aria-hidden="true">
        {file.previewUrl ? <img src={file.previewUrl} alt="" /> : extensionLabel(file.name, file.type)}
      </span>
      <div className="kjun-file-upload-body">
        <div className="kjun-file-upload-name" title={file.name}>
          <span className="kjun-file-upload-name-head">{head}</span>
          <span className="kjun-file-upload-name-tail">{tail}</span>
        </div>
        <div className="kjun-file-upload-meta">
          {file.status === "uploading" && progress !== undefined ? (
            <>
              <span className="kjun-file-upload-num">{formatBytes(file.size * progress / 100, intl)} / {size}</span>
              <span aria-hidden="true">·</span>
              <span className="kjun-file-upload-num">{Math.round(progress)}%</span>
            </>
          ) : (
            <>
              <span className="kjun-file-upload-num">{size}</span>
              {file.status !== "uploading" && <span aria-hidden="true">·</span>}
              {file.status === "queued" && <span className="kjun-file-upload-status">{m.uploadQueued}</span>}
              {file.status === "done" && <span className="kjun-file-upload-status" data-tone="done">{m.uploadDone}</span>}
              {file.status === "error" && <span className="kjun-file-upload-status" data-tone="error">{file.error || m.uploadFailed}</span>}
            </>
          )}
        </div>
        {file.status === "uploading" && (
          <div
            className="kjun-file-upload-bar"
            role="progressbar"
            aria-label={m.uploadProgress(file.name)}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={progress === undefined ? undefined : Math.round(progress)}
          >
            <div style={progress === undefined ? undefined : { width: progress + "%" }} />
          </div>
        )}
      </div>
      <div className="kjun-file-upload-actions">
        {onReplace && (
          <KjunButton size="xs" variant="secondary" disabled={disabled} ariaLabel={m.uploadReplaceFile(file.name)} onClick={onReplace}>
            {m.uploadReplace}
          </KjunButton>
        )}
        {file.status === "error" && onRetry && (
          <button type="button" className="kjun-file-upload-action" data-action="retry" disabled={disabled}
            aria-label={m.uploadRetry(file.name)} onClick={() => onRetry(file.id)}>
            <KjunIcon name="refresh" size={icon} />
          </button>
        )}
        {onRemove && (
          <button type="button" className="kjun-file-upload-action" data-action="remove" disabled={disabled}
            aria-label={m.remove(file.name)} onClick={() => onRemove(file.id)}>
            <KjunIcon name="x" size={icon} />
          </button>
        )}
      </div>
    </div>
  );
}
