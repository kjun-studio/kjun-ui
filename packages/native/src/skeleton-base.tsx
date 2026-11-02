import { tokens, type TypographyRole } from "@kjun-ui/tokens";
import {
Animated,
View,
useWindowDimensions,
type DimensionValue,
type ViewStyle
} from "react-native";
import { skeletonTextWidths } from "../../../shared/package-runtime/skeleton-text";
import { useReducedMotion } from "./internal";
import { useSkeletonPulse } from "./skeleton-clock";
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
  const shimmer = opacity && typeof colors.skeletonShine === "string" && typeof colors.skeleton === "string"
    ? opacity.interpolate({ inputRange: [0.6, 1], outputRange: [colors.skeletonShine, colors.skeleton] })
    : colors.skeleton;
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
  const slot = (w: DimensionValue, lineRole: TypographyRole = "body", key?: number, marginTop = 0) => {
    const lineHeight = tokens.typography[lineRole].lineHeightPx * fontScale;
    return <View key={key} style={{ height: lineHeight, justifyContent: "center", marginTop }}>{block(w, lineHeight / 2)}</View>;
  };
  const paragraph = () => skeletonTextWidths(rows).map((w, i) => slot(w, "body", i));
  return (
    <View
      {...(loadingText
        // The status carries the text; iOS and Android need the label and an explicit live region.
        ? { role: "status" as const, accessible: true, accessibilityLabel: loadingText, accessibilityLiveRegion: "polite" as const }
        : { accessibilityElementsHidden: true, importantForAccessibility: "no-hide-descendants" as const })}
      style={{ width: width || "100%", overflow: "hidden" }}
    >
      {type === "text" && paragraph()}
      {type === "line" && slot("100%", role)}
      {type === "avatar" &&
        block(width || tokens.extensions.skeleton.avatarSize, height || tokens.extensions.skeleton.avatarSize, { borderRadius: rounded ? tokens.radius.radius9999 : tokens.extensions.skeleton.blockRadius })}
      {type === "card" && (
        <View style={{ padding: tokens.extensions.skeleton.padding, borderRadius: tokens.extensions.skeleton.radius, backgroundColor: colors.surface }}>
          {slot("40%", "cardTitle")}
          {slot("28%", "caption", undefined, tokens.card.subtitleGap)}
          {rows > 0 && <View style={{ marginTop: tokens.extensions.skeleton.padding }}>{paragraph()}</View>}
        </View>
      )}
      {type === "table" && (
        <View
          style={{
            borderWidth: tokens.border.defaultWidth,
            borderColor: colors.border,
            borderRadius: tokens.extensions.skeleton.blockRadius,
            overflow: "hidden",
          }}
        >
          {[0, ...count(rows)].map((row) => (
            <View
              key={row}
              style={{
                flexDirection: "row",
                backgroundColor: row === 0 ? colors.secondary : undefined,
                borderBottomWidth: row === rows ? 0 : tokens.border.defaultWidth,
                borderBottomColor: colors.border,
              }}
            >
              {count(columns).map((col) => (
                <View
                  key={col}
                  style={{
                    flex: 1,
                    paddingVertical: tokens.dimension.value12,
                    paddingHorizontal: tokens.dimension.value16,
                  }}
                >
                  {block(
                    row === 0
                      ? "70%"
                      : (
                          [
                            "45%",
                            "55%",
                            "65%",
                            "75%",
                            "85%",
                          ] as DimensionValue[]
                        )[(row + col) % 5],
                    tokens.extensions.skeleton.tableLineHeight
                  )}
                </View>
              ))}
            </View>
          ))}
        </View>
      )}
      {type === "stat" && (
        <View>
          {slot("40%", "caption")}
          {slot("64%", "displaySm", undefined, tokens.extensions.kpiRow.md.labelGap)}
          {slot("30%", "caption", undefined, tokens.extensions.kpiRow.md.descriptionGap)}
        </View>
      )}
      {type === "block" &&
        block(width || "100%", height ?? tokens.extensions.skeleton.blockHeight, { borderRadius: tokens.extensions.skeleton.blockRadius })}
    </View>
  );
}
