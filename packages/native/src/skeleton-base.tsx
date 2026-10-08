import { tokens } from "@kjun-ui/tokens";
import { useEffect,useRef } from "react";
import {
Animated,
View,
type DimensionValue,
type ViewStyle
} from "react-native";
import { useReducedMotion } from "./internal";
import { useKjunStyles } from "./provider";

export interface DsSkeletonProps {
  type?: "text" | "avatar" | "card" | "table" | "chart" | "stat" | "block";
  rows?: number;
  columns?: number;
  height?: DimensionValue;
  width?: DimensionValue;
  animated?: boolean;
  rounded?: boolean;
}
export function DsSkeleton({
  type = "text",
  rows = 3,
  columns = 4,
  height,
  width,
  animated = true,
  rounded = true,
}: DsSkeletonProps) {
  const { colors } = useKjunStyles(),
    reduced = useReducedMotion(),
    opacity = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    if (!animated || reduced) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 0.6,
          duration: tokens.motion.shimmer / 2,
          useNativeDriver: false,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: tokens.motion.shimmer / 2,
          useNativeDriver: false,
        }),
      ])
    );
    loop.start();
    return () => {
      loop.stop();
      opacity.setValue(1);
    };
  }, [animated, reduced, opacity]);
  const shimmer = typeof colors.skeletonShine === "string" && typeof colors.skeleton === "string"
    ? opacity.interpolate({ inputRange: [0.6, 1], outputRange: [colors.skeletonShine, colors.skeleton] })
    : colors.skeleton;
  const block = (
    w: DimensionValue,
    h: DimensionValue = 16,
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
  const line = (w: DimensionValue, key: number, h = tokens.extensions.skeleton.lineHeights.md) => (
    <View key={key} style={{ marginBottom: key === rows ? 0 : tokens.extensions.skeleton.gap }}>
      {block(w, h)}
    </View>
  );
  const frame: ViewStyle = {
    padding: tokens.extensions.skeleton.padding,
    borderWidth: tokens.border.defaultWidth,
    borderColor: colors.border,
    borderRadius: tokens.extensions.skeleton.radius,
    backgroundColor: colors.background,
  };
  return (
    <Animated.View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={{ width: width || "100%", overflow: "hidden" }}
    >
      {type === "text" &&
        count(rows).map((i) =>
          line(
            i === rows
              ? "60%"
              : (["100%", "90%", "80%", "70%", "60%"] as DimensionValue[])[
                  i % 5
                ],
            i
          )
        )}
      {type === "avatar" &&
        block(width || tokens.extensions.skeleton.avatarSize, height || tokens.extensions.skeleton.avatarSize, { borderRadius: rounded ? tokens.radius.radius9999 : tokens.extensions.skeleton.blockRadius })}
      {type === "card" && (
        <View style={frame}>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: tokens.extensions.skeleton.gap,
              marginBottom: tokens.dimension.value16,
            }}
          >
            {block(tokens.extensions.skeleton.cardAvatarSize, tokens.extensions.skeleton.cardAvatarSize, { borderRadius: tokens.radius.radius9999 })}
            <View style={{ flex: 1, gap: tokens.dimension.value8 }}>
              {block("60%")}
              {block("40%", tokens.extensions.skeleton.lineHeights.sm)}
            </View>
          </View>
          <View style={{ gap: tokens.dimension.value10 }}>
            {block("100%")}
            {block("80%")}
            {block("60%")}
          </View>
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
      {type === "chart" && (
        <View style={[frame, { height: height || tokens.extensions.skeleton.chartHeight }]}>
          <View
            style={{
              flex: 1,
              flexDirection: "row",
              alignItems: "flex-end",
              justifyContent: "space-around",
              gap: tokens.extensions.skeleton.gap,
              // Bars stand on the axis line, like ChartSkeleton.
            }}
          >
            {[40, 65, 50, 80, 60, 90, 75].map((h, i) => (
              <Animated.View
                key={i}
                style={{
                  flex: 1,
                  maxWidth: tokens.extensions.skeleton.chartBarMaxWidth,
                  height: `${h}%`,
                  backgroundColor: shimmer,
                  borderTopLeftRadius: tokens.radius.radius4,
                  borderTopRightRadius: tokens.radius.radius4,
                }}
              />
            ))}
          </View>
          {block("100%", tokens.extensions.skeleton.chartAxisHeight, { backgroundColor: colors.border })}
        </View>
      )}
      {type === "stat" && (
        <View
          style={[
            frame,
            {
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
            },
          ]}
        >
          <View style={{ flex: 1, gap: tokens.dimension.value8 }}>
            {block("40%", tokens.extensions.skeleton.lineHeights.sm)}
            {block("60%", tokens.extensions.skeleton.lineHeights.lg)}
            {block("30%", tokens.extensions.skeleton.lineHeights.sm)}
          </View>
          {block(tokens.extensions.skeleton.statWidth, tokens.extensions.skeleton.statHeight)}
        </View>
      )}
      {type === "block" &&
        block(width || "100%", height ?? tokens.extensions.skeleton.blockHeight, { borderRadius: tokens.extensions.skeleton.blockRadius })}
    </Animated.View>
  );
}
