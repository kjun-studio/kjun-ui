import { computed, defineComponent, inject, onMounted, provide, ref, watchEffect, type ExtractPublicPropTypes, type PropType, type SlotsType, type VNodeChild } from "vue";
import { tokens, type CardRadius } from "@kjun-ui/tokens";
import { KjunIcon } from "./button";
import { useKjunId } from "./input";
import { hasContent } from "./runtime/slots";
import { warnNestedControls } from "../../../shared/package-runtime/nested-controls";
import { listRowKind, listSectionShape, warnListRowProps } from "../../../shared/package-runtime/list-row";
import { bindRadioKeyboard } from "../../../shared/package-runtime/radio-keyboard";

// True inside a single-choice section, whose list is a radiogroup.
const kjunListChoiceKey = Symbol("kjunListChoice");

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
    const content = ref<HTMLElement | null>(null), choice = inject<{ value: boolean } | null>(kjunListChoiceKey, null);
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
      // In a single-choice section the list is a radiogroup, so its items drop their listitem role.
      return <li class="kjun-list-row" role={choice?.value ? "none" : undefined} data-leading={leading ? (hasLeading ? "" : "icon") : undefined} data-destructive={props.destructive || undefined} data-disabled={props.disabled || undefined}>{main}{hasContent(actions) && <div class="kjun-list-actions" data-disabled={props.disabled || undefined} inert={props.disabled || undefined}>{actions}</div>}</li>;
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
  /** Rounds the rows into a card on the card radius steps; the title, actions and footer stay outside it (default "none", or the KjunListGroup's). */
  radius: { type: String as PropType<CardRadius>, default: undefined },
  /** "title" is the 16px heading, "label" the small caption above the rows; by default a title with a description is a heading and one without is a label. */
  titleVariant: { type: String as PropType<"title" | "label">, default: undefined },
  /** Heading level of the title (default 3). */
  headingLevel: { type: Number as PropType<2 | 3 | 4>, default: 3 },
  /** "single": the rows are one choice (rows given `selected`); the list becomes a radio group with one Tab stop and arrow keys. */
  selectionMode: { type: String as PropType<"none" | "single">, default: "none" },
} as const;
export type KjunListSectionProps = ExtractPublicPropTypes<typeof kjunListSectionProps>;
// A ref, so a group whose variant changes updates its sections' corners too.
const kjunListGroupKey = Symbol("kjunListGroup");
/** Slots: default (KjunListRow items), actions, loading (in place of the rows while they load), empty (in place of no rows), footer. */
export const KjunListSection = defineComponent({
  name: "KjunListSection",
  props: kjunListSectionProps,
  slots: Object as SlotsType<{
    default?: () => VNodeChild;
    actions?: () => VNodeChild;
    loading?: () => VNodeChild;
    empty?: () => VNodeChild;
    footer?: () => VNodeChild;
  }>,
  setup(props, { slots }) {
    const id = useKjunId("kjun-"), group = inject<{ value: "inset" | "flush" } | null>(kjunListGroupKey, null);
    const choice = computed(() => props.selectionMode === "single"), list = ref<HTMLElement | null>(null);
    provide(kjunListChoiceKey, choice);
    watchEffect(onCleanup => { if (choice.value && list.value) onCleanup(bindRadioKeyboard(list.value)); }, { flush: "post" });
    return () => {
      const actions = slots.actions?.(), children = slots.default?.(), loading = slots.loading?.(), empty = slots.empty?.(), footer = slots.footer?.();
      // Like React: a rounded section is a card of rows only; its title, actions and footer stay on the page around it.
      const { corner, bare, outside } = listSectionShape({ radius: props.radius, group: group?.value, title: props.title, description: props.description, titleVariant: props.titleVariant });
      const rounded = corner === "none" ? undefined : { borderRadius: `var(--_kjun-geometry-card-radii-${corner})` };
      const Heading = `h${props.headingLevel}` as "h3", compact = props.density === "compact" ? "compact" : undefined;
      // The list carries the name and the description; a named section would make every settings group a page landmark.
      const rows = hasContent(loading) ? <div class="kjun-list-loading" aria-busy="true">{loading}</div>
        : hasContent(children)
        ? <ul ref={list} class="kjun-list" role={choice.value ? "radiogroup" : undefined} aria-label={props.ariaLabel || undefined} aria-labelledby={props.ariaLabel || !props.title ? undefined : id} aria-describedby={props.description ? id + "-description" : undefined} data-divider={props.divider ? undefined : "false"} data-density={compact}>{children}</ul>
        : hasContent(empty) ? <div class="kjun-list-empty" data-density={compact}>{empty}</div> : null;
      return (
        <section class="kjun-list-section" data-surface={props.surface ? undefined : "false"} data-outside={outside || undefined}>
          {(props.title || props.description || hasContent(actions)) && (
            <div class="kjun-list-heading" data-bare={bare ? "" : undefined}><div>{props.title && <Heading id={id}>{props.title}</Heading>}{props.description && <p id={id + "-description"}>{props.description}</p>}</div>{hasContent(actions) && <div class="kjun-list-heading-actions">{actions}</div>}</div>
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
    const choice = inject<{ value: boolean } | null>(kjunListChoiceKey, null);
    return () => <li class="kjun-list-item" role={choice?.value ? "none" : undefined}>{slots.default?.()}</li>;
  },
});
export type KjunListItemProps = Record<string, never>;
