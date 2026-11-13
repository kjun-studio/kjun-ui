import { tokens, type TypographyRole } from "@kjun-ui/tokens";
import {
Animated,
View,
useWindowDimensions,
type DimensionValue,
type ViewStyle
} from "react-native";
import { skeletonTableWidth, skeletonTextWidths } from "../../../shared/package-runtime/skeleton-text";
import { useReducedMotion } from "./internal";
import { skeletonFill, useSkeletonPulse } from "./skeleton-clock";
import { KPI_NUMERAL_HEIGHT } from "../../../shared/package-runtime/kpi";
import { useKjunStyles } from "./provider";

export interface KjunSkeletonProps {
  /** "line" is one line of text: a bar in the line box of `role` (default body). */
  type?: "text" | "line" | "avatar" | "card" | "table" | "stat" | "block";
  /** Typography role for type="line". */
  role?: TypographyRole;
  /** Announces loading to screen readers (a status); the skeleton itself stays silent. */
  loadingText?: string;
  rows?: number;
  columns?: number;
  /** Block and avatar height; on a line, the bar's own height within the role's line box (default half the line). */
  height?: DimensionValue;
  width?: DimensionValue;
  animated?: boolean;
  rounded?: boolean;
}
export function KjunSkeleton({
  type = "text",
  rows = 3,
  columns = 4,
  height,
  width,
  animated = true,
  rounded = true,
  role = "body",
  loadingText,
}: KjunSkeletonProps) {
  const { colors } = useKjunStyles(),
    reduced = useReducedMotion(),
    // Text scales with the device's font size, so the line boxes that stand in for it scale too.
    { fontScale } = useWindowDimensions(),
    opacity = useSkeletonPulse(animated && !reduced);
  const shimmer = skeletonFill(opacity, colors);
  const block = (
    w: DimensionValue,
    h: DimensionValue = tokens.extensions.skeleton.lineHeights.md,
    extra: ViewStyle = {}
  ) => (
    <Animated.View
      style={{
        width: w,
        height: h,
        backgroundColor: shimmer,
        borderRadius: tokens.extensions.skeleton.lineRadius,
        ...extra,
      }}
    />
  );
  const count = (n: number) =>
    Array.from({ length: Math.max(0, Math.floor(n)) }, (_, i) => i + 1);
  // Like Web: a bar half a type role's line height, centred in that line box, so the skeleton is as tall as the text.
  // `bar` overrides the bar's height (unscaled), never taller than the line box.
  const slot = (w: DimensionValue, lineRole: TypographyRole = "body", key?: number, marginTop = 0, bar?: number, end = false) => {
    const lineHeight = tokens.typography[lineRole].lineHeightPx * fontScale;
    return (
      <View key={key} style={{ height: lineHeight, justifyContent: "center", alignItems: end ? "flex-end" : undefined, marginTop }}>
        {block(w, bar === undefined ? lineHeight / 2 : Math.min(bar * fontScale, lineHeight))}
      </View>
    );
  };
  const lineBar = typeof height === "number" ? Math.min(height * fontScale, tokens.typography[role].lineHeightPx * fontScale) : undefined;
  const paragraph = () => skeletonTextWidths(rows).map((w, i) => slot(w, "body", i));
  return (
    <View
      {...(loadingText
        // The status carries the text; iOS and Android need the label and an explicit live region.
        ? { role: "status" as const, accessible: true, accessibilityLabel: loadingText, accessibilityLiveRegion: "polite" as const }
        : { accessibilityElementsHidden: true, importantForAccessibility: "no-hide-descendants" as const })}
      // An avatar is as wide as itself, so it does not claim (or get squeezed in) a row; everything else fills.
      style={{ width: width || (type === "avatar" ? tokens.extensions.skeleton.avatarSize : "100%"), flexShrink: type === "avatar" ? 0 : undefined, overflow: "hidden" }}
    >
      {type === "text" && paragraph()}
      {type === "line" && (lineBar === undefined ? slot("100%", role)
        : <View style={{ height: tokens.typography[role].lineHeightPx * fontScale, justifyContent: "center" }}>{block("100%", lineBar)}</View>)}
      {type === "avatar" &&
        // The root already carries a given width; repeating a percentage here would apply it twice.
        block(width ? "100%" : tokens.extensions.skeleton.avatarSize, height || tokens.extensions.skeleton.avatarSize, { borderRadius: rounded ? tokens.radius.radius9999 : tokens.extensions.skeleton.blockRadius })}
      {type === "card" && (
        <View style={{ padding: tokens.extensions.skeleton.padding, borderRadius: tokens.extensions.skeleton.radius, backgroundColor: colors.surface }}>
          {slot("40%", "cardTitle")}
          {slot("28%", "caption", undefined, tokens.card.subtitleGap)}
          {rows > 0 && <View style={{ marginTop: tokens.extensions.skeleton.padding }}>{paragraph()}</View>}
        </View>
      )}
      {type === "table" && (
        // Like Web: rows of a KjunTable at rest, with row dividers only; columns after the first end like values.
        <View>
          {[0, ...count(rows)].map((row) => (
            <View
              key={row}
              style={{
                flexDirection: "row",
                borderBottomWidth: row === rows ? 0 : tokens.border.defaultWidth,
                borderBottomColor: colors.divider,
              }}
            >
              {count(columns).map((col) => (
                <View
                  key={col}
                  style={{
                    flex: 1,
                    minWidth: 0,
                    paddingVertical: tokens.dimension.value12,
                    paddingHorizontal: tokens.dimension.value16,
                  }}
                >
                  {slot(skeletonTableWidth(row, col - 1), row === 0 ? "caption" : "body", undefined, 0, undefined, col > 1)}
                </View>
              ))}
            </View>
          ))}
        </View>
      )}
      {type === "stat" && (
        <View>
          {slot("40%", "caption")}
          {/* Like a loading KpiRow: the value bar stands as tall as the value's digits. */}
          {slot("64%", "displaySm", undefined, tokens.extensions.kpiRow.md.labelGap, tokens.typography.displaySm.fontSizePx * KPI_NUMERAL_HEIGHT)}
          {slot("30%", "caption", undefined, tokens.extensions.kpiRow.md.descriptionGap)}
        </View>
      )}
      {type === "block" &&
        block("100%", height ?? tokens.extensions.skeleton.blockHeight, { borderRadius: tokens.extensions.skeleton.blockRadius })}
    </View>
  );
}
