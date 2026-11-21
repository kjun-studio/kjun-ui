import { useEffect, useRef, useState } from "react";
import { AccessibilityInfo, findNodeHandle, Platform, View, type StyleProp, type ViewStyle } from "react-native";
import { tokens } from "@kjun-ui/tokens";
import { KjunButton, KjunIcon } from "./button";
import { AccessiblePressable as Pressable } from "./a11y";
import { KText } from "./internal";
import { typeStyle } from "./typography";
import { useKjunStyles } from "./provider";
import { useKjunField } from "./input";
import { Action, FileUploadRow, FileUploadTile } from "./file-upload-row";
import { joinHints } from "../../../shared/package-runtime/aria-ids";
import { componentIcons } from "../../../shared/package-runtime/component-icons";
import { IconFallbacks } from "../../../shared/package-runtime/icon-context";
import { useKjunMessageScope } from "../../../shared/package-runtime/messages-context";
import {
  acceptText, focusAfterRemove, formatBytes, gridColumns, rejectionLines, screenFiles, uploadRoom, uploadStatuses, uploadSummary, uploadTransitions,
  type KjunPickedFile, type KjunRejectedFile, type KjunUploadFile, type KjunUploadLayout, type KjunUploadSize, type KjunUploadTrigger,
} from "../../../shared/package-runtime/file-upload";

export type {
  KjunUploadFile, KjunUploadStatus, KjunRejectedFile, KjunRejectReason, KjunPickedFile, KjunUploadSize, KjunUploadTrigger, KjunUploadLayout,
} from "../../../shared/package-runtime/file-upload";

export interface KjunFileUploadProps {
  /** The app's files. Empty shows the pick zone; any file folds it into a list with an add row. */
  files?: KjunUploadFile[];
  /** <input accept>-style rules such as ".pdf,image/*", checked against what onPick returns. */
  accept?: string;
  maxSize?: number;
  maxFiles?: number;
  multiple?: boolean;
  disabled?: boolean;
  hint?: string;
  /** "compact": the empty field is the one-line add row instead of the tall zone. */
  size?: KjunUploadSize;
  /** "button": a "Choose files" button at the end of a text line picks instead of a pressable area. */
  trigger?: KjunUploadTrigger;
  /** "grid": files show as square tiles (photos) with an add tile, instead of rows. */
  layout?: KjunUploadLayout;
  /** The app's file picker (expo-document-picker or any other); KJUN depends on none. Resolve null when the user cancels. */
  onPick: () => Promise<KjunPickedFile[] | null>;
  onSelect: (accepted: KjunPickedFile[], rejected: KjunRejectedFile<KjunPickedFile>[]) => void;
  onRemove?: (id: string) => void;
  onRetry?: (id: string) => void;
  ariaLabel?: string;
  style?: StyleProp<ViewStyle>;
}

const g = tokens.extensions.fileUpload;
const web = Platform.OS === "web";

function focusView(view: View | null | undefined) {
  if (!view) return;
  if (web) (view as unknown as HTMLElement).focus?.({ preventScroll: true });
  else { const tag = findNodeHandle(view); if (tag) AccessibilityInfo.setAccessibilityFocus(tag); }
}

/** Native has no drag and drop: the zone and the add row call onPick, and the result goes through the same screen as Web. */
export function KjunFileUpload({
  files = [], accept, maxSize, maxFiles, multiple = true, disabled = false, hint, size = "md", trigger = "area", layout = "list",
  onPick, onSelect, onRemove, onRetry, ariaLabel, style,
}: KjunFileUploadProps) {
  const { messages: m, intl } = useKjunMessageScope();
  const { colors, numericFontFamily } = useKjunStyles();
  const field = useKjunField();
  const [rejected, setRejected] = useState<KjunRejectedFile<KjunPickedFile>[]>([]);
  const [said, setSaid] = useState("");
  const [gridWidth, setGridWidth] = useState(0);
  const limits = { accept, maxSize, maxFiles, multiple, current: files.length };
  const full = multiple && uploadRoom(limits) <= 0, blocked = disabled || full;
  const types = acceptText(m, accept);
  const sizeText = maxSize == null ? undefined : formatBytes(maxSize, intl);
  const say = (text: string) => { if (web) setSaid(text); else if (text) AccessibilityInfo.announceForAccessibility(text); };
  const invalid = !!field?.error;

  const statuses = useRef(uploadStatuses(files));
  useEffect(() => {
    const changed = uploadTransitions(statuses.current, files);
    statuses.current = uploadStatuses(files);
    if (changed.length) say(changed.map(file => m.uploadAnnounce(file.name, file.status)).join(" "));
  }, [files, m]);

  // After a remove, focus moves to the next row's ×, else the previous one's, else the add control (as on Web).
  const removeRefs = useRef(new Map<string, View | null>()), pickRef = useRef<View | null>(null);
  const pendingFocus = useRef<{ removed: string; next: string | null } | null>(null);
  useEffect(() => {
    const pending = pendingFocus.current;
    if (!pending || files.some(file => file.id === pending.removed)) return;
    pendingFocus.current = null;
    const next = pending.next ? removeRefs.current.get(pending.next) : null;
    // Wait a frame so the add control that replaces the last row is mounted.
    requestAnimationFrame(() => focusView(next ?? pickRef.current));
  }, [files]);
  const remove = onRemove && ((id: string) => {
    pendingFocus.current = { removed: id, next: focusAfterRemove(files.map(file => file.id), id) };
    onRemove(id);
  });
  const removeRef = (id: string) => (node: View | null) => { if (node) removeRefs.current.set(id, node); else removeRefs.current.delete(id); };

  const lines = rejectionLines(m, rejected, sizeText);

  const picking = useRef(false);
  async function pick() {
    // One picker at a time; a picker that throws counts as a cancel.
    if (blocked || picking.current) return;
    picking.current = true;
    let picked: KjunPickedFile[] | null;
    try { picked = await onPick(); } catch { picked = null; } finally { picking.current = false; }
    if (!picked?.length) return;
    const result = screenFiles(picked, limits);
    setRejected(result.rejected);
    if (result.rejected.length) say(rejectionLines(m, result.rejected, sizeText).join(" "));
    onSelect(result.accepted, result.rejected);
  }
  const retryFailed = onRetry && (() => files.filter(file => file.status === "error").forEach(file => onRetry(file.id)));
  // A FormGroup error fills the pick control with the danger surface; hover and press keep their steps (as on Web).
  const fill = (pressed: boolean, hovered: boolean) => !blocked && pressed ? colors.active : !blocked && hovered ? colors.hover
    : invalid ? colors.dangerBg : colors.secondary;
  const title = { ...typeStyle("label"), color: blocked ? colors.textDisabled : colors.text };
  const caption = { ...typeStyle("caption"), color: blocked ? colors.textDisabled : colors.textSecondary };
  const circle = (diameter: number, name: string) => (
    <View style={{ width: diameter, height: diameter, borderRadius: g.roundRadius, backgroundColor: colors.surface, alignItems: "center", justifyContent: "center" }}>
      <KjunIcon name={name} size={g.iconSize} color={blocked ? colors.textDisabled : invalid ? colors.danger : colors.text} />
    </View>
  );
  const summary = uploadSummary(files), filled = files.length > 0;
  const button = trigger === "button", grid = layout === "grid";
  const divider = { borderColor: colors.divider, borderTopWidth: tokens.border.defaultWidth };
  const zoneTitle = filled ? (full && maxFiles != null ? m.uploadFull(maxFiles) : m.uploadAdd) : m.uploadSelect;
  const zoneHint = full ? m.uploadFullHint : hint ?? m.uploadHint(types, sizeText, filled || !multiple ? undefined : maxFiles);
  const pickA11y = (label: string) => ({
    accessibilityRole: "button" as const, accessibilityLabel: label, accessibilityHint: joinHints(zoneHint, field?.error),
    accessibilityState: { disabled: blocked }, ...(web ? { "aria-invalid": invalid || undefined } : {}),
  });

  const addRow = (icon: string) => (
    <Pressable ref={pickRef} {...pickA11y(zoneTitle)} disabled={blocked} onPress={pick}
      style={({ pressed, hovered }: { pressed: boolean; hovered?: boolean }) => ({ margin: g.inset, minHeight: g.addRowHeight, borderRadius: g.innerRadius,
        backgroundColor: fill(pressed, !!hovered), flexDirection: "row", alignItems: "center", gap: g.gap, paddingHorizontal: g.inset })}>
      {circle(g.addIcon, icon)}
      <View style={{ flex: 1, minWidth: 0 }}>
        <KText style={title}>{zoneTitle}</KText>
        <KText style={caption}>{zoneHint}</KText>
      </View>
    </Pressable>
  );
  // No drops on devices, so the foot line under a list only says what may still be added (or that the field is full).
  const triggerLine = (lineTitle: string | null, label: string) => (
    <View style={{ flexDirection: "row", alignItems: "center", gap: g.triggerGap, padding: g.inset, paddingLeft: g.rowPadding }}>
      <View style={{ flex: 1, minWidth: 0 }}>
        {lineTitle ? <KText style={title}>{lineTitle}</KText> : null}
        <KText style={caption}>{zoneHint}</KText>
      </View>
      <KjunButton size="sm" variant="secondary" disabled={blocked} accessibilityHint={joinHints(zoneHint, field?.error)}
        {...(web ? { "aria-invalid": invalid || undefined } : {})} onPress={pick}>{label}</KjunButton>
    </View>
  );
  const tile = gridColumns(Math.max(0, gridWidth - 2 * g.inset), g.tileMinSize, g.tileGap).tile || g.tileMinSize;

  let body;
  if (!filled) {
    body = button ? triggerLine(m.uploadEmpty, m.uploadSelect)
      : size === "compact" ? addRow("cloud-upload")
      : (
        <Pressable ref={pickRef} {...pickA11y(zoneTitle)} disabled={blocked} onPress={pick}
          style={({ pressed, hovered }: { pressed: boolean; hovered?: boolean }) => ({ margin: g.inset, minHeight: g.zoneHeight, borderRadius: g.innerRadius,
            backgroundColor: fill(pressed, !!hovered), alignItems: "center", justifyContent: "center", gap: g.zoneGap, paddingHorizontal: g.rowPadding })}>
          {circle(g.zoneIcon, "cloud-upload")}
          <KText style={{ ...title, textAlign: "center" }}>{zoneTitle}</KText>
          <KText style={{ ...caption, textAlign: "center" }}>{zoneHint}</KText>
        </Pressable>
      );
  } else {
    const addTile = grid && (multiple ? !button : true) ? (
      <Pressable ref={pickRef} {...pickA11y(multiple ? zoneTitle : m.uploadReplaceFile(files[0].name))} disabled={blocked} onPress={pick}
        style={({ pressed, hovered }: { pressed: boolean; hovered?: boolean }) => ({ width: tile, height: tile, borderRadius: g.tileRadius,
          backgroundColor: fill(pressed, !!hovered), alignItems: "center", justifyContent: "center", gap: g.tileInset })}>
        {circle(g.addIcon, multiple ? "plus" : "refresh")}
        {multiple && maxFiles != null && (
          <KText style={{ ...caption, fontFamily: numericFontFamily, fontVariant: ["tabular-nums"] }}>{`${files.length}/${maxFiles}`}</KText>
        )}
      </Pressable>
    ) : null;
    body = (
      <>
        {(files.length > 1 || summary.failed > 0) && (
          <View style={{ flexDirection: "row", alignItems: "center", gap: g.progressGap, minHeight: g.headMinHeight,
            paddingLeft: g.rowPadding, paddingRight: g.inset, borderColor: colors.divider, borderBottomWidth: tokens.border.defaultWidth }}>
            <KText style={{ ...typeStyle("labelStrong") }}>{m.uploadFiles}</KText>
            <KText style={{ ...typeStyle("caption"), color: colors.textSecondary, fontFamily: numericFontFamily, fontVariant: ["tabular-nums"] }}>
              {multiple && maxFiles != null ? `${files.length}/${maxFiles}` : String(files.length)}
            </KText>
            <View style={{ flex: 1 }} />
            {summary.failed > 0 && <KText style={{ ...typeStyle("caption"), color: colors.textSecondary }}>{m.uploadFailedCount(summary.failed)}</KText>}
            {summary.failed > 0 && retryFailed && (
              <KjunButton size="xs" variant="secondary" disabled={disabled} ariaLabel={m.uploadRetryFailed} onPress={retryFailed}
                style={{ alignSelf: "center" }}>{m.retry}</KjunButton>
            )}
          </View>
        )}
        {grid ? (
          <View role="list" onLayout={event => setGridWidth(event.nativeEvent.layout.width)}
            style={{ flexDirection: "row", flexWrap: "wrap", gap: g.tileGap, padding: g.inset }}>
            {files.map(file => (
              <FileUploadTile key={file.id} file={file} m={m} size={tile} disabled={disabled}
                removeRef={removeRef(file.id)} onRemove={remove} onRetry={onRetry} />
            ))}
            {addTile}
          </View>
        ) : (
          <View role="list">
            {files.map((file, index) => (
              <FileUploadRow key={file.id} file={file} m={m} intl={intl} disabled={disabled} first={index === 0}
                removeRef={removeRef(file.id)} onRemove={remove} onRetry={onRetry} onReplace={multiple ? undefined : pick} />
            ))}
          </View>
        )}
        {multiple && (button || !grid) && (
          <View style={divider}>{button ? triggerLine(full && maxFiles != null ? m.uploadFull(maxFiles) : null, m.uploadAdd) : addRow("plus")}</View>
        )}
      </>
    );
  }

  return (
    <IconFallbacks icons={componentIcons}>
      <View role="group" accessibilityLabel={field?.label ?? ariaLabel}
        style={[{ borderRadius: g.radius, backgroundColor: colors.surface, overflow: "hidden" }, style]}>
        {body}
        {lines.length > 0 && (
          <View style={{ flexDirection: "row", alignItems: "flex-start", gap: g.noticeGap, paddingLeft: g.rowPadding, paddingRight: g.inset, paddingBottom: g.inset }}>
            <KjunIcon name="alert-circle" size={tokens.extensions.form.messageIconSize} color={colors.danger} />
            <View style={{ flex: 1, minWidth: 0 }}>
              {lines.map(line => <KText key={line} style={{ ...typeStyle("caption"), color: colors.danger }}>{line}</KText>)}
            </View>
            <View style={{ marginVertical: (typeStyle("caption").lineHeight - g.touchTarget) / 2 }}>
              <Action name="x" label={m.close} disabled={false} onPress={() => setRejected([])} />
            </View>
          </View>
        )}
        {web ? <View role="status" style={{ pointerEvents: "none", position: "absolute", opacity: 0 }}><KText>{said}</KText></View> : null}
      </View>
    </IconFallbacks>
  );
}
