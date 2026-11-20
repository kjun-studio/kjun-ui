import { useKjunMessages } from "../../../shared/package-runtime/messages-context";
import { developmentMode } from "../../../shared/package-runtime/development";
import { stepDetail, stepLineReached, stepSelectable, stepSpoken, stepsCurrent, stepsHead, stepsLayout, stepsRootStatus, stepsStatuses, type KjunStepItem, type KjunStepStatus, type KjunStepsCurrentStatus, type KjunStepsLayout, type KjunStepsSelectable } from "../../../shared/package-runtime/steps";
import { tokens } from "@kjun-ui/tokens";
import { useEffect, useState } from "react";
import { Platform, View, type LayoutChangeEvent, type StyleProp, type TextStyle, type ViewStyle } from "react-native";
import { AccessiblePressable as Pressable } from "./a11y";
import { KjunIcon } from "./button";
import { KText } from "./internal";
import { useKjunStyles } from "./provider";
import { typeStyle } from "./typography";

export type { KjunStepItem, KjunStepStatus, KjunStepsCurrentStatus, KjunStepsLayout, KjunStepsSelectable };

export interface KjunStepsProps {
  /** The steps in order. Two or more. */
  items: KjunStepItem[];
  /** Index of the current step, counted from 0. items.length means every step is complete. Optional when the items carry
   * their own status: the first step marked current or error is then the current one. */
  current?: number;
  /** error marks the current step as failed (a failed payment, a failed delivery). */
  currentStatus?: KjunStepsCurrentStatus;
  orientation?: "horizontal" | "vertical";
  /** Horizontal only. auto folds to a compact header and bare markers when the width is under 80 per step. */
  layout?: KjunStepsLayout;
  /** Names the list; defaults to the "진행 단계" message. */
  ariaLabel?: string;
  /** Makes steps buttons in the wide horizontal layout and in the vertical one: completed ones, or with selectable="all" every step but the current one. */
  onStepSelect?: (index: number) => void;
  /** "complete" (default) lets onStepSelect go back only; "all" also lets it skip ahead to a later step. */
  selectable?: KjunStepsSelectable;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

/** A long single word breaks inside its column instead of running past it (React Native Web only; devices wrap on their own). */
const breakWords = (Platform.OS === "web" ? { wordBreak: "keep-all", overflowWrap: "anywhere" } : {}) as TextStyle;

/** Progress through an ordered flow: a wizard, a checkout, a delivery trail. */
export function KjunSteps({ items, current, currentStatus = "active", orientation = "horizontal", layout = "auto", ariaLabel,
  onStepSelect, selectable: selectableSteps = "complete", style, testID }: KjunStepsProps) {
  const m = useKjunMessages();
  const { colors, numericFontFamily, fontFamily } = useKjunStyles();
  const geometry = tokens.extensions.steps;
  const [width, setWidth] = useState<number | undefined>();
  const count = items.length;
  useEffect(() => {
    if (count < 2 && developmentMode()) console.warn("[KJUN] KjunSteps expects two or more items.");
  }, [count]);
  const at = stepsCurrent(items, current), statuses = stepsStatuses(items, at, currentStatus);
  const vertical = orientation === "vertical";
  // Only a horizontal auto layout reads the width and stays invisible until the first measurement. The width is always tracked, so switching to auto later has one.
  const measuring = !vertical && layout === "auto";
  const waiting = measuring && width === undefined;
  const compact = !vertical && (layout === "compact" || (measuring && stepsLayout(width ?? 0, count) === "compact"));
  const head = stepsHead(m, items, at), headItem = head.item, next = head.next;
  const failed = stepsRootStatus(statuses) === "error";
  const titleLine = tokens.typography.label.lineHeightPx, bigMarker = geometry.markerLarge, smallMarker = geometry.markerSmall;
  // How far a horizontal connector stops short of a marker's centre: half the marker, its halo when it has one, and a 4px gap.
  const lineEnd = (status: KjunStepStatus) => bigMarker / 2 + (status === "current" || status === "error" ? geometry.halo : 0) + tokens.dimension.value4;
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
        <KText style={[typeStyle(status === "current" || status === "error" ? "labelStrong" : "label"), breakWords, { color: status === "error" ? colors.danger : status === "current" ? colors.text : status === "complete" ? colors.textSecondary : colors.textTertiary }]}>{item.label}</KText>
        {detail ? (
          <KText style={[typeStyle("caption"), breakWords, { color: colors.textTertiary }]}>
            {item.meta ? <KText style={[numeric, { color: colors.textTertiary }]}>{item.meta}</KText> : null}
            {item.meta && item.description ? " · " : ""}{item.description ?? ""}
          </KText>
        ) : null}
      </View>
    </View>
  );

  const list = items.map((item, i) => {
    const status = statuses[i];
    const detail = stepDetail(item, vertical), spoken = stepSpoken(m, i, item, status, detail);
    const body = vertical ? verticalBody(item, status, i, detail) : horizontalBody(item, status, i);
    const selectable = !!onStepSelect && stepSelectable(status, selectableSteps, item.disabled) && !compact;
    const marked = status === "current" || status === "error";
    // The line from the previous marker's centre to this one's, coloured once both ends are reached; in a column it belongs to the step above.
    const line = vertical
      ? i < count - 1 && { left: (bigMarker - geometry.connector) / 2, top: (titleLine + smallMarker) / 2, width: geometry.connector,
          bottom: -(geometry.rowGap + (titleLine - smallMarker) / 2), backgroundColor: stepLineReached(status, statuses[i + 1]) ? colors.brand : colors.secondary }
      // Previous centre to this centre, then cut back a 4px gap from each marker (from its halo on the current or failed step), like Web.
      : i > 0 && { left: "-50%" as const, right: "50%" as const, top: (bigMarker - geometry.connector) / 2, height: geometry.connector,
          marginLeft: lineEnd(statuses[i - 1]), marginRight: lineEnd(status),
          backgroundColor: stepLineReached(statuses[i - 1], status) ? colors.brand : colors.secondary };
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
            {head.lead ? <KText style={[typeStyle("captionStrong"), numeric, { color: colors.brand }]}>{head.lead}</KText> : null}{head.rest}
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
