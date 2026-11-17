import { useEffect, useRef, useState } from "react";
import { AccessibilityInfo, Platform, View, type StyleProp, type ViewStyle } from "react-native";
import { tokens } from "@kjun-ui/tokens";
import { KjunButton, KjunIcon } from "./button";
import { AccessiblePressable as Pressable } from "./a11y";
import { KText } from "./internal";
import { typeStyle } from "./typography";
import { useKjunStyles } from "./provider";
import { useKjunField } from "./input";
import { Action, FileUploadRow } from "./file-upload-row";
import { componentIcons } from "../../../shared/package-runtime/component-icons";
import { IconFallbacks } from "../../../shared/package-runtime/icon-context";
import { useKjunMessageScope } from "../../../shared/package-runtime/messages-context";
import {
  acceptLabels, formatBytes, screenFiles, uploadRoom, uploadStatuses, uploadSummary, uploadTransitions,
  type KjunPickedFile, type KjunRejectedFile, type KjunUploadFile,
} from "../../../shared/package-runtime/file-upload";

export type { KjunUploadFile, KjunUploadStatus, KjunRejectedFile, KjunRejectReason, KjunPickedFile } from "../../../shared/package-runtime/file-upload";

export interface KjunFileUploadProps {
  /** The app's files. Empty shows the wide pick zone; any file folds it into a list with an add row. */
  files?: KjunUploadFile[];
  /** <input accept>-style rules such as ".pdf,image/*", checked against what onPick returns. */
  accept?: string;
  maxSize?: number;
  maxFiles?: number;
  multiple?: boolean;
  disabled?: boolean;
  hint?: string;
  /** The app's file picker (expo-document-picker or any other); KJUN depends on none. Resolve null when the user cancels. */
  onPick: () => Promise<KjunPickedFile[] | null>;
  onSelect: (accepted: KjunPickedFile[], rejected: KjunRejectedFile<KjunPickedFile>[]) => void;
  onRemove?: (id: string) => void;
  onRetry?: (id: string) => void;
  ariaLabel?: string;
  style?: StyleProp<ViewStyle>;
}

const g = tokens.extensions.fileUpload;
const REJECTION_LINES = 3;

/** Native has no drag and drop: the zone and the add row call onPick, and the result goes through the same screen as Web. */
export function KjunFileUpload({
  files = [], accept, maxSize, maxFiles, multiple = true, disabled = false, hint, onPick, onSelect, onRemove, onRetry, ariaLabel, style,
}: KjunFileUploadProps) {
  const { messages: m, intl } = useKjunMessageScope();
  const { colors } = useKjunStyles();
  const field = useKjunField();
  const [rejected, setRejected] = useState<KjunRejectedFile<KjunPickedFile>[]>([]);
  const [said, setSaid] = useState("");
  const limits = { accept, maxSize, maxFiles, multiple, current: files.length };
  const full = multiple && uploadRoom(limits) <= 0, blocked = disabled || full;
  const { labels, groups } = acceptLabels(accept);
  const types = [...labels, ...groups.map(m.uploadGroup)].join(", ");
  const sizeText = maxSize == null ? undefined : formatBytes(maxSize, intl);
  const say = (text: string) => { if (Platform.OS === "web") setSaid(text); else if (text) AccessibilityInfo.announceForAccessibility(text); };

  const statuses = useRef(uploadStatuses(files));
  useEffect(() => {
    const changed = uploadTransitions(statuses.current, files);
    statuses.current = uploadStatuses(files);
    if (changed.length) say(changed.map(file => m.uploadAnnounce(file.name, file.status)).join(" "));
  }, [files, m]);

  const lines = rejected.slice(0, REJECTION_LINES).map(({ file, reason }) => m.uploadRejected(file.name, reason, sizeText ?? ""));
  if (rejected.length > REJECTION_LINES) lines.push(m.uploadRejectedMore(rejected.length - REJECTION_LINES));

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
    if (result.rejected.length) say(result.rejected.map(({ file, reason }) => m.uploadRejected(file.name, reason, sizeText ?? "")).join(" "));
    onSelect(result.accepted, result.rejected);
  }
  const retryFailed = onRetry && (() => files.filter(file => file.status === "error").forEach(file => onRetry(file.id)));
  const fill = (pressed: boolean, hovered: boolean) => !blocked && pressed ? colors.active : !blocked && hovered ? colors.hover : colors.secondary;
  const title = { ...typeStyle("label"), color: blocked ? colors.textDisabled : colors.text };
  const caption = { ...typeStyle("caption"), color: blocked ? colors.textDisabled : colors.textSecondary };
  const circle = (size: number, name: string) => (
    <View style={{ width: size, height: size, borderRadius: g.roundRadius, backgroundColor: colors.surface, alignItems: "center", justifyContent: "center" }}>
      <KjunIcon name={name} size={g.iconSize} color={blocked ? colors.textDisabled : colors.text} />
    </View>
  );
  const summary = uploadSummary(files), filled = files.length > 0;
  const divider = { borderColor: colors.divider, borderTopWidth: tokens.border.defaultWidth };
  const zoneTitle = filled ? (full && maxFiles != null ? m.uploadFull(maxFiles) : m.uploadAdd) : m.uploadSelect;
  const zoneHint = full ? m.uploadFullHint : hint ?? m.uploadHint(types, sizeText, filled || !multiple ? undefined : maxFiles);

  return (
    <IconFallbacks icons={componentIcons}>
      <View role="group" accessibilityLabel={field?.label ?? ariaLabel}
        style={[{ borderRadius: g.radius, backgroundColor: colors.surface, overflow: "hidden" }, style]}>
        {!filled ? (
          <Pressable accessibilityRole="button" accessibilityLabel={zoneTitle} accessibilityHint={zoneHint} accessibilityState={{ disabled: blocked }}
            disabled={blocked} onPress={pick}
            style={({ pressed, hovered }: { pressed: boolean; hovered?: boolean }) => ({ margin: g.inset, minHeight: g.zoneHeight, borderRadius: g.innerRadius,
              backgroundColor: fill(pressed, !!hovered), alignItems: "center", justifyContent: "center", gap: g.zoneGap, paddingHorizontal: g.rowPadding })}>
            {circle(g.zoneIcon, "cloud-upload")}
            <KText style={{ ...title, textAlign: "center" }}>{zoneTitle}</KText>
            <KText style={{ ...caption, textAlign: "center" }}>{zoneHint}</KText>
          </Pressable>
        ) : (
          <>
            {(files.length > 1 || summary.failed > 0) && (
              <View style={{ flexDirection: "row", alignItems: "center", gap: g.progressGap, minHeight: g.headMinHeight,
                paddingLeft: g.rowPadding, paddingRight: g.inset, borderColor: colors.divider, borderBottomWidth: tokens.border.defaultWidth }}>
                <KText style={{ ...typeStyle("labelStrong") }}>{m.uploadFiles}</KText>
                <KText style={{ ...typeStyle("caption"), color: colors.textSecondary }}>{multiple && maxFiles != null ? `${files.length}/${maxFiles}` : String(files.length)}</KText>
                <View style={{ flex: 1 }} />
                {summary.failed > 0 && <KText style={{ ...typeStyle("caption"), color: colors.textSecondary }}>{m.uploadFailedCount(summary.failed)}</KText>}
                {summary.failed > 0 && retryFailed && (
                  <KjunButton size="xs" variant="secondary" disabled={disabled} ariaLabel={m.uploadRetryFailed} onPress={retryFailed}>{m.retry}</KjunButton>
                )}
              </View>
            )}
            <View role="list">
              {files.map((file, index) => (
                <FileUploadRow key={file.id} file={file} m={m} intl={intl} disabled={disabled} first={index === 0}
                  onRemove={onRemove} onRetry={onRetry} onReplace={multiple ? undefined : pick} />
              ))}
            </View>
            {multiple && (
              <View style={divider}>
                <Pressable accessibilityRole="button" accessibilityLabel={zoneTitle} accessibilityHint={zoneHint} accessibilityState={{ disabled: blocked }}
                  disabled={blocked} onPress={pick}
                  style={({ pressed, hovered }: { pressed: boolean; hovered?: boolean }) => ({ margin: g.inset, minHeight: g.addRowHeight, borderRadius: g.innerRadius,
                    backgroundColor: fill(pressed, !!hovered), flexDirection: "row", alignItems: "center", gap: g.gap, paddingHorizontal: g.inset })}>
                  {circle(g.addIcon, "plus")}
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <KText style={title}>{zoneTitle}</KText>
                    <KText style={caption}>{full ? m.uploadFullHint : hint ?? m.uploadHint(types, sizeText)}</KText>
                  </View>
                </Pressable>
              </View>
            )}
          </>
        )}
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
        {Platform.OS === "web" ? <View role="status" pointerEvents="none" style={{ position: "absolute", opacity: 0 }}><KText>{said}</KText></View> : null}
      </View>
    </IconFallbacks>
  );
}
