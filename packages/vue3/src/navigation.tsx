import { Fragment, defineComponent, inject, onBeforeUnmount, onMounted, provide, ref, shallowRef, watch,
  type ExtractPublicPropTypes, type InjectionKey, type PropType, type VNode, type SlotsType, type VNodeChild } from "vue";
import { tokens } from "@kjun-ui/tokens";
import { KjunIcon } from "./button";
import { KjunCollapse } from "./collapse";
import { useKjunId } from "./input";
import { hasContent } from "./runtime/slots";
import { KjunSelect } from "./select-control";

interface AccordionContext { opened: () => Set<string>; toggle: (id: string) => void; register: (id: string, defaultOpen: boolean) => () => void }
const kjunAccordionKey: InjectionKey<AccordionContext> = Symbol("kjunAccordion");

function useAccordionState(multiple: () => boolean): AccordionContext {
  const opened = shallowRef(new Set<string>());
  watch(multiple, value => { if (!value && opened.value.size > 1) opened.value = new Set([...opened.value].slice(-1)); });
  return {
    opened: () => opened.value,
    toggle: id => {
      const next = new Set(multiple() ? opened.value : []);
      if (opened.value.has(id)) next.delete(id); else next.add(id);
      opened.value = next;
    },
    register: (id, defaultOpen) => {
      if (defaultOpen && (multiple() || !opened.value.size)) opened.value = new Set([...opened.value, id]);
      return () => {
        if (!opened.value.has(id)) return;
        const next = new Set(opened.value);
        next.delete(id);
        opened.value = next;
      };
    },
  };
}

const kjunAccordionProps = {
  multiple: { type: Boolean, default: false },
  tone: { type: String as PropType<"card" | "muted">, default: "card" },
} as const;
export type KjunAccordionProps = ExtractPublicPropTypes<typeof kjunAccordionProps>;
export const KjunAccordion = defineComponent({
  name: "KjunAccordion",
  props: kjunAccordionProps,
  slots: Object as SlotsType<{ default?: () => VNodeChild }>,
  setup(props, { slots }) {
    provide(kjunAccordionKey, useAccordionState(() => props.multiple));
    return () => <div class="kjun-accordion" data-tone={props.tone}>{slots.default?.()}</div>;
  },
});

const kjunAccordionItemProps = {
  title: { type: String, default: "" },
  defaultOpen: { type: Boolean, default: false },
  disabled: { type: Boolean, default: false },
} as const;
export type KjunAccordionItemProps = ExtractPublicPropTypes<typeof kjunAccordionItemProps>;
/** Slots: default (panel), header (replaces the title). */
export const KjunAccordionItem = defineComponent({
  name: "KjunAccordionItem",
  props: kjunAccordionItemProps,
  slots: Object as SlotsType<{
    default?: () => VNodeChild;
    header?: () => VNodeChild;
  }>,
  setup(props, { slots }) {
    const group = inject(kjunAccordionKey, null);
    const id = useKjunId("kjun-");
    const own = ref(props.defaultOpen);
    let unregister: (() => void) | undefined;
    onMounted(() => { unregister = group?.register(id, props.defaultOpen); });
    onBeforeUnmount(() => unregister?.());
    return () => {
      const open = group ? group.opened().has(id) : own.value;
      const header = slots.header?.();
      return (
        <div class="kjun-accordion-item">
          <button type="button" id={id + "-heading"} disabled={props.disabled} aria-expanded={open} aria-controls={id + "-panel"}
            class="kjun-accordion-trigger" onClick={() => group ? group.toggle(id) : (own.value = !own.value)}>
            <span class="kjun-accordion-heading">{hasContent(header) ? header : props.title}</span>
            <KjunIcon name="chevron-down" class="kjun-accordion-chevron" size={tokens.extensions.accordion.iconSize}
              style={{ transform: open ? "rotate(180deg)" : undefined }} />
          </button>
          <KjunCollapse open={open}>
            <div role="region" id={id + "-panel"} aria-labelledby={id + "-heading"} class="kjun-accordion-panel">{slots.default?.()}</div>
          </KjunCollapse>
        </div>
      );
    };
  },
});

export interface BreadcrumbItem { label: string; to?: string; icon?: string }
const kjunBreadcrumbProps = {
  items: { type: Array as PropType<BreadcrumbItem[]>, required: true },
  ariaLabel: { type: String, default: "현재 위치" },
} as const;
export type KjunBreadcrumbProps = ExtractPublicPropTypes<typeof kjunBreadcrumbProps>;
/** Slot link({ item, label }) renders a router link; without it, links are plain anchors. */
export const KjunBreadcrumb = defineComponent({
  name: "KjunBreadcrumb",
  props: kjunBreadcrumbProps,
  slots: Object as SlotsType<{ link?: (scope: { item: BreadcrumbItem; label: VNode }) => VNodeChild }>,
  setup(props, { slots }) {
    return () => (
      <nav aria-label={props.ariaLabel} class="kjun-breadcrumb">
        {props.items.map((item, i) => {
          const label = <>{item.icon && <KjunIcon name={item.icon} size={tokens.extensions.breadcrumb.iconSize} />} {item.label}</>;
          const link = item.to && i < props.items.length - 1 ? slots.link?.({ item, label }) : undefined;
          return (
            <Fragment key={i}>
              {i > 0 && <KjunIcon name="chevron-right" size={tokens.extensions.breadcrumb.separatorSize} />}{" "}
              {item.to && i < props.items.length - 1
                ? hasContent(link as VNode[] | undefined) ? link : <a href={item.to}>{label}</a>
                : <span aria-current={i === props.items.length - 1 ? "page" : undefined}>{label}</span>}
            </Fragment>
          );
        })}
      </nav>
    );
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
        <nav aria-label="페이지 탐색" class="kjun-pagination">
          {props.showInfo && totalRows > 0
            ? <span>{(current - 1) * pageSize + 1} - {Math.min(current * pageSize, totalRows)} / {props.formatter(totalRows)}개</span>
            : <span />}
          <div class="kjun-pagination-controls">
            {props.showSizeSelector && (
              <div class="kjun-pagination-size">
                <KjunSelect size="sm" ariaLabel="페이지당 항목 수" modelValue={pageSize}
                  options={props.pageSizeOptions.map(n => ({ value: n, label: `${n}개씩` }))}
                  onUpdate:modelValue={(value: unknown) => { emit("update:pageSize", Number(value)); emit("update:page", 1); emit("change", 1); }} />
              </div>
            )}
            {totalPages > 1 && (
              <div class="kjun-pagination-mobile">
                {button(current - 1, "이전 페이지", "chevron-left")}
                <span><strong>{current}</strong> / {totalPages}</span>
                {button(current + 1, "다음 페이지", "chevron-right")}
              </div>
            )}
            {totalPages > 1 && (
              <div class="kjun-pagination-desktop">
                {props.showFirstLast && button(1, "첫 페이지", "chevrons-left")}
                {button(current - 1, "이전 페이지", "chevron-left")}
                {pages.map((n, i) => typeof n === "string"
                  ? <span key={"dots" + i}>...</span>
                  : <button key={n} type="button" aria-label={`${n} 페이지`} aria-current={current === n ? "page" : undefined} onClick={() => change(n)}>{n}</button>)}
                {button(current + 1, "다음 페이지", "chevron-right")}
                {props.showFirstLast && button(totalPages, "마지막 페이지", "chevrons-right")}
              </div>
            )}
          </div>
        </nav>
      );
    };
  },
});
