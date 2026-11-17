import { Image, Platform, View } from "react-native";
import { tokens } from "@kjun-ui/tokens";
import { KjunButton, KjunIcon } from "./button";
import { AccessiblePressable as Pressable } from "./a11y";
import { KText } from "./internal";
import { typeStyle } from "./typography";
import { useKjunStyles } from "./provider";
import type { KjunMessages } from "../../../shared/package-runtime/messages";
import { clampProgress, extensionLabel, formatBytes, splitFileName, type KjunUploadFile } from "../../../shared/package-runtime/file-upload";

const g = tokens.extensions.fileUpload;

export interface FileUploadRowProps {
  file: KjunUploadFile;
  m: KjunMessages;
  intl?: string;
  disabled: boolean;
  first: boolean;
  onRemove?: (id: string) => void;
  onRetry?: (id: string) => void;
  onReplace?: () => void;
}

/** A row action: a 44pt touch target around the same icon as Web. */
function Action({ name, label, disabled, strong, onPress }: { name: string; label: string; disabled: boolean; strong?: boolean; onPress: () => void }) {
  const { colors } = useKjunStyles();
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={label} accessibilityState={{ disabled }} disabled={disabled} onPress={onPress}
      style={{ width: g.touchTarget, height: g.touchTarget, alignItems: "center", justifyContent: "center", opacity: disabled ? tokens.states.opacity.disabled : 1 }}>
      {({ pressed }: { pressed: boolean }) => (
        // A 44pt target around the same 32pt press shape as Web.
        <View style={{ width: g.actionSize, height: g.actionSize, borderRadius: g.thumbRadius, alignItems: "center", justifyContent: "center",
          backgroundColor: pressed ? colors.active : "transparent" }}>
          <KjunIcon name={name} size={g.iconSize} color={strong ? colors.text : colors.textSecondary} />
        </View>
      )}
    </Pressable>
  );
}

/** Mirrors the Web row: thumbnail, middle-truncated name, size and status in words, a bar while uploading, then actions. */
export function FileUploadRow({ file, m, intl, disabled, first, onRemove, onRetry, onReplace }: FileUploadRowProps) {
  const { colors, numericFontFamily } = useKjunStyles();
  const { head, tail } = splitFileName(file.name);
  const progress = file.status === "uploading" ? clampProgress(file.progress) : undefined;
  const size = formatBytes(file.size, intl);
  const caption = { ...typeStyle("caption"), color: colors.textSecondary };
  const num = { ...caption, fontFamily: numericFontFamily, fontVariant: ["tabular-nums" as const] };
  const status = file.status === "queued" ? m.uploadQueued : file.status === "done" ? m.uploadDone : file.status === "error" ? file.error || m.uploadFailed : null;
  const tone = file.status === "done" ? colors.success : file.status === "error" ? colors.danger : colors.textSecondary;
  return (
    <View role="listitem" style={{ flexDirection: "row", alignItems: "center", gap: g.gap, minHeight: g.rowMinHeight,
      paddingVertical: g.rowPaddingY, paddingLeft: g.rowPadding, paddingRight: g.inset }}>
      {!first && <View style={{ position: "absolute", top: 0, left: g.rowPadding, right: g.rowPadding, height: tokens.border.defaultWidth, backgroundColor: colors.divider }} />}
      <View aria-hidden style={{ width: g.thumb, height: g.thumb, borderRadius: g.thumbRadius, backgroundColor: colors.secondary,
        alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
        {file.previewUrl ? <Image source={{ uri: file.previewUrl }} style={{ width: g.thumb, height: g.thumb }} />
          : <KText style={{ ...typeStyle("captionStrong"), color: colors.textSecondary }}>{extensionLabel(file.name, file.type)}</KText>}
      </View>
      <View style={{ flex: 1, minWidth: 0 }}>
        <View style={{ flexDirection: "row", minWidth: 0 }} accessible accessibilityLabel={file.name}>
          <KText numberOfLines={1} style={{ ...typeStyle("label"), flexShrink: 1 }}>{head}</KText>
          <KText numberOfLines={1} style={{ ...typeStyle("label"), flexShrink: 0 }}>{tail}</KText>
        </View>
        <View style={{ flexDirection: "row", alignItems: "center", gap: g.metaGap, marginTop: tokens.extensions.list.descriptionGap, minWidth: 0 }}>
          {file.status === "uploading" && progress !== undefined ? (
            <>
              <KText style={num}>{formatBytes(file.size * progress / 100, intl)} / {size}</KText>
              <KText aria-hidden style={caption}>·</KText>
              <KText style={num}>{Math.round(progress)}%</KText>
            </>
          ) : (
            <>
              <KText style={num}>{size}</KText>
              {status && <KText aria-hidden style={caption}>·</KText>}
              {status && <KText numberOfLines={1} style={{ ...caption, color: tone, flexShrink: 1 }}>{status}</KText>}
            </>
          )}
        </View>
        {file.status === "uploading" && (
          <View role="progressbar" accessibilityLabel={m.uploadProgress(file.name)}
            accessibilityValue={progress === undefined ? undefined : { min: 0, max: 100, now: Math.round(progress) }}
            {...(Platform.OS === "web" && progress !== undefined ? { "aria-valuenow": Math.round(progress), "aria-valuemin": 0, "aria-valuemax": 100 } : {})}
            style={{ height: g.progressHeight, marginTop: g.progressGap, borderRadius: g.roundRadius, backgroundColor: colors.secondary, overflow: "hidden" }}>
            <View style={{ height: "100%", width: progress === undefined ? "30%" : `${progress}%`, borderRadius: g.roundRadius, backgroundColor: colors.brand }} />
          </View>
        )}
      </View>
      <View style={{ flexDirection: "row", alignItems: "center" }}>
        {onReplace && <KjunButton size="xs" variant="secondary" disabled={disabled} ariaLabel={m.uploadReplaceFile(file.name)} onPress={onReplace}>{m.uploadReplace}</KjunButton>}
        {file.status === "error" && onRetry && <Action name="refresh" strong label={m.uploadRetry(file.name)} disabled={disabled} onPress={() => onRetry(file.id)} />}
        {onRemove && <Action name="x" label={m.remove(file.name)} disabled={disabled} onPress={() => onRemove(file.id)} />}
      </View>
    </View>
  );
}
