import { useKjunMessages } from "./runtime/messages";
import { spinnerGlyph } from "./spinner-glyph";
import { spinnerStacked } from "../../../shared/package-runtime/spinner-geometry";
import { badgeCount } from "../../../shared/package-runtime/navigation-badge";
import { skeletonLineBox, skeletonTableWidth, skeletonTextWidths } from "../../../shared/package-runtime/skeleton-text";
import { ref, useId, type ExtractPublicPropTypes, type PropType, type SlotsType, type VNodeChild } from "vue";
import { defineComponent } from "./runtime/component";
import { alertRole, type AlertLive } from "../../../shared/package-runtime/alert-live";
import { alertIcons, alertToneRoles } from "../../../shared/package-runtime/alert-tone";
import { collapseAlert } from "../../../shared/package-runtime/alert-exit";
import { badgeGeometry, badgeToneRoles } from "../../../shared/package-runtime/badge-tone";
import { tokens, type TypographyRole } from "@kjun-ui/tokens";
import { progressCircle, progressPercent, progressState } from "../../../shared/package-runtime/progress-circle";
import { progressMarker, progressMarkerInset } from "../../../shared/package-runtime/progress-marker";
import { alertActionSizes } from "../../../shared/package-runtime/alert-action-size";
import { typeStyle } from "../../../shared/package-runtime/typography";
import { emptyGeometry, type EmptySize } from "../../../shared/package-runtime/empty-geometry";
import { KjunIcon } from "./button";
import { useSkeletonPhase } from "./skeleton-phase";
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
      const { padding, radius, gap, dotSize, type, count: pill, standaloneDotSize } = badgeGeometry(props.size);
      const paint = badgeToneRoles(props.variant);
      const counted = props.count === undefined ? undefined : badgeCount(props.count, props.max);
      if (counted === null) return null;
      const body = counted ?? slots.default?.(), dotOnly = props.dot && !hasContent(body);
      return (
        <span ref={domainRef(props.variant.startsWith("price-"))} class="kjun-badge" data-variant={props.variant} data-dot-only={dotOnly || undefined} style={css({
          ...({ "--_kjun-badge-dot": `${dotOnly ? standaloneDotSize : dotSize}px` } as Record<string, string>),
          padding: dotOnly ? "0" : `${padding.y}px ${counted ? pill.paddingX : padding.x}px`,
          ...typeStyle(type),
          gap: `${gap}px`,
          borderRadius: `${counted ? pill.radius : radius}px`,
          ...(counted ? { minWidth: `${pill.minWidth}px`, justifyContent: "center", boxSizing: "border-box" } : {}),
          // A tinted card sets --_kjun-badge-fill so the badge stays apart from its surface.
          background: dotOnly ? "transparent" : `var(--_kjun-badge-fill, ${role(paint.bg)})`,
          color: role(paint.text),
        })}>
          {props.dot && <span class="kjun-badge-dot" style={css({ background: role(paint.dot) })} />}
          {props.label ? [<span class="kjun-sr-only">{props.label}</span>, !dotOnly && <span aria-hidden="true">{body}</span>] : body}
        </span>
      );
    };
  },
});

const kjunEmptyProps = {
  text: { type: String, default: undefined },
  /** Why it is empty and what to do next; the description slot can carry a link or emphasis. */
  description: { type: String, default: undefined },
  /** An icon name drawn as a quiet line icon; the icon slot takes your own element instead. */
  icon: { type: String, default: undefined },
  /** md for pages and panels; sm for cards and list areas. */
  size: { type: String as PropType<EmptySize>, default: "md" },
  /** Renders the title as an h2–h6 so it joins the page outline; false keeps a paragraph. */
  headingLevel: { type: [Boolean, Number] as PropType<false | 2 | 3 | 4 | 5 | 6>, default: false },
  /** polite announces the message when it appears (role status), such as a search that just came back empty. */
  live: { type: String as PropType<"polite" | "off">, default: "off" },
} as const;
export type KjunEmptyProps = ExtractPublicPropTypes<typeof kjunEmptyProps>;
export const KjunEmpty = defineComponent({
  name: "KjunEmpty",
  props: kjunEmptyProps,
  slots: Object as SlotsType<{ default?: () => VNodeChild; icon?: () => VNodeChild; description?: () => VNodeChild }>,
  setup(props, { slots }) {
    const m = useKjunMessages();
    return () => {
      const children = slots.default?.(), iconNode = slots.icon?.(), descriptionNode = slots.description?.();
      const g = emptyGeometry(props.size);
      // Typed as "p" so JSX accepts the tag variable; h2–h6 take the same attributes.
      const Title = (props.headingLevel ? `h${props.headingLevel}` : "p") as "p";
      // hasContent reads slot nodes; a description prop is plain text.
      const description = hasContent(descriptionNode) ? descriptionNode : props.description?.trim() ? props.description : undefined;
      return (
        <div class="kjun-empty" data-size={props.size} role={props.live === "polite" ? "status" : undefined}>
          {hasContent(iconNode) ? <div class="kjun-empty-icon">{iconNode}</div>
            : props.icon && <KjunIcon name={props.icon} size={g.iconSize} class="kjun-empty-icon" style={{ strokeWidth: g.iconStroke }} />}
          <Title class="kjun-empty-title">{(props.text ?? m.value.noData)}</Title>
          {description && <div class="kjun-empty-description">{description}</div>}
          {hasContent(children) && <div class="kjun-empty-actions">{children}</div>}
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
      return (
        // A live region announces its content, not its name: the loading words sit inside it, hidden when there is no text.
        <span role="status" class="kjun-spinner" data-size={props.size}
          data-stacked={(props.text && spinnerStacked(props.size)) || undefined}>
          {spinnerGlyph({ size: tokens.extensions.spinner.sizes[props.size], stroke: tokens.extensions.spinner.strokeWidths[props.size] })}
          {props.text ? <span>{props.text}</span> : <span class="kjun-sr-only">{m.value.loading}</span>}
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
  /** An icon name in place of the tone's icon (its filled form when the icon has one), or false for no icon. */
  icon: { type: [String, Boolean] as PropType<string | false>, default: undefined },
  closable: { type: Boolean, default: false },
  /** How screen readers announce it: assertive (role alert), polite (status) or off; defaults to alert for danger, status otherwise. */
  live: { type: String as PropType<AlertLive>, default: undefined },
} as const;
export type KjunAlertProps = ExtractPublicPropTypes<typeof kjunAlertProps>;
/** Slots: default (message), title, actions (under the message with a title, beside it without; unsized KjunButtons follow the alert size). */
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
      const scale = props.size === "sm" || props.size === "lg" ? props.size : "md", paint = alertToneRoles(tone);
      const title = slots.title ? slots.title() : props.title;
      const children = slots.default?.(), actions = slots.actions?.();
      const titled = slots.title ? hasContent(title as ReturnType<NonNullable<typeof slots.title>>) : props.title != null && String(props.title).trim() !== "";
      // Without a title the actions sit beside the message, centred on its first line, like a toast's.
      const beside = !titled && hasContent(actions);
      const actionBox = hasContent(actions) && (
        <KjunActionSize size={alertActionSizes[scale]}>
          {{ default: () => <div class="kjun-alert-actions" data-placement={beside ? "end" : undefined}>{actions}</div> }}
        </KjunActionSize>
      );
      return (
        <div ref={root} role={alertRole(tone, props.live)} class="kjun-alert" data-size={scale} data-tone={tone}
          style={paint.bg ? { background: role(paint.bg) } : undefined}>
          {props.icon !== false && (
            <span class="kjun-alert-icon" data-icon={props.icon ? "custom" : undefined} style={{ color: role(paint.icon) }}>
              <KjunIcon name={props.icon || alertIcons[tone]} filled size={tokens.extensions.alert.iconSizes[scale]} />
            </span>
          )}
          <div class="kjun-alert-content">
            {titled && <div class="kjun-alert-title">{title}</div>}
            {hasContent(children) && <div class="kjun-alert-description">{children}</div>}
            {!beside && actionBox}
          </div>
          {beside && actionBox}
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
  /** Shown and read in place of the rounded percent while the value is known, e.g. "37.4%" or "3.2 / 8 GB". */
  valueText: { type: String, default: undefined },
  /** A reference point across the bar on the value's own scale (0 to max), such as today's share of a budget. Bars only; not drawn while indeterminate or missing. */
  marker: { type: Number, default: undefined },
  /** Read by screen readers as the bar's description, e.g. "오늘 기준 53%". Put visible wording in subLabel. */
  markerLabel: { type: String, default: undefined },
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
    const m = useKjunMessages(), baseId = "kjun-progress-" + useId().replace(/[^\w-]/g, ""), markerId = baseId + "-marker", noDataId = baseId + "-nodata";
    return () => {
      const state = progressState(props.value, props.max, props.indeterminate);
      const percentage = state === "determinate" ? progressPercent(props.value!, props.max) : 0;
      const text = state === "indeterminate" ? m.value.loadingEllipsis : state === "missing" ? "—" : props.valueText ?? `${percentage}%`;
      const label = slots.label ? slots.label() : props.label;
      const subLabel = slots.subLabel ? slots.subLabel() : props.subLabel;
      const name = typeof props.label === "string" && !slots.label ? props.label : m.value.progress;
      // A slot label is not plain text: it names the bar through aria-labelledby, so screen readers say what is shown.
      const labelId = slots.label && hasContent(label) ? baseId + "-label" : undefined;
      const accessibility = {
        role: state === "missing" ? "img" : "progressbar",
        "aria-label": labelId ? undefined : state === "missing" ? `${name}: ${m.value.noData}` : name,
        "aria-labelledby": labelId && (state === "missing" ? `${labelId} ${noDataId}` : labelId),
        "aria-valuemin": state === "missing" ? undefined : 0,
        "aria-valuemax": state === "missing" ? undefined : 100,
        "aria-valuenow": state === "determinate" ? percentage : undefined,
        "aria-valuetext": state === "indeterminate" ? m.value.loadingEllipsis : state === "determinate" ? props.valueText : undefined,
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
            {label && <div id={labelId} class="kjun-progress-circle-label">{label}</div>}
            {labelId && state === "missing" && <span id={noDataId} hidden>{m.value.noData}</span>}
            {subLabel && <div class="kjun-progress-sub">{subLabel}</div>}
          </div>
        );
      }
      const mark = state === "determinate" ? progressMarker(props.marker, props.max) : null;
      return (
        <div class="kjun-progress" data-state={state}>
          {(label || props.showLabel) && (
            <div class="kjun-progress-label">
              {label && <span id={labelId}>{label}</span>}
              {props.showLabel && <span>{text}</span>}
            </div>
          )}
          <div {...accessibility} class="kjun-progress-track" data-marker={mark != null || undefined} aria-describedby={mark != null && props.markerLabel ? markerId : undefined}
            style={css({ height: tokens.extensions.progress.heights[props.size] })}>
            <div style={{ width: (state === "indeterminate" ? 30 : percentage) + "%", background: color }} />
            {mark != null && <span class="kjun-progress-marker" aria-hidden="true" style={{ left: `calc(${mark}% - ${progressMarkerInset(mark)}px)` }} />}
          </div>
          {mark != null && props.markerLabel && <span id={markerId} hidden>{props.markerLabel}</span>}
          {labelId && state === "missing" && <span id={noDataId} hidden>{m.value.noData}</span>}
          {subLabel && <div class="kjun-progress-sub">{subLabel}</div>}
        </div>
      );
    };
  },
});

type Length = number | string;
const kjunSkeletonProps = {
  /** "line" is one line of text: a bar in the line box of `role`, or of the surrounding text when no role is given. */
  type: { type: String as PropType<"text" | "line" | "avatar" | "card" | "table" | "stat" | "block">, default: "text" },
  /** Typography role for type="line"; omit it to take the surrounding text's line height. */
  role: { type: String as PropType<TypographyRole>, default: undefined },
  /** Announces loading to screen readers (a status); the skeleton itself stays silent. */
  loadingText: { type: String, default: undefined },
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
    const line = (w: Length | undefined, key?: number) =>
      <div key={key} class="kjun-skeleton-line" style={css({ width: w })} />;
    // Like React: a bar inside a line box of a type role, so the skeleton is as tall as that text.
    const slot = (w: Length, role?: TypographyRole | "inherit", key?: number) =>
      <div key={key} class="kjun-skeleton-slot" style={role ? { "--_kjun-skeleton-slot": skeletonLineBox(role === "inherit" ? undefined : role) } : undefined}>{line(w)}</div>;
    const root = useSkeletonPhase(() => props.animated);
    const avatar = () => (
      <div class="kjun-skeleton-avatar"
        style={css({
          // Like React: the root already carries a given width; repeating a percentage here would apply it twice.
          width: props.width ? "100%" : tokens.extensions.skeleton.avatarSize,
          height: props.height || tokens.extensions.skeleton.avatarSize,
          borderRadius: props.rounded ? tokens.radius.radius9999 : tokens.extensions.skeleton.blockRadius,
        })} />
    );
    const count = (n: number) => Array.from({ length: Math.max(0, Math.floor(n)) }, (_, i) => i + 1);
    return () => {
      const { type, rows, columns, height, width } = props;
      const sizes = tokens.extensions.skeleton;
      return (
        <div ref={root} aria-hidden={props.loadingText ? undefined : "true"} role={props.loadingText ? "status" : undefined}
          class={"kjun-skeleton" + (props.animated ? " kjun-skeleton-animated" : "")} data-type={type} style={css({ width })}>
          {props.loadingText && <span class="kjun-sr-only">{props.loadingText}</span>}
          {type === "text" && skeletonTextWidths(rows).map((w, i) => slot(w, undefined, i))}
          {type === "line" && slot("100%", props.role ?? "inherit")}
          {type === "avatar" && avatar()}
          {type === "card" && (
            <div class="kjun-skeleton-card">
              <div class="kjun-skeleton-card-header">{slot("40%", "cardTitle")}{slot("28%", "caption")}</div>
              {rows > 0 && <div class="kjun-skeleton-card-body">{skeletonTextWidths(rows).map((w, i) => slot(w, undefined, i))}</div>}
            </div>
          )}
          {type === "table" && (
            <div class="kjun-skeleton-table">
              {[0, ...count(rows)].map(row => (
                <div key={row} class={row === 0 ? "kjun-skeleton-table-header" : "kjun-skeleton-table-row"}>
                  {count(columns).map(col => (
                    <div key={col} class="kjun-skeleton-table-cell" data-align={col > 1 ? "end" : undefined}>
                      {slot(skeletonTableWidth(row, col - 1), row === 0 ? "caption" : "body")}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          )}
          {type === "stat" && <div class="kjun-skeleton-stat">{slot("40%", "caption")}{slot("64%", "displaySm")}{slot("30%", "caption")}</div>}
          {type === "block" && <div class="kjun-skeleton-block" style={css({ width: "100%", height: height ?? sizes.blockHeight })} />}
        </div>
      );
    };
  },
});

