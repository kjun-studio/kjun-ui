import { sparklineDash, sparklineGeometry, sparklineLabel, sparklineTone, type SparkPoint, type SparklineData } from "../../../shared/package-runtime/sparkline";
import { useKjunMessages } from "../../../shared/package-runtime/messages-context";
import { tokens } from "@kjun-ui/tokens";
import { deviationText } from "../../../shared/package-runtime/signed-number";
import { domainColorRef } from "../../../shared/package-runtime/css-contract";
import { progressMarker, progressMarkerInset } from "../../../shared/package-runtime/progress-marker";
import { heatCell, progressCellState, type HeatCellColor, type HeatCellMode, type ProgressCellColor } from "../../../shared/package-runtime/data-cells";
import {
useId,
type CSSProperties,
type ReactNode
} from "react";
import { KjunIcon } from "./button";
import { KjunBadge,type DisplaySize } from "./display";
import { KjunTooltip } from "./layers";
import { signedText } from "./number-display";

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
  const shown = deviationText(value, decimals, formatter);
  if (shown === null)
    return <span className="kjun-deviation" data-variant={variant === "badge" ? undefined : variant} data-missing="" style={{ color: "var(--_kjun-color-text-disabled)" }}>—</span>;
  const { label, direction, level, abs } = shown,
    signal = abs >= signalThreshold,
    neutral = level === "neutral",
    role = neutral ? "text-secondary" : direction > 0 ? "price-up" : "price-down";
  // In the badge variant every value shares the badge box and the icon slot, so a column of
  // deviations keeps its digits aligned; values below the signal threshold drop only the fill and icon.
  if (variant === "badge")
    return (
      <span className="kjun-deviation-badge">
        <KjunBadge variant={neutral ? "secondary" : direction > 0 ? "price-up" : "price-down"} size="sm"
          style={signal ? undefined : { background: "transparent" }}>
          {signedText(label)}
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
      <span>{signedText(label)}</span>
    </span>
  );
}
export interface KjunHeatmapCellProps {
  /** null or a number that is not finite shows a dash on no fill. */
  value?: number | null;
  min?: number;
  max?: number;
  /** Where diverging and price cells change side (default the middle of min and max). Both sides share one scale. */
  center?: number;
  mode?: HeatCellMode;
  color?: HeatCellColor;
  children?: ReactNode;
}
export function KjunHeatmapCell({
  value = 0,
  min = 0,
  max = 1,
  center,
  mode = "diverging",
  color = "brand",
  children,
}: KjunHeatmapCellProps) {
  const cell = heatCell(value, min, max, mode, color, center);
  // A missing value keeps the cell's neutral fill, so a grid keeps its rhythm, and shows a dash.
  if (cell.missing) return <span className="kjun-heat-cell" data-missing=""><span aria-hidden="true" className="kjun-heat-layer" style={{ background: "var(--_kjun-color-secondary)" }} /><span>—</span></span>;
  return (
    <span className="kjun-heat-cell" ref={domainColorRef(mode === 'price')}>
      <span
        aria-hidden="true"
        className="kjun-heat-layer"
        // A cell at the centre keeps its shape on the neutral fill; any other value starts from a visible minimum.
        style={cell.magnitude
          ? { background: `var(--_kjun-color-${cell.role})`, opacity: cell.opacity }
          : { background: "var(--_kjun-color-secondary)" }}
      />
      <span>{signedText(children ?? value)}</span>
    </span>
  );
}
export interface KjunProgressCellProps {
  value?: number;
  max?: number;
  showLabel?: boolean;
  /** "custom" (or customColor alone) takes customColor; without one "custom" falls back to the auto colours. */
  color?: ProgressCellColor;
  customColor?: string;
  height?: number;
  /** Shown and read in place of the rounded percent, e.g. "12/20건"; the bar's length still comes from value and max. */
  valueText?: string;
  /** The bar's name for screen readers, e.g. the row's name ("A팀 진척"). */
  ariaLabel?: string;
  /** A reference point across the bar on the value's own scale (0 to max), such as today's share of a budget. */
  marker?: number;
  /** Read by screen readers as the bar's description, e.g. "오늘 기준 53%". */
  markerLabel?: string;
}
export function KjunProgressCell({
  value = 0,
  max = 100,
  showLabel = true,
  color = "auto",
  customColor,
  height = tokens.extensions.financial.progressHeight,
  valueText,
  ariaLabel,
  marker,
  markerLabel,
}: KjunProgressCellProps) {
  const mark = progressMarker(marker, max), markerId = "kjun-progress-marker-" + useId().replace(/:/g, "");
  const { percent, rounded, role, custom } = progressCellState(value, max, color, customColor);
  return (
    <div className="kjun-progress-cell">
      {/* The bar is a progressbar, so its value reaches screen readers also without the visible label. */}
      <div style={{ height }} role="progressbar" aria-label={ariaLabel} aria-valuemin={0} aria-valuemax={100} aria-valuenow={rounded}
        aria-valuetext={valueText} data-marker={mark != null || undefined} aria-describedby={mark != null && markerLabel ? markerId : undefined}>
        <span style={{ width: percent + "%", background: custom ?? `var(--_kjun-color-${role})` }} />
        {mark != null && <span className="kjun-progress-marker" aria-hidden="true" style={{ left: `calc(${mark}% - ${progressMarkerInset(mark)}px)` }} />}
        {mark != null && markerLabel && <span id={markerId} hidden>{markerLabel}</span>}
      </div>
      {showLabel && <span aria-hidden="true">{valueText ?? rounded + "%"}</span>}
    </div>
  );
}
export interface KjunCollectionMarkProps {
  kind: "favorite" | "interest";
  active?: boolean;
  size?: "sm" | "md" | "lg";
  /** What an active mark says to a screen reader (default "즐겨찾기" or "관심"). An inactive mark stays hidden. */
  label?: string;
}
export function KjunCollectionMark({
  kind,
  active = false,
  size = "md",
  label,
}: KjunCollectionMarkProps) {
  const m = useKjunMessages();
  // The heart glyph carries more inner space than the star, so it draws one icon step larger within the same box.
  const box = tokens.extensions.financial.markSizes[size],
    glyph = kind === "interest" ? tokens.extensions.financial.heartMarkSizes[size] : box;
  return (
    <KjunIcon
      ref={domainColorRef(active)}
      name={kind === "favorite" ? "star" : "heart"}
      filled={active}
      size={glyph}
      ariaLabel={active ? label || (kind === "favorite" ? m.favoriteMark : m.interestMark) : undefined}
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
  /** Values in time order. null, undefined and non-finite numbers are gaps: the line breaks there. */
  data?: SparklineData;
  width?: number;
  height?: number;
  color?: string;
  semantic?: "price" | "status";
  /** "line" (default) draws the trend; "bar" draws each value as a bar from the baseline (or zero), values below it hanging down; the last bar takes the direction color and the others stay quiet. */
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
  /** Names the chart for screen readers; without it the chart is decorative. With no data, the no-data message follows it. */
  ariaLabel?: string;
  className?: string;
  style?: CSSProperties;
  id?: string;
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
  className,
  style,
  id,
}: KjunSparklineProps) {
  const gradient = "kjun-" + useId().replace(/:/g, ""), spec = tokens.extensions.financial, m = useKjunMessages();
  const g = sparklineGeometry(data, { width, height, strokeWidth, variant, baseline, min, max, endDot });
  const line = color || `var(--_kjun-color-${sparklineTone(g.direction, semantic)})`, dash = sparklineDash(), label = sparklineLabel(ariaLabel, g.empty, m.noData);
  const scale = stretch ? "non-scaling-stroke" : undefined;
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
      role={label ? "img" : undefined}
      aria-label={label}
      aria-hidden={!label || undefined}
      id={id}
      className={"kjun-sparkline" + (className ? " " + className : "")}
      style={style}
      data-variant={variant}
    >
      {/* No data reads as a quiet dotted line rather than an empty box. */}
      {g.empty && <line x1={0} x2={width} y1={height / 2} y2={height / 2} stroke="var(--_kjun-color-border)" strokeWidth={strokeWidth} strokeDasharray={dash} strokeLinecap="round" vectorEffect={scale} />}
      {/* Stretched bars stay square: a stretched viewBox would pull a corner radius into an ellipse. */}
      {g.bars.map((bar, i) => <rect key={i} x={bar.x} y={bar.y} width={bar.width} height={bar.height} rx={stretch ? 0 : Math.min(spec.sparklineBarGap, bar.width / 2)} fill={bar.last ? line : "var(--_kjun-color-border)"} />)}
      {fill && g.areas.length > 0 && (
        <>
          <defs>
            <linearGradient id={gradient} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={line} stopOpacity={tokens.states.opacity.sparklineFill} />
              <stop offset="100%" stopColor={line} stopOpacity={0} />
            </linearGradient>
          </defs>
          {g.areas.map((area, i) => <polygon key={i} points={area} fill={`url(#${gradient})`} />)}
        </>
      )}
      {g.baselineY != null && <line x1={0} x2={width} y1={g.baselineY} y2={g.baselineY} stroke="var(--_kjun-color-border-strong)" strokeWidth={spec.sparklineBaselineWidth} strokeDasharray={dash} vectorEffect={scale} />}
      {g.segments.map((run, i) => run.length > 1
        ? <polyline key={i} points={points(run)} fill="none" stroke={line} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" vectorEffect={scale} />
        : dot(run[0], spec.sparklineLoneDotSize, i))}
      {endDot && g.end && g.segments.some((run) => run.length > 1) && dot(g.end, spec.sparklineDotSize)}
    </svg>
  );
}
