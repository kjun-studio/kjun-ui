import { sparklineDash, sparklineGeometry, sparklineTone, type SparkPoint } from "../../../shared/package-runtime/sparkline";
import { useKjunMessages } from "../../../shared/package-runtime/messages-context";
import { deviationLevel, tokens } from "@kjun-ui/tokens";
import { domainColorRef } from "../../../shared/package-runtime/css-contract";
import {
useId,
type ReactNode
} from "react";
import { KjunIcon } from "./button";
import { KjunBadge,type DisplaySize } from "./display";
import { KjunTooltip } from "./layers";
import { finiteNumber,format } from "./number-display";

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
  const n = finiteNumber(value);
  if (n === null)
    return <span style={{ color: "var(--_kjun-color-text-disabled)" }}>-</span>;
  const abs = Math.abs(n),
    signal = abs >= signalThreshold,
    level = deviationLevel(n),
    neutral = level === "neutral",
    role = neutral ? "text-secondary" : n > 0 ? "price-up" : "price-down",
    label = formatter
      ? formatter(n)
      : (n > 0 ? "+" : "") + format(n, decimals) + "%";
  // In the badge variant every value shares the badge box and the icon slot, so a column of
  // deviations keeps its digits aligned; values below the signal threshold drop only the fill and icon.
  if (variant === "badge")
    return (
      <span className="kjun-deviation-badge">
        <KjunBadge variant={neutral ? "secondary" : n > 0 ? "price-up" : "price-down"} size="sm"
          style={signal ? undefined : { background: "transparent" }}>
          {label}
        </KjunBadge>
        {!signal ? <span className="kjun-deviation-signal-slot" aria-hidden="true" /> : <KjunTooltip
          content={m.deviationWarning(signalThreshold)}
        >
          <span tabIndex={0} role="img" aria-label={m.arbitrage} className="kjun-deviation-signal">
            <KjunIcon
              name="alert-triangle"
              size={tokens.extensions.financial.warningIconSize}
              style={{ color: "var(--_kjun-color-warning)" }}
            />
          </span>
        </KjunTooltip>}
      </span>
    );
  return (
    <span
      className="kjun-deviation"
      ref={domainColorRef(!neutral)}
      data-variant={variant}
      style={{ color: `var(--_kjun-color-${role})`, fontWeight: level === "strong" ? tokens.typography.numberLg.fontWeight : tokens.typography.control.fontWeight }}
    >
      {variant === "pill" && (
        <span
          aria-hidden="true"
          className="kjun-heat-layer"
          style={{
            background: neutral
              ? "var(--_kjun-color-secondary)"
              : `var(--_kjun-color-${role})`,
            opacity: deviationFill[level],
          }}
        />
      )}
      <span>{label}</span>
    </span>
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
export interface KjunProgressCellProps {
  value?: number;
  max?: number;
  showLabel?: boolean;
  color?: "auto" | "brand" | "success" | "danger" | "warning" | "custom";
  customColor?: string;
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
  // The heart glyph carries more inner space than the star, so it draws one icon step larger within the same box.
  const box = tokens.extensions.financial.markSizes[size],
    glyph = kind === "interest" ? tokens.extensions.financial.heartMarkSizes[size] : box;
  return (
    <KjunIcon
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
  color?: string;
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
  const id = "kjun-" + useId().replace(/:/g, ""), spec = tokens.extensions.financial;
  const g = sparklineGeometry(data, { width, height, strokeWidth, variant, baseline, min, max, endDot });
  const line = color || `var(--_kjun-color-${sparklineTone(g.direction, semantic)})`, dash = sparklineDash();
  const points = (run: SparkPoint[]) => run.map((p) => `${p.x},${p.y}`).join(" ");
  // A stretched viewBox scales x alone, so dots become round stroke caps that keep their screen size.
  const dot = (p: SparkPoint, size: number, key?: number) => stretch
    ? <path key={key} d={`M${p.x} ${p.y}h0`} stroke={line} strokeWidth={size} strokeLinecap="round" vectorEffect="non-scaling-stroke" />
    : <circle key={key} cx={p.x} cy={p.y} r={size / 2} fill={line} />;
  return (
    <svg
      ref={domainColorRef(!color && semantic === 'price' && g.direction !== 0)}
      width={stretch ? "100%" : width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio={stretch ? "none" : "xMidYMid meet"}
      role={ariaLabel ? "img" : undefined}
      aria-label={ariaLabel}
      aria-hidden={!ariaLabel || undefined}
      className="kjun-sparkline"
      data-variant={variant}
    >
      {/* No data reads as a quiet dotted line rather than an empty box. */}
      {g.empty && <line x1={0} x2={width} y1={height / 2} y2={height / 2} stroke="var(--_kjun-color-border)" strokeWidth={strokeWidth} strokeDasharray={dash} strokeLinecap="round" />}
      {g.bars.map((bar, i) => <rect key={i} x={bar.x} y={bar.y} width={bar.width} height={bar.height} rx={Math.min(spec.sparklineBarGap, bar.width / 2)} fill={bar.last ? line : "var(--_kjun-color-border-strong)"} />)}
      {fill && g.areas.length > 0 && (
        <>
          <defs>
            <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={line} stopOpacity={tokens.states.opacity.sparklineFill} />
              <stop offset="100%" stopColor={line} stopOpacity={0} />
            </linearGradient>
          </defs>
          {g.areas.map((area, i) => <polygon key={i} points={area} fill={`url(#${id})`} />)}
        </>
      )}
      {g.baselineY != null && <line x1={0} x2={width} y1={g.baselineY} y2={g.baselineY} stroke="var(--_kjun-color-border-strong)" strokeWidth={spec.sparklineBaselineWidth} strokeDasharray={dash} vectorEffect={stretch ? "non-scaling-stroke" : undefined} />}
      {g.segments.map((run, i) => run.length > 1
        ? <polyline key={i} points={points(run)} fill="none" stroke={line} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" vectorEffect={stretch ? "non-scaling-stroke" : undefined} />
        : dot(run[0], spec.sparklineLoneDotSize, i))}
      {endDot && g.end && g.segments.some((run) => run.length > 1) && dot(g.end, spec.sparklineDotSize)}
    </svg>
  );
}
