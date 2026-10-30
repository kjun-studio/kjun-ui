import { defineComponent, onMounted, ref, type ExtractPublicPropTypes, type PropType, type SlotsType, type VNodeChild } from "vue";
import { tokens, type CardRadius } from "@kjun-ui/tokens";
import { KjunIcon } from "./button";
import { useKjunId } from "./input";
import { hasContent } from "./runtime/slots";
import { warnNestedControls } from "../../../shared/package-runtime/nested-controls";

const kjunListRowProps = {
  title: { type: String, required: true },
  description: { type: String, default: undefined },
  /** Icon name drawn in the leading column at the list icon size; the leading slot replaces it when both are given. */
  icon: { type: String, default: undefined },
  href: { type: String, default: undefined },
  disabled: { type: Boolean, default: false },
  /** Draws the title in the danger role, for rows such as "Delete account". */
  destructive: { type: Boolean, default: false },
  /** Ends the row with a decorative chevron that marks it as navigation. */
  chevron: { type: Boolean, default: false },
  /** Declared as a prop: a row is a button only when the app listens for clicks. */
  onClick: { type: Function as PropType<(event: MouseEvent) => void>, default: undefined },
  /** Name of a pressable or link row, e.g. with the amount a screen reader should hear. */
  ariaLabel: { type: String, default: undefined },
} as const;
export type KjunListRowProps = ExtractPublicPropTypes<typeof kjunListRowProps>;
/** Slots: default (display-only content under the description), leading, trailing, actions. */
export const KjunListRow = defineComponent({
  name: "KjunListRow",
  props: kjunListRowProps,
  slots: Object as SlotsType<{
    default?: () => VNodeChild;
    leading?: () => VNodeChild;
    trailing?: () => VNodeChild;
    actions?: () => VNodeChild;
  }>,
  setup(props, { slots }) {
    const content = ref<HTMLElement | null>(null);
    onMounted(() => { if (props.href || props.onClick) warnNestedControls(content.value, "KJUN ListRow: a pressable row's content contains buttons or links; move them to actions."); });
    return () => {
      const slotted = slots.leading?.(), trailing = slots.trailing?.(), actions = slots.actions?.(), body = slots.default?.();
      const leading = hasContent(slotted) ? slotted : props.icon ? <KjunIcon name={props.icon} class="kjun-list-icon" size={tokens.extensions.list.iconSize} /> : null;
      const contents = <>
        {leading && <span class="kjun-list-leading">{leading}</span>}
        <span class="kjun-list-body"><span class="kjun-list-title">{props.title}</span>{props.description && <span class="kjun-list-description">{props.description}</span>}{hasContent(body) && <span ref={content} class="kjun-list-content">{body}</span>}</span>
        {hasContent(trailing) && <span class="kjun-list-trailing">{trailing}</span>}
        {props.chevron && <KjunIcon name="chevron-right" class="kjun-list-chevron" size={tokens.iconSizes.default} />}
      </>;
      const main = props.href
        ? <a class="kjun-list-main" href={props.disabled ? undefined : props.href} aria-label={props.ariaLabel} aria-disabled={props.disabled || undefined}
            onClick={(event: MouseEvent) => { if (props.disabled) event.preventDefault(); else props.onClick?.(event); }}>{contents}</a>
        : props.onClick
          ? <button class="kjun-list-main" type="button" aria-label={props.ariaLabel} disabled={props.disabled} onClick={(event: MouseEvent) => props.onClick?.(event)}>{contents}</button>
          : <div class="kjun-list-main">{contents}</div>;
      // A disabled row disables its actions too, so the row never reads as partly available.
      return <li class="kjun-list-row" data-leading={leading ? "" : undefined} data-destructive={props.destructive || undefined}>{main}{hasContent(actions) && <div class="kjun-list-actions" data-disabled={props.disabled || undefined} inert={props.disabled || undefined}>{actions}</div>}</li>;
    };
  },
});

const kjunListSectionProps = {
  title: { type: String, default: undefined },
  description: { type: String, default: undefined },
  ariaLabel: { type: String, default: undefined },
  /** Paints the surface background (default true); false lets the page background show through. */
  surface: { type: Boolean, default: true },
  /** Draws dividers between rows (default true). */
  divider: { type: Boolean, default: true },
  /** "compact" rows keep the 16px inset but are 44 tall (the touch minimum) instead of 56. */
  density: { type: String as PropType<"default" | "compact">, default: "default" },
  /** Rounds the section on the card radius steps and clips its rows to the corners (default "none"). */
  radius: { type: String as PropType<CardRadius>, default: "none" },
} as const;
export type KjunListSectionProps = ExtractPublicPropTypes<typeof kjunListSectionProps>;
/** Slots: default (KjunListRow items), actions. */
export const KjunListSection = defineComponent({
  name: "KjunListSection",
  props: kjunListSectionProps,
  slots: Object as SlotsType<{
    default?: () => VNodeChild;
    actions?: () => VNodeChild;
  }>,
  setup(props, { slots }) {
    const id = useKjunId("kjun-");
    return () => {
      const actions = slots.actions?.();
      return (
        <section class="kjun-list-section" data-surface={props.surface ? undefined : "false"}
          data-radius={props.radius === "none" ? undefined : props.radius} style={props.radius === "none" ? undefined : { borderRadius: `var(--_kjun-geometry-card-radii-${props.radius})` }} aria-labelledby={props.title ? id : undefined} aria-label={props.title ? undefined : props.ariaLabel}>
          {(props.title || props.description || hasContent(actions)) && (
            <div class="kjun-list-heading" data-bare={props.title && !props.description ? "" : undefined}><div>{props.title && <h3 id={id}>{props.title}</h3>}{props.description && <p>{props.description}</p>}</div>{actions}</div>
          )}
          <ul class="kjun-list" aria-label={props.ariaLabel || props.title} data-divider={props.divider ? undefined : "false"} data-density={props.density === "compact" ? "compact" : undefined}>{slots.default?.()}</ul>
        </section>
      );
    };
  },
});

/** Non-row content inside a KjunListSection (a theme switcher, a note) on the rows' inset and dividers. Slot: default. */
export const KjunListItem = defineComponent({
  name: "KjunListItem",
  slots: Object as SlotsType<{ default?: () => VNodeChild }>,
  setup(_, { slots }) {
    return () => <li class="kjun-list-item">{slots.default?.()}</li>;
  },
});
export type KjunListItemProps = Record<string, never>;
