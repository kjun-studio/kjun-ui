import { defineComponent, ref, type ExtractPublicPropTypes, type PropType, type SlotsType, type VNodeChild } from "vue";
import { tokens } from "@kjun-ui/tokens";
import { alertActionSizes } from "../../../shared/package-runtime/alert-action-size";
import { typeStyle } from "../../../shared/package-runtime/typography";
import { KjunIcon } from "./button";
import { KjunActionSize } from "./runtime/action-size";
import { domainRef } from "./runtime/refs";
import { hasContent } from "./runtime/slots";
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
  text: { type: String, default: "데이터가 없습니다" },
  description: { type: String, default: undefined },
  icon: { type: String, default: undefined },
} as const;
export type KjunEmptyProps = ExtractPublicPropTypes<typeof kjunEmptyProps>;
export const KjunEmpty = defineComponent({
  name: "KjunEmpty",
  props: kjunEmptyProps,
  slots: Object as SlotsType<{ default?: () => VNodeChild }>,
  setup(props, { slots }) {
    return () => {
      const children = slots.default?.();
      return (
        <div class="kjun-empty">
          {props.icon && <KjunIcon name={props.icon} size={tokens.extensions.empty.iconSize} />}
          <p>{props.text}</p>
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
    return () => {
      const size = tokens.extensions.spinner.sizes[props.size];
      // The stroke keeps a size-specific pixel weight instead of scaling with the 24-unit viewBox.
      const stroke = (tokens.extensions.spinner.strokeWidths[props.size] * 24) / size;
      return (
        <span role="status" aria-label={props.text || "로딩 중"} class="kjun-spinner">
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

const alertIcons = { info: "info-circle", primary: "info-circle", success: "circle-check", warning: "alert-triangle", danger: "alert-circle" };
const kjunAlertProps = {
  type: { type: String as PropType<"info" | "success" | "warning" | "danger" | "error">, default: "info" },
  variant: { type: String as PropType<SemanticTone>, default: undefined },
  size: { type: String as PropType<"sm" | "md" | "lg">, default: "md" },
  title: { type: String, default: undefined },
  closable: { type: Boolean, default: false },
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
    const visible = ref(true);
    return () => {
      if (!visible.value) return null;
      const tone = props.variant || (props.type === "error" ? "danger" : props.type);
      const small = props.size === "sm";
      const title = slots.title ? slots.title() : props.title;
      const children = slots.default?.(), actions = slots.actions?.();
      return (
        <div role={tone === "danger" ? "alert" : "status"} class="kjun-alert" data-size={small ? "sm" : "md"}
          style={{ background: role(tone === "primary" ? "brand-subtle-bg" : tone + "-bg"),
            borderColor: role(tone === "primary" ? "brand-light" : tone + "-light") }}>
          <span class="kjun-alert-icon" style={{ color: role(tone === "primary" ? "brand" : tone + "-accent") }}>
            <KjunIcon name={alertIcons[tone]} size={tokens.extensions.alert.iconSizes[small ? "sm" : "md"]} />
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
            <button class="kjun-alert-close" type="button" aria-label="닫기" onClick={() => { visible.value = false; emit("close"); }}>
              <KjunIcon name="x" size={tokens.extensions.alert.closeIconSize} />
            </button>
          )}
        </div>
      );
    };
  },
});

const kjunProgressProps = {
  value: { type: Number, default: 0 },
  max: { type: Number, default: 100 },
  size: { type: String as PropType<"sm" | "md" | "lg">, default: "md" },
  variant: { type: String as PropType<SemanticTone>, default: "primary" },
  showLabel: { type: Boolean, default: false },
  label: { type: String, default: undefined },
  subLabel: { type: String, default: undefined },
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
    return () => {
      const percentage = Number.isFinite(props.value) && props.max > 0
        ? Math.min(100, Math.max(0, Math.round((props.value / props.max) * 100))) : 0;
      const label = slots.label ? slots.label() : props.label;
      const subLabel = slots.subLabel ? slots.subLabel() : props.subLabel;
      return (
        <div class="kjun-progress">
          {(label || props.showLabel) && (
            <div class="kjun-progress-label">
              {label && <span>{label}</span>}
              {props.showLabel && <span>{percentage}%</span>}
            </div>
          )}
          <div role="progressbar" aria-label={typeof props.label === "string" && !slots.label ? props.label : "진행률"}
            aria-valuemin={0} aria-valuemax={100} aria-valuenow={percentage} class="kjun-progress-track"
            style={css({ height: tokens.extensions.progress.heights[props.size] })}>
            <div style={{ width: percentage + "%", background: role(props.variant === "primary" ? "brand" : props.variant) }} />
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
