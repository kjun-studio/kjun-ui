import { computed, nextTick, ref, useId, watch, type ExtractPublicPropTypes, type PropType } from "vue";
import { defineComponent } from "./runtime/component";
import { tokens } from "@kjun-ui/tokens";
import { useKjunMessageScope } from "./runtime/messages";
import { provideFallbackIcons } from "./runtime/icons";
import { KjunButton, KjunIcon } from "./button";
import { useKjunField } from "./input";
import { fileUploadRow, fileUploadTile } from "./file-upload-row";
import { mergeIds } from "../../../shared/package-runtime/aria-ids";
import { componentIcons } from "../../../shared/package-runtime/component-icons";
import {
  acceptText, dragCopy, dragVerdict, focusAfterRemove, formatBytes, rejectionLines, screenFiles, uploadRoom, uploadStatuses, uploadSummary,
  uploadTransitions, type DragState, type KjunRejectedFile, type KjunUploadFile, type KjunUploadLayout, type KjunUploadSize, type KjunUploadTrigger,
} from "../../../shared/package-runtime/file-upload";

export type {
  KjunUploadFile, KjunUploadStatus, KjunRejectedFile, KjunRejectReason, KjunUploadSize, KjunUploadTrigger, KjunUploadLayout,
} from "../../../shared/package-runtime/file-upload";

// Mirrors packages/react/src/file-upload.tsx: same DOM, classes and aria. @select, @remove and @retry arrive as the
// onSelect, onRemove and onRetry props, so a field without @remove draws no × (as in React).
const kjunFileUploadProps = {
  /** The app's files. Empty shows the pick zone; any file folds it into a list with an add row. */
  files: { type: Array as PropType<KjunUploadFile[]>, default: () => [] },
  /** <input accept> rules such as ".pdf,image/*". Also lists the allowed types in the hint. */
  accept: { type: String, default: undefined },
  /** Largest file in bytes. */
  maxSize: { type: Number, default: undefined },
  maxFiles: { type: Number, default: undefined },
  /** false: one file; a new pick replaces it. */
  multiple: { type: Boolean, default: true },
  disabled: { type: Boolean, default: false },
  /** Second line of the zone; built from accept, maxSize and maxFiles when left out. */
  hint: { type: String, default: undefined },
  /** "compact": the empty field is the one-line add row (80px card) instead of the tall zone. */
  size: { type: String as PropType<KjunUploadSize>, default: "md" },
  /** "button": a "Choose files" button at the end of a text line picks instead of a pressable area; drops still land on the card. */
  trigger: { type: String as PropType<KjunUploadTrigger>, default: "area" },
  /** "grid": files show as square tiles (photos) with an add tile, instead of rows. */
  layout: { type: String as PropType<KjunUploadLayout>, default: "list" },
  /** @select: picks that passed the pre-screen, and the ones that did not. */
  onSelect: { type: Function as PropType<(accepted: File[], rejected: KjunRejectedFile<File>[]) => void>, default: undefined },
  /** @remove: the × on a row: cancels a waiting or uploading file, removes a finished one. */
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
    const types = computed(() => acceptText(scope.value.messages, props.accept));

    let statuses = uploadStatuses(props.files);
    let pendingFocus: { removed: string; next: string | null } | null = null;
    // Watch ids and statuses, not the array, so an app that edits file objects in place is still heard.
    watch(() => props.files.map(file => file.id + ":" + file.status).join("|"), () => {
      const files = props.files;
      const changed = uploadTransitions(statuses, files);
      statuses = uploadStatuses(files);
      if (changed.length) live.value = changed.map(file => scope.value.messages.uploadAnnounce(file.name, file.status)).join(" ");
      const pending = pendingFocus;
      if (!pending || files.some(file => file.id === pending.removed)) return;
      pendingFocus = null;
      nextTick(() => {
        const next = pending.next && root.value?.querySelector<HTMLElement>(`[data-file-id="${CSS.escape(pending.next)}"] [data-action="remove"]`);
        (next || root.value?.querySelector<HTMLElement>("[data-pick]"))?.focus();
      });
    });

    const select = (list: File[]) => {
      if (!list.length) return;
      const result = screenFiles(list, limits());
      rejected.value = result.rejected;
      if (result.rejected.length) live.value = rejectionLines(scope.value.messages, result.rejected, sizeText.value).join(" ");
      props.onSelect?.(result.accepted, result.rejected);
    };
    const open = () => { if (!props.disabled && !full.value) input.value?.click(); };
    const remove = (fileId: string) => {
      pendingFocus = { removed: fileId, next: focusAfterRemove(props.files.map(file => file.id), fileId) };
      props.onRemove?.(fileId);
    };
    const retryFailed = () => props.files.filter(file => file.status === "error").forEach(file => props.onRetry?.(file.id));

    const carriesFiles = (event: DragEvent) => !props.disabled && !!event.dataTransfer && Array.from(event.dataTransfer.types).includes("Files");
    const copy = computed(() => dragCopy(scope.value.messages, drag.value, types.value, props.maxFiles));
    const onDragenter = (event: DragEvent) => {
      if (!carriesFiles(event)) return;
      event.preventDefault();
      depth++;
      drag.value = dragVerdict(Array.from(event.dataTransfer!.items), limits());
    };
    const onDragover = (event: DragEvent) => {
      if (!carriesFiles(event)) return;
      event.preventDefault();
      event.dataTransfer!.dropEffect = copy.value?.blocked ? "none" : "copy";
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
      const m = scope.value.messages, intl = scope.value.intl, owner = field.value, files = props.files, c = copy.value;
      const filled = files.length > 0, summary = uploadSummary(files), lines = rejectionLines(m, rejected.value, sizeText.value);
      const titleId = uid + "-title", hintId = uid + "-hint", iconSize = tokens.extensions.fileUpload.iconSize;
      const invalid = !!owner?.error || undefined, describedBy = mergeIds(hintId, owner?.describedBy, props.ariaDescribedBy);
      const zoneHint = props.hint ?? m.uploadHint(types.value, sizeText.value, props.multiple ? props.maxFiles : undefined);
      const addHint = full.value ? m.uploadFullHint : props.hint ?? m.uploadHint(types.value, sizeText.value);
      const fullTitle = full.value && props.maxFiles != null ? m.uploadFull(props.maxFiles) : undefined;
      const button = props.trigger === "button", grid = props.layout === "grid";
      const addRow = (icon: string, title: string, rowHint: string) => (
        <button type="button" class="kjun-file-upload-add" data-pick="" aria-disabled={props.disabled || full.value || undefined} aria-invalid={invalid}
          aria-labelledby={titleId} aria-describedby={describedBy} onClick={open}>
          <span class="kjun-file-upload-icon"><KjunIcon name={icon} size={iconSize} /></span>
          <span class="kjun-file-upload-text">
            <span class="kjun-file-upload-title" id={titleId}>{title}</span>
            <span class="kjun-file-upload-hint" id={hintId}>{rowHint}</span>
          </span>
        </button>
      );
      // The foot line under a list only says what may still be added (or that the field is full), as in React.
      const triggerLine = (title: string | null, lineHint: string, label: string) => (
        <div class="kjun-file-upload-trigger">
          <span class="kjun-file-upload-text">
            {title ? <span class="kjun-file-upload-title">{title}</span> : null}
            <span class="kjun-file-upload-hint" id={hintId}>{lineHint}</span>
          </span>
          <KjunButton size="sm" variant="secondary" disabled={props.disabled || full.value} data-pick="" aria-invalid={invalid}
            aria-describedby={describedBy} onClick={open}>{label}</KjunButton>
        </div>
      );
      const empty = filled ? null : button ? triggerLine(m.uploadEmpty, zoneHint, m.uploadSelect)
        : props.size === "compact" ? addRow(c?.icon ?? "cloud-upload", c?.title ?? m.uploadDropOrSelect, c?.hint ?? zoneHint)
        : (
          <button type="button" class="kjun-file-upload-zone" data-pick="" aria-disabled={props.disabled || undefined} aria-invalid={invalid}
            aria-labelledby={titleId} aria-describedby={describedBy} onClick={open}>
            <span class="kjun-file-upload-icon"><KjunIcon name={c?.icon ?? "cloud-upload"} size={iconSize} /></span>
            <span class="kjun-file-upload-title" id={titleId}>{c?.title ?? m.uploadDropOrSelect}</span>
            <span class="kjun-file-upload-hint" id={hintId}>{c?.hint ?? zoneHint}</span>
          </button>
        );
      const addTile = grid && (props.multiple ? !button : true) ? (
        <button type="button" class="kjun-file-upload-add" data-tile="" data-pick="" aria-disabled={props.disabled || full.value || undefined}
          aria-invalid={invalid} aria-labelledby={titleId} aria-describedby={describedBy} onClick={open}>
          <span class="kjun-file-upload-icon"><KjunIcon name={props.multiple ? "plus" : "refresh"} size={iconSize} /></span>
          {props.multiple && props.maxFiles != null ? <span class="kjun-file-upload-num" aria-hidden="true">{files.length}/{props.maxFiles}</span> : null}
          <span class="kjun-sr-only" id={titleId}>{props.multiple ? fullTitle ?? m.uploadAddOrDrop : m.uploadReplaceFile(files[0]?.name ?? "")}</span>
          <span class="kjun-sr-only" id={hintId}>{props.multiple ? addHint : zoneHint}</span>
        </button>
      ) : null;
      return (
        <div ref={root} class={["kjun-file-upload", attrs.class]} style={attrs.style as never} role="group"
          aria-label={owner?.labelId ? undefined : props.ariaLabel} aria-labelledby={owner?.labelId}
          aria-describedby={mergeIds(owner?.describedBy, props.ariaDescribedBy)}
          data-state={filled ? "filled" : "empty"} data-drag={!c ? "none" : c.blocked ? "blocked" : "over"}
          data-size={props.size} data-trigger={props.trigger} data-layout={props.layout} data-invalid={invalid} data-disabled={props.disabled || undefined}
          onDragenter={onDragenter} onDragover={onDragover} onDragleave={onDragleave} onDrop={onDrop}>
          <input ref={input} id={props.id ?? owner?.id ?? uid + "-input"} type="file" hidden tabindex={-1} accept={props.accept}
            multiple={props.multiple} disabled={props.disabled}
            onChange={(event: Event) => { const el = event.currentTarget as HTMLInputElement; select(Array.from(el.files ?? [])); el.value = ""; }} />
          {empty}
          {filled ? [
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
            grid ? (
              <div class="kjun-file-upload-grid" role="list">
                {files.map(file => fileUploadTile({ file, m, disabled: props.disabled, onRemove: props.onRemove ? remove : undefined, onRetry: props.onRetry }))}
                {addTile}
              </div>
            ) : (
              <div class="kjun-file-upload-list" role="list">
                {files.map(file => fileUploadRow({ file, m, intl, disabled: props.disabled, onRemove: props.onRemove ? remove : undefined,
                  onRetry: props.onRetry, onReplace: props.multiple ? undefined : open }))}
              </div>
            ),
            props.multiple && (button || !grid) ? (
              <div class="kjun-file-upload-foot">
                {button ? triggerLine(fullTitle ?? null, addHint, m.uploadAdd) : addRow("plus", fullTitle ?? m.uploadAddOrDrop, addHint)}
              </div>
            ) : null,
          ] : null}
          {lines.length ? (
            <div class="kjun-file-upload-notice">
              <KjunIcon name="alert-circle" size={tokens.extensions.form.messageIconSize} />
              <span class="kjun-file-upload-notice-text">{lines.map(line => <span key={line}>{line}</span>)}</span>
              <button type="button" class="kjun-file-upload-action" data-action="dismiss" aria-label={m.close} onClick={() => { rejected.value = []; }}>
                <KjunIcon name="x" size={tokens.extensions.form.messageIconSize} />
              </button>
            </div>
          ) : null}
          {c && (filled || button) ? (
            <div class="kjun-file-upload-veil" aria-hidden="true">
              <span class="kjun-file-upload-icon"><KjunIcon name={c.icon} size={iconSize} /></span>
              <span class="kjun-file-upload-title">{c.title}</span>
              <span class="kjun-file-upload-hint">{c.hint}</span>
            </div>
          ) : null}
          <div class="kjun-sr-only" aria-live="polite">{live.value}</div>
        </div>
      );
    };
  },
});
