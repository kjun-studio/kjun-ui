import { useKjunMessages } from "./runtime/messages";
import { defineComponent, type ExtractPublicPropTypes, type PropType, type SlotsType, type VNodeChild } from "vue";
import { deviationLevel, tokens } from "@kjun-ui/tokens";
import { KjunIcon } from "./button";
import { KjunBadge, type DisplaySize } from "./display";
import { useKjunId } from "./input";
import { finiteNumber, format } from "./number-display";
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
      const n = finiteNumber(props.value);
      if (n === null) return <span style={{ color: "var(--_kjun-color-text-disabled)" }}>-</span>;
      const abs = Math.abs(n), signal = abs >= props.signalThreshold, level = deviationLevel(n), neutral = level === "neutral";
      const role = neutral ? "text-secondary" : n > 0 ? "price-up" : "price-down";
      const label = props.formatter ? props.formatter(n) : (n > 0 ? "+" : "") + format(n, props.decimals) + "%";
      // In the badge variant every value shares the badge box and the icon slot, so a column of
      // deviations keeps its digits aligned; values below the signal threshold drop only the fill and icon.
      if (props.variant === "badge") return (
        <span class="kjun-deviation-badge">
          <KjunBadge variant={neutral ? "secondary" : n > 0 ? "price-up" : "price-down"} size="sm" style={signal ? undefined : { background: "transparent" }}>{label}</KjunBadge>
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
          <span>{label}</span>
        </span>
      );
    };
  },
});

const kjunHeatmapCellProps = {
  value: { type: Number, default: 0 },
  min: { type: Number, default: 0 },
  max: { type: Number, default: 1 },
  mode: { type: String as PropType<"diverging" | "sequential" | "price">, default: "diverging" },
  color: { type: String as PropType<"brand" | "success" | "danger" | "warning">, default: "brand" },
} as const;
export type KjunHeatmapCellProps = ExtractPublicPropTypes<typeof kjunHeatmapCellProps>;
/** Default slot replaces the shown value. */
export const KjunHeatmapCell = defineComponent({
  name: "KjunHeatmapCell",
  props: kjunHeatmapCellProps,
  slots: Object as SlotsType<{ default?: () => VNodeChild }>,
  setup(props, { slots }) {
    return () => {
      const { value, min, max, mode } = props;
      const ratio = max === min ? 0.5 : Math.min(1, Math.max(0, (value - min) / (max - min)));
      const role = mode === "price" ? ratio >= 0.5 ? "price-up" : "price-down" : mode === "diverging" ? ratio >= 0.5 ? "success" : "danger" : props.color;
      const magnitude = mode === "sequential" ? ratio : Math.abs(ratio - 0.5) * 2, { heatMinimum, heatMaximum } = tokens.states.opacity;
      return (
        <span class="kjun-heat-cell" ref={domainRef(mode === "price")}>
          {/* A zero cell keeps its shape on the neutral fill; any other value starts from a visible minimum. */}
          <span aria-hidden="true" class="kjun-heat-layer" style={magnitude
            ? { background: `var(--_kjun-color-${role})`, opacity: heatMinimum + (heatMaximum - heatMinimum) * magnitude }
            : { background: "var(--_kjun-color-secondary)" }} />
          <span>{slots.default ? slots.default() : value}</span>
        </span>
      );
    };
  },
});

const kjunProgressCellProps = {
  value: { type: Number, default: 0 },
  max: { type: Number, default: 100 },
  showLabel: { type: Boolean, default: true },
  color: { type: String as PropType<"auto" | "brand" | "success" | "danger" | "warning" | "custom">, default: "auto" },
  customColor: { type: String, default: undefined },
  height: { type: Number, default: tokens.extensions.financial.progressHeight },
} as const;
export type KjunProgressCellProps = ExtractPublicPropTypes<typeof kjunProgressCellProps>;
export const KjunProgressCell = defineComponent({
  name: "KjunProgressCell",
  props: kjunProgressCellProps,
  setup(props) {
    return () => {
      const percent = props.max > 0 && Number.isFinite(props.value) ? Math.min(100, Math.max(0, (props.value / props.max) * 100)) : 0;
      const role = props.color === "auto" ? percent < 30 ? "danger" : percent < 70 ? "warning" : "success" : props.color;
      return (
        <div class="kjun-progress-cell">
          <div style={css({ height: props.height })}>
            <span style={{ width: percent + "%", background: props.color === "custom" ? props.customColor : `var(--_kjun-color-${role})` }} />
          </div>
          {props.showLabel && <span>{Math.round(percent)}%</span>}
        </div>
      );
    };
  },
});

const kjunCollectionMarkProps = {
  kind: { type: String as PropType<"favorite" | "interest">, required: true },
  active: { type: Boolean, default: false },
  size: { type: String as PropType<"sm" | "md" | "lg">, default: "md" },
} as const;
export type KjunCollectionMarkProps = ExtractPublicPropTypes<typeof kjunCollectionMarkProps>;
export const KjunCollectionMark = defineComponent({
  name: "KjunCollectionMark",
  props: kjunCollectionMarkProps,
  setup(props) {
    return () => {
      // The heart glyph carries more inner space than the star, so it draws one icon step larger within the same box.
      const box = tokens.extensions.financial.markSizes[props.size];
      const glyph = props.kind === "interest" ? tokens.extensions.financial.heartMarkSizes[props.size] : box;
      const check = domainRef(props.active);
      return (
        <KjunIcon ref={check ? (node: unknown) => check((node as { $el?: unknown } | null)?.$el ?? node) : undefined}
          name={props.kind === "favorite" ? "star" : "heart"} filled={props.active} size={glyph}
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
          {props.label || (state && m.value[state[1]]) || (props.status ? m.value.statusUnknown : m.value.statusNoRuns)}
        </KjunBadge>
      );
    };
  },
});

const kjunSparklineProps = {
  data: { type: Array as PropType<number[]>, default: () => [] },
  width: { type: Number, default: tokens.extensions.financial.sparklineWidth },
  height: { type: Number, default: tokens.extensions.financial.sparklineHeight },
  color: { type: String, default: undefined },
  semantic: { type: String as PropType<"price" | "status">, default: "price" },
  fill: { type: Boolean, default: true },
  strokeWidth: { type: Number, default: 1.5 },
  stretch: { type: Boolean, default: false },
  ariaLabel: { type: String, default: undefined },
} as const;
export type KjunSparklineProps = ExtractPublicPropTypes<typeof kjunSparklineProps>;
export const KjunSparkline = defineComponent({
  name: "KjunSparkline",
  props: kjunSparklineProps,
  setup(props) {
    const id = useKjunId("kjun-");
    return () => {
      const { width, height } = props, values = props.data.filter(Number.isFinite);
      const min = Math.min(...values), max = Math.max(...values), range = max - min || 1;
      const points = values.map((v, i) => `${2 + (i / Math.max(1, values.length - 1)) * (width - 4)},${2 + height - 4 - ((v - min) / range) * (height - 4)}`).join(" ");
      const change = values.length > 1 ? values[values.length - 1] - values[0] : 0;
      const line = props.color || `var(--_kjun-color-${change === 0 ? "text-tertiary" : props.semantic === "status" ? change > 0 ? "success" : "danger" : change > 0 ? "price-up" : "price-down"})`;
      return (
        <svg ref={domainRef(!props.color && props.semantic === "price" && change !== 0)} width={props.stretch ? "100%" : width} height={height}
          viewBox={`0 0 ${width} ${height}`} preserveAspectRatio={props.stretch ? "none" : "xMidYMid meet"} role={props.ariaLabel ? "img" : undefined}
          aria-label={props.ariaLabel} aria-hidden={!props.ariaLabel || undefined} class="kjun-sparkline">
          {props.fill && values.length > 1 && <>
            <defs>
              <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stop-color={line} stop-opacity={0.3} />
                <stop offset="100%" stop-color={line} stop-opacity={0.05} />
              </linearGradient>
            </defs>
            <polygon points={`2,${height - 2} ${points} ${width - 2},${height - 2}`} fill={`url(#${id})`} />
          </>}
          {values.length > 1
            ? <polyline points={points} fill="none" stroke={line} stroke-width={props.strokeWidth} stroke-linecap="round" stroke-linejoin="round"
                vector-effect={props.stretch ? "non-scaling-stroke" : undefined} />
            : values.length === 1 ? <circle cx={width / 2} cy={height / 2} r={2} fill={line} /> : null}
        </svg>
      );
    };
  },
});
