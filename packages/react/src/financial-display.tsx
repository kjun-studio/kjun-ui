import { tokens } from "@kjun/tokens";
import { domainColorRef } from "../../../shared/package-runtime/css-contract";
import {
useId,
type ReactNode
} from "react";
import { DsIcon } from "./button";
import { DsBadge,type DisplaySize } from "./display";
import { DsTooltip } from "./layers";
import { finiteNumber,format } from "./number-display";
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
  const n = finiteNumber(value);
  if (n === null)
    return <span style={{ color: "var(--_kjun-color-text-disabled)" }}>-</span>;
  const abs = Math.abs(n),
    signal = abs >= signalThreshold,
    neutral = abs < 0.1,
    role = neutral ? "text-secondary" : n > 0 ? "price-up" : "price-down",
    label = formatter
      ? formatter(n)
      : (n > 0 ? "+" : "") + format(n, decimals) + "%";
  // In the badge variant every value shares the badge box and the icon slot, so a column of
  // deviations keeps its digits aligned; values below the signal threshold drop only the fill and icon.
  if (variant === "badge")
    return (
      <span className="kjun-deviation-badge">
        <DsBadge variant={neutral ? "secondary" : n > 0 ? "price-up" : "price-down"} size="sm"
          style={signal ? undefined : { background: "transparent" }}>
          {label}
        </DsBadge>
        {!signal ? <span className="kjun-deviation-signal-slot" aria-hidden="true" /> : <DsTooltip
          content={`괴리율 ${signalThreshold}% 초과 — 차익거래 기회 가능`}
        >
          <span tabIndex={0} role="img" aria-label="차익거래 기회" className="kjun-deviation-signal">
            <DsIcon
              name="alert-triangle"
              size={tokens.extensions.financial.warningIconSize}
              style={{ color: "var(--_kjun-color-warning)" }}
            />
          </span>
        </DsTooltip>}
      </span>
    );
  return (
    <span
      className="kjun-deviation"
      ref={domainColorRef(!neutral)}
      data-variant={variant}
      style={{ color: `var(--_kjun-color-${role})`, fontWeight: abs >= 1 ? tokens.typography.numberLg.fontWeight : tokens.typography.control.fontWeight }}
    >
      {variant === "pill" && (
        <span
          aria-hidden="true"
          className="kjun-heat-layer"
          style={{
            background: neutral
              ? "var(--_kjun-color-secondary)"
              : `var(--_kjun-color-${role})`,
            opacity: neutral ? 1 : abs < 0.5 ? 0.08 : abs < 1 ? 0.14 : 0.22,
          }}
        />
      )}
      <span>{label}</span>
    </span>
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
  const ratio =
    max === min ? 0.5 : Math.min(1, Math.max(0, (value - min) / (max - min)));
  const role =
    mode === "price"
      ? ratio >= 0.5
        ? "price-up"
        : "price-down"
      : mode === "diverging"
      ? ratio >= 0.5
        ? "success"
        : "danger"
      : color;
  const magnitude = mode === "sequential" ? ratio : Math.abs(ratio - 0.5) * 2,
    { heatMinimum, heatMaximum } = tokens.states.opacity;
  return (
    <span className="kjun-heat-cell" ref={domainColorRef(mode === 'price')}>
      <span
        aria-hidden="true"
        className="kjun-heat-layer"
        // A zero cell keeps its shape on the neutral fill; any other value starts from a visible minimum.
        style={magnitude
          ? { background: `var(--_kjun-color-${role})`, opacity: heatMinimum + (heatMaximum - heatMinimum) * magnitude }
          : { background: "var(--_kjun-color-secondary)" }}
      />
      <span>{children ?? value}</span>
    </span>
  );
}
export interface DsProgressCellProps {
  value?: number;
  max?: number;
  showLabel?: boolean;
  color?: "auto" | "brand" | "success" | "danger" | "warning" | "custom";
  customColor?: string;
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
  const percent =
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
    <div className="kjun-progress-cell">
      <div style={{ height }}>
        <span
          style={{
            width: percent + "%",
            background:
              color === "custom" ? customColor : `var(--_kjun-color-${role})`,
          }}
        />
      </div>
      {showLabel && <span>{Math.round(percent)}%</span>}
    </div>
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
  // The heart glyph carries more inner space than the star, so it draws one icon step larger within the same box.
  const box = tokens.extensions.financial.markSizes[size],
    glyph = kind === "interest" ? tokens.extensions.financial.heartMarkSizes[size] : box;
  return (
    <DsIcon
      ref={domainColorRef(active)}
      name={kind === "favorite" ? "star" : "heart"}
      filled={active}
      size={glyph}
      style={{
        color: active ? `var(--_kjun-color-${kind})` : "var(--_kjun-color-text-tertiary)",
        margin: (box - glyph) / 2,
      }}
    />
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
  color?: string;
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
  const id = useId().replace(/:/g, ""),
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
      `var(--_kjun-color-${
        change === 0
          ? "text-tertiary"
          : semantic === "status"
          ? change > 0
            ? "success"
            : "danger"
          : change > 0
          ? "price-up"
          : "price-down"
      })`;
  return (
    <svg
      ref={domainColorRef(!color && semantic === 'price' && change !== 0)}
      width={stretch ? "100%" : width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio={stretch ? "none" : "xMidYMid meet"}
      role={ariaLabel ? "img" : undefined}
      aria-label={ariaLabel}
      aria-hidden={!ariaLabel || undefined}
      className="kjun-sparkline"
    >
      {fill && values.length > 1 && (
        <>
          <defs>
            <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={line} stopOpacity={0.3} />
              <stop offset="100%" stopColor={line} stopOpacity={0.05} />
            </linearGradient>
          </defs>
          <polygon
            points={`2,${height - 2} ${points} ${width - 2},${height - 2}`}
            fill={`url(#${id})`}
          />
        </>
      )}
      {values.length > 1 ? (
        <polyline
          points={points}
          fill="none"
          stroke={line}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeLinejoin="round"
          vectorEffect={stretch ? "non-scaling-stroke" : undefined}
        />
      ) : values.length === 1 ? (
        <circle cx={width / 2} cy={height / 2} r={2} fill={line} />
      ) : null}
    </svg>
  );
}
