import { useKjunMessages } from "./runtime/messages";
import { Fragment, inject, onBeforeUnmount, onMounted, provide, ref, shallowRef, watch,
  type ExtractPublicPropTypes, type InjectionKey, type PropType, type VNode, type SlotsType, type VNodeChild } from "vue";
import { defineComponent } from "./runtime/component";
import { tokens } from "@kjun-ui/tokens";
import { KjunButton, KjunIcon } from "./button";
import { KjunCollapse } from "./collapse";
import { useKjunId } from "./input";
import { hasContent } from "./runtime/slots";
import { accordionKeyTarget, openedFromValue, registerOpened, toggleOpened, trimToSingle, unregisterOpened } from "../../../shared/package-runtime/accordion-state";
import { breadcrumbCurrent, collapseBreadcrumb, type BreadcrumbItem } from "../../../shared/package-runtime/breadcrumb";
import { KjunDropdown, KjunDropdownItem } from "./dropdown";
import { KjunSelect } from "./select-control";

interface AccordionContext { opened: () => ReadonlySet<string>; controlled: () => boolean; toggle: (id: string) => void; register: (id: string, defaultOpen: boolean) => () => void }
const kjunAccordionKey: InjectionKey<AccordionContext> = Symbol("kjunAccordion");
export type AccordionHeadingLevel = 2 | 3 | 4 | 5 | 6 | false;
const kjunAccordionLayoutKey: InjectionKey<{ headingLevel: () => AccordionHeadingLevel; region: () => boolean }> = Symbol("kjunAccordionLayout");

/** The Vue form of the shared useAccordionState: with modelValue the group is controlled and update:modelValue requests
 * each change; without it the group keeps its own set (from defaultValue and the items' defaultOpen) and reports changes. */
function useAccordionState(multiple: () => boolean, value: () => readonly string[] | undefined, defaultValue: readonly string[] | undefined, change: (value: string[]) => void): AccordionContext {
  const own = shallowRef<ReadonlySet<string>>(openedFromValue(defaultValue, multiple()));
  const controlled = () => value() !== undefined;
  const opened = () => controlled() ? openedFromValue(value(), multiple()) : own.value;
  watch(multiple, single => { if (!single && !controlled()) own.value = trimToSingle(own.value); });
  return {
    opened,
    controlled,
    toggle: id => {
      const next = toggleOpened(opened(), id, multiple());
      if (!controlled()) own.value = next;
      change([...next]);
    },
    register: (id, defaultOpen) => {
      // A controlled group shows its value only, so an item's defaultOpen does not apply there.
      if (!controlled()) own.value = registerOpened(own.value, id, defaultOpen, multiple());
      return () => { if (!controlled()) own.value = unregisterOpened(own.value, id); };
    },
  };
}

const kjunAccordionProps = {
  multiple: { type: Boolean, default: false },
  tone: { type: String as PropType<"card" | "muted">, default: "muted" },
  /** Draws a line between items from the text start, like ListSection (default true; false sets rows apart by height alone). */
  divider: { type: Boolean, default: true },
  /** Gives every item its own rounded surface with a gap between them; divider has no effect then. */
  separated: { type: Boolean, default: false },
  /** The heading level wrapping each header (default 3), or false for none, so headers join the page's outline. */
  headingLevel: { type: [Number, Boolean] as PropType<AccordionHeadingLevel>, default: 3 },
  /** Open panels are labelled regions (default true). Turn off for long lists, where many landmarks crowd a screen reader. */
  region: { type: Boolean, default: true },
  /** v-model: the open items, by each item's value (give the items a value). A single-open Accordion shows the last one. */
  modelValue: { type: Array as PropType<string[]>, default: undefined },
  /** The items open at first, by value, without v-model. */
  defaultValue: { type: Array as PropType<string[]>, default: undefined },
} as const;
export type KjunAccordionProps = ExtractPublicPropTypes<typeof kjunAccordionProps>;
export const KjunAccordion = defineComponent({
  name: "KjunAccordion",
  props: kjunAccordionProps,
  /** update:modelValue requests a change with v-model and reports every change otherwise; items without a value report an internal id. */
  emits: { "update:modelValue": (_value: string[]) => true },
  slots: Object as SlotsType<{ default?: () => VNodeChild }>,
  setup(props, { slots, emit }) {
    provide(kjunAccordionKey, useAccordionState(() => props.multiple, () => props.modelValue, props.defaultValue, value => emit("update:modelValue", value)));
    provide(kjunAccordionLayoutKey, { headingLevel: () => props.headingLevel, region: () => props.region });
    // ↑↓ Home End move between headers, as in the WAI-ARIA accordion pattern.
    const keydown = (event: KeyboardEvent) => {
      const root = event.currentTarget as HTMLElement;
      const triggers = Array.from(root.querySelectorAll<HTMLButtonElement>(":scope > .kjun-accordion-item > .kjun-accordion-trigger:not(:disabled), :scope > .kjun-accordion-item > .kjun-accordion-title > .kjun-accordion-trigger:not(:disabled)"));
      const next = accordionKeyTarget(event.key, triggers.indexOf(event.target as HTMLButtonElement), triggers.length);
      if (next === null) return;
      event.preventDefault();
      triggers[next].focus();
    };
    return () => <div class="kjun-accordion" data-tone={props.tone} data-divider={props.divider || undefined} data-separated={props.separated || undefined} onKeydown={keydown}>{slots.default?.()}</div>;
  },
});

const kjunAccordionItemProps = {
  title: { type: String, default: "" },
  /** A secondary line under the title (caption, secondary text). */
  description: { type: String, default: undefined },
  /** Icon name drawn in a 40px leading column at the list icon size; the body and divider then start at the title. */
  icon: { type: String, default: undefined },
  defaultOpen: { type: Boolean, default: false },
  disabled: { type: Boolean, default: false },
  /** v-model:open. A controlled item follows this value only and stays out of the Accordion's single-open rule. */
  open: { type: Boolean, default: undefined },
  /** Keeps the body mounted after it first opens, so inputs keep their state while closed. */
  keepMounted: { type: Boolean, default: false },
  /** The header's accessible name when the header slot is not plain text. */
  ariaLabel: { type: String, default: undefined },
  /** Names the item in the Accordion's v-model and defaultValue. */
  value: { type: String, default: undefined },
} as const;
export type KjunAccordionItemProps = ExtractPublicPropTypes<typeof kjunAccordionItemProps>;
/** Slots: default (panel), header (replaces the title), trailing (information at the end of the header before the chevron,
 * such as a status badge, an amount or a count; part of the header button, so no buttons or links). Events: update:open (a request when controlled, a report otherwise),
 * after-open and after-close (the item has finished opening or closing, after its height motion). */
export const KjunAccordionItem = defineComponent({
  name: "KjunAccordionItem",
  props: kjunAccordionItemProps,
  emits: { "update:open": (_open: boolean) => true, "after-open": () => true, "after-close": () => true },
  slots: Object as SlotsType<{
    default?: () => VNodeChild;
    header?: () => VNodeChild;
    trailing?: () => VNodeChild;
  }>,
  setup(props, { slots, emit }) {
    // Decided on each render like React; registration with the Accordion still happens once at mount.
    const controlled = () => props.open !== undefined;
    const context = inject(kjunAccordionKey, null);
    const layout = inject(kjunAccordionLayoutKey, { headingLevel: () => 3, region: () => true });
    const group = () => controlled() ? null : context;
    const id = useKjunId("kjun-");
    const own = ref(props.defaultOpen);
    // The group knows the item by its value, or by its own id without one.
    const key = props.value ?? id;
    let unregister: (() => void) | undefined;
    onMounted(() => { unregister = group()?.register(key, props.defaultOpen); });
    onBeforeUnmount(() => unregister?.());
    const isOpen = () => { const g = group(); return controlled() ? !!props.open : g ? g.opened().has(key) : own.value; };
    // Uncontrolled items report each real change, including a sibling closing them. A defaultOpen item in an
    // Accordion opens once it registers after mount; that is its starting state, not a change.
    let registering = !!group() && !context?.controlled() && props.defaultOpen;
    watch(isOpen, open => { if (controlled()) return; if (registering) { if (open) registering = false; return; } emit("update:open", open); });
    return () => {
      const open = isOpen();
      const header = slots.header?.(), trailing = slots.trailing?.();
      const level = layout.headingLevel(), region = layout.region();
      const trigger = (
          <button type="button" id={id + "-heading"} disabled={props.disabled} aria-expanded={open} aria-controls={id + "-panel"} aria-label={props.ariaLabel}
            class="kjun-accordion-trigger" onClick={() => { registering = false; const g = group(); controlled() ? emit("update:open", !open) : g ? g.toggle(key) : (own.value = !own.value); }}>
            {props.icon && <span class="kjun-accordion-leading"><KjunIcon name={props.icon} size={tokens.extensions.accordion.leadingIconSize} /></span>}
            <span class="kjun-accordion-heading">{hasContent(header) ? header : props.title}{props.description && <span class="kjun-accordion-description">{props.description}</span>}</span>
            {hasContent(trailing) && <span class="kjun-accordion-trailing">{trailing}</span>}
            <KjunIcon name="chevron-down" class="kjun-accordion-chevron" size={tokens.extensions.accordion.iconSize}
              style={{ transform: open ? "rotate(180deg)" : undefined }} />
          </button>
      );
      const Heading = level ? (`h${level}` as const) : undefined;
      return (
        <div class="kjun-accordion-item" data-leading={props.icon ? "" : undefined}>
          {Heading ? <Heading class="kjun-accordion-title">{trigger}</Heading> : trigger}
          <KjunCollapse open={open} keepMounted={props.keepMounted} onSettled={(settled: boolean) => { if (settled) emit("after-open"); else emit("after-close"); }}>
            <div role={region ? "region" : undefined} id={id + "-panel"} aria-labelledby={region ? id + "-heading" : undefined} class="kjun-accordion-panel">{slots.default?.()}</div>
          </KjunCollapse>
        </div>
      );
    };
  },
});

export type { BreadcrumbItem };
const kjunBreadcrumbProps = {
  items: { type: Array as PropType<BreadcrumbItem[]>, required: true },
  ariaLabel: { type: String, default: undefined },
  /** Folds a long trail: the first step and the last maxItems - 1 stay, and the steps between open from a "…" menu. */
  maxItems: { type: Number, default: undefined },
} as const;
export type KjunBreadcrumbProps = ExtractPublicPropTypes<typeof kjunBreadcrumbProps>;
/** Slot link({ item, label }) renders a router link; without it, links are plain anchors. A last item with `to` is a link too. */
export const KjunBreadcrumb = defineComponent({
  name: "KjunBreadcrumb",
  props: kjunBreadcrumbProps,
  slots: Object as SlotsType<{ link?: (scope: { item: BreadcrumbItem; label: VNode }) => VNodeChild }>,
  setup(props, { slots }) {
    const m = useKjunMessages();
    return () => {
      if (!props.items.length) return null;
      const { shown, hidden, at } = collapseBreadcrumb(props.items, props.maxItems);
      const separator = () => <KjunIcon name="chevron-right" size={tokens.extensions.breadcrumb.separatorSize} />;
      return (
        <nav aria-label={(props.ariaLabel ?? m.value.breadcrumb)} class="kjun-breadcrumb">
          <ol class="kjun-breadcrumb-list">
            {shown.map(({ item, index }, position) => {
              const current = breadcrumbCurrent(item, index, props.items.length);
              const label = <>{item.icon && <KjunIcon name={item.icon} size={tokens.extensions.breadcrumb.iconSize} />}<span class="kjun-breadcrumb-label">{item.label}</span></>;
              const link = item.to ? slots.link?.({ item, label }) : undefined;
              return (
                <Fragment key={index}>
                  {position === at && (
                    <li class="kjun-breadcrumb-item">
                      {separator()}
                      <KjunDropdown>{{
                        trigger: () => <KjunButton size="xs" variant="ghost" prefixIcon="dots" ariaLabel={m.value.showPath} />,
                        default: () => hidden.map(({ item: folded, index: key }) => <KjunDropdownItem key={key} href={folded.to} icon={folded.icon}>{folded.label}</KjunDropdownItem>),
                      }}</KjunDropdown>
                    </li>
                  )}
                  <li class="kjun-breadcrumb-item">
                    {position > 0 && separator()}
                    {item.to
                      ? hasContent(link as VNode[] | undefined) ? link : <a href={item.to} aria-current={current ? "page" : undefined}>{label}</a>
                      : <span aria-current={current ? "page" : undefined}>{label}</span>}
                  </li>
                </Fragment>
              );
            })}
          </ol>
        </nav>
      );
    };
  },
});

const kjunPaginationProps = {
  /** v-model:page. currentPage is accepted as an alias. */
  page: { type: Number, default: undefined },
  currentPage: { type: Number, default: undefined },
  totalPages: { type: Number, required: true },
  totalRows: { type: Number, default: 0 },
  /** v-model:pageSize. */
  pageSize: { type: Number, default: 20 },
  pageSizeOptions: { type: Array as PropType<number[]>, default: () => [10, 20, 50, 100] },
  siblingCount: { type: Number, default: 1 },
  showInfo: { type: Boolean, default: false },
  showSizeSelector: { type: Boolean, default: false },
  showFirstLast: { type: Boolean, default: true },
  formatter: { type: Function as PropType<(value: number) => string>, default: String },
} as const;
export type KjunPaginationProps = ExtractPublicPropTypes<typeof kjunPaginationProps>;
export const KjunPagination = defineComponent({
  name: "KjunPagination",
  props: kjunPaginationProps,
  emits: { "update:page": (_page: number) => true, change: (_page: number) => true, "update:pageSize": (_size: number) => true },
  setup(props, { emit }) {
    const m = useKjunMessages();
    return () => {
      const { totalPages, siblingCount, pageSize, totalRows } = props;
      const current = Math.max(1, Math.min(totalPages, props.currentPage ?? props.page ?? 1));
      if (totalPages <= 1 && !props.showSizeSelector && !(props.showInfo && totalRows > 0)) return null;
      const change = (v: number) => {
        if (v < 1 || v > totalPages || v === current) return;
        emit("update:page", v); emit("change", v);
      };
      const visible = new Set([1, totalPages, ...Array.from({ length: Math.min(totalPages, siblingCount * 2 + 1) },
        (_, i) => current - siblingCount + i).filter(v => v >= 1 && v <= totalPages)]);
      const pages = [...visible].sort((a, b) => a - b).flatMap((v, i, all) => (i && v - all[i - 1] > 1 ? ["...", v] : [v]));
      const button = (target: number, label: string, icon: string) => (
        <button type="button" aria-label={label} disabled={target < 1 || target > totalPages || target === current} onClick={() => change(target)}>
          <KjunIcon name={icon} size={tokens.extensions.pagination.iconSize} />
        </button>
      );
      return (
        <nav aria-label={m.value.pagination} class="kjun-pagination">
          {props.showInfo && totalRows > 0
            ? <span>{m.value.pageRange((current - 1) * pageSize + 1, Math.min(current * pageSize, totalRows), props.formatter(totalRows))}</span>
            : <span />}
          <div class="kjun-pagination-controls">
            {props.showSizeSelector && (
              <div class="kjun-pagination-size">
                <KjunSelect size="sm" ariaLabel={m.value.itemsPerPage} modelValue={pageSize}
                  options={props.pageSizeOptions.map(n => ({ value: n, label: m.value.perPage(n) }))}
                  onUpdate:modelValue={(value: unknown) => { emit("update:pageSize", Number(value)); emit("update:page", 1); emit("change", 1); }} />
              </div>
            )}
            {totalPages > 1 && (
              <div class="kjun-pagination-mobile">
                {button(current - 1, m.value.previousPage, "chevron-left")}
                <span><strong>{current}</strong> / {totalPages}</span>
                {button(current + 1, m.value.nextPage, "chevron-right")}
              </div>
            )}
            {totalPages > 1 && (
              <div class="kjun-pagination-desktop">
                {props.showFirstLast && button(1, m.value.firstPage, "chevrons-left")}
                {button(current - 1, m.value.previousPage, "chevron-left")}
                {pages.map((n, i) => typeof n === "string"
                  ? <span key={"dots" + i}>...</span>
                  : <button key={n} type="button" aria-label={m.value.page(n)} aria-current={current === n ? "page" : undefined} onClick={() => change(n)}>{n}</button>)}
                {button(current + 1, m.value.nextPage, "chevron-right")}
                {props.showFirstLast && button(totalPages, m.value.lastPage, "chevrons-right")}
              </div>
            )}
          </div>
        </nav>
      );
    };
  },
});
