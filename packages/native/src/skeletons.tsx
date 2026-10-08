import { typeStyle } from "./typography";
import { tokens, type InputSize } from "@kjun-ui/tokens";
import { Fragment,useEffect,useRef,type ReactNode } from "react";
import { Animated,View,useWindowDimensions,type DimensionValue } from "react-native";
import Svg,{ G,Path,Rect } from "react-native-svg";
import { DsSkeleton } from "./display";
import { KText,useReducedMotion } from "./internal";
import { useKjunStyles } from "./provider";
export interface DsListSkeletonProps {
  rows?: number;
  variant?: "market" | "compact" | "notification";
  avatar?: boolean;
  avatarSize?: DimensionValue;
  quote?: boolean;
}
export function DsListSkeleton({
  rows = 8,
  variant = "market",
  avatar = true,
  avatarSize = tokens.extensions.skeleton.listAvatarSize,
  quote = true,
}: DsListSkeletonProps) {
  const { colors } = useKjunStyles();
  // Market rows follow simple-list market rows (like Web): 16px all round, 14/20 with a minimum height on
  // narrow screens, and bars centred in the name and meta line slots.
  const market = variant === "market", narrow = useWindowDimensions().width < tokens.responsive.market;
  const slots = market ? [typeStyle(narrow ? "input" : "label").lineHeight, typeStyle(narrow ? "body" : "caption").lineHeight] : null;
  const slot = (index: number, child: ReactNode) => slots ? <View style={{ height: slots[index], justifyContent: "center" }}>{child}</View> : child;
  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      {Array.from({ length: rows }, (_, i) => (
        <View
          key={i}
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: tokens.extensions.skeleton.gap,
            minHeight: market ? (narrow ? tokens.extensions.marketList.minimumHeight : undefined) : tokens.extensions.skeleton.listHeights[variant],
            paddingVertical: market ? (narrow ? tokens.dimension.value14 : tokens.dimension.value16) : tokens.extensions.skeleton.list[variant].paddingY,
            paddingHorizontal: market ? (narrow ? tokens.dimension.value20 : tokens.dimension.value16) : tokens.extensions.skeleton.list[variant].paddingX,
            borderBottomWidth: tokens.border.defaultWidth,
            borderBottomColor: colors.border,
          }}
        >
          {avatar && (
            <DsSkeleton type="avatar" width={avatarSize} height={avatarSize} />
          )}
          <View style={{ flex: 1, minWidth: 0, gap: market ? tokens.dimension.value2 : tokens.extensions.skeleton.detailGap }}>
            {slot(0, <DsSkeleton
              type="block"
              height={tokens.extensions.skeleton.lineHeights.md}
              width={i % 2 ? "80%" : "65%"}
            />)}
            {slot(1, <DsSkeleton type="block" height={tokens.extensions.skeleton.lineHeights.sm} width="50%" />)}
          </View>
          {quote && (
            <View style={{ alignItems: "flex-end", gap: market ? tokens.dimension.value2 : tokens.extensions.skeleton.detailGap }}>
              {slot(0, <DsSkeleton type="block" height={tokens.extensions.skeleton.quoteHeight} width={tokens.extensions.skeleton.quoteWidth} />)}
              {slot(1, <DsSkeleton type="block" height={tokens.extensions.skeleton.lineHeights.sm} width={tokens.extensions.skeleton.detailWidth} />)}
            </View>
          )}
        </View>
      ))}
    </View>
  );
}
export interface DsFormSkeletonProps {
  fields?: (string | { label?: string; height?: DimensionValue })[];
  columns?: number;
  multiline?: boolean;
  size?: InputSize;
}
export function DsFormSkeleton({
  fields = ["", "", "", ""],
  columns = 1,
  multiline = false,
  size = "md",
}: DsFormSkeletonProps) {
  const { colors } = useKjunStyles();
  const window = useWindowDimensions();
  const twoColumns = columns === 2 && window.width >= tokens.responsive.formColumns;
  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={{
        flexDirection: twoColumns ? "row" : "column",
        flexWrap: twoColumns ? "wrap" : "nowrap",
        gap: tokens.extensions.skeleton.formGap,
      }}
    >
      {fields.map((field, i) => (
        <View
          key={i}
          style={{
            gap: tokens.extensions.skeleton.fieldGap,
            minWidth: 0,
            flexBasis: twoColumns ? "45%" : undefined,
            flexGrow: 1,
          }}
        >
          {field ? (
            <KText style={{ color: colors.text, ...typeStyle('label'),  }}>
              {typeof field === "string" ? field : field.label}
            </KText>
          ) : (
            // The bar sits in a label-line slot so the field starts where the real input will.
            <View style={{ height: typeStyle('label').lineHeight, justifyContent: "center" }}>
              <DsSkeleton type="block" height={tokens.extensions.skeleton.formLabelHeight} width={tokens.extensions.skeleton.formLabelWidth} />
            </View>
          )}
          <View style={{ borderRadius: tokens.input[size].radius, overflow: "hidden" }}>
            <DsSkeleton
              type="block"
              height={
                typeof field === "object" && field.height != null
                  ? field.height
                  : multiline
                  ? tokens.input[size].lineHeight * 3 + tokens.input[size].textareaPaddingY * 2 + 2 * tokens.border.controlWidth
                  : tokens.input[size].height
              }
            />
          </View>
        </View>
      ))}
    </View>
  );
}
export interface DsChartSkeletonProps {
  loadingText?: string;
  kind?: "grid" | "line" | "bar" | "donut" | "candle" | "matrix";
  height?: DimensionValue;
}
export function DsChartSkeleton({
  loadingText = "차트를 불러오는 중",
  kind = "line",
  height = tokens.extensions.chartSkeleton.height,
}: DsChartSkeletonProps) {
  const { colors } = useKjunStyles(),
    reduced = useReducedMotion(),
    opacity = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    if (reduced) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 0.55,
          duration: tokens.motion.shimmer / 2,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: tokens.motion.shimmer / 2,
          useNativeDriver: true,
        }),
      ])
    );
    loop.start();
    return () => {
      loop.stop();
      opacity.setValue(1);
    };
  }, [opacity, reduced]);
  return (
    <Animated.View
      style={{
        height,
        alignItems: "center",
        justifyContent: "center",
        width: "100%",
        minWidth: 0,
        opacity,
      }}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      {kind === "donut" ? (
        <View
          style={{
            height: "80%",
            aspectRatio: 1,
            borderWidth: tokens.extensions.chartSkeleton.donutThickness,
            borderColor: colors.skeleton,
            borderRadius: tokens.radius.radius9999,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <DsSkeleton type="block" width={tokens.extensions.chartSkeleton.donutLabelWidth} height={tokens.extensions.chartSkeleton.donutLabelHeight} />
        </View>
      ) : (
        <Svg
          viewBox="0 0 600 240"
          preserveAspectRatio="none"
          width="100%"
          height="100%"
        >
          <Path
            d="M20 10V220H590 M20 65H590 M20 120H590 M20 175H590"
            fill="none"
            stroke={colors.border}
            strokeWidth={1}
          />
          {/* A line kind previews its series; grid keeps only the axes. */}
          {kind === "line" && (
            <Path d="M20 190 L100 160 L180 172 L260 120 L340 140 L420 96 L500 110 L590 64" fill="none" stroke={colors.skeleton} strokeWidth={4} strokeLinecap="round" strokeLinejoin="round" />
          )}
          {kind === "matrix"
            ? Array.from({ length: 8 }, (_, row) => (
                <G key={row}>
                  {Array.from({ length: 14 }, (_, col) => (
                    <Rect
                      key={col}
                      x={24 + col * 40}
                      y={12 + row * 26}
                      width={36}
                      height={22}
                      rx={2}
                      fill={colors.skeleton}
                      opacity={(row + col + 2) % 3 === 0 ? 0.55 : 1}
                    />
                  ))}
                </G>
              ))
            : (kind === "bar" || kind === "candle") &&
              [60, 100, 85, 140, 110, 165, 180].map((h, i) => (
                <Fragment key={i}>
                  {kind === "candle" && (
                    <Path
                      // The wick extends 15 past each end of the body and stays above the axis.
                      d={`M${55 + i * 75} ${195 - h}V${225 - h / 2}`}
                      fill="none"
                      stroke={colors.skeleton}
                      strokeWidth={4}
                    />
                  )}
                  <Rect
                    x={35 + i * 75}
                    // Bars stand on the axis (y 220); candle bodies float within their wick.
                    y={kind === "candle" ? 210 - h : 220 - h}
                    width={kind === "candle" ? 28 : 42}
                    height={kind === "candle" ? h / 2 : h}
                    rx={3}
                    fill={colors.skeleton}
                  />
                </Fragment>
              ))}
        </Svg>
      )}
      <View pointerEvents="none" style={{ position:"absolute", inset:0, alignItems:"center", justifyContent:"center", gap:tokens.dimension.value12 }}>
        {!!loadingText && <KText style={{ ...typeStyle('body'),  paddingHorizontal:tokens.dimension.value12, paddingVertical:tokens.dimension.value4, borderRadius:tokens.radius.radius6, backgroundColor:colors.surface, color:colors.textSecondary, maxWidth:"90%", textAlign:"center" }}>{loadingText}</KText>}
      </View>
    </Animated.View>
  );
}
export { DsMarketTableSkeleton } from "./market-skeleton";
export type { DsMarketTableSkeletonProps } from "./market-skeleton";
