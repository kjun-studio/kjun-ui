import { sparklineDash, sparklineGeometry, sparklineLabel, sparklineTone, type SparkPoint, type SparklineData } from "../../../shared/package-runtime/sparkline";
import { useKjunMessages } from "./runtime/messages";
import { type ExtractPublicPropTypes, type PropType, type SlotsType, type VNodeChild } from "vue";
import { defineComponent } from "./runtime/component";
import { tokens } from "@kjun-ui/tokens";
import { deviationText } from "../../../shared/package-runtime/signed-number";
import { progressMarker, progressMarkerInset } from "../../../shared/package-runtime/progress-marker";
import { heatCell, progressCellState, type HeatCellColor, type HeatCellMode, type ProgressCellColor } from "../../../shared/package-runtime/data-cells";
import { KjunIcon } from "./button";
import { KjunBadge, type DisplaySize } from "./display";
import { useKjunId } from "./input";
import { signedText } from "./number-display";
import { KjunTooltip } from "./popover";
import { domainRef } from "./runtime/refs";
import { css } from "./runtime/style";

// Fill strength of a non-neutral deviation step.
const deviationFill = { neutral: 1, low: tokens.states.opacity.deviationLow, medium: tokens.states.opacity.deviationMedium, strong: tokens.states.opacity.deviationStrong };

const kjunDeviationProps = {
  value: { type: Number as PropType<number | null>, default: undefined },
  variant: { type: String as PropType<"pill" | "badge" | "text">, default: "pill" },
  signalThreshold: { type: Number, default: 1 },
  decimals: { type: Number, default: 2 },
  formatter: { type: Function as PropType<(value: number) => string>, default: undefined },
} as const;
export type KjunDeviationProps = ExtractPublicPropTypes<typeof kjunDeviationProps>;
export const KjunDeviation = defineComponent({
  name: "KjunDeviation",
  props: kjunDeviationProps,
  setup(props) {
    const m = useKjunMessages();
    return () => {
      const shown = deviationText(props.value, props.decimals, props.formatter);
      if (shown === null) return <span class="kjun-deviation" data-variant={props.variant === "badge" ? undefined : props.variant} data-missing=""
        style={{ color: "var(--_kjun-color-text-disabled)" }}>—</span>;
      const { label, direction, level, abs } = shown, signal = abs >= props.signalThreshold, neutral = level === "neutral";
      const role = neutral ? "text-secondary" : direction > 0 ? "price-up" : "price-down";
      // In the badge variant every value shares the badge box and the icon slot, so a column of
      // deviations keeps its digits aligned; values below the signal threshold drop only the fill and icon.
      if (props.variant === "badge") return (
        <span class="kjun-deviation-badge">
          <KjunBadge variant={neutral ? "secondary" : direction > 0 ? "price-up" : "price-down"} size="sm" style={signal ? undefined : { background: "transparent" }}>{signedText(label)}</KjunBadge>
          {!signal ? <span class="kjun-deviation-signal-slot" aria-hidden="true" /> : (
            <KjunTooltip content={m.value.deviationWarning(props.signalThreshold)}>
              <span tabindex={0} role="img" aria-label={m.value.arbitrage} class="kjun-deviation-signal">
                <KjunIcon name="alert-triangle" size={tokens.extensions.financial.warningIconSize} style={{ color: "var(--_kjun-color-warning)" }} />
              </span>
            </KjunTooltip>
          )}
        </span>
      );
      return (
        <span class="kjun-deviation" ref={domainRef(!neutral)} data-variant={props.variant}
          style={{ color: `var(--_kjun-color-${role})`, fontWeight: level === "strong" ? tokens.typography.numberLg.fontWeight : tokens.typography.control.fontWeight }}>
          {props.variant === "pill" && (
            <span aria-hidden="true" class="kjun-heat-layer" style={{
              background: neutral ? "var(--_kjun-color-secondary)" : `var(--_kjun-color-${role})`,
              opacity: deviationFill[level],
            }} />
          )}
          <span>{signedText(label)}</span>
        </span>
      );
    };
  },
});

const kjunHeatmapCellProps = {
  /** null or a number that is not finite shows a dash on no fill. */
  value: { type: [Number, null] as PropType<number | null>, default: 0 },
  min: { type: Number, default: 0 },
  max: { type: Number, default: 1 },
  /** Where diverging and price cells change side (default the middle of min and max). Both sides share one scale. */
  center: { type: Number, default: undefined },
  mode: { type: String as PropType<HeatCellMode>, default: "diverging" },
  color: { type: String as PropType<HeatCellColor>, default: "brand" },
} as const;
export type KjunHeatmapCellProps = ExtractPublicPropTypes<typeof kjunHeatmapCellProps>;
/** Default slot replaces the shown value. */
export const KjunHeatmapCell = defineComponent({
  name: "KjunHeatmapCell",
  props: kjunHeatmapCellProps,
  slots: Object as SlotsType<{ default?: () => VNodeChild }>,
  setup(props, { slots }) {
    return () => {
      const cell = heatCell(props.value, props.min, props.max, props.mode, props.color, props.center);
      // A missing value keeps the cell's neutral fill, so a grid keeps its rhythm, and shows a dash.
      if (cell.missing) return <span class="kjun-heat-cell" data-missing=""><span aria-hidden="true" class="kjun-heat-layer" style={{ background: "var(--_kjun-color-secondary)" }} /><span>—</span></span>;
      return (
        <span class="kjun-heat-cell" ref={domainRef(props.mode === "price")}>
          {/* A cell at the centre keeps its shape on the neutral fill; any other value starts from a visible minimum. */}
          <span aria-hidden="true" class="kjun-heat-layer" style={cell.magnitude
            ? { background: `var(--_kjun-color-${cell.role})`, opacity: cell.opacity }
            : { background: "var(--_kjun-color-secondary)" }} />
          <span>{slots.default ? slots.default() : signedText(props.value)}</span>
        </span>
      );
    };
  },
});

const kjunProgressCellProps = {
  value: { type: Number, default: 0 },
  max: { type: Number, default: 100 },
  showLabel: { type: Boolean, default: true },
  /** "custom" (or customColor alone) takes customColor; without one "custom" falls back to the auto colours. */
  color: { type: String as PropType<ProgressCellColor>, default: "auto" },
  customColor: { type: String, default: undefined },
  height: { type: Number, default: tokens.extensions.financial.progressHeight },
  /** Shown and read in place of the rounded percent, e.g. "12/20건"; the bar's length still comes from value and max. */
  valueText: { type: String, default: undefined },
  /** The bar's name for screen readers, e.g. the row's name ("A팀 진척"). */
  ariaLabel: { type: String, default: undefined },
  /** A reference point across the bar on the value's own scale (0 to max), such as today's share of a budget. */
  marker: { type: Number, default: undefined },
  /** Read by screen readers as the bar's description, e.g. "오늘 기준 53%". */
  markerLabel: { type: String, default: undefined },
} as const;
export type KjunProgressCellProps = ExtractPublicPropTypes<typeof kjunProgressCellProps>;
export const KjunProgressCell = defineComponent({
  name: "KjunProgressCell",
  props: kjunProgressCellProps,
  setup(props) {
    const markerId = useKjunId("kjun-progress-marker-");
    return () => {
      const mark = progressMarker(props.marker, props.max);
      const { percent, rounded, role, custom } = progressCellState(props.value, props.max, props.color, props.customColor);
      return (
        <div class="kjun-progress-cell">
          {/* The bar is a progressbar, so its value reaches screen readers also without the visible label. */}
          <div style={css({ height: props.height })} role="progressbar" aria-label={props.ariaLabel} aria-valuemin={0} aria-valuemax={100} aria-valuenow={rounded}
            aria-valuetext={props.valueText} data-marker={mark != null || undefined} aria-describedby={mark != null && props.markerLabel ? markerId : undefined}>
            <span style={{ width: percent + "%", background: custom ?? `var(--_kjun-color-${role})` }} />
            {mark != null && <span class="kjun-progress-marker" aria-hidden="true" style={{ left: `calc(${mark}% - ${progressMarkerInset(mark)}px)` }} />}
            {mark != null && props.markerLabel && <span id={markerId} hidden>{props.markerLabel}</span>}
          </div>
          {props.showLabel && <span aria-hidden="true">{props.valueText ?? rounded + "%"}</span>}
        </div>
      );
    };
  },
});

const kjunCollectionMarkProps = {
  kind: { type: String as PropType<"favorite" | "interest">, required: true },
  active: { type: Boolean, default: false },
  size: { type: String as PropType<"sm" | "md" | "lg">, default: "md" },
  /** What an active mark says to a screen reader (default "즐겨찾기" or "관심"). An inactive mark stays hidden. */
  label: { type: String, default: undefined },
} as const;
export type KjunCollectionMarkProps = ExtractPublicPropTypes<typeof kjunCollectionMarkProps>;
export const KjunCollectionMark = defineComponent({
  name: "KjunCollectionMark",
  props: kjunCollectionMarkProps,
  setup(props) {
    const m = useKjunMessages();
    return () => {
      // The heart glyph carries more inner space than the star, so it draws one icon step larger within the same box.
      const box = tokens.extensions.financial.markSizes[props.size];
      const glyph = props.kind === "interest" ? tokens.extensions.financial.heartMarkSizes[props.size] : box;
      const check = domainRef(props.active);
      return (
        <KjunIcon ref={check ? (node: unknown) => check((node as { $el?: unknown } | null)?.$el ?? node) : undefined}
          name={props.kind === "favorite" ? "star" : "heart"} filled={props.active} size={glyph}
          ariaLabel={props.active ? props.label || (props.kind === "favorite" ? m.value.favoriteMark : m.value.interestMark) : undefined}
          style={css({ color: props.active ? `var(--_kjun-color-${props.kind})` : "var(--_kjun-color-text-tertiary)", margin: (box - glyph) / 2 })} />
      );
    };
  },
});

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
const kjunExecutionStatusBadgeProps = {
  status: { type: String as PropType<string | null>, default: undefined },
  label: { type: String, default: undefined },
  size: { type: String as PropType<DisplaySize>, default: "md" },
} as const;
export type KjunExecutionStatusBadgeProps = ExtractPublicPropTypes<typeof kjunExecutionStatusBadgeProps>;
export const KjunExecutionStatusBadge = defineComponent({
  name: "KjunExecutionStatusBadge",
  props: kjunExecutionStatusBadgeProps,
  setup(props) {
    const m = useKjunMessages();
    return () => {
      const state = props.status ? executionStates[props.status as keyof typeof executionStates] : undefined;
      // A running job carries a dot, so it reads apart from queued at a glance.
      return (
        <KjunBadge variant={state?.[0] || "secondary"} size={props.size} dot={props.status === "running"}>
          {props.label || (state ? m.value[state[1]] : undefined) || (props.status ? m.value.statusUnknown : m.value.statusNoRuns)}
        </KjunBadge>
      );
    };
  },
});

const kjunSparklineProps = {
  /** Values in time order. null, undefined and non-finite numbers are gaps: the line breaks there. */
  data: { type: Array as PropType<SparklineData>, default: () => [] },
  width: { type: Number, default: tokens.extensions.financial.sparklineWidth },
  height: { type: Number, default: tokens.extensions.financial.sparklineHeight },
  color: { type: String, default: undefined },
  semantic: { type: String as PropType<"price" | "status">, default: "price" },
  /** "line" (default) draws the trend; "bar" draws each value as a bar from the baseline (or zero), values below it hanging down; the last bar takes the direction color and the others stay quiet. */
  variant: { type: String as PropType<"line" | "bar">, default: "line" },
  fill: { type: Boolean, default: true },
  strokeWidth: { type: Number, default: tokens.extensions.financial.sparklineStrokeWidth },
  stretch: { type: Boolean, default: false },
  /** Reference value (a previous close): a dotted line, the direction color and the area are measured from it. */
  baseline: { type: Number, default: undefined },
  /** Fixed vertical range, so small moves stay small and rows share one scale. */
  min: { type: Number, default: undefined },
  max: { type: Number, default: undefined },
  /** Marks the last value with a dot (line variant). */
  endDot: { type: Boolean, default: true },
  /** Names the chart for screen readers; without it the chart is decorative. With no data, the no-data message follows it. */
  ariaLabel: { type: String, default: undefined },
} as const;
export type KjunSparklineProps = ExtractPublicPropTypes<typeof kjunSparklineProps>;
export const KjunSparkline = defineComponent({
  name: "KjunSparkline",
  props: kjunSparklineProps,
  setup(props) {
    const id = useKjunId("kjun-"), m = useKjunMessages();
    return () => {
      const { width, height, strokeWidth, stretch } = props, spec = tokens.extensions.financial;
      const g = sparklineGeometry(props.data, { width, height, strokeWidth,
        variant: props.variant, baseline: props.baseline, min: props.min, max: props.max, endDot: props.endDot });
      const line = props.color || `var(--_kjun-color-${sparklineTone(g.direction, props.semantic)})`, dash = sparklineDash();
      const label = sparklineLabel(props.ariaLabel, g.empty, m.value.noData);
      const scale = stretch ? "non-scaling-stroke" : undefined;
      const dot = (p: SparkPoint, size: number, key?: number) => stretch
        ? <path key={key} d={`M${p.x} ${p.y}h0`} stroke={line} stroke-width={size} stroke-linecap="round" vector-effect="non-scaling-stroke" />
        : <circle key={key} cx={p.x} cy={p.y} r={size / 2} fill={line} />;
      // Like React: an empty series is a quiet dotted line; bars grow from the baseline or zero; stretched dots stay round and stretched bars square.
      return (
        <svg ref={domainRef(!props.color && props.semantic === "price" && g.direction !== 0)} width={stretch ? "100%" : width} height={height}
          viewBox={`0 0 ${width} ${height}`} preserveAspectRatio={stretch ? "none" : "xMidYMid meet"} role={label ? "img" : undefined}
          aria-label={label} aria-hidden={!label || undefined} class="kjun-sparkline" data-variant={props.variant}>
          {g.empty && <line x1={0} x2={width} y1={height / 2} y2={height / 2} stroke="var(--_kjun-color-border)" stroke-width={strokeWidth} stroke-dasharray={dash} stroke-linecap="round" vector-effect={scale} />}
          {g.bars.map((bar, i) => <rect key={i} x={bar.x} y={bar.y} width={bar.width} height={bar.height} rx={stretch ? 0 : Math.min(spec.sparklineBarGap, bar.width / 2)} fill={bar.last ? line : "var(--_kjun-color-border)"} />)}
          {props.fill && g.areas.length > 0 && <>
            <defs>
              <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stop-color={line} stop-opacity={tokens.states.opacity.sparklineFill} />
                <stop offset="100%" stop-color={line} stop-opacity={0} />
              </linearGradient>
            </defs>
            {g.areas.map((area, i) => <polygon key={i} points={area} fill={`url(#${id})`} />)}
          </>}
          {g.baselineY != null && <line x1={0} x2={width} y1={g.baselineY} y2={g.baselineY} stroke="var(--_kjun-color-border-strong)" stroke-width={spec.sparklineBaselineWidth} stroke-dasharray={dash} vector-effect={scale} />}
          {g.segments.map((run, i) => run.length > 1
            ? <polyline key={i} points={run.map(p => `${p.x},${p.y}`).join(" ")} fill="none" stroke={line} stroke-width={strokeWidth} stroke-linecap="round" stroke-linejoin="round" vector-effect={scale} />
            : dot(run[0], spec.sparklineLoneDotSize, i))}
          {props.endDot && g.end && g.segments.some(run => run.length > 1) && dot(g.end, spec.sparklineDotSize)}
        </svg>
      );
    };
  },
});
