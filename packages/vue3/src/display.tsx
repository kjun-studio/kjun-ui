import { useKjunMessages } from "./runtime/messages";
import { badgeCount } from "../../../shared/package-runtime/navigation-badge";
import { skeletonTextWidths } from "../../../shared/package-runtime/skeleton-text";
import { defineComponent, ref, type ExtractPublicPropTypes, type PropType, type SlotsType, type VNodeChild } from "vue";
import { alertRole, type AlertLive } from "../../../shared/package-runtime/alert-live";
import { alertIcons, alertToneRoles } from "../../../shared/package-runtime/alert-tone";
import { collapseAlert } from "../../../shared/package-runtime/alert-exit";
import { badgeGeometry, badgeToneRoles } from "../../../shared/package-runtime/badge-tone";
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
  /** Shows this number instead of the slot; over max it shows "99+", and 0 or less draws no badge at all. */
  count: { type: Number, default: undefined },
  /** The largest count shown in full (default 99). */
  max: { type: Number, default: undefined },
  /** What the badge means to a screen reader, e.g. "읽지 않은 알림 3개"; the drawn text is then hidden from it. Give it to a dot-only badge. */
  label: { type: String, default: undefined },
} as const;
export type KjunBadgeProps = ExtractPublicPropTypes<typeof kjunBadgeProps>;
export const KjunBadge = defineComponent({
  name: "KjunBadge",
  props: kjunBadgeProps,
  slots: Object as SlotsType<{ default?: () => VNodeChild }>,
  setup(props, { slots }) {
    return () => {
      const { padding, radius, gap, dotSize, type } = badgeGeometry(props.size);
      const paint = badgeToneRoles(props.variant);
      const counted = props.count === undefined ? undefined : badgeCount(props.count, props.max);
      if (counted === null) return null;
      const body = counted ?? slots.default?.();
      return (
        <span ref={domainRef(props.variant.startsWith("price-"))} class="kjun-badge" data-variant={props.variant} style={css({
          ...({ "--_kjun-badge-dot": `${dotSize}px` } as Record<string, string>),
          padding: `${padding.y}px ${padding.x}px`,
          ...typeStyle(type),
          gap: `${gap}px`,
          borderRadius: `${radius}px`,
          background: role(paint.bg),
          color: role(paint.text),
        })}>
          {props.dot && <span class="kjun-badge-dot" style={css({ background: role(paint.dot) })} />}
          {props.label ? [<span class="kjun-sr-only">{props.label}</span>, <span aria-hidden="true">{body}</span>] : body}
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
    // Like React: a bar inside a line box of a type role, so the skeleton is as tall as that text.
    const slot = (w: Length, role?: "card-title" | "caption" | "display-sm", key?: number) =>
      <div key={key} class="kjun-skeleton-slot" data-role={role}>{line(w)}</div>;
    const avatar = () => (
      <div class="kjun-skeleton-avatar"
        style={css({
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
          {type === "text" && skeletonTextWidths(rows).map((w, i) => slot(w, undefined, i))}
          {type === "avatar" && avatar()}
          {type === "card" && (
            <div class="kjun-skeleton-card">
              <div class="kjun-skeleton-card-header">{slot("40%", "card-title")}{slot("28%", "caption")}</div>
              {rows > 0 && <div class="kjun-skeleton-card-body">{skeletonTextWidths(rows).map((w, i) => slot(w, undefined, i))}</div>}
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
          {type === "stat" && <div class="kjun-skeleton-stat">{slot("40%", "caption")}{slot("64%", "display-sm")}{slot("30%", "caption")}</div>}
          {type === "block" && <div class="kjun-skeleton-block" style={css({ width: width || "100%", height: height ?? sizes.blockHeight })} />}
        </div>
      );
    };
  },
});
