import { useKjunMessages } from "../../../shared/package-runtime/messages-context";
import { typeStyle } from "./typography";
import { tokens, type InputSize } from "@kjun-ui/tokens";
import { useState } from "react";
import { Animated,Platform,View,useWindowDimensions,type DimensionValue } from "react-native";
import Svg,{ Path } from "react-native-svg";
import { KjunSkeleton,KjunSpinner } from "./display";
import { KText,useReducedMotion } from "./internal";
import { useSkeletonPulse } from "./skeleton-clock";
import { useKjunStyles } from "./provider";
import { useLoadingReveal } from "../../../shared/package-runtime/use-loading-reveal";
import {
  chartDonutRatio,
  chartFrameDefaults,
  chartFramePath,
  chartFrameStops,
  chartFrameViewBox,
  chartMatrixMuted,
  chartSkeletonCount,
  chartSkeletonKind,
  chartTickShift,
  type KjunChartSkeletonKind,
} from "../../../shared/package-runtime/chart-skeleton";
export interface KjunListSkeletonProps {
  rows?: number;
  /** "row" is the silhouette of KjunListRow: title and description lines, a text-start divider, no avatar unless asked. */
  variant?: "market" | "compact" | "notification" | "row";
  avatar?: boolean;
  avatarSize?: DimensionValue;
  quote?: boolean;
  /** Row variant: draws the description line (default true). */
  description?: boolean;
  /** Row variant: what ends the row, a value (default), a switch or a chevron; quote={false} leaves it empty. */
  trailing?: "value" | "switch" | "chevron";
  /** Announces loading to screen readers (a status); the skeleton itself stays silent. */
  loadingText?: string;
}
// A skeleton is hidden from assistive technology unless it carries loading text, which it then announces politely.
const skeletonStatus = (loadingText?: string) => loadingText
  ? { role: "status" as const, accessible: true, accessibilityLabel: loadingText, accessibilityLiveRegion: "polite" as const }
  : { accessibilityElementsHidden: true, importantForAccessibility: "no-hide-descendants" as const };
export function KjunListSkeleton({
  rows = 8,
  variant = "market",
  avatar,
  avatarSize = tokens.extensions.skeleton.listAvatarSize,
  quote = true,
  description = true,
  trailing = "value",
  loadingText,
}: KjunListSkeletonProps) {
  const { colors } = useKjunStyles();
  const window = useWindowDimensions();
  if (variant === "row") return (
    <View {...skeletonStatus(loadingText)}>
      <ListRowSkeleton rows={rows} avatar={avatar ?? false} avatarSize={avatarSize} description={description}
        trailing={quote ? trailing : undefined} divider={colors.divider} />
    </View>
  );
  const sk = tokens.extensions.skeleton;
  // Market rows follow simple-list market rows (like Web): 16px all round, 14/20 with a minimum height on narrow
  // screens. Every variant puts its bars in the name and meta line boxes.
  const market = variant === "market", narrow = market && window.width < tokens.responsive.market;
  const roles = narrow ? (["input", "body"] as const) : (["label", "caption"] as const);
  return (
    <View {...skeletonStatus(loadingText)}>
      {Array.from({ length: rows }, (_, i) => (
        <View
          key={i}
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: sk.gap,
            minHeight: market ? (narrow ? tokens.extensions.marketList.minimumHeight : undefined) : sk.listHeights[variant],
            paddingVertical: market ? (narrow ? tokens.dimension.value14 : tokens.dimension.value16) : sk.list[variant].paddingY,
            paddingHorizontal: market ? (narrow ? tokens.dimension.value20 : tokens.dimension.value16) : sk.list[variant].paddingX,
            borderBottomWidth: tokens.border.defaultWidth,
            borderBottomColor: colors.border,
          }}
        >
          {(avatar ?? true) && <KjunSkeleton type="avatar" width={avatarSize} height={avatarSize} />}
          <View style={{ flex: 1, minWidth: 0, gap: market ? tokens.dimension.value2 : sk.detailGap }}>
            <KjunSkeleton type="line" role={roles[0]} width={i % 2 ? "80%" : "65%"} />
            <KjunSkeleton type="line" role={roles[1]} width="50%" />
          </View>
          {quote && (
            <View style={{ alignItems: "flex-end", gap: market ? tokens.dimension.value2 : sk.detailGap }}>
              <KjunSkeleton type="line" role={roles[0]} width={sk.quoteWidth} />
              <KjunSkeleton type="line" role={roles[1]} width={sk.detailWidth} />
            </View>
          )}
        </View>
      ))}
    </View>
  );
}
// Like Web: KjunListRow's own geometry, bars in the title and description line boxes, a text-start divider.
function ListRowSkeleton({ rows, avatar, avatarSize, description, trailing, divider }: {
  rows: number; avatar: boolean; avatarSize: DimensionValue; description: boolean; trailing?: "value" | "switch" | "chevron"; divider: KjunListDivider;
}) {
  const list = tokens.extensions.list;
  const inset = list.padding + (avatar ? list.leadingWidth + list.gap : 0);
  return (
    <>
      {Array.from({ length: rows }, (_, i) => (
        <View key={i} style={{ flexDirection: "row", alignItems: "center", gap: list.gap, minHeight: list.minimumHeight, padding: list.padding }}>
          {avatar ? <View style={{ width: list.leadingWidth, alignItems: "center" }}><KjunSkeleton type="avatar" width={avatarSize} height={avatarSize} /></View> : null}
          <View style={{ flex: 1, minWidth: 0, gap: list.descriptionGap }}>
            <KjunSkeleton type="line" role="control" width={i % 2 ? "55%" : "40%"} />
            {description ? <KjunSkeleton type="line" role="caption" width="30%" /> : null}
          </View>
          {trailing === "switch" ? <KjunSkeleton type="avatar" width={tokens.extensions.switch.widths.md} height={tokens.extensions.switch.heights.md} />
            : trailing ? <KjunSkeleton type="line" role="control" width={trailing === "chevron" ? tokens.iconSizes.default : tokens.extensions.skeleton.detailWidth} />
            : null}
          {i < rows - 1 ? <View style={{ position: "absolute", left: inset, right: 0, bottom: 0, height: tokens.border.defaultWidth, backgroundColor: divider }} /> : null}
        </View>
      ))}
    </>
  );
}
type KjunListDivider = ReturnType<typeof useKjunStyles>["colors"]["divider"];
export interface KjunFormSkeletonProps {
  fields?: (string | { label?: string; height?: DimensionValue })[];
  columns?: number;
  multiline?: boolean;
  size?: InputSize;
  /** Announces loading to screen readers (a status); the skeleton itself stays silent. */
  loadingText?: string;
}
export function KjunFormSkeleton({
  fields = ["", "", "", ""],
  columns = 1,
  multiline = false,
  size = "md",
  loadingText,
}: KjunFormSkeletonProps) {
  const { colors } = useKjunStyles();
  const window = useWindowDimensions();
  const twoColumns = columns === 2 && window.width >= tokens.responsive.formColumns;
  return (
    <View
      {...skeletonStatus(loadingText)}
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
            // The bar sits in the label's line box so the field starts where the real input will.
            <KjunSkeleton type="line" role="label" width={tokens.extensions.skeleton.formLabelWidth} />
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
  /** Frame: horizontal grid lines of the app's chart, top to baseline (default 5). */
  gridLines?: number;
  /** Frame: x-axis tick labels (default 6). */
  xTicks?: number;
  /** Frame: y-axis label width (default 40); label bars fill it, less the label gap. */
  axisWidth?: number;
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
  gridLines = chartFrameDefaults.gridLines,
  xTicks = chartFrameDefaults.xTicks,
  axisWidth = tokens.extensions.chartSkeleton.axisWidth,
}: KjunChartSkeletonProps) {
  const m = useKjunMessages();
  loadingText ??= m.chartLoading;
  const kind = chartSkeletonKind(requestedKind),
    { colors } = useKjunStyles(),
    reduced = useReducedMotion(),
    revealed = useLoadingReveal(true, loadingDelay),
    spec = tokens.extensions.chartSkeleton,
    caption = tokens.typography.caption.lineHeightPx,
    labels = spec.labelGap + caption,
    axis = Math.max(0, axisWidth),
    rowCount = chartSkeletonCount(rows),
    columnCount = chartSkeletonCount(columns),
    status = revealed && loadingText ? ("status" as const) : undefined,
    [frameWidth, setFrameWidth] = useState(0),
    // Like Web: tick bars narrow when ticks crowd the plot, so an end bar keeps a label gap from its neighbour.
    step = frameWidth > 0 ? (frameWidth - axis) / (chartFrameStops(xTicks).length - 1) : Infinity,
    tickWidth = Math.max(0, Math.min(spec.tickLabelWidth, ((step - spec.labelGap) * 2) / 3));
  // The shared skeleton pulse (1 → 0.6) dims the chart's skeleton parts to 0.55, like Web.
  const pulse = useSkeletonPulse(!reduced && skeleton),
    opacity = pulse ? pulse.interpolate({ inputRange: [0.6, 1], outputRange: [tokens.states.opacity.pending, 1] }) : 1;
  // Like Web: only the skeleton-coloured parts pulse; the grid holds still.
  const label = (style: object, key: string) => (
    <Animated.View key={key} {...chartPart("label")}
      style={{ position: "absolute", height: caption / 2, borderRadius: tokens.extensions.skeleton.lineRadius, backgroundColor: colors.skeleton, opacity, ...style }} />
  );
  return (
    <View
      style={{ height, width: "100%", minWidth: 0, opacity: revealed ? 1 : 0, justifyContent: skeleton ? undefined : "center", alignItems: skeleton ? undefined : "center" }}
      aria-hidden={revealed ? undefined : true}
      importantForAccessibility={revealed ? undefined : "no-hide-descendants"}
      {...(Platform.OS === "web" ? { dataSet: { kjunChartKind: kind, skeleton: skeleton ? undefined : "false" } } : {})}
    >
      {!skeleton ? (
        <View {...chartPart("loading")} role={status} style={{ alignItems: "center", gap: tokens.dimension.value12 }}>
          {/* The chart's status carries the text; the spinner stays out of the accessibility tree. */}
          <View aria-hidden importantForAccessibility="no-hide-descendants">
            <KjunSpinner size="md" />
          </View>
          {!!loadingText && (
            <KText style={{ ...typeStyle("body"), color: colors.textSecondary, textAlign: "center", maxWidth: "100%" }}>{loadingText}</KText>
          )}
        </View>
      ) : (
        <>
          <View aria-hidden importantForAccessibility="no-hide-descendants" style={{ flex: 1, minHeight: 0, alignItems: "center", justifyContent: "center" }}>
            {kind === "donut" ? (
              <Animated.View
                {...chartPart("donut")}
                style={{ height: `${chartDonutRatio * 100}%`, aspectRatio: 1, borderWidth: spec.donutThickness, borderColor: colors.skeleton, borderRadius: tokens.radius.radius9999, opacity }}
              />
            ) : kind === "matrix" ? (
              <Animated.View {...chartPart("matrix")} style={{ alignSelf: "stretch", flex: 1, gap: tokens.dimension.value4, opacity }}>
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
              </Animated.View>
            ) : (
              <View style={{ position: "absolute", top: 0, right: 0, bottom: 0, left: 0 }} onLayout={(event) => setFrameWidth(event.nativeEvent.layout.width)}>
                {/* Only the app's frame is honest before data arrives; any series shape would be invented. */}
                <View {...chartPart("plot")} aria-hidden style={{ position: "absolute", top: 0, right: 0, bottom: labels, left: axis }}>
                  <Svg viewBox={chartFrameViewBox} preserveAspectRatio="none" width="100%" height="100%" style={{ overflow: "visible" }}>
                    <Path d={chartFramePath(gridLines)} fill="none" stroke={colors.chartGrid} strokeWidth={tokens.border.defaultWidth} vectorEffect="non-scaling-stroke" />
                  </Svg>
                </View>
                {axis > 0 && (
                  <View style={{ position: "absolute", top: 0, bottom: labels, left: 0, width: axis - spec.labelGap }}>
                    {chartFrameStops(gridLines).map((stop) => label({ top: `${stop * 100}%`, marginTop: -caption / 4, left: 0, right: 0 }, "y" + stop))}
                  </View>
                )}
                <View style={{ position: "absolute", bottom: caption / 4, height: caption / 2, left: axis, right: 0 }}>
                  {chartFrameStops(xTicks).map((stop) =>
                    label({ top: 0, left: `${stop * 100}%`, width: tickWidth, marginLeft: (chartTickShift(stop) / 100) * tickWidth }, "x" + stop))}
                </View>
              </View>
            )}
          </View>
          {!!loadingText && (
            <View
              {...chartPart("status")}
              role={status}
              // iOS and Android do not treat role="status" as a live region; Android needs it explicitly.
              accessibilityLiveRegion={status ? "polite" : undefined}
              style={{ marginTop: spec.labelGap }}
            >
              <KText style={{ ...typeStyle("caption"), color: colors.textTertiary }}>{loadingText}</KText>
            </View>
          )}
        </>
      )}
    </View>
  );
}
export { KjunMarketTableSkeleton } from "./market-skeleton";
export type { KjunMarketTableSkeletonProps } from "./market-skeleton";
