import { tokens } from "@kjun/tokens";
import { typeStyle } from "./typography";
import { useId,type ReactNode } from "react";
import {
View,
type ColorValue
} from "react-native";
import Svg,{
Circle,
Defs,
LinearGradient,
Polygon,
Polyline,
Stop,
} from "react-native-svg";
import { DsIcon } from "./button";
import { AccessiblePressable } from "./a11y";
import { DsTooltip } from "./popover";
import { DsBadge,type DisplaySize } from "./display";
import { KText,content,domainColor } from "./internal";
import { finiteNumber,format } from "./number-display";
import { useKjunStyles } from "./provider";
export interface DsDeviationProps {
  value?: number | null;
  variant?: "pill" | "badge" | "text";
  signalThreshold?: number;
  decimals?: number;
  formatter?: (value: number) => string;
}
export function DsDeviation({
  value,
  variant = "pill",
  signalThreshold = 1,
  decimals = 2,
  formatter,
}: DsDeviationProps) {
  const { colors, domainColors, numericFontFamily, fontFamily } =
      useKjunStyles(),
    n = finiteNumber(value);
  if (n === null)
    return <KText style={{ color: colors.textDisabled }}>-</KText>;
  const abs = Math.abs(n),
    signal = abs >= signalThreshold,
    neutral = abs < 0.1,
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
        <DsBadge variant={neutral ? "secondary" : n > 0 ? "price-up" : "price-down"} size="sm"
          style={signal ? undefined : { backgroundColor: "transparent" }}>
          <KText style={{ ...typeStyle('controlSmall'), color, flexShrink: 1, minWidth: 0,
            fontFamily: numericFontFamily || fontFamily, fontVariant: ["tabular-nums"] }}>{label}</KText>
        </DsBadge>
        {!signal && <View style={{ width: tokens.extensions.financial.warningIconSize, flexShrink: 0 }} />}
        {signal && (<>
        {/* Like Web: a 24px focusable tooltip target around the 12px icon; negative margins keep the layout.
            The outer View centres it in the row, since the tooltip wrapper hugs its trigger from the top. */}
        <View style={{ alignSelf: "center" }}>
        <DsTooltip content={`괴리율 ${signalThreshold}% 초과 — 차익거래 기회 가능`}>
          <AccessiblePressable
            accessibilityRole="image"
            accessibilityLabel="차익거래 기회"
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
            <DsIcon name="alert-triangle" size={tokens.extensions.financial.warningIconSize} color={colors.warning} />
          </AccessiblePressable>
        </DsTooltip>
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
            opacity: neutral ? 1 : abs < 0.5 ? 0.08 : abs < 1 ? 0.14 : 0.22,
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
          fontWeight: abs >= 1 ? typeStyle("numberLg").fontWeight : typeStyle("control").fontWeight,
        }}
      >
        {label}
      </KText>
    </View>
  );
}
export interface DsHeatmapCellProps {
  value?: number;
  min?: number;
  max?: number;
  mode?: "diverging" | "sequential" | "price";
  color?: "brand" | "success" | "danger" | "warning";
  children?: ReactNode;
}
export function DsHeatmapCell({
  value = 0,
  min = 0,
  max = 1,
  mode = "diverging",
  color = "brand",
  children,
}: DsHeatmapCellProps) {
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
export interface DsProgressCellProps {
  value?: number;
  max?: number;
  showLabel?: boolean;
  color?: "auto" | "brand" | "success" | "danger" | "warning" | "custom";
  customColor?: ColorValue;
  height?: number;
}
export function DsProgressCell({
  value = 0,
  max = 100,
  showLabel = true,
  color = "auto",
  customColor,
  height = tokens.extensions.financial.progressHeight,
}: DsProgressCellProps) {
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
    <View
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
            textAlign: "right",
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
export interface DsCollectionMarkProps {
  kind: "favorite" | "interest";
  active?: boolean;
  size?: "sm" | "md" | "lg";
}
export function DsCollectionMark({
  kind,
  active = false,
  size = "md",
}: DsCollectionMarkProps) {
  const { colors, domainColors } = useKjunStyles();
  // Like Web: the heart draws one icon step larger within the same box to match the star optically.
  const box = tokens.extensions.financial.markSizes[size],
    glyph = kind === "interest" ? tokens.extensions.financial.heartMarkSizes[size] : box;
  return (
    <View style={{ width: box, height: box, alignItems: "center", justifyContent: "center", overflow: "visible" }}>
      <DsIcon
        name={kind === "favorite" ? "star" : "heart"}
        filled={active}
        size={glyph}
        color={active ? domainColor(domainColors, kind) : colors.textTertiary}
      />
    </View>
  );
}
export const executionStates = {
  queued: ["secondary", "대기 중"],
  starting: ["primary", "시작 중"],
  running: ["primary", "실행 중"],
  stopping: ["warning", "중단 중"],
  stopped: ["secondary", "중단됨"],
  completed: ["success", "완료"],
  completed_with_errors: ["warning", "완료 (오류)"],
  failed: ["danger", "실패"],
} as const;
export interface DsExecutionStatusBadgeProps {
  status?: string | null;
  label?: string;
  size?: DisplaySize;
}
export function DsExecutionStatusBadge({
  status,
  label,
  size = "md",
}: DsExecutionStatusBadgeProps) {
  const state = status
    ? executionStates[status as keyof typeof executionStates]
    : undefined;
  // A running job carries a dot, so it reads apart from queued at a glance.
  return (
    <DsBadge variant={state?.[0] || "secondary"} size={size} dot={status === "running"}>
      {label || state?.[1] || (status ? "알 수 없음" : "실행 이력 없음")}
    </DsBadge>
  );
}
export interface DsSparklineProps {
  data?: number[];
  width?: number;
  height?: number;
  color?: ColorValue;
  semantic?: "price" | "status";
  fill?: boolean;
  strokeWidth?: number;
  stretch?: boolean;
  ariaLabel?: string;
}
export function DsSparkline({
  data = [],
  width = tokens.extensions.financial.sparklineWidth,
  height = tokens.extensions.financial.sparklineHeight,
  color,
  semantic = "price",
  fill = true,
  strokeWidth = 1.5,
  stretch = false,
  ariaLabel,
}: DsSparklineProps) {
  const { colors, domainColors } = useKjunStyles(),
    id = useId().replace(/:/g, ""),
    values = data.filter(Number.isFinite),
    min = Math.min(...values),
    max = Math.max(...values),
    range = max - min || 1,
    points = values
      .map(
        (v, i) =>
          `${2 + (i / Math.max(1, values.length - 1)) * (width - 4)},${
            2 + height - 4 - ((v - min) / range) * (height - 4)
          }`
      )
      .join(" "),
    change = values.length > 1 ? values[values.length - 1] - values[0] : 0,
    line =
      color ||
      (change === 0
        ? colors.textTertiary
        : semantic === "status"
        ? change > 0
          ? colors.success
          : colors.danger
        : domainColor(domainColors, change > 0 ? "priceUp" : "priceDown"));
  return (
    <Svg
      width={stretch ? "100%" : width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio={stretch ? "none" : "xMidYMid meet"}
      accessibilityRole={ariaLabel ? "image" : undefined}
      accessibilityLabel={ariaLabel}
      accessible={!!ariaLabel}
    >
      {fill && values.length > 1 && (
        <>
          <Defs>
            <LinearGradient id={id} x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0%" stopColor={line} stopOpacity={0.3} />
              <Stop offset="100%" stopColor={line} stopOpacity={0.05} />
            </LinearGradient>
          </Defs>
          <Polygon
            points={`2,${height - 2} ${points} ${width - 2},${height - 2}`}
            fill={`url(#${id})`}
          />
        </>
      )}
      {values.length > 1 ? (
        <Polyline
          points={points}
          fill="none"
          stroke={line}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeLinejoin="round"
          vectorEffect={stretch ? "non-scaling-stroke" : undefined}
        />
      ) : values.length === 1 ? (
        <Circle cx={width / 2} cy={height / 2} r={2} fill={line} />
      ) : null}
    </Svg>
  );
}
