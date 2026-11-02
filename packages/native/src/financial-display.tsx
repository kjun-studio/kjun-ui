import { sparklineDash, sparklineGeometry, sparklineTone, type SparkPoint } from "../../../shared/package-runtime/sparkline";
import { useKjunMessages } from "../../../shared/package-runtime/messages-context";
import { deviationLevel, tokens } from "@kjun-ui/tokens";
import { typeStyle } from "./typography";
import { useId,type ReactNode } from "react";
import {
View,
type ColorValue
} from "react-native";
import Svg,{
Circle,
Defs,
Line,
Path,
LinearGradient,
Polygon,
Polyline,
Rect,
Stop,
} from "react-native-svg";
import { KjunIcon } from "./button";
import { AccessiblePressable } from "./a11y";
import { KjunTooltip } from "./popover";
import { KjunBadge,type DisplaySize } from "./display";
import { KText,content,domainColor } from "./internal";
import { finiteNumber,format } from "./number-display";
import { useKjunStyles } from "./provider";

// Fill strength of a non-neutral deviation step.
const deviationFill = { neutral: 1, low: tokens.states.opacity.deviationLow, medium: tokens.states.opacity.deviationMedium, strong: tokens.states.opacity.deviationStrong };
export interface KjunDeviationProps {
  value?: number | null;
  variant?: "pill" | "badge" | "text";
  signalThreshold?: number;
  decimals?: number;
  formatter?: (value: number) => string;
}
export function KjunDeviation({
  value,
  variant = "pill",
  signalThreshold = 1,
  decimals = 2,
  formatter,
}: KjunDeviationProps) {
  const m = useKjunMessages();
  const { colors, domainColors, numericFontFamily, fontFamily } =
      useKjunStyles(),
    n = finiteNumber(value);
  if (n === null)
    return <KText style={{ color: colors.textDisabled }}>-</KText>;
  const abs = Math.abs(n),
    signal = abs >= signalThreshold,
    level = deviationLevel(n),
    neutral = level === "neutral",
    color = neutral
      ? colors.textSecondary
      : domainColor(domainColors, n > 0 ? "priceUp" : "priceDown"),
    label = formatter
      ? formatter(n)
      : (n > 0 ? "+" : "") + format(n, decimals) + "%";
  // Like Web: in the badge variant every value shares the badge box and the icon slot, so a column keeps
  // its digits aligned; values below the signal threshold drop only the fill and icon.
  if (variant === "badge")
    return (
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "flex-end",
          gap: tokens.extensions.financial.badgeGap,
        }}
      >
        <KjunBadge variant={neutral ? "secondary" : n > 0 ? "price-up" : "price-down"} size="sm"
          style={signal ? undefined : { backgroundColor: "transparent" }}>
          <KText style={{ ...typeStyle('controlSmall'), color, flexShrink: 1, minWidth: 0,
            fontFamily: numericFontFamily || fontFamily, fontVariant: ["tabular-nums"] }}>{label}</KText>
        </KjunBadge>
        {!signal && <View style={{ width: tokens.extensions.financial.warningIconSize, flexShrink: 0 }} />}
        {signal && (<>
        {/* Like Web: a 24px focusable tooltip target around the 12px icon; negative margins keep the layout.
            The outer View centres it in the row, since the tooltip wrapper hugs its trigger from the top. */}
        <View style={{ alignSelf: "center" }}>
        <KjunTooltip content={m.deviationWarning(signalThreshold)}>
          <AccessiblePressable
            accessibilityRole="image"
            accessibilityLabel={m.arbitrage}
            focusRingInset
            focusRingRadius={tokens.radius.radius4}
            style={{
              width: tokens.extensions.financial.warningTargetSize,
              height: tokens.extensions.financial.warningTargetSize,
              margin: (tokens.extensions.financial.warningIconSize - tokens.extensions.financial.warningTargetSize) / 2,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <KjunIcon name="alert-triangle" size={tokens.extensions.financial.warningIconSize} color={colors.warning} />
          </AccessiblePressable>
        </KjunTooltip>
        </View>
        </>)}
      </View>
    );
  return (
    <View
      style={{
        alignSelf: "flex-start",
        position: "relative",
        borderRadius: tokens.extensions.financial.cellRadius,
        paddingVertical: variant === "pill" ? tokens.extensions.financial.pillPaddingY : 0,
        paddingHorizontal: variant === "pill" ? tokens.extensions.financial.pillPaddingX : 0,
      }}
    >
      {variant === "pill" && (
        <View
          pointerEvents="none"
          style={{
            position: "absolute",
            inset: 0,
            borderRadius: tokens.extensions.financial.cellRadius,
            backgroundColor: neutral ? colors.secondary : color,
            opacity: deviationFill[level],
          }}
        />
      )}
      <KText
        style={{
          color,
          fontFamily: numericFontFamily || fontFamily,
          fontVariant: ["tabular-nums"],
          ...typeStyle('body'),
          // Like Web: control weight, stronger once the deviation reaches 1%.
          fontWeight: level === "strong" ? typeStyle("numberLg").fontWeight : typeStyle("control").fontWeight,
        }}
      >
        {label}
      </KText>
    </View>
  );
}
export interface KjunHeatmapCellProps {
  value?: number;
  min?: number;
  max?: number;
  mode?: "diverging" | "sequential" | "price";
  color?: "brand" | "success" | "danger" | "warning";
  children?: ReactNode;
}
export function KjunHeatmapCell({
  value = 0,
  min = 0,
  max = 1,
  mode = "diverging",
  color = "brand",
  children,
}: KjunHeatmapCellProps) {
  const { colors, domainColors, numericFontFamily, fontFamily } =
      useKjunStyles(),
    ratio =
      max === min ? 0.5 : Math.min(1, Math.max(0, (value - min) / (max - min)));
  const background =
    mode === "price"
      ? domainColor(domainColors, ratio >= 0.5 ? "priceUp" : "priceDown")
      : mode === "diverging"
      ? ratio >= 0.5
        ? colors.success
        : colors.danger
      : colors[color];
  const magnitude = mode === "sequential" ? ratio : Math.abs(ratio - 0.5) * 2;
  return (
    <View
      style={{
        position: "relative",
        alignSelf: "flex-start",
        paddingVertical: tokens.extensions.financial.pillPaddingY,
        paddingHorizontal: tokens.extensions.financial.pillPaddingX,
        borderRadius: tokens.extensions.financial.cellRadius,
      }}
    >
      <View
        pointerEvents="none"
        style={{
          position: "absolute",
          inset: 0,
          borderRadius: tokens.extensions.financial.cellRadius,
          // A zero cell keeps its shape on the neutral fill; any other value starts from a visible minimum.
          backgroundColor: magnitude ? background : colors.secondary,
          opacity: magnitude ? tokens.states.opacity.heatMinimum + (tokens.states.opacity.heatMaximum - tokens.states.opacity.heatMinimum) * magnitude : 1,
        }}
      />
      {content(children ?? value, {
        fontFamily: numericFontFamily || fontFamily,
        fontVariant: ["tabular-nums"],
      })}
    </View>
  );
}
export interface KjunProgressCellProps {
  value?: number;
  max?: number;
  showLabel?: boolean;
  color?: "auto" | "brand" | "success" | "danger" | "warning" | "custom";
  customColor?: ColorValue;
  height?: number;
}
export function KjunProgressCell({
  value = 0,
  max = 100,
  showLabel = true,
  color = "auto",
  customColor,
  height = tokens.extensions.financial.progressHeight,
}: KjunProgressCellProps) {
  const { colors, numericFontFamily, fontFamily } = useKjunStyles(),
    percent =
      max > 0 && Number.isFinite(value)
        ? Math.min(100, Math.max(0, (value / max) * 100))
        : 0,
    role =
      color === "auto"
        ? percent < 30
          ? "danger"
          : percent < 70
          ? "warning"
          : "success"
        : color;
  return (
    // One progressbar with its value, so screen readers hear it also without the visible label.
    <View
      accessible
      accessibilityRole="progressbar"
      accessibilityValue={{ min: 0, max: 100, now: Math.round(percent) }}
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: tokens.extensions.financial.progressGap,
        minWidth: tokens.extensions.financial.progressMinimumWidth,
      }}
    >
      <View
        style={{
          height,
          flex: 1,
          backgroundColor: colors.tertiary,
          borderRadius: tokens.extensions.financial.progressRadius,
          overflow: "hidden",
        }}
      >
        <View
          style={{
            width: `${percent}%`,
            height: "100%",
            borderRadius: tokens.extensions.financial.progressRadius,
            backgroundColor:
              color === "custom"
                ? customColor
                : colors[role as keyof typeof colors],
          }}
        />
      </View>
      {showLabel && (
        <KText
          style={{
            ...typeStyle('caption'),
            color: colors.textSecondary,
            minWidth: tokens.extensions.financial.progressLabelWidth,
            // Like Web: the value sits beside its bar; the fixed width keeps every bar the same length.
            textAlign: "left",
            fontFamily: numericFontFamily || fontFamily,
            fontVariant: ["tabular-nums"],
          }}
        >
          {Math.round(percent)}%
        </KText>
      )}
    </View>
  );
}
export interface KjunCollectionMarkProps {
  kind: "favorite" | "interest";
  active?: boolean;
  size?: "sm" | "md" | "lg";
}
export function KjunCollectionMark({
  kind,
  active = false,
  size = "md",
}: KjunCollectionMarkProps) {
  const { colors, domainColors } = useKjunStyles();
  // Like Web: the heart draws one icon step larger within the same box to match the star optically.
  const box = tokens.extensions.financial.markSizes[size],
    glyph = kind === "interest" ? tokens.extensions.financial.heartMarkSizes[size] : box;
  return (
    <View style={{ width: box, height: box, alignItems: "center", justifyContent: "center", overflow: "visible" }}>
      <KjunIcon
        name={kind === "favorite" ? "star" : "heart"}
        filled={active}
        size={glyph}
        color={active ? domainColor(domainColors, kind) : colors.textTertiary}
      />
    </View>
  );
}
export const executionStates = {
  queued: ["secondary", "statusQueued"],
  starting: ["primary", "statusStarting"],
  running: ["primary", "statusRunning"],
  stopping: ["warning", "statusStopping"],
  stopped: ["secondary", "statusStopped"],
  completed: ["success", "statusCompleted"],
  completed_with_errors: ["warning", "statusCompletedWithErrors"],
  failed: ["danger", "statusFailed"],
} as const;
export interface KjunExecutionStatusBadgeProps {
  status?: string | null;
  label?: string;
  size?: DisplaySize;
}
export function KjunExecutionStatusBadge({
  status,
  label,
  size = "md",
}: KjunExecutionStatusBadgeProps) {
  const m = useKjunMessages();
  const state = status
    ? executionStates[status as keyof typeof executionStates]
    : undefined;
  // A running job carries a dot, so it reads apart from queued at a glance.
  return (
    <KjunBadge variant={state?.[0] || "secondary"} size={size} dot={status === "running"}>
      {label || (state ? m[state[1]] : undefined) || (status ? m.statusUnknown : m.statusNoRuns)}
    </KjunBadge>
  );
}
export interface KjunSparklineProps {
  data?: number[];
  width?: number;
  height?: number;
  color?: ColorValue;
  semantic?: "price" | "status";
  /** "line" (default) draws the trend; "bar" draws each value as a bar from the baseline (or zero), values below it hanging down; the last bar takes the direction color. */
  variant?: "line" | "bar";
  fill?: boolean;
  strokeWidth?: number;
  stretch?: boolean;
  /** Reference value (a previous close): a dotted line, the direction color and the area are measured from it. */
  baseline?: number;
  /** Fixed vertical range, so small moves stay small and rows share one scale. */
  min?: number;
  max?: number;
  /** Marks the last value with a dot (line variant; default true). */
  endDot?: boolean;
  ariaLabel?: string;
}
export function KjunSparkline({
  data = [],
  width = tokens.extensions.financial.sparklineWidth,
  height = tokens.extensions.financial.sparklineHeight,
  color,
  semantic = "price",
  variant = "line",
  fill = true,
  strokeWidth = tokens.extensions.financial.sparklineStrokeWidth,
  stretch = false,
  baseline,
  min,
  max,
  endDot = true,
  ariaLabel,
}: KjunSparklineProps) {
  const { colors, domainColors } = useKjunStyles(), id = "kjun-" + useId().replace(/:/g, ""), spec = tokens.extensions.financial;
  const g = sparklineGeometry(data, { width, height, strokeWidth, variant, baseline, min, max, endDot });
  const tone = sparklineTone(g.direction, semantic);
  const line = color || (tone === "price-up" ? domainColor(domainColors, "priceUp") : tone === "price-down" ? domainColor(domainColors, "priceDown")
    : { "text-tertiary": colors.textTertiary, success: colors.success, danger: colors.danger }[tone]);
  const dash = sparklineDash(), scale = stretch ? "non-scaling-stroke" : undefined;
  const dot = (p: SparkPoint, size: number, key?: number) => stretch
    ? <Path key={key} d={`M${p.x} ${p.y}h0`} stroke={line} strokeWidth={size} strokeLinecap="round" vectorEffect="non-scaling-stroke" />
    : <Circle key={key} cx={p.x} cy={p.y} r={size / 2} fill={line} />;
  // Like Web: an empty series is a quiet dotted line; bars grow from the baseline or zero; stretched dots stay round.
  return (
    <Svg width={stretch ? "100%" : width} height={height} viewBox={`0 0 ${width} ${height}`} preserveAspectRatio={stretch ? "none" : "xMidYMid meet"}
      accessibilityRole={ariaLabel ? "image" : undefined} accessibilityLabel={ariaLabel} accessible={!!ariaLabel}>
      {g.empty && <Line x1={0} x2={width} y1={height / 2} y2={height / 2} stroke={colors.border} strokeWidth={strokeWidth} strokeDasharray={dash} strokeLinecap="round" />}
      {g.bars.map((bar, i) => <Rect key={i} x={bar.x} y={bar.y} width={bar.width} height={bar.height} rx={Math.min(spec.sparklineBarGap, bar.width / 2)} fill={bar.last ? line : colors.borderStrong} />)}
      {fill && g.areas.length > 0 && <>
        <Defs>
          <LinearGradient id={id} x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0%" stopColor={line} stopOpacity={tokens.states.opacity.sparklineFill} />
            <Stop offset="100%" stopColor={line} stopOpacity={0} />
          </LinearGradient>
        </Defs>
        {g.areas.map((area, i) => <Polygon key={i} points={area} fill={`url(#${id})`} />)}
      </>}
      {g.baselineY != null && <Line x1={0} x2={width} y1={g.baselineY} y2={g.baselineY} stroke={colors.borderStrong} strokeWidth={spec.sparklineBaselineWidth} strokeDasharray={dash} vectorEffect={scale} />}
      {g.segments.map((run, i) => run.length > 1
        ? <Polyline key={i} points={run.map((p) => `${p.x},${p.y}`).join(" ")} fill="none" stroke={line} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" vectorEffect={scale} />
        : dot(run[0], spec.sparklineLoneDotSize, i))}
      {endDot && g.end && g.segments.some((run) => run.length > 1) && dot(g.end, spec.sparklineDotSize)}
    </Svg>
  );
}
