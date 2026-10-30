import { useKjunMessages } from "./runtime/messages";
import { defineComponent, ref, type ExtractPublicPropTypes, type PropType, type SlotsType, type VNodeChild } from "vue";
import { alertRole, type AlertLive } from "../../../shared/package-runtime/alert-live";
import { alertIcons, alertToneRoles } from "../../../shared/package-runtime/alert-tone";
import { collapseAlert } from "../../../shared/package-runtime/alert-exit";
import { tokens } from "@kjun-ui/tokens";
import { progressCircle } from "../../../shared/package-runtime/progress-circle";
import { alertActionSizes } from "../../../shared/package-runtime/alert-action-size";
import { typeStyle } from "../../../shared/package-runtime/typography";
import { KjunIcon } from "./button";
import { KjunActionSize } from "./runtime/action-size";
import { domainRef } from "./runtime/refs";
import { hasContent } from "./runtime/slots";
import { useReducedMotion } from "./runtime/presence";
import { css } from "./runtime/style";

export type DisplaySize = "xs" | "sm" | "md" | "lg" | "xl";
export type SemanticTone = "primary" | "success" | "warning" | "danger" | "info";
const role = (name: string) => `var(--_kjun-color-${name})`;

const kjunBadgeProps = {
  variant: { type: String as PropType<"default" | "secondary" | SemanticTone | "price-up" | "price-down">, default: "default" },
  size: { type: String as PropType<DisplaySize>, default: "sm" },
  dot: { type: Boolean, default: false },
} as const;
export type KjunBadgeProps = ExtractPublicPropTypes<typeof kjunBadgeProps>;
export const KjunBadge = defineComponent({
  name: "KjunBadge",
  props: kjunBadgeProps,
  slots: Object as SlotsType<{ default?: () => VNodeChild }>,
  setup(props, { slots }) {
    return () => {
      const { x, y } = tokens.extensions.badge.padding[props.size];
      const neutral = props.variant === "default" || props.variant === "secondary";
      return (
        <span ref={domainRef(props.variant.startsWith("price-"))} class="kjun-badge" style={css({
          padding: `${y}px ${x}px`,
          ...typeStyle(props.size === "xl" ? "controlLarge" : props.size === "lg" ? "control" : "controlSmall"),
          background: role(neutral ? "secondary" : props.variant === "primary" ? "brand-subtle-bg" : props.variant + "-bg"),
          color: role(neutral ? "text-secondary" : props.variant === "primary" ? "brand-hover" : props.variant),
        })}>
          {props.dot && <span class="kjun-badge-dot" />}
          {slots.default?.()}
        </span>
      );
    };
  },
});

const kjunEmptyProps = {
  text: { type: String, default: undefined },
  description: { type: String, default: undefined },
  icon: { type: String, default: undefined },
} as const;
export type KjunEmptyProps = ExtractPublicPropTypes<typeof kjunEmptyProps>;
export const KjunEmpty = defineComponent({
  name: "KjunEmpty",
  props: kjunEmptyProps,
  slots: Object as SlotsType<{ default?: () => VNodeChild }>,
  setup(props, { slots }) {
    const m = useKjunMessages();
    return () => {
      const children = slots.default?.();
      return (
        <div class="kjun-empty">
          {props.icon && <KjunIcon name={props.icon} size={tokens.extensions.empty.iconSize} />}
          <p>{(props.text ?? m.value.noData)}</p>
          {props.description && <small>{props.description}</small>}
          {hasContent(children) && <div>{children}</div>}
        </div>
      );
    };
  },
});

const kjunSpinnerProps = {
  size: { type: String as PropType<DisplaySize>, default: "md" },
  text: { type: String, default: undefined },
} as const;
export type KjunSpinnerProps = ExtractPublicPropTypes<typeof kjunSpinnerProps>;
export const KjunSpinner = defineComponent({
  name: "KjunSpinner",
  props: kjunSpinnerProps,
  setup(props) {
    const m = useKjunMessages();
    return () => {
      const size = tokens.extensions.spinner.sizes[props.size];
      // The stroke keeps a size-specific pixel weight instead of scaling with the 24-unit viewBox.
      const stroke = (tokens.extensions.spinner.strokeWidths[props.size] * 24) / size;
      return (
        <span role="status" aria-label={props.text || m.value.loading} class="kjun-spinner">
          <svg class="kjun-spin" width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width={stroke} opacity=".25" />
            <path d="M22 12A10 10 0 0 0 12 2" stroke="currentColor" stroke-width={stroke} />
          </svg>
          {props.text && <span>{props.text}</span>}
        </span>
      );
    };
  },
});

const kjunAlertProps = {
  type: { type: String as PropType<"info" | "success" | "warning" | "danger" | "error">, default: "info" },
  variant: { type: String as PropType<SemanticTone>, default: undefined },
  size: { type: String as PropType<"sm" | "md" | "lg">, default: "md" },
  title: { type: String, default: undefined },
  closable: { type: Boolean, default: false },
  /** How screen readers announce it: assertive (role alert), polite (status) or off; defaults to alert for danger, status otherwise. */
  live: { type: String as PropType<AlertLive>, default: undefined },
} as const;
export type KjunAlertProps = ExtractPublicPropTypes<typeof kjunAlertProps>;
/** Slots: default (message), title, actions (unsized KjunButtons follow the alert size). */
export const KjunAlert = defineComponent({
  name: "KjunAlert",
  props: kjunAlertProps,
  emits: { close: () => true },
  slots: Object as SlotsType<{
    default?: () => VNodeChild;
    title?: () => VNodeChild;
    actions?: () => VNodeChild;
  }>,
  setup(props, { slots, emit }) {
    const m = useKjunMessages();
    const visible = ref(true), root = ref<HTMLElement | null>(null), reduced = useReducedMotion();
    let closing = false;
    const close = () => {
      if (closing) return;
      closing = true;
      collapseAlert(root.value, reduced.value, () => { visible.value = false; emit("close"); });
    };
    return () => {
      if (!visible.value) return null;
      const tone = props.variant || (props.type === "error" ? "danger" : props.type);
      const small = props.size === "sm", paint = alertToneRoles(tone);
      const title = slots.title ? slots.title() : props.title;
      const children = slots.default?.(), actions = slots.actions?.();
      return (
        <div ref={root} role={alertRole(tone, props.live)} class="kjun-alert" data-size={small ? "sm" : "md"} data-tone={tone}
          style={paint.bg ? { background: role(paint.bg) } : undefined}>
          <span class="kjun-alert-icon" style={{ color: role(paint.icon) }}>
            <KjunIcon name={alertIcons[tone]} filled size={tokens.extensions.alert.iconSizes[small ? "sm" : "md"]} />
          </span>
          <div class="kjun-alert-content">
            {(slots.title ? hasContent(title as ReturnType<NonNullable<typeof slots.title>>) : props.title != null && String(props.title).trim() !== "")
              && <div class="kjun-alert-title">{title}</div>}
            {hasContent(children) && <div class="kjun-alert-description">{children}</div>}
            {hasContent(actions) && (
              <KjunActionSize size={alertActionSizes[small ? "sm" : "md"]}>
                {{ default: () => <div class="kjun-alert-actions">{actions}</div> }}
              </KjunActionSize>
            )}
          </div>
          {props.closable && (
            <button class="kjun-alert-close" type="button" aria-label={m.value.close} onClick={close}>
              <KjunIcon name="x" size={tokens.extensions.alert.closeIconSize} />
            </button>
          )}
        </div>
      );
    };
  },
});

const kjunProgressProps = {
  /** null is missing data; omission retains the existing zero default. */
  value: { type: [Number, null] as PropType<number | null>, default: 0 },
  /** Work is active but its completion percentage is unknown. */
  indeterminate: { type: Boolean, default: false },
  max: { type: Number, default: 100 },
  size: { type: String as PropType<"sm" | "md" | "lg">, default: "md" },
  variant: { type: String as PropType<SemanticTone>, default: "primary" },
  showLabel: { type: Boolean, default: false },
  label: { type: String, default: undefined },
  subLabel: { type: String, default: undefined },
  shape: { type: String as PropType<"bar" | "circle">, default: "bar" },
} as const;
export type KjunProgressProps = ExtractPublicPropTypes<typeof kjunProgressProps>;
/** Slots: label, subLabel (override the matching props). */
export const KjunProgress = defineComponent({
  name: "KjunProgress",
  props: kjunProgressProps,
  slots: Object as SlotsType<{
    label?: () => VNodeChild;
    subLabel?: () => VNodeChild;
  }>,
  setup(props, { slots }) {
    const m = useKjunMessages();
    return () => {
      const missing = props.value === null || !Number.isFinite(props.value) || !Number.isFinite(props.max) || props.max <= 0;
      const state = props.indeterminate ? "indeterminate" : missing ? "missing" : "determinate";
      const percentage = state === "determinate" ? Math.min(100, Math.max(0, Math.round((props.value! / props.max) * 100))) : 0;
      const text = state === "indeterminate" ? m.value.loadingEllipsis : state === "missing" ? "—" : `${percentage}%`;
      const label = slots.label ? slots.label() : props.label;
      const subLabel = slots.subLabel ? slots.subLabel() : props.subLabel;
      const name = typeof props.label === "string" && !slots.label ? props.label : m.value.progress;
      const accessibility = {
        role: state === "missing" ? "img" : "progressbar",
        "aria-label": state === "missing" ? `${name}: ${m.value.noData}` : name,
        "aria-valuemin": state === "missing" ? undefined : 0,
        "aria-valuemax": state === "missing" ? undefined : 100,
        "aria-valuenow": state === "determinate" ? percentage : undefined,
        "aria-valuetext": state === "indeterminate" ? m.value.loadingEllipsis : undefined,
        "aria-busy": state === "indeterminate" || undefined,
      };
      const color = role(props.variant === "primary" ? "brand" : props.variant);
      if (props.shape === "circle") {
        const c = progressCircle(props.size, state === "indeterminate" ? 25 : percentage);
        return (
          <div class="kjun-progress" data-shape="circle" data-size={props.size} data-state={state}>
            <div {...accessibility}
              class="kjun-progress-circle" style={css({ width: c.diameter, height: c.diameter })}>
              <svg class={state === "indeterminate" ? "kjun-spin" : undefined} width={c.diameter} height={c.diameter} viewBox={`0 0 ${c.diameter} ${c.diameter}`} fill="none" aria-hidden="true">
                <circle class="kjun-progress-circle-track" cx={c.centre} cy={c.centre} r={c.radius} stroke-width={c.stroke} />
                {(percentage > 0 || state === "indeterminate") && <circle class="kjun-progress-circle-value" cx={c.centre} cy={c.centre} r={c.radius} stroke-width={c.stroke}
                  stroke={color} stroke-linecap="round" stroke-dasharray={c.circumference} stroke-dashoffset={c.offset}
                  transform={`rotate(-90 ${c.centre} ${c.centre})`} />}
              </svg>
              {props.showLabel && c.showsPercentage && state !== "indeterminate" && <span class="kjun-progress-circle-percent">{text}</span>}
            </div>
            {label && <div class="kjun-progress-circle-label">{label}</div>}
            {subLabel && <div class="kjun-progress-sub">{subLabel}</div>}
          </div>
        );
      }
      return (
        <div class="kjun-progress" data-state={state}>
          {(label || props.showLabel) && (
            <div class="kjun-progress-label">
              {label && <span>{label}</span>}
              {props.showLabel && <span>{text}</span>}
            </div>
          )}
          <div {...accessibility} class="kjun-progress-track"
            style={css({ height: tokens.extensions.progress.heights[props.size] })}>
            <div style={{ width: (state === "indeterminate" ? 30 : percentage) + "%", background: color }} />
          </div>
          {subLabel && <div class="kjun-progress-sub">{subLabel}</div>}
        </div>
      );
    };
  },
});

type Length = number | string;
const kjunSkeletonProps = {
  type: { type: String as PropType<"text" | "avatar" | "card" | "table" | "stat" | "block">, default: "text" },
  rows: { type: Number, default: 3 },
  columns: { type: Number, default: 4 },
  height: { type: [Number, String] as PropType<Length>, default: undefined },
  width: { type: [Number, String] as PropType<Length>, default: undefined },
  animated: { type: Boolean, default: true },
  rounded: { type: Boolean, default: true },
} as const;
export type KjunSkeletonProps = ExtractPublicPropTypes<typeof kjunSkeletonProps>;
export const KjunSkeleton = defineComponent({
  name: "KjunSkeleton",
  props: kjunSkeletonProps,
  setup(props) {
    const line = (w: Length | undefined, key?: number, lineHeight?: number) =>
      <div key={key} class="kjun-skeleton-line" style={css({ width: w, height: lineHeight })} />;
    const avatar = (sm = false) => (
      <div class={"kjun-skeleton-avatar" + (sm ? " kjun-skeleton-avatar-sm" : "")}
        style={sm ? undefined : css({
          width: props.width || tokens.extensions.skeleton.avatarSize,
          height: props.height || tokens.extensions.skeleton.avatarSize,
          borderRadius: props.rounded ? "50%" : tokens.radius.radius8,
        })} />
    );
    const count = (n: number) => Array.from({ length: Math.max(0, Math.floor(n)) }, (_, i) => i + 1);
    return () => {
      const { type, rows, columns, height, width } = props;
      const sizes = tokens.extensions.skeleton;
      return (
        <div aria-hidden="true" class={"kjun-skeleton" + (props.animated ? " kjun-skeleton-animated" : "")} style={css({ width })}>
          {type === "text" && count(rows).map(i => line(i === rows ? "60%" : ["100%", "90%", "80%", "70%", "60%"][i % 5], i))}
          {type === "avatar" && avatar()}
          {type === "card" && (
            <div class="kjun-skeleton-card">
              <div class="kjun-skeleton-card-header">
                {avatar(true)}
                <div class="kjun-skeleton-card-header-text">{line("60%")}{line("40%", undefined, sizes.lineHeights.sm)}</div>
              </div>
              <div class="kjun-skeleton-card-body">{line("100%")} {line("80%")} {line("60%")}</div>
            </div>
          )}
          {type === "table" && (
            <div class="kjun-skeleton-table">
              {[0, ...count(rows)].map(row => (
                <div key={row} class={row === 0 ? "kjun-skeleton-table-header" : "kjun-skeleton-table-row"}>
                  {count(columns).map(col => (
                    <div key={col} class="kjun-skeleton-table-cell">
                      {line(row === 0 ? "70%" : ["45%", "55%", "65%", "75%", "85%"][(row + col) % 5])}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          )}
          {type === "stat" && (
            <div class="kjun-skeleton-stat">
              <div class="kjun-skeleton-stat-content">
                {line("40%", 0, sizes.lineHeights.sm)}{line("60%", 1, sizes.lineHeights.lg)}{line("30%", 2, sizes.lineHeights.sm)}
              </div>
              <div class="kjun-skeleton-stat-chart"><div class="kjun-skeleton-sparkline" /></div>
            </div>
          )}
          {type === "block" && <div class="kjun-skeleton-block" style={css({ width: width || "100%", height: height ?? sizes.blockHeight })} />}
        </div>
      );
    };
  },
});
