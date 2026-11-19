import { useEffect, useState, type Ref } from "react";
import { Image, Platform, View } from "react-native";
import { tokens } from "@kjun-ui/tokens";
import { KjunButton, KjunIcon } from "./button";
import { AccessiblePressable as Pressable } from "./a11y";
import { KText } from "./internal";
import { typeStyle } from "./typography";
import { useKjunStyles } from "./provider";
import type { KjunMessages } from "../../../shared/package-runtime/messages";
import {
  clampProgress, extensionLabel, formatBytes, removeLabel, splitFileName, tileLabel, type KjunUploadFile,
} from "../../../shared/package-runtime/file-upload";

const g = tokens.extensions.fileUpload;

export interface FileUploadRowProps {
  file: KjunUploadFile;
  m: KjunMessages;
  intl?: string;
  disabled: boolean;
  first: boolean;
  /** The ×, so the field can move focus to it after another row is removed. */
  removeRef?: Ref<View>;
  onRemove?: (id: string) => void;
  onRetry?: (id: string) => void;
  onReplace?: () => void;
}

/** A row action: a 44pt touch target around the same icon as Web. */
export function Action({ name, label, disabled, strong, pressRef, onPress }: {
  name: string; label: string; disabled: boolean; strong?: boolean; pressRef?: Ref<View>; onPress: () => void;
}) {
  const { colors } = useKjunStyles();
  return (
    <Pressable ref={pressRef} accessibilityRole="button" accessibilityLabel={label} accessibilityState={{ disabled }} disabled={disabled} onPress={onPress}
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

/** The extension in capitals, with the preview over it until the preview fails to load. */
function Thumb({ file, size, radius }: { file: KjunUploadFile; size: number; radius: number }) {
  const { colors } = useKjunStyles();
  const [broken, setBroken] = useState(false);
  useEffect(() => setBroken(false), [file.previewUrl]);
  return (
    <View aria-hidden style={{ width: size, height: size, borderRadius: radius, backgroundColor: colors.secondary,
      alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
      {file.previewUrl && !broken ? <Image source={{ uri: file.previewUrl }} style={{ width: size, height: size }} onError={() => setBroken(true)} />
        : <KText style={{ ...typeStyle("captionStrong"), color: colors.textSecondary }}>{extensionLabel(file.name, file.type)}</KText>}
    </View>
  );
}

function Bar({ file, m, progress, style }: { file: KjunUploadFile; m: KjunMessages; progress?: number; style?: object }) {
  const { colors } = useKjunStyles();
  return (
    <View role="progressbar" accessibilityLabel={m.uploadProgress(file.name)}
      accessibilityValue={progress === undefined ? undefined : { min: 0, max: 100, now: Math.round(progress) }}
      {...(Platform.OS === "web" && progress !== undefined ? { "aria-valuenow": Math.round(progress), "aria-valuemin": 0, "aria-valuemax": 100 } : {})}
      style={[{ height: g.progressHeight, borderRadius: g.roundRadius, backgroundColor: colors.secondary, overflow: "hidden" }, style]}>
      <View style={{ height: "100%", width: progress === undefined ? "30%" : `${progress}%`, borderRadius: g.roundRadius, backgroundColor: colors.brand }} />
    </View>
  );
}

/** Mirrors the Web row: thumbnail, middle-truncated name, size and status in words, a bar while uploading, then actions. */
export function FileUploadRow({ file, m, intl, disabled, first, removeRef, onRemove, onRetry, onReplace }: FileUploadRowProps) {
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
      <Thumb file={file} size={g.thumb} radius={g.thumbRadius} />
      <View style={{ flex: 1, minWidth: 0 }}>
        <View style={{ flexDirection: "row", minWidth: 0 }} accessible accessibilityLabel={file.name}>
          <KText numberOfLines={1} style={{ ...typeStyle("label"), flexShrink: 1 }}>{head}</KText>
          <KText numberOfLines={1} style={{ ...typeStyle("label"), flexShrink: 0 }}>{tail}</KText>
        </View>
        <View style={{ flexDirection: "row", alignItems: "flex-start", gap: g.metaGap, marginTop: tokens.extensions.list.descriptionGap, minWidth: 0 }}>
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
              {/* A failure message may run to two lines, as on Web. */}
              {status && <KText numberOfLines={file.status === "error" ? 2 : 1} style={{ ...caption, color: tone, flexShrink: 1 }}>{status}</KText>}
            </>
          )}
        </View>
        {file.status === "uploading" && <Bar file={file} m={m} progress={progress} style={{ marginTop: g.progressGap }} />}
      </View>
      <View style={{ flexDirection: "row", alignItems: "center" }}>
        {onReplace && <KjunButton size="xs" variant="secondary" disabled={disabled} ariaLabel={m.uploadReplaceFile(file.name)} onPress={onReplace}>{m.uploadReplace}</KjunButton>}
        {file.status === "error" && onRetry && <Action name="refresh" strong label={m.uploadRetry(file.name)} disabled={disabled} onPress={() => onRetry(file.id)} />}
        {onRemove && <Action name="x" label={removeLabel(m, file)} disabled={disabled} pressRef={removeRef} onPress={() => onRemove(file.id)} />}
      </View>
    </View>
  );
}

export interface FileUploadTileProps {
  file: KjunUploadFile;
  m: KjunMessages;
  /** Tile width and height from the grid's measured width. */
  size: number;
  disabled: boolean;
  removeRef?: Ref<View>;
  onRemove?: (id: string) => void;
  onRetry?: (id: string) => void;
}

/** layout="grid": the Web tile — preview, a bar while uploading, a fill and retry when failed, × in a 44pt corner target. */
export function FileUploadTile({ file, m, size, disabled, removeRef, onRemove, onRetry }: FileUploadTileProps) {
  const { colors } = useKjunStyles();
  const progress = file.status === "uploading" ? clampProgress(file.progress) : undefined;
  return (
    <View role="listitem" style={{ width: size, height: size, borderRadius: g.tileRadius, overflow: "hidden" }}>
      <View accessible accessibilityLabel={tileLabel(m, file)} style={{ position: "absolute", top: 0, left: 0 }}>
        <Thumb file={file} size={size} radius={0} />
      </View>
      {file.status === "uploading" && (
        <Bar file={file} m={m} progress={progress} style={{ position: "absolute", left: g.tileInset, right: g.tileInset, bottom: g.tileInset, backgroundColor: colors.surface }} />
      )}
      {file.status === "error" && (
        <View style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, alignItems: "center", justifyContent: "center",
          padding: g.tileInset, backgroundColor: colors.dangerBg }}>
          {/* With retry the tile shows only its button (the head counts failures); without it, the words. */}
          {onRetry ? <Action name="refresh" strong label={m.uploadRetry(file.name)} disabled={disabled} onPress={() => onRetry(file.id)} />
            : <KText aria-hidden style={{ ...typeStyle("caption"), color: colors.danger, textAlign: "center" }}>{m.uploadFailed}</KText>}
        </View>
      )}
      {onRemove && (
        <Pressable ref={removeRef} accessibilityRole="button" accessibilityLabel={removeLabel(m, file)} accessibilityState={{ disabled }}
          disabled={disabled} onPress={() => onRemove(file.id)}
          style={{ position: "absolute", top: 0, right: 0, width: g.touchTarget, height: g.touchTarget, alignItems: "flex-end",
            padding: g.tileInset, opacity: disabled ? tokens.states.opacity.disabled : 1 }}>
          <View style={{ width: g.tileRemoveSize, height: g.tileRemoveSize, borderRadius: g.roundRadius, backgroundColor: colors.overlay,
            alignItems: "center", justifyContent: "center" }}>
            <KjunIcon name="x" size={g.tileRemoveIcon} color={colors.inverse} />
          </View>
        </Pressable>
      )}
    </View>
  );
}
