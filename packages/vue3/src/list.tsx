import { computed, defineComponent, inject, onMounted, provide, ref, watchEffect, type ExtractPublicPropTypes, type PropType, type SlotsType, type VNodeChild } from "vue";
import { tokens, type CardRadius } from "@kjun-ui/tokens";
import { KjunIcon } from "./button";
import { useKjunId } from "./input";
import { hasContent } from "./runtime/slots";
import { listLeadingGeometry, type ListLeadingSize } from "../../../shared/package-runtime/list-leading";
import { warnNestedControls } from "../../../shared/package-runtime/nested-controls";
import { listRowChoice, listRowKind, listSectionShape, observeListHeadingActions, warnListRowProps, type ListChoiceValue, type ListGroupVariant, type ListSectionVariant, type ListSelection, type ListSelectionMode } from "../../../shared/package-runtime/list-row";
import { bindRadioKeyboard } from "../../../shared/package-runtime/radio-keyboard";
export type { ListChoiceValue } from "../../../shared/package-runtime/list-row";
export type { ListLeadingSize } from "../../../shared/package-runtime/list-leading";

// The section's selection mode and, when it owns the value, that value (a single-choice list is a radiogroup), and
// whether the section is open, which changes how a row draws its icon and its choice.
type ListRowSelection = ListSelection & { open?: boolean };
const kjunListSelectionKey = Symbol("kjunListSelection");
const noSelection: ListRowSelection = { mode: "none" };

const kjunListRowProps = {
  title: { type: String, required: true },
  description: { type: String, default: undefined },
  /** Icon name drawn in a 24px column (on a 40px rounded square in an open section); custom leading slot content uses a minimum 40px column and takes priority. */
  icon: { type: String, default: undefined },
  /** Leading square/icon sizes: xs 24/16, sm 32/20, md 40/24, lg 56/28. */
  leadingSize: { type: String as PropType<ListLeadingSize>, default: undefined },
  /** App-owned CSS color for the built-in icon; overrides its default/destructive color. */
  iconColor: { type: String, default: undefined },
  /** App-owned circular background color for the built-in icon; defaults leadingSize to sm. */
  iconBackground: { type: String, default: undefined },
  href: { type: String, default: undefined },
  disabled: { type: Boolean, default: false },
  /** Draws the title in the danger role, for rows such as "Delete account". */
  destructive: { type: Boolean, default: false },
  /** Ends the row with a decorative chevron that marks it as navigation. */
  chevron: { type: Boolean, default: false },
  /** One choice in a single-choice list: true draws a check at the end (in an open section, a filled mark; unchosen rows an empty one). A pressable row given it (true or false) reads as a radio. */
  selected: { type: Boolean, default: undefined },
  /** v-model:checked makes the whole row a switch: it draws one at the end and toggles on any press. */
  checked: { type: Boolean, default: undefined },
  /** This row's value in a section that owns its selection (v-model on the section): it is selected when the section's value holds it. */
  value: { type: [String, Number] as PropType<ListChoiceValue>, default: undefined },
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
    const content = ref<HTMLElement | null>(null), selection = inject<{ value: ListRowSelection } | null>(kjunListSelectionKey, null);
    // Like React: the row's choice comes from the section when the section owns the value.
    const state = computed(() => {
      const current = selection?.value ?? noSelection, choice = listRowChoice(current, props.value, props.selected);
      const press = choice.press, onClick = press ? (event: MouseEvent) => { press(); props.onClick?.(event); } : props.onClick;
      const kind = listRowKind({ checked: props.checked, selected: choice.selected, href: props.href, pressable: !!(props.href || onClick), mode: current.mode });
      return { mode: current.mode, open: !!current.open, selected: choice.selected, onClick, kind };
    });
    // Like React: a switch row (checked) counts as pressable too.
    onMounted(() => {
      if (state.value.kind !== "static") warnNestedControls(content.value, "KJUN ListRow: a pressable row's content contains buttons or links; move them to actions.");
    });
    // Like React, the warnings follow prop changes, not only the first render.
    watchEffect(() => {
      const { kind, mode, selected } = state.value;
      warnListRowProps({ checked: props.checked, selected, href: props.href, chevron: props.chevron, looseChoice: (kind === "radio" || kind === "checkbox") && mode === "none" });
    });
    return () => {
      const { selected, onClick, kind, mode, open } = state.value;
      const slotted = slots.leading?.(), trailing = slots.trailing?.(), actions = slots.actions?.(), body = slots.default?.();
      const hasLeading = hasContent(slotted);
      const geometry = listLeadingGeometry({ size: props.leadingSize, custom: hasLeading, background: props.iconBackground != null, open });
      const glyph = props.icon ? <KjunIcon name={props.icon} class="kjun-list-icon" size={geometry.iconSize} style={{ color: props.iconColor }} /> : null;
      const leading = hasLeading ? slotted : glyph && geometry.tile ? <span class="kjun-list-icon-background" style={props.iconBackground != null ? { backgroundColor: props.iconBackground } : undefined} aria-hidden="true">{glyph}</span> : glyph;
      // Like React: an open section's choice rows draw a mark, empty until chosen; other rows draw a check when selected.
      const choiceRow = kind === "radio" || kind === "checkbox";
      const mark = open && choiceRow ? <span class="kjun-list-mark" data-kind={kind} data-checked={selected ? "" : undefined} aria-hidden="true">{selected && <KjunIcon name="check" size={tokens.extensions.list.open.markIconSize} />}</span>
        : selected && <KjunIcon name="check" class="kjun-list-check" size={tokens.iconSizes.default} />;
      const leadingStyle = leading && geometry.size ? { "--_kjun-list-leading-width": `${geometry.width}px`, "--_kjun-list-leading-height": `${geometry.width}px` } : undefined;
      const contents = <>
        {leading && <span class="kjun-list-leading">{leading}</span>}
        <span class="kjun-list-body"><span class="kjun-list-title" data-clamp={props.titleLines ? "" : undefined} style={props.titleLines ? { WebkitLineClamp: props.titleLines } : undefined}>{props.title}</span>{props.description && <span class="kjun-list-description" data-clamp={props.descriptionLines ? "" : undefined} style={props.descriptionLines ? { WebkitLineClamp: props.descriptionLines } : undefined}>{props.description}</span>}{hasContent(body) && <span ref={content} class="kjun-list-content">{body}</span>}</span>
        {hasContent(trailing) && <span class="kjun-list-trailing">{trailing}</span>}
        {mark}
        {props.checked !== undefined && <span class={"kjun-switch kjun-switch--md" + (props.checked ? " kjun-switch--on" : "")} aria-hidden="true"><span class="kjun-switch-thumb" /></span>}
        {props.chevron && <KjunIcon name="chevron-right" class="kjun-list-chevron" size={tokens.iconSizes.default} />}
      </>;
      // Like React: a switch row is one switch control and the drawn switch is decoration; a choice row is a radio (a
      // checkbox in a multiple-choice section).
      const main = kind === "switch"
        ? <button class="kjun-list-main" type="button" role="switch" aria-checked={props.checked} aria-label={props.ariaLabel} disabled={props.disabled}
            onClick={(event: MouseEvent) => { emit("update:checked", !props.checked); onClick?.(event); }}>{contents}</button>
        : choiceRow
          ? <button class="kjun-list-main" type="button" role={kind} aria-checked={!!selected} aria-label={props.ariaLabel} disabled={props.disabled} onClick={(event: MouseEvent) => onClick?.(event)}>{contents}</button>
        : props.href
          ? <a class="kjun-list-main" href={props.disabled ? undefined : props.href} aria-label={props.ariaLabel} aria-disabled={props.disabled || undefined}
              onClick={(event: MouseEvent) => { if (props.disabled) event.preventDefault(); else onClick?.(event); }}>{contents}</a>
        : onClick
          ? <button class="kjun-list-main" type="button" aria-label={props.ariaLabel} disabled={props.disabled} onClick={(event: MouseEvent) => onClick?.(event)}>{contents}</button>
          : <div class="kjun-list-main">{contents}</div>;
      // A disabled row disables its actions too, so the row never reads as partly available.
      // In a single-choice section the list is a radiogroup, so its items drop their listitem role.
      return <li class="kjun-list-row" role={mode === "single" ? "none" : undefined} data-leading={leading ? (hasLeading ? "" : "icon") : undefined} data-leading-size={leading ? geometry.size : undefined} style={leadingStyle} data-destructive={props.destructive || undefined} data-disabled={props.disabled || undefined}>{main}{hasContent(actions) && <div class="kjun-list-actions" data-disabled={props.disabled || undefined} inert={props.disabled || undefined}>{actions}</div>}</li>;
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
  /** Rounds the rows into a card on the card radius steps; the title, actions and footer stay outside it (default "none", or the KjunListGroup's). An open section has no card. */
  radius: { type: String as PropType<CardRadius>, default: undefined },
  /** "open" puts the rows on the page with no card or dividers: larger titles, icons on rounded squares, and a filled mark for the chosen row (default "default", or "open" in an open KjunListGroup). */
  variant: { type: String as PropType<ListSectionVariant>, default: undefined },
  /** "title" is the 16px heading, "label" the small caption above the rows; by default a title with a description is a heading and one without is a label. */
  titleVariant: { type: String as PropType<"title" | "label">, default: undefined },
  /** Heading level of the title (default 3). */
  headingLevel: { type: Number as PropType<2 | 3 | 4>, default: 3 },
  /** "single": the rows are one choice and the list a radio group with one Tab stop and arrow keys; "multiple": each row is a checkbox. Rows are choices when given `selected`, or a `value` with the section's v-model. */
  selectionMode: { type: String as PropType<ListSelectionMode>, default: "none" },
  /** v-model: the chosen rows' values, owned by the app: one value (null for none) with "single", a list with "multiple". */
  modelValue: { type: [String, Number, Array] as PropType<ListChoiceValue | null | ListChoiceValue[]>, default: undefined },
} as const;
export type KjunListSectionProps = ExtractPublicPropTypes<typeof kjunListSectionProps>;
// A ref, so a group whose variant changes updates its sections' corners too.
const kjunListGroupKey = Symbol("kjunListGroup");
/** Slots: default (KjunListRow items), actions, loading (in place of the rows while they load), empty (in place of no rows), footer. Event: update:modelValue. */
export const KjunListSection = defineComponent({
  name: "KjunListSection",
  props: kjunListSectionProps,
  emits: { "update:modelValue": (_value: ListChoiceValue | ListChoiceValue[]) => true },
  slots: Object as SlotsType<{
    default?: () => VNodeChild;
    actions?: () => VNodeChild;
    loading?: () => VNodeChild;
    empty?: () => VNodeChild;
    footer?: () => VNodeChild;
  }>,
  setup(props, { slots, emit }) {
    const id = useKjunId("kjun-"), group = inject<{ value: ListGroupVariant } | null>(kjunListGroupKey, null);
    const choice = computed(() => props.selectionMode === "single"), list = ref<HTMLElement | null>(null), actionsBox = ref<HTMLElement | null>(null);
    const shape = computed(() => listSectionShape({ radius: props.radius, group: group?.value, variant: props.variant, title: props.title, description: props.description, titleVariant: props.titleVariant }));
    provide(kjunListSelectionKey, computed<ListRowSelection>(() => ({ mode: props.selectionMode, value: props.modelValue, open: shape.value.open, onValueChange: ((value: ListChoiceValue | ListChoiceValue[]) => emit("update:modelValue", value)) as ListSelection["onValueChange"] })));
    watchEffect(onCleanup => { if (choice.value && list.value) onCleanup(bindRadioKeyboard(list.value)); }, { flush: "post" });
    watchEffect(onCleanup => { if (actionsBox.value) onCleanup(observeListHeadingActions(actionsBox.value)); }, { flush: "post" });
    return () => {
      const actions = slots.actions?.(), children = slots.default?.(), loading = slots.loading?.(), empty = slots.empty?.(), footer = slots.footer?.();
      // Like React: a rounded section is a card of rows only; its title, actions and footer stay on the page around it.
      const { open, corner, bare, outside } = shape.value;
      const rounded = corner === "none" ? undefined : { borderRadius: `var(--_kjun-geometry-card-radii-${corner})` };
      const Heading = `h${props.headingLevel}` as "h3", compact = props.density === "compact" ? "compact" : undefined;
      // The list carries the name and the description; a named section would make every settings group a page landmark.
      const hasFooter = hasContent(footer), describedBy = [props.description && id + "-description", hasFooter && id + "-footer"].filter(Boolean).join(" ") || undefined;
      // Loading content announces itself (a skeleton's loadingText is a status), so the wrapper only places it.
      const rows = hasContent(loading) ? <div class="kjun-list-loading">{loading}</div>
        : hasContent(children)
        ? <ul ref={list} class="kjun-list" role={choice.value ? "radiogroup" : undefined} aria-label={props.ariaLabel || undefined} aria-labelledby={props.ariaLabel || !props.title ? undefined : id} aria-describedby={describedBy} data-divider={props.divider ? undefined : "false"} data-density={compact} data-variant={open ? "open" : undefined}>{children}</ul>
        : hasContent(empty) ? <div class="kjun-list-empty" data-density={compact}>{empty}</div> : null;
      return (
        <section class="kjun-list-section" data-surface={props.surface ? undefined : "false"} data-outside={outside || undefined} data-variant={open ? "open" : undefined}>
          {(props.title || props.description || hasContent(actions)) && (
            <div class="kjun-list-heading" data-bare={bare ? "" : undefined}><div>{props.title && <Heading id={id}>{props.title}</Heading>}{props.description && <p id={id + "-description"}>{props.description}</p>}</div>{hasContent(actions) && <div ref={actionsBox} class="kjun-list-heading-actions">{actions}</div>}</div>
          )}
          {outside ? <div class="kjun-list-panel" data-surface={props.surface ? undefined : "false"} style={rounded}>{rows}</div> : rows}
          {hasFooter && <div id={id + "-footer"} class="kjun-list-footer">{footer}</div>}
        </section>
      );
    };
  },
});

const kjunListGroupProps = {
  /** "inset" (default) rounds every section and keeps them 24px apart; "flush" keeps square sections 8px apart; "open" puts every section's rows on the page with no card or dividers, 20px apart. */
  variant: { type: String as PropType<ListGroupVariant>, default: "inset" },
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
    const selection = inject<{ value: ListRowSelection } | null>(kjunListSelectionKey, null);
    return () => <li class="kjun-list-item" role={selection?.value.mode === "single" ? "none" : undefined}>{slots.default?.()}</li>;
  },
});
export type KjunListItemProps = Record<string, never>;
