import { useKjunMessages } from "../../../shared/package-runtime/messages-context";
import { clampCurrent, stepStatus, stepsLayout, stepsRootStatus, type KjunStepItem, type KjunStepStatus, type KjunStepsCurrentStatus, type KjunStepsLayout } from "../../../shared/package-runtime/steps";
import { tokens } from "@kjun-ui/tokens";
import { useEffect, useState } from "react";
import { Platform, View, type LayoutChangeEvent, type StyleProp, type TextStyle, type ViewStyle } from "react-native";
import { AccessiblePressable as Pressable } from "./a11y";
import { KjunIcon } from "./button";
import { KText } from "./internal";
import { useKjunStyles } from "./provider";
import { typeStyle } from "./typography";

export type { KjunStepItem, KjunStepStatus, KjunStepsCurrentStatus, KjunStepsLayout };

export interface KjunStepsProps {
  /** The steps in order. Two or more. */
  items: KjunStepItem[];
  /** Index of the current step, counted from 0. items.length means every step is complete. */
  current: number;
  /** error marks the current step as failed (a failed payment, a failed delivery). */
  currentStatus?: KjunStepsCurrentStatus;
  orientation?: "horizontal" | "vertical";
  /** Horizontal only. auto folds to a compact header and bare markers when the width is under 80 per step. */
  layout?: KjunStepsLayout;
  /** Names the list; defaults to the "진행 단계" message. */
  ariaLabel?: string;
  /** Makes each completed step a button in the wide horizontal layout and in the vertical one. */
  onStepSelect?: (index: number) => void;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

function developmentMode() {
  try { return !!process.env.NODE_ENV && process.env.NODE_ENV !== "production"; } catch { return false; }
}

/** A long single word breaks inside its column instead of running past it (React Native Web only; devices wrap on their own). */
const breakWords = (Platform.OS === "web" ? { wordBreak: "keep-all", overflowWrap: "anywhere" } : {}) as TextStyle;

/** Progress through an ordered flow: a wizard, a checkout, a delivery trail. */
export function KjunSteps({ items, current, currentStatus = "active", orientation = "horizontal", layout = "auto", ariaLabel,
  onStepSelect, style, testID }: KjunStepsProps) {
  const m = useKjunMessages();
  const { colors, numericFontFamily, fontFamily } = useKjunStyles();
  const geometry = tokens.extensions.steps;
  const [width, setWidth] = useState<number | undefined>();
  const count = items.length;
  useEffect(() => {
    if (count < 2 && developmentMode()) console.warn("[KJUN] KjunSteps expects two or more items.");
  }, [count]);
  const at = clampCurrent(current, count);
  const vertical = orientation === "vertical";
  // Only a horizontal auto layout reads the width and stays invisible until the first measurement. The width is always tracked, so switching to auto later has one.
  const measuring = !vertical && layout === "auto";
  const waiting = measuring && width === undefined;
  const compact = !vertical && (layout === "compact" || (measuring && stepsLayout(width ?? 0, count) === "compact"));
  const statusText: Record<KjunStepStatus, string> = { complete: m.stepComplete, current: m.stepCurrent, error: m.stepError, upcoming: m.stepUpcoming };
  const shown = Math.min(at, count - 1), headItem = items[shown], next = at < count ? items[at + 1] : undefined;
  const total = m.stepCount(shown + 1, count), lead = String(shown + 1);
  const failed = stepsRootStatus(at, count, currentStatus) === "error";
  const titleLine = tokens.typography.label.lineHeightPx, bigMarker = geometry.markerLarge, smallMarker = geometry.markerSmall;
  const reached = (status: KjunStepStatus) => status !== "upcoming";
  const numeric = { fontFamily: numericFontFamily || fontFamily, fontVariant: ["tabular-nums"] as TextStyle["fontVariant"] };

  const marker = (status: KjunStepStatus, index: number) => {
    const small = vertical, size = small ? smallMarker : bigMarker, halo = small ? geometry.haloSmall : geometry.halo;
    const fill = status === "upcoming" ? colors.secondary : status === "error" ? colors.danger : colors.brand;
    const ink = status === "upcoming" ? colors.textTertiary : status === "error" ? colors.onDanger : colors.onBrand;
    const ring = status === "current" ? colors.brandSubtleBg : status === "error" ? colors.dangerBg : undefined;
    const lift = small ? (titleLine - smallMarker) / 2 : 0;
    // The halo is an outer filled circle that gives back its size as negative margin, like a box-shadow takes none.
    return (
      <View style={{ zIndex: 1, width: size + 2 * halo, height: size + 2 * halo, margin: -halo, marginTop: lift - halo, borderRadius: tokens.radius.radius9999,
        alignItems: "center", justifyContent: "center", backgroundColor: ring }}>
        <View style={{ width: size, height: size, borderRadius: tokens.radius.radius9999, alignItems: "center", justifyContent: "center", backgroundColor: fill }}>
          {small ? null : status === "complete" ? <KjunIcon name="check" size={geometry.markerIcon} color={ink} />
            : status === "error" ? <KjunIcon name="exclamation-mark" size={geometry.markerIcon} color={ink} />
            : <KText style={[typeStyle("captionStrong"), numeric, { color: ink }]}>{index + 1}</KText>}
        </View>
      </View>
    );
  };

  const horizontalBody = (item: KjunStepItem, status: KjunStepStatus, i: number) => (
    <View style={{ alignItems: "center", gap: geometry.labelGap, width: "100%", minWidth: 0 }}>
      {marker(status, i)}
      {compact ? null : (
        <KText numberOfLines={2} style={[typeStyle(status === "current" || status === "error" ? "captionStrong" : "caption"), breakWords,
          { maxWidth: "100%", textAlign: "center", color: status === "error" ? colors.danger : status === "current" ? colors.text : status === "complete" ? colors.textSecondary : colors.textTertiary }]}>{item.label}</KText>
      )}
    </View>
  );

  const verticalBody = (item: KjunStepItem, status: KjunStepStatus, i: number, detail: string) => (
    <View style={{ flexDirection: "row", alignItems: "flex-start", columnGap: geometry.columnGap, width: "100%" }}>
      <View style={{ width: bigMarker, alignItems: "center" }}>{marker(status, i)}</View>
      <View style={{ flex: 1, minWidth: 0 }}>
        <KText style={[typeStyle(status === "current" || status === "error" ? "labelStrong" : "label"), breakWords, { color: status === "error" ? colors.danger : colors.text }]}>{item.label}</KText>
        {detail ? <KText style={[typeStyle("caption"), breakWords, { color: colors.textTertiary }]}>{detail}</KText> : null}
      </View>
    </View>
  );

  const list = items.map((item, i) => {
    const status = stepStatus(i, at, currentStatus);
    const detail = vertical ? [item.meta, item.description].filter(Boolean).join(" · ") : "";
    const spoken = m.stepPosition(i + 1) + ", " + item.label + ", " + statusText[status] + (detail ? ", " + detail : "");
    const body = vertical ? verticalBody(item, status, i, detail) : horizontalBody(item, status, i);
    const selectable = !!onStepSelect && status === "complete" && !compact;
    const marked = status === "current" || status === "error";
    // The line from the previous marker's centre to this one's, coloured by this step; in a column it belongs to the step above.
    const line = vertical
      ? i < count - 1 && { left: (bigMarker - geometry.connector) / 2, top: (titleLine + smallMarker) / 2, width: geometry.connector,
          bottom: -(geometry.rowGap + (titleLine - smallMarker) / 2), backgroundColor: reached(stepStatus(i + 1, at, currentStatus)) ? colors.brand : colors.secondary }
      : i > 0 && { left: "-50%" as const, top: (bigMarker - geometry.connector) / 2, width: "100%" as const, height: geometry.connector,
          backgroundColor: reached(status) ? colors.brand : colors.secondary };
    const pad = vertical ? tokens.space.inline.xs : tokens.space.stack.sm, side = vertical ? tokens.space.inline.sm : tokens.space.inline.xs;
    const slop = Math.max(0, (tokens.native.minimumTouchTarget - (vertical ? titleLine + 2 * pad : 0)) / 2);
    return (
      <View key={item.key ?? i} role="listitem"
        {...(selectable ? {} : { accessible: true, accessibilityLabel: spoken, ...(marked && Platform.OS !== "web" ? { accessibilityState: { selected: true } } : {}) })}
        {...(Platform.OS === "web" && marked ? { "aria-current": "step" } : {})}
        style={{ flex: vertical ? undefined : 1, minWidth: !vertical && layout === "full" ? geometry.minColumn : 0 }}>
        {line ? <View testID={`steps-line-${i}`} pointerEvents="none" style={[{ position: "absolute", zIndex: 0 }, line]} /> : null}
        {selectable ? (
          <Pressable accessibilityRole="button" accessibilityLabel={spoken} onPress={() => onStepSelect?.(i)}
            hitSlop={{ top: slop, bottom: slop }} focusRingRadius={tokens.radius.radius8}
            style={({ pressed, hovered }: { pressed: boolean; hovered?: boolean }) => ({ marginVertical: -pad, marginHorizontal: -side, paddingVertical: pad,
              paddingHorizontal: side, borderRadius: tokens.radius.radius8, backgroundColor: pressed ? colors.active : hovered ? colors.hover : undefined })}>
            {body}
          </Pressable>
        ) : body}
      </View>
    );
  });

  return (
    <View testID={testID} onLayout={(event: LayoutChangeEvent) => setWidth(event.nativeEvent.layout.width)}
      style={[{ minWidth: 0, opacity: waiting ? 0 : 1 }, style]}>
      {compact && headItem ? (
        <View accessible={false} aria-hidden importantForAccessibility="no-hide-descendants" accessibilityElementsHidden
          style={{ flexDirection: "row", alignItems: "baseline", marginBottom: geometry.labelGap }}>
          <KText numberOfLines={1} style={[typeStyle("labelStrong"), { flex: 1, minWidth: 0, color: failed ? colors.danger : colors.text }]}>{headItem.label}</KText>
          <KText style={[typeStyle("caption"), numeric, { marginLeft: geometry.columnGap, color: colors.textTertiary }]}>
            {total.startsWith(lead)
              ? <><KText style={[typeStyle("captionStrong"), numeric, { color: colors.brand }]}>{lead}</KText>{total.slice(lead.length)}</>
              : total}
          </KText>
        </View>
      ) : null}
      <View accessibilityRole="list" accessibilityLabel={ariaLabel ?? m.steps}
        style={vertical ? { rowGap: geometry.rowGap } : { flexDirection: "row" }}>{list}</View>
      {compact && next ? (
        <KText aria-hidden importantForAccessibility="no-hide-descendants" numberOfLines={1}
          style={[typeStyle("caption"), { marginTop: geometry.labelGap, color: colors.textTertiary }]}>{m.stepNext} · {next.label}</KText>
      ) : null}
    </View>
  );
}
