import { useKjunMessages } from "./runtime/messages";
import { defineComponent, inject, mergeProps, onBeforeUnmount, onMounted, onUpdated, ref, type ExtractPublicPropTypes, type PropType, type SlotsType, type VNodeChild } from "vue";
import { tokens, type ButtonSize, type ButtonVariant } from "@kjun-ui/tokens";
import { typeStyle } from "../../../shared/package-runtime/typography";
import { KjunButton, KjunIcon } from "./button";
import { KjunSpinner } from "./display";
import { useOptionalKjunFeedback } from "./feedback";
import { KjunTooltip, type KjunTooltipProps } from "./popover";
import { kjunTopNavigationKey } from "./runtime/keys";
import { useReducedMotion } from "./runtime/presence";
import { css } from "./runtime/style";

type Placement = KjunTooltipProps["placement"];
const kjunIconToggleProps = {
  active: { type: Boolean, default: false },
  activeIcon: { type: String, required: true },
  inactiveIcon: { type: String, default: undefined },
  activeColorClass: { type: String, default: "" },
  inactiveColorClass: { type: String, default: "" },
  activeColor: { type: String, default: "var(--_kjun-color-brand)" },
  inactiveColor: { type: String, default: "var(--_kjun-color-text-tertiary)" },
  size: { type: String as PropType<ButtonSize>, default: "md" },
  disabled: { type: Boolean, default: false },
  loading: { type: Boolean, default: false },
  ariaLabel: { type: String, required: true },
  /** Defaults to ariaLabel, like RefreshButton; an empty string disables the hint. */
  tooltip: { type: String, default: undefined },
  tooltipPlacement: { type: String as PropType<Placement>, default: undefined },
  tooltipDelay: { type: Number, default: undefined },
} as const;
export type KjunIconToggleProps = ExtractPublicPropTypes<typeof kjunIconToggleProps>;
/** Event: toggle. The app owns `active`. */
export const KjunIconToggle = defineComponent({
  name: "KjunIconToggle",
  props: kjunIconToggleProps,
  emits: { toggle: () => true },
  setup(props, { emit }) {
    const navigation = inject(kjunTopNavigationKey, null);
    return () => (
      <KjunTooltip content={props.disabled || props.loading ? "" : props.tooltip ?? props.ariaLabel} placement={props.tooltipPlacement} delay={props.tooltipDelay}>
        <button type="button" aria-label={props.ariaLabel} aria-pressed={props.active} aria-busy={props.loading || undefined}
          disabled={props.disabled || props.loading} class="kjun-icon-toggle" data-size={props.size}
          style={navigation ? css({ width: navigation.controlSize, height: navigation.controlSize }) : undefined}
          onClick={(event: MouseEvent) => { event.stopPropagation(); emit("toggle"); }}>
          {props.loading
            ? navigation ? <KjunIcon name="loader-2" spin size={navigation.iconSize} /> : <KjunSpinner size="sm" />
            : <KjunIcon name={props.active ? props.activeIcon : props.inactiveIcon || props.activeIcon} filled={props.active}
                size={navigation?.iconSize ?? tokens.button.iconSizes[props.size]}
                // Passed as a variable so the shared hover rule can darken the inactive icon. An app color
                // class opts the icon out of KJUN's color rules, so the class color shows.
                style={{ "--_kjun-icon-toggle-color": props.active ? props.activeColor : props.inactiveColor }}
                class={props.active ? props.activeColorClass : props.inactiveColorClass}
                data-kjun-color-class={(props.active ? props.activeColorClass : props.inactiveColorClass) ? "" : undefined} />}
        </button>
      </KjunTooltip>
    );
  },
});

async function browserCopy(value: string) {
  if (navigator.clipboard && window.isSecureContext) {
    await navigator.clipboard.writeText(value);
    return;
  }
  const previous = document.activeElement as HTMLElement | null, ta = document.createElement("textarea");
  ta.value = value;
  ta.style.cssText = "position:fixed;left:-9999px;top:-9999px";
  document.body.append(ta);
  ta.select();
  try {
    if (!document.execCommand("copy")) throw Error("Clipboard copy failed");
  } finally {
    ta.remove();
    previous?.focus();
  }
}
const kjunCopyButtonProps = {
  value: { type: String, required: true },
  ariaLabel: { type: String, default: undefined },
  text: { type: String, default: undefined },
  successText: { type: String, default: undefined },
  inline: { type: Boolean, default: false },
  size: { type: String as PropType<"xs" | "sm" | "md">, default: "sm" },
  disabled: { type: Boolean, default: false },
  copyText: { type: Function as PropType<(value: string) => void | Promise<void>>, default: browserCopy },
} as const;
export type KjunCopyButtonProps = ExtractPublicPropTypes<typeof kjunCopyButtonProps>;
/** Events: copied(value), copy-error(error). Announces through the feedback toast when a provider is present. */
export const KjunCopyButton = defineComponent({
  name: "KjunCopyButton",
  inheritAttrs: false,
  props: kjunCopyButtonProps,
  emits: { copied: (_value: string) => true, "copy-error": (_error: unknown) => true },
  setup(props, { attrs, emit }) {
    const m = useKjunMessages();
    const feedback = useOptionalKjunFeedback();
    const copied = ref(false), failed = ref(false);
    let busy = false, mounted = true, timer: ReturnType<typeof setTimeout> | undefined;
    onBeforeUnmount(() => { mounted = false; clearTimeout(timer); });
    const copy = async (event: MouseEvent) => {
      event.stopPropagation();
      if (copied.value || busy) return;
      busy = true;
      try {
        await props.copyText(props.value);
        if (mounted) {
          copied.value = true; failed.value = false;
          feedback?.toast.success((props.successText ?? m.value.copied));
          emit("copied", props.value);
          timer = setTimeout(() => { copied.value = false; }, 1500);
        }
      } catch (error) {
        if (mounted) {
          failed.value = true;
          feedback?.toast.error(m.value.copyFailed);
          emit("copy-error", error);
        }
      } finally {
        busy = false;
      }
    };
    return () => <>
      <button {...mergeProps(attrs, { class: "kjun-copy-button", onClick: (event: MouseEvent) => { if (!event.defaultPrevented) void copy(event); } })}
        type="button" disabled={props.disabled} aria-label={props.ariaLabel || attrs["aria-label"] as string || props.text || m.value.copy}
        data-inline={String(props.inline)}
        style={[css({
          ...typeStyle(props.size === "xs" ? "controlSmall" : "control"),
          minHeight: tokens.button.heights[props.size], paddingBlock: 0,
          paddingInline: { xs: tokens.dimension.value4, sm: tokens.dimension.value8, md: tokens.dimension.value12 }[props.size],
        }), attrs.style as never]}>
        <KjunIcon name={copied.value ? "check" : "copy"} size={tokens.button.iconSizes[props.size]}
          style={{ color: copied.value ? "var(--_kjun-color-success)" : undefined }} />
        {props.text && !props.inline && <span>{copied.value ? (props.successText ?? m.value.copied) : props.text}</span>}
      </button>
      <span role={feedback ? undefined : "status"} aria-hidden={feedback ? true : undefined} class="kjun-sr-only">
        {copied.value ? (props.successText ?? m.value.copied) : failed.value ? m.value.copyFailed : ""}
      </span>
    </>;
  },
});

const kjunRefreshButtonProps = {
  targetName: { type: String, default: "" },
  mode: { type: String as PropType<"icon" | "text">, default: "icon" },
  text: { type: String, default: undefined },
  size: { type: String as PropType<ButtonSize>, default: "sm" },
  variant: { type: String as PropType<ButtonVariant>, default: "ghost" },
  disabled: { type: Boolean, default: false },
  loading: { type: Boolean, default: false },
  block: { type: Boolean, default: false },
  ariaLabel: { type: String, default: undefined },
  title: { type: String, default: undefined },
  /** Defaults to the icon button's accessible label; an empty string disables it. */
  tooltip: { type: String, default: undefined },
  tooltipPlacement: { type: String as PropType<Placement>, default: undefined },
  tooltipDelay: { type: Number, default: undefined },
  spinOnLoading: { type: Boolean, default: true },
} as const;
export type KjunRefreshButtonProps = ExtractPublicPropTypes<typeof kjunRefreshButtonProps>;
/** Event: refresh. */
export const KjunRefreshButton = defineComponent({
  name: "KjunRefreshButton",
  props: kjunRefreshButtonProps,
  emits: { refresh: () => true },
  setup(props, { emit }) {
    const m = useKjunMessages();
    const reduced = useReducedMotion();
    return () => {
      // Text mode speaks what it shows (WCAG 2.5.3); icon mode keeps the action name.
      const label = props.ariaLabel || [props.targetName, props.mode === "text" ? (props.text ?? m.value.refresh) : m.value.refresh].filter(Boolean).join(" ");
      const hint = props.tooltip ?? props.title ?? (props.mode === "icon" ? label : "");
      return (
        <KjunTooltip content={props.disabled || props.loading ? "" : hint} placement={props.tooltipPlacement} delay={props.tooltipDelay}>
          <KjunButton size={props.size} variant={props.variant} disabled={props.disabled} loading={props.loading} block={props.block}
            prefixIcon="refresh" spinOnLoading={!reduced.value && props.spinOnLoading} ariaLabel={label} onClick={() => emit("refresh")}>
            {props.mode === "text" ? (props.text ?? m.value.refresh) : undefined}
          </KjunButton>
        </KjunTooltip>
      );
    };
  },
});

export function safeExternalUrl(href: string) {
  try {
    const url = new URL(href);
    return ["http:", "https:"].includes(url.protocol) ? url.href : "";
  } catch {
    return "";
  }
}
const kjunExternalLinkProps = {
  href: { type: String, default: "" },
  mode: { type: String as PropType<"icon" | "text">, default: "text" },
  label: { type: String, default: undefined },
} as const;
export type KjunExternalLinkProps = ExtractPublicPropTypes<typeof kjunExternalLinkProps>;
/** Opens only http(s) URLs in a new window; anything else renders as plain text. */
export const KjunExternalLink = defineComponent({
  name: "KjunExternalLink",
  props: kjunExternalLinkProps,
  slots: Object as SlotsType<{ default?: () => VNodeChild }>,
  setup(props, { slots }) {
    const m = useKjunMessages();
    return () => {
      const url = safeExternalUrl(props.href), name = props.label || (props.mode === "icon" ? m.value.externalLink : undefined);
      const body = props.mode === "icon" ? <KjunIcon name="external-link" /> : slots.default?.();
      return url ? (
        <a href={url} target="_blank" rel="noopener noreferrer" aria-label={name ? name + m.value.newWindow : undefined} title={name}
          class="kjun-external-link" onClick={(event: MouseEvent) => event.stopPropagation()}>
          {body}
          {props.mode === "text" && <KjunIcon name="external-link" size={tokens.iconSizes.small} class="kjun-external-link-icon" />}
          {!name && <span class="kjun-sr-only">{m.value.newWindow}</span>}
        </a>
      ) : <span aria-label={name}>{body}</span>;
    };
  },
});

/** Fades whichever horizontal edge still has content to scroll to. */
export const KjunScrollFade = defineComponent({
  name: "KjunScrollFade",
  slots: Object as SlotsType<{ default?: () => VNodeChild }>,
  setup(_, { slots }) {
    const root = ref<HTMLElement | null>(null), edges = ref({ left: false, right: false });
    const update = () => {
      const el = root.value;
      if (!el) return;
      const next = { left: el.scrollLeft > 1, right: el.scrollLeft + el.clientWidth < el.scrollWidth - 1 };
      if (next.left !== edges.value.left || next.right !== edges.value.right) edges.value = next;
    };
    let observer: ResizeObserver | undefined;
    const observe = () => {
      observer?.disconnect();
      update();
      observer = new ResizeObserver(update);
      if (root.value) {
        observer.observe(root.value);
        Array.from(root.value.children).forEach(el => observer!.observe(el));
      }
    };
    onMounted(observe);
    onUpdated(observe);
    onBeforeUnmount(() => observer?.disconnect());
    return () => {
      const { left, right } = edges.value, width = tokens.extensions.scrollFade.width;
      const mask = left || right
        ? `linear-gradient(to right, ${left ? `transparent, currentColor ${width}px` : "currentColor"}, ${right ? `currentColor calc(100% - ${width}px), transparent` : "currentColor"})`
        : undefined;
      return <div ref={root} onScroll={update} class="kjun-scroll-fade" style={{ maskImage: mask, WebkitMaskImage: mask }}>{slots.default?.()}</div>;
    };
  },
});
