import { computed, defineComponent, inject, onMounted, provide, ref, type ExtractPublicPropTypes, type PropType, type SlotsType, type VNodeChild } from "vue";
import { tokens, type CardRadius } from "@kjun-ui/tokens";
import { KjunIcon } from "./button";
import { useKjunId } from "./input";
import { hasContent } from "./runtime/slots";
import { warnNestedControls } from "../../../shared/package-runtime/nested-controls";
import { listRowKind, warnListRowProps } from "../../../shared/package-runtime/list-row";

const kjunListRowProps = {
  title: { type: String, required: true },
  description: { type: String, default: undefined },
  /** Icon name drawn in a 24px column; custom leading slot content uses a minimum 40px column and takes priority. */
  icon: { type: String, default: undefined },
  href: { type: String, default: undefined },
  disabled: { type: Boolean, default: false },
  /** Draws the title in the danger role, for rows such as "Delete account". */
  destructive: { type: Boolean, default: false },
  /** Ends the row with a decorative chevron that marks it as navigation. */
  chevron: { type: Boolean, default: false },
  /** One choice in a single-choice list: true draws a check at the end. A pressable row given it (true or false) reads as a radio. */
  selected: { type: Boolean, default: undefined },
  /** v-model:checked makes the whole row a switch: it draws one at the end and toggles on any press. */
  checked: { type: Boolean, default: undefined },
  /** Declared as a prop: a row is a button only when the app listens for clicks. */
  onClick: { type: Function as PropType<(event: MouseEvent) => void>, default: undefined },
  /** Name of a pressable or link row, e.g. with the amount a screen reader should hear. */
  ariaLabel: { type: String, default: undefined },
  /** Clamps the title (and the description) to this many lines, ending in an ellipsis. */
  titleLines: { type: Number, default: undefined },
  descriptionLines: { type: Number, default: undefined },
} as const;
export type KjunListRowProps = ExtractPublicPropTypes<typeof kjunListRowProps>;
/** Slots: default (display-only content under the description), leading, trailing, actions. Event: update:checked. */
export const KjunListRow = defineComponent({
  name: "KjunListRow",
  props: kjunListRowProps,
  emits: { "update:checked": (_checked: boolean) => true },
  slots: Object as SlotsType<{
    default?: () => VNodeChild;
    leading?: () => VNodeChild;
    trailing?: () => VNodeChild;
    actions?: () => VNodeChild;
  }>,
  setup(props, { slots, emit }) {
    const content = ref<HTMLElement | null>(null);
    // Like React: a switch row (checked) counts as pressable too.
    onMounted(() => {
      if (props.href || props.onClick || props.checked !== undefined) warnNestedControls(content.value, "KJUN ListRow: a pressable row's content contains buttons or links; move them to actions.");
      warnListRowProps(props);
    });
    return () => {
      const slotted = slots.leading?.(), trailing = slots.trailing?.(), actions = slots.actions?.(), body = slots.default?.();
      const hasLeading = hasContent(slotted);
      const leading = hasLeading ? slotted : props.icon ? <KjunIcon name={props.icon} class="kjun-list-icon" size={tokens.extensions.list.iconSize} /> : null;
      const contents = <>
        {leading && <span class="kjun-list-leading">{leading}</span>}
        <span class="kjun-list-body"><span class="kjun-list-title" data-clamp={props.titleLines ? "" : undefined} style={props.titleLines ? { WebkitLineClamp: props.titleLines } : undefined}>{props.title}</span>{props.description && <span class="kjun-list-description" data-clamp={props.descriptionLines ? "" : undefined} style={props.descriptionLines ? { WebkitLineClamp: props.descriptionLines } : undefined}>{props.description}</span>}{hasContent(body) && <span ref={content} class="kjun-list-content">{body}</span>}</span>
        {hasContent(trailing) && <span class="kjun-list-trailing">{trailing}</span>}
        {props.selected && <KjunIcon name="check" class="kjun-list-check" size={tokens.iconSizes.default} />}
        {props.checked !== undefined && <span class={"kjun-switch kjun-switch--md" + (props.checked ? " kjun-switch--on" : "")} aria-hidden="true"><span class="kjun-switch-thumb" /></span>}
        {props.chevron && <KjunIcon name="chevron-right" class="kjun-list-chevron" size={tokens.iconSizes.default} />}
      </>;
      const kind = listRowKind({ checked: props.checked, selected: props.selected, href: props.href, pressable: !!(props.href || props.onClick) });
      // Like React: a switch row is one switch control and the drawn switch is decoration; a choice row is a radio.
      const main = kind === "switch"
        ? <button class="kjun-list-main" type="button" role="switch" aria-checked={props.checked} aria-label={props.ariaLabel} disabled={props.disabled}
            onClick={(event: MouseEvent) => { emit("update:checked", !props.checked); props.onClick?.(event); }}>{contents}</button>
        : kind === "radio"
          ? <button class="kjun-list-main" type="button" role="radio" aria-checked={!!props.selected} aria-label={props.ariaLabel} disabled={props.disabled} onClick={(event: MouseEvent) => props.onClick?.(event)}>{contents}</button>
        : props.href
          ? <a class="kjun-list-main" href={props.disabled ? undefined : props.href} aria-label={props.ariaLabel} aria-disabled={props.disabled || undefined}
              onClick={(event: MouseEvent) => { if (props.disabled) event.preventDefault(); else props.onClick?.(event); }}>{contents}</a>
        : props.onClick
          ? <button class="kjun-list-main" type="button" aria-label={props.ariaLabel} disabled={props.disabled} onClick={(event: MouseEvent) => props.onClick?.(event)}>{contents}</button>
          : <div class="kjun-list-main">{contents}</div>;
      // A disabled row disables its actions too, so the row never reads as partly available.
      return <li class="kjun-list-row" data-leading={leading ? (hasLeading ? "" : "icon") : undefined} data-destructive={props.destructive || undefined} data-disabled={props.disabled || undefined}>{main}{hasContent(actions) && <div class="kjun-list-actions" data-disabled={props.disabled || undefined} inert={props.disabled || undefined}>{actions}</div>}</li>;
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
  /** Rounds the section on the card radius steps and clips its rows to the corners (default "none", or the KjunListGroup's). */
  radius: { type: String as PropType<CardRadius>, default: undefined },
  /** "title" is the 16px heading, "label" the small caption above the rows; by default a title with a description is a heading and one without is a label. */
  titleVariant: { type: String as PropType<"title" | "label">, default: undefined },
  /** Heading level of the title (default 3). */
  headingLevel: { type: Number as PropType<2 | 3 | 4>, default: 3 },
} as const;
export type KjunListSectionProps = ExtractPublicPropTypes<typeof kjunListSectionProps>;
// A ref, so a group whose variant changes updates its sections' corners too.
const kjunListGroupKey = Symbol("kjunListGroup");
/** Slots: default (KjunListRow items), actions, empty (in place of no rows), footer (supporting text under the rows). */
export const KjunListSection = defineComponent({
  name: "KjunListSection",
  props: kjunListSectionProps,
  slots: Object as SlotsType<{
    default?: () => VNodeChild;
    actions?: () => VNodeChild;
    empty?: () => VNodeChild;
    footer?: () => VNodeChild;
  }>,
  setup(props, { slots }) {
    const id = useKjunId("kjun-"), group = inject<{ value: "inset" | "flush" } | null>(kjunListGroupKey, null);
    return () => {
      const actions = slots.actions?.(), children = slots.default?.(), empty = slots.empty?.(), footer = slots.footer?.();
      const corner = props.radius ?? (group?.value === "inset" ? "lg" : "none");
      const label = props.titleVariant ? props.titleVariant === "label" : !!props.title && !props.description;
      // Like React: a rounded section with a label title keeps the label and footer on the page, around its card.
      const outside = corner !== "none" && !!props.title && label;
      const rounded = corner === "none" ? undefined : { borderRadius: `var(--_kjun-geometry-card-radii-${corner})` };
      const Heading = `h${props.headingLevel}` as "h3";
      const rows = hasContent(children)
        ? <ul class="kjun-list" aria-label={props.ariaLabel || undefined} aria-labelledby={props.ariaLabel || !props.title ? undefined : id} data-divider={props.divider ? undefined : "false"} data-density={props.density === "compact" ? "compact" : undefined}>{children}</ul>
        : hasContent(empty) ? <div class="kjun-list-empty">{empty}</div> : null;
      return (
        <section class="kjun-list-section" data-surface={props.surface ? undefined : "false"} data-outside={outside || undefined}
          // The list carries the name; a named section would make every settings group a page landmark.
          data-radius={corner === "none" || outside ? undefined : corner} style={outside ? undefined : rounded}>
          {(props.title || props.description || hasContent(actions)) && (
            <div class="kjun-list-heading" data-bare={props.title && label ? "" : undefined}><div>{props.title && <Heading id={id}>{props.title}</Heading>}{props.description && <p>{props.description}</p>}</div>{hasContent(actions) && <div class="kjun-list-heading-actions">{actions}</div>}</div>
          )}
          {outside ? <div class="kjun-list-panel" data-surface={props.surface ? undefined : "false"} style={rounded}>{rows}</div> : rows}
          {hasContent(footer) && <div class="kjun-list-footer">{footer}</div>}
        </section>
      );
    };
  },
});

const kjunListGroupProps = {
  /** "inset" (default) rounds every section and keeps them 24px apart; "flush" keeps square sections 8px apart. */
  variant: { type: String as PropType<"inset" | "flush">, default: "inset" },
} as const;
export type KjunListGroupProps = ExtractPublicPropTypes<typeof kjunListGroupProps>;
/** Stacks KjunListSections with one spacing and corner rule. Slot: default (KjunListSection items). */
export const KjunListGroup = defineComponent({
  name: "KjunListGroup",
  props: kjunListGroupProps,
  slots: Object as SlotsType<{ default?: () => VNodeChild }>,
  setup(props, { slots }) {
    provide(kjunListGroupKey, computed(() => props.variant));
    return () => <div class="kjun-list-group" data-variant={props.variant}>{slots.default?.()}</div>;
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
