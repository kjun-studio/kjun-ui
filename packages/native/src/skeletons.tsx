import { useKjunMessages } from "../../../shared/package-runtime/messages-context";
import { typeStyle } from "./typography";
import { tokens, type InputSize } from "@kjun-ui/tokens";
import { useEffect,useRef,useState,type ReactNode } from "react";
import { Animated,Platform,View,useWindowDimensions,type DimensionValue } from "react-native";
import Svg,{ Path } from "react-native-svg";
import { KjunSkeleton,KjunSpinner } from "./display";
import { KText,useReducedMotion } from "./internal";
import { useKjunStyles } from "./provider";
import { useLoadingReveal } from "../../../shared/package-runtime/use-loading-reveal";
import {
  chartDonutHole,
  chartDonutRatio,
  chartFramePath,
  chartFrameViewBox,
  chartMatrixMuted,
  chartSkeletonCount,
  chartSkeletonKind,
  type KjunChartSkeletonKind,
} from "../../../shared/package-runtime/chart-skeleton";
export interface KjunListSkeletonProps {
  rows?: number;
  variant?: "market" | "compact" | "notification";
  avatar?: boolean;
  avatarSize?: DimensionValue;
  quote?: boolean;
}
export function KjunListSkeleton({
  rows = 8,
  variant = "market",
  avatar = true,
  avatarSize = tokens.extensions.skeleton.listAvatarSize,
  quote = true,
}: KjunListSkeletonProps) {
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
            <KjunSkeleton type="avatar" width={avatarSize} height={avatarSize} />
          )}
          <View style={{ flex: 1, minWidth: 0, gap: market ? tokens.dimension.value2 : tokens.extensions.skeleton.detailGap }}>
            {slot(0, <KjunSkeleton
              type="block"
              height={tokens.extensions.skeleton.lineHeights.md}
              width={i % 2 ? "80%" : "65%"}
            />)}
            {slot(1, <KjunSkeleton type="block" height={tokens.extensions.skeleton.lineHeights.sm} width="50%" />)}
          </View>
          {quote && (
            <View style={{ alignItems: "flex-end", gap: market ? tokens.dimension.value2 : tokens.extensions.skeleton.detailGap }}>
              {slot(0, <KjunSkeleton type="block" height={tokens.extensions.skeleton.quoteHeight} width={tokens.extensions.skeleton.quoteWidth} />)}
              {slot(1, <KjunSkeleton type="block" height={tokens.extensions.skeleton.lineHeights.sm} width={tokens.extensions.skeleton.detailWidth} />)}
            </View>
          )}
        </View>
      ))}
    </View>
  );
}
export interface KjunFormSkeletonProps {
  fields?: (string | { label?: string; height?: DimensionValue })[];
  columns?: number;
  multiline?: boolean;
  size?: InputSize;
}
export function KjunFormSkeleton({
  fields = ["", "", "", ""],
  columns = 1,
  multiline = false,
  size = "md",
}: KjunFormSkeletonProps) {
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
              <KjunSkeleton type="block" height={tokens.extensions.skeleton.formLabelHeight} width={tokens.extensions.skeleton.formLabelWidth} />
            </View>
          )}
          <View style={{ borderRadius: tokens.input[size].radius, overflow: "hidden" }}>
            <KjunSkeleton
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
export interface KjunChartSkeletonProps {
  kind?: KjunChartSkeletonKind;
  height?: DimensionValue;
  loadingText?: string;
  skeleton?: boolean;
  loadingDelay?: number;
  rows?: number;
  columns?: number;
}
// React Native Web prints dataSet as data-* so the packed web contracts can find each part.
const chartPart = (name: string) => (Platform.OS === "web" ? { dataSet: { kjunChartPart: name } } : {});
export function KjunChartSkeleton({
  kind: requestedKind = "frame",
  height = tokens.extensions.chartSkeleton.height,
  loadingText,
  skeleton = true,
  loadingDelay = 0,
  rows = 8,
  columns = 14,
}: KjunChartSkeletonProps) {
  const m = useKjunMessages();
  loadingText ??= m.chartLoading;
  const kind = chartSkeletonKind(requestedKind),
    { colors } = useKjunStyles(),
    reduced = useReducedMotion(),
    opacity = useRef(new Animated.Value(1)).current,
    revealed = useLoadingReveal(true, loadingDelay),
    [measured, setMeasured] = useState(0),
    thickness = tokens.extensions.chartSkeleton.donutThickness,
    boxHeight = typeof height === "number" ? height : measured,
    hole = boxHeight > 0 ? chartDonutHole(boxHeight, thickness) : undefined,
    rowCount = chartSkeletonCount(rows),
    columnCount = chartSkeletonCount(columns),
    status = revealed && loadingText ? ("status" as const) : undefined,
    hidden = { "aria-hidden": true, importantForAccessibility: "no-hide-descendants" as const };
  useEffect(() => {
    if (reduced || !skeleton) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 0.55, duration: tokens.motion.shimmer / 2, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 1, duration: tokens.motion.shimmer / 2, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => {
      loop.stop();
      opacity.setValue(1);
    };
  }, [opacity, reduced, skeleton]);
  return (
    <Animated.View
      onLayout={typeof height === "number" ? undefined : (event) => setMeasured(event.nativeEvent.layout.height)}
      style={{ height, alignItems: "center", justifyContent: "center", width: "100%", minWidth: 0, opacity: revealed ? opacity : 0 }}
      aria-hidden={revealed ? undefined : true}
      importantForAccessibility={revealed ? undefined : "no-hide-descendants"}
      {...(Platform.OS === "web" ? { dataSet: { kjunChartKind: kind, skeleton: skeleton ? undefined : "false" } } : {})}
    >
      {!skeleton ? (
        <View {...chartPart("loading")} role={status} style={{ alignItems: "center", gap: tokens.dimension.value12 }}>
          {/* The chart's status carries the text; the spinner stays out of the accessibility tree. */}
          <View {...hidden}>
            <KjunSpinner size="md" />
          </View>
          {!!loadingText && (
            <KText style={{ ...typeStyle("body"), color: colors.textSecondary, textAlign: "center", maxWidth: "100%" }}>{loadingText}</KText>
          )}
        </View>
      ) : (
        <>
          {kind === "donut" ? (
            <View
              {...chartPart("donut")}
              {...hidden}
              style={{ height: `${chartDonutRatio * 100}%`, aspectRatio: 1, borderWidth: thickness, borderColor: colors.skeleton, borderRadius: tokens.radius.radius9999 }}
            />
          ) : kind === "matrix" ? (
            <View {...chartPart("matrix")} {...hidden} style={{ alignSelf: "stretch", flex: 1, gap: tokens.dimension.value4 }}>
              {Array.from({ length: rowCount }, (_, row) => (
                <View key={row} style={{ flex: 1, flexDirection: "row", gap: tokens.dimension.value4 }}>
                  {Array.from({ length: columnCount }, (_, column) => (
                    <View
                      key={column}
                      {...chartPart("cell")}
                      style={{
                        flex: 1,
                        borderRadius: tokens.extensions.skeleton.lineRadius,
                        backgroundColor: colors.skeleton,
                        opacity: chartMatrixMuted(row, column) ? tokens.states.opacity.pending : 1,
                      }}
                    />
                  ))}
                </View>
              ))}
            </View>
          ) : (
            <View {...chartPart("plot")} {...hidden} style={{ alignSelf: "stretch", flex: 1 }}>
              {/* Only the frame is honest before data arrives; any series shape would be invented. */}
              <Svg viewBox={chartFrameViewBox} preserveAspectRatio="none" width="100%" height="100%">
                <Path d={chartFramePath} fill="none" stroke={colors.chartGrid} strokeWidth={tokens.border.defaultWidth} vectorEffect="non-scaling-stroke" />
              </Svg>
            </View>
          )}
          {!!loadingText && (
            <View
              {...chartPart("status")}
              role={status}
              // iOS and Android do not treat role="status" as a live region; Android needs it explicitly.
              accessibilityLiveRegion={status ? "polite" : undefined}
              pointerEvents="none"
              style={{ position: "absolute", inset: 0, alignItems: "center", justifyContent: "center" }}
            >
              <KText
                style={{
                  ...typeStyle("body"),
                  paddingHorizontal: tokens.dimension.value12,
                  paddingVertical: tokens.dimension.value4,
                  borderRadius: tokens.radius.radius6,
                  borderWidth: kind === "donut" ? 0 : tokens.border.defaultWidth,
                  borderColor: colors.chartGrid,
                  backgroundColor: colors.surface,
                  color: colors.textSecondary,
                  maxWidth: kind === "donut" && hole != null ? hole : "90%",
                  textAlign: "center",
                }}
              >
                {loadingText}
              </KText>
            </View>
          )}
        </>
      )}
    </Animated.View>
  );
}
export { KjunMarketTableSkeleton } from "./market-skeleton";
export type { KjunMarketTableSkeletonProps } from "./market-skeleton";
