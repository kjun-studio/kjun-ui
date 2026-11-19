import { useKjunMessages } from "../../../shared/package-runtime/messages-context";
import { typeStyle } from "./typography";
import { tokens, type InputSize } from "@kjun-ui/tokens";
import { useContext, useState } from "react";
import { ListShapeContext } from "./list-context";
import { listRowMetrics } from "../../../shared/package-runtime/list-row";
import { listRowBleed } from "../../../shared/package-runtime/list-leading";
import { Animated,Platform,StyleSheet,View,useWindowDimensions,type DimensionValue,type StyleProp,type ViewStyle } from "react-native";
import Svg,{ Path } from "react-native-svg";
import { KjunSkeleton,KjunSpinner } from "./display";
import { KText,useReducedMotion } from "./internal";
import { skeletonFill, skeletonStatus, useSkeletonPulse } from "./skeleton-clock";
import { skeletonActionWidths, skeletonCount, skeletonRowWidths, skeletonWidthScale } from "../../../shared/package-runtime/skeleton-text";
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
  /** Default: ListRow's sm leading square (32) for the row variant, the market avatar (36) otherwise. */
  avatarSize?: DimensionValue;
  quote?: boolean;
  /** Row variant: draws the description line (default true). */
  description?: boolean;
  /** Row variant: what ends the row, a value (default), a switch or a chevron; quote={false} leaves it empty. */
  trailing?: "value" | "switch" | "chevron";
  /** Announces loading to screen readers (a status); the skeleton itself stays silent. */
  loadingText?: string;
  style?: StyleProp<ViewStyle>;
}
export function KjunListSkeleton({
  rows = 8,
  variant = "market",
  avatar,
  avatarSize: ownAvatarSize,
  quote = true,
  description = true,
  trailing = "value",
  loadingText,
  style,
}: KjunListSkeletonProps) {
  const { colors } = useKjunStyles();
  const window = useWindowDimensions();
  // The row silhouette takes ListRow's default leading square (sm, 32px, in the 40px column); other variants keep the market avatar.
  const avatarSize = ownAvatarSize ?? (variant === "row" ? tokens.extensions.list.leadingSizes.sm : tokens.extensions.skeleton.listAvatarSize);
  if (variant === "row") return (
    <View {...skeletonStatus(loadingText)} style={style}>
      <ListRowSkeleton rows={skeletonCount(rows)} avatar={avatar ?? false} avatarSize={avatarSize} description={description}
        trailing={quote ? trailing : undefined} divider={colors.divider} />
    </View>
  );
  const sk = tokens.extensions.skeleton;
  // Market rows follow simple-list market rows (like Web): 16px all round, 14/20 with a minimum height on narrow
  // screens. Every variant puts its bars in the name and meta line boxes.
  const market = variant === "market", narrow = market && window.width < tokens.responsive.market;
  const roles = narrow ? (["input", "body"] as const) : (["label", "caption"] as const);
  return (
    <View {...skeletonStatus(loadingText)} style={style}>
      {Array.from({ length: skeletonCount(rows) }, (_, i) => (
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
            <KjunSkeleton type="line" role={roles[0]} width={skeletonRowWidths(i, true).title} />
            <KjunSkeleton type="line" role={roles[1]} width={skeletonRowWidths(i, true).detail} />
          </View>
          {quote && (
            <View style={{ alignItems: "flex-end", gap: market ? tokens.dimension.value2 : sk.detailGap }}>
              <KjunSkeleton type="line" role={roles[0]} width={sk.quoteWidth * skeletonWidthScale(i)} />
              <KjunSkeleton type="line" role={roles[1]} width={sk.detailWidth * skeletonWidthScale(i + 2)} />
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
  const list = tokens.extensions.list, o = list.open, { open, compact } = useContext(ListShapeContext), m = listRowMetrics({ open, compact });
  const inset = list.padding + (avatar ? list.leadingWidth + list.gap : 0);
  // Like Web: in an open KjunListSection the rows take the open row's shape (larger lines, a rounded leading square,
  // inset from the edges, no dividers), and in a compact one the compact row's height.
  const shape = { gap: m.gap, minHeight: m.minimumHeight, paddingVertical: m.paddingY, paddingHorizontal: m.paddingX, ...(open ? { marginHorizontal: o.rowInset } : {}) };
  // Like ListRow: without a description the leading square and a switch reach into the padding, keeping the minimum height.
  const bleed = description ? {} : { marginVertical: listRowBleed(m.paddingY) };
  return (
    <>
      {Array.from({ length: rows }, (_, i) => (
        <View key={i} style={{ flexDirection: "row", alignItems: "center", ...shape }}>
          {avatar ? open ? <View style={{ width: o.leadingSize, height: o.leadingSize, borderRadius: o.leadingRadius, overflow: "hidden", ...bleed }}><KjunSkeleton type="block" width={o.leadingSize} height={o.leadingSize} /></View>
            : <View style={{ width: list.leadingWidth, alignItems: "center", ...bleed }}><KjunSkeleton type="avatar" width={avatarSize} height={avatarSize} /></View> : null}
          <View style={{ flex: 1, minWidth: 0, gap: list.descriptionGap }}>
            <KjunSkeleton type="line" role={open ? m.title : "control"} width={skeletonRowWidths(i).title} />
            {description ? <KjunSkeleton type="line" role={m.description} width={skeletonRowWidths(i).detail} /> : null}
          </View>
          {trailing === "switch" ? <View style={bleed}><KjunSkeleton type="avatar" width={tokens.extensions.switch.widths.md} height={tokens.extensions.switch.heights.md} /></View>
            : trailing ? <KjunSkeleton type="line" role="control" width={trailing === "chevron" ? tokens.iconSizes.default : tokens.extensions.skeleton.detailWidth * skeletonWidthScale(i)} />
            : null}
          {i < rows - 1 && !open ? <View style={{ position: "absolute", left: inset, right: 0, bottom: 0, height: tokens.border.defaultWidth, backgroundColor: divider }} /> : null}
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
  /** Like Web: bars for a FormActions row under the fields at the size's button height; the last is the primary button. */
  actions?: number;
  /** Announces loading to screen readers (a status); the skeleton itself stays silent. */
  loadingText?: string;
  style?: StyleProp<ViewStyle>;
}
export function KjunFormSkeleton({
  fields = ["", "", "", ""],
  columns = 1,
  multiline = false,
  size = "md",
  actions = 0,
  loadingText,
  style,
}: KjunFormSkeletonProps) {
  const { colors } = useKjunStyles();
  const sk = tokens.extensions.skeleton, actionWidths = skeletonActionWidths(actions, sk.actionWidth, sk.primaryActionWidth);
  const window = useWindowDimensions();
  const twoColumns = columns === 2 && window.width >= tokens.responsive.formColumns;
  return (
    <View
      {...skeletonStatus(loadingText)}
      style={[{
        flexDirection: twoColumns ? "row" : "column",
        flexWrap: twoColumns ? "wrap" : "nowrap",
        gap: tokens.extensions.skeleton.formGap,
      }, style]}
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
            <KjunSkeleton type="line" role="label" width={tokens.extensions.skeleton.formLabelWidth * skeletonWidthScale(i)} />
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
      {actionWidths.length > 0 && (
        // Like Web: a FormActions row under every column, end-aligned, at the size's button radius.
        <View style={{ width: "100%", flexDirection: "row", justifyContent: "flex-end", gap: tokens.modal.actionsGap }}>
          {actionWidths.map((w, i) => (
            <View key={i} style={{ width: w, borderRadius: tokens.button.radii[size], overflow: "hidden" }}>
              <KjunSkeleton type="block" height={tokens.button.heights[size]} />
            </View>
          ))}
        </View>
      )}
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
  /** Merged over the root's height and reveal styles. */
  style?: StyleProp<ViewStyle>;
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
  style,
}: KjunChartSkeletonProps) {
  const m = useKjunMessages();
  loadingText ??= m.chartLoading;
  const kind = chartSkeletonKind(requestedKind),
    { colors } = useKjunStyles(),
    reduced = useReducedMotion(),
    revealed = useLoadingReveal(true, loadingDelay),
    spec = tokens.extensions.chartSkeleton,
    caption = tokens.typography.caption.lineHeightPx,
    fill = StyleSheet.absoluteFill,
    labels = spec.labelGap + caption,
    axis = Math.max(0, axisWidth),
    rowCount = chartSkeletonCount(rows),
    columnCount = chartSkeletonCount(columns),
    status = revealed && loadingText ? ("status" as const) : undefined,
    [frameWidth, setFrameWidth] = useState(0),
    // Like Web: tick bars narrow when ticks crowd the plot, so an end bar keeps a label gap from its neighbour.
    step = frameWidth > 0 ? (frameWidth - axis) / (chartFrameStops(xTicks).length - 1) : Infinity,
    tickWidth = Math.max(0, Math.min(spec.tickLabelWidth, ((step - spec.labelGap) * 2) / 3));
  // Like Web and every other skeleton: the parts pulse towards the shine colour, never towards transparent.
  const color = skeletonFill(useSkeletonPulse(!reduced && skeleton), colors);
  // Like Web: only the skeleton-coloured parts pulse; the grid holds still.
  const label = (style: object, key: string) => (
    <Animated.View key={key} {...chartPart("label")}
      style={{ position: "absolute", height: caption / 2, borderRadius: tokens.extensions.skeleton.lineRadius, backgroundColor: color, ...style }} />
  );
  return (
    <View
      style={[{ height, width: "100%", minWidth: 0, justifyContent: skeleton ? undefined : "center", alignItems: skeleton ? undefined : "center" }, style, { opacity: revealed ? 1 : 0 }]}
      aria-hidden={revealed ? undefined : true}
      importantForAccessibility={revealed ? undefined : "no-hide-descendants"}
      {...(Platform.OS === "web" ? { dataSet: { kjunChartKind: kind, skeleton: skeleton ? undefined : "false" } } : {})}
    >
      {!skeleton ? (
        // Like the skeleton's status below: iOS and Android need the live region explicitly.
        <View {...chartPart("loading")} role={status} accessibilityLiveRegion={status ? "polite" : undefined} style={{ alignItems: "center", gap: tokens.dimension.value12 }}>
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
                style={{ height: `${chartDonutRatio * 100}%`, aspectRatio: 1, borderWidth: spec.donutThickness, borderColor: color, borderRadius: tokens.radius.radius9999 }}
              />
            ) : kind === "matrix" ? (
              <View {...chartPart("matrix")} style={{ alignSelf: "stretch", flex: 1, gap: tokens.dimension.value4 }}>
                {Array.from({ length: rowCount }, (_, row) => (
                  <View key={row} style={{ flex: 1, flexDirection: "row", gap: tokens.dimension.value4 }}>
                    {Array.from({ length: columnCount }, (_, column) => (
                      <Animated.View
                        key={column}
                        {...chartPart("cell")}
                        style={{
                          flex: 1,
                          borderRadius: tokens.extensions.skeleton.lineRadius,
                          backgroundColor: color,
                          opacity: chartMatrixMuted(row, column) ? tokens.states.opacity.pending : 1,
                        }}
                      />
                    ))}
                  </View>
                ))}
              </View>
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
          {/* Like Web: announced, not drawn. A caption would shorten the plot and move the grid lines when the chart arrives. */}
          {!!loadingText && (
            <View
              {...chartPart("status")}
              role={status}
              // iOS and Android do not treat role="status" as a live region; Android needs it explicitly.
              accessibilityLiveRegion={status ? "polite" : undefined}
              pointerEvents="none"
              style={[fill, { opacity: 0 }]}
            >
              <KText style={typeStyle("caption")}>{loadingText}</KText>
            </View>
          )}
        </>
      )}
    </View>
  );
}
export { KjunMarketTableSkeleton } from "./market-skeleton";
export type { KjunMarketTableSkeletonProps } from "./market-skeleton";
