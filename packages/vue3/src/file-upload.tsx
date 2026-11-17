import { computed, nextTick, ref, useId, watch, type ExtractPublicPropTypes, type PropType } from "vue";
import { defineComponent } from "./runtime/component";
import { tokens } from "@kjun-ui/tokens";
import { useKjunMessageScope } from "./runtime/messages";
import { provideFallbackIcons } from "./runtime/icons";
import { KjunButton, KjunIcon } from "./button";
import { useKjunField } from "./input";
import { fileUploadRow } from "./file-upload-row";
import { mergeIds } from "../../../shared/package-runtime/aria-ids";
import { componentIcons } from "../../../shared/package-runtime/component-icons";
import {
  acceptLabels, dragVerdict, focusAfterRemove, formatBytes, screenFiles, uploadRoom, uploadStatuses, uploadSummary, uploadTransitions,
  type DragVerdict, type KjunRejectedFile, type KjunUploadFile,
} from "../../../shared/package-runtime/file-upload";

export type { KjunUploadFile, KjunUploadStatus, KjunRejectedFile, KjunRejectReason } from "../../../shared/package-runtime/file-upload";

// Mirrors packages/react/src/file-upload.tsx: same DOM, classes and aria. @select, @remove and @retry arrive as the
// onSelect, onRemove and onRetry props, so a field without @remove draws no × (as in React).
const kjunFileUploadProps = {
  /** The app's files. Empty shows the wide pick zone; any file folds it into a list with an add row. */
  files: { type: Array as PropType<KjunUploadFile[]>, default: () => [] },
  /** <input accept> rules such as ".pdf,image/*". Also lists the allowed types in the hint. */
  accept: { type: String, default: undefined },
  /** Largest file in bytes. */
  maxSize: { type: Number, default: undefined },
  maxFiles: { type: Number, default: undefined },
  /** false: one file; a new pick asks to replace it. */
  multiple: { type: Boolean, default: true },
  disabled: { type: Boolean, default: false },
  /** Second line of the zone; built from accept, maxSize and maxFiles when left out. */
  hint: { type: String, default: undefined },
  /** @select: picks that passed the pre-screen, and the ones that did not. */
  onSelect: { type: Function as PropType<(accepted: File[], rejected: KjunRejectedFile<File>[]) => void>, default: undefined },
  /** @remove: the × on a row. Whether the file is also deleted on the server is the app's call. */
  onRemove: { type: Function as PropType<(id: string) => void>, default: undefined },
  /** @retry: retry on a failed row; the head's retry calls it for each failed row. */
  onRetry: { type: Function as PropType<(id: string) => void>, default: undefined },
  /** Id of the hidden file input, for an outside <label for>; defaults to the FormGroup's id. */
  id: { type: String, default: undefined },
  /** Names the field when no FormGroup label does. */
  ariaLabel: { type: String, default: undefined },
  /** Extra description ids, merged with the FormGroup's hint and error. */
  ariaDescribedBy: { type: String, default: undefined },
} as const;
export type KjunFileUploadProps = ExtractPublicPropTypes<typeof kjunFileUploadProps>;

type DragState = { verdict: DragVerdict; count: number; room: number } | null;
const REJECTION_LINES = 3;

export const KjunFileUpload = defineComponent({
  name: "KjunFileUpload",
  inheritAttrs: false,
  props: kjunFileUploadProps,
  setup(props, { attrs }) {
    provideFallbackIcons(componentIcons);
    const scope = useKjunMessageScope(), field = useKjunField();
    const uid = "kjun-file-upload-" + useId();
    const root = ref<HTMLDivElement>(), input = ref<HTMLInputElement>();
    const drag = ref<DragState>(null), rejected = ref<KjunRejectedFile<File>[]>([]), live = ref("");
    let depth = 0;
    const limits = () => ({ accept: props.accept, maxSize: props.maxSize, maxFiles: props.maxFiles, multiple: props.multiple, current: props.files.length });
    const full = computed(() => props.multiple && uploadRoom(limits()) <= 0);
    const sizeText = computed(() => props.maxSize == null ? undefined : formatBytes(props.maxSize, scope.value.intl));
    const types = computed(() => { const { labels, groups } = acceptLabels(props.accept); return [...labels, ...groups.map(scope.value.messages.uploadGroup)].join(", "); });

    let statuses = uploadStatuses(props.files);
    let pendingFocus: { removed: string; next: string | null } | null = null;
    watch(() => props.files, files => {
      const changed = uploadTransitions(statuses, files);
      statuses = uploadStatuses(files);
      if (changed.length) live.value = changed.map(file => scope.value.messages.uploadAnnounce(file.name, file.status)).join(" ");
      const pending = pendingFocus;
      if (!pending || files.some(file => file.id === pending.removed)) return;
      pendingFocus = null;
      nextTick(() => {
        const next = pending.next && root.value?.querySelector<HTMLElement>(`[data-file-id="${CSS.escape(pending.next)}"] [data-action="remove"]`);
        (next || root.value?.querySelector<HTMLElement>(".kjun-file-upload-add, .kjun-file-upload-zone"))?.focus();
      });
    });

    const rejectionLines = (list: KjunRejectedFile<File>[]) => {
      const m = scope.value.messages;
      const lines = list.slice(0, REJECTION_LINES).map(({ file, reason }) => m.uploadRejected(file.name, reason, sizeText.value ?? ""));
      if (list.length > REJECTION_LINES) lines.push(m.uploadRejectedMore(list.length - REJECTION_LINES));
      return lines;
    };
    const select = (list: File[]) => {
      if (!list.length) return;
      const result = screenFiles(list, limits());
      rejected.value = result.rejected;
      if (result.rejected.length) live.value = rejectionLines(result.rejected).join(" ");
      props.onSelect?.(result.accepted, result.rejected);
    };
    const open = () => { if (!props.disabled && !full.value) input.value?.click(); };
    const remove = (fileId: string) => {
      pendingFocus = { removed: fileId, next: focusAfterRemove(props.files.map(file => file.id), fileId) };
      props.onRemove?.(fileId);
    };
    const retryFailed = () => props.files.filter(file => file.status === "error").forEach(file => props.onRetry?.(file.id));

    const carriesFiles = (event: DragEvent) => !props.disabled && !!event.dataTransfer && Array.from(event.dataTransfer.types).includes("Files");
    const blocked = () => !!drag.value && (drag.value.verdict === "type" || (drag.value.verdict === "count" && drag.value.room === 0));
    const onDragenter = (event: DragEvent) => {
      if (!carriesFiles(event)) return;
      event.preventDefault();
      depth++;
      drag.value = dragVerdict(Array.from(event.dataTransfer!.items), limits());
    };
    const onDragover = (event: DragEvent) => {
      if (!carriesFiles(event)) return;
      event.preventDefault();
      event.dataTransfer!.dropEffect = blocked() ? "none" : "copy";
    };
    const onDragleave = (event: DragEvent) => {
      if (!carriesFiles(event)) return;
      depth = Math.max(0, depth - 1);
      if (!depth) drag.value = null;
    };
    const onDrop = (event: DragEvent) => {
      if (!carriesFiles(event)) return;
      event.preventDefault();
      depth = 0;
      drag.value = null;
      select(Array.from(event.dataTransfer!.files));
    };

    return () => {
      const m = scope.value.messages, intl = scope.value.intl, owner = field.value, files = props.files, d = drag.value;
      const isBlocked = blocked(), filled = files.length > 0, summary = uploadSummary(files), lines = rejectionLines(rejected.value);
      const titleId = uid + "-title", hintId = uid + "-hint", iconSize = tokens.extensions.fileUpload.iconSize;
      const zoneHint = props.hint ?? m.uploadHint(types.value, sizeText.value, props.multiple ? props.maxFiles : undefined);
      const dragTitle = !d ? null : d.verdict === "type" ? m.uploadTypeBlockedTitle : isBlocked && props.maxFiles != null ? m.uploadFull(props.maxFiles) : m.uploadDropHere;
      const dragHint = !d ? null : d.verdict === "type" ? m.uploadTypeBlocked(types.value)
        : d.verdict === "count" && d.room > 0 ? m.uploadDropOverflow(d.room, d.count - d.room) : isBlocked ? m.uploadFullHint : m.uploadDropCount(d.count);
      const dragIcon = d?.verdict === "type" ? "ban" : "arrow-down";
      return (
        <div ref={root} class={["kjun-file-upload", attrs.class]} style={attrs.style as never} role="group"
          aria-label={owner?.labelId ? undefined : props.ariaLabel} aria-labelledby={owner?.labelId}
          aria-describedby={mergeIds(owner?.describedBy, props.ariaDescribedBy)}
          data-state={filled ? "filled" : "empty"} data-drag={!d ? "none" : isBlocked ? "blocked" : "over"} data-disabled={props.disabled || undefined}
          onDragenter={onDragenter} onDragover={onDragover} onDragleave={onDragleave} onDrop={onDrop}>
          <input ref={input} id={props.id ?? owner?.id ?? uid + "-input"} type="file" hidden tabindex={-1} accept={props.accept}
            multiple={props.multiple} disabled={props.disabled}
            onChange={(event: Event) => { const el = event.currentTarget as HTMLInputElement; select(Array.from(el.files ?? [])); el.value = ""; }} />
          {!filled ? (
            <button type="button" class="kjun-file-upload-zone" aria-disabled={props.disabled || undefined}
              aria-labelledby={titleId} aria-describedby={hintId} onClick={open}>
              <span class="kjun-file-upload-icon"><KjunIcon name={d ? dragIcon : "cloud-upload"} size={iconSize} /></span>
              <span class="kjun-file-upload-title" id={titleId}>{dragTitle ?? m.uploadDropOrSelect}</span>
              <span class="kjun-file-upload-hint" id={hintId}>{dragHint ?? zoneHint}</span>
            </button>
          ) : [
            files.length > 1 || summary.failed > 0 ? (
              <div class="kjun-file-upload-head">
                <span class="kjun-file-upload-head-title">{m.uploadFiles}</span>
                <span class="kjun-file-upload-num">{props.multiple && props.maxFiles != null ? `${files.length}/${props.maxFiles}` : files.length}</span>
                <span class="kjun-file-upload-head-spacer" />
                {summary.failed > 0 ? <span>{m.uploadFailedCount(summary.failed)}</span> : null}
                {summary.failed > 0 && props.onRetry ? (
                  <KjunButton size="xs" variant="secondary" disabled={props.disabled} ariaLabel={m.uploadRetryFailed} onClick={retryFailed}>{m.retry}</KjunButton>
                ) : null}
              </div>
            ) : null,
            <div class="kjun-file-upload-list" role="list">
              {files.map(file => fileUploadRow({ file, m, intl, disabled: props.disabled, onRemove: props.onRemove ? remove : undefined,
                onRetry: props.onRetry, onReplace: props.multiple ? undefined : open }))}
            </div>,
            props.multiple ? (
              <div class="kjun-file-upload-foot">
                <button type="button" class="kjun-file-upload-add" aria-disabled={props.disabled || full.value || undefined}
                  aria-labelledby={titleId} aria-describedby={hintId} onClick={open}>
                  <span class="kjun-file-upload-icon"><KjunIcon name="plus" size={iconSize} /></span>
                  <span class="kjun-file-upload-text">
                    <span class="kjun-file-upload-title" id={titleId}>{full.value && props.maxFiles != null ? m.uploadFull(props.maxFiles) : m.uploadAddOrDrop}</span>
                    <span class="kjun-file-upload-hint" id={hintId}>{full.value ? m.uploadFullHint : props.hint ?? m.uploadHint(types.value, sizeText.value)}</span>
                  </span>
                </button>
              </div>
            ) : null,
          ]}
          {lines.length ? (
            <div class="kjun-file-upload-notice">
              <KjunIcon name="alert-circle" size={tokens.extensions.form.messageIconSize} />
              <span class="kjun-file-upload-notice-text">{lines.map(line => <span key={line}>{line}</span>)}</span>
              <button type="button" class="kjun-file-upload-action" data-action="dismiss" aria-label={m.close} onClick={() => { rejected.value = []; }}>
                <KjunIcon name="x" size={tokens.extensions.form.messageIconSize} />
              </button>
            </div>
          ) : null}
          {filled && d ? (
            <div class="kjun-file-upload-veil" aria-hidden="true">
              <span class="kjun-file-upload-icon"><KjunIcon name={dragIcon} size={iconSize} /></span>
              <span class="kjun-file-upload-title">{dragTitle}</span>
              <span class="kjun-file-upload-hint">{dragHint}</span>
            </div>
          ) : null}
          <div class="kjun-sr-only" aria-live="polite">{live.value}</div>
        </div>
      );
    };
  },
});
