import { useKjunMessages } from "../../../shared/package-runtime/messages-context";
import { tokens } from '@kjun-ui/tokens';
import { Collapse } from "./collapse";
import { useInitialTab, useAccordionState } from "../../../shared/package-runtime/navigation";
import { accordionKeyTarget } from "../../../shared/package-runtime/accordion-state";
import { breadcrumbCurrent, collapseBreadcrumb, type BreadcrumbItem } from "../../../shared/package-runtime/breadcrumb";
import { useSelectionIndicator } from "./use-selection-indicator";
import { manageTabList } from "../../../shared/package-runtime/tab-keyboard";
import {
Children,
createContext,
Fragment,
isValidElement,
useContext,
useEffect,
useLayoutEffect,
useId,
useRef,
useState,
type ReactElement,
type ReactNode,
} from "react";
import { Tab,TabList,TabPanel,Tabs,TabListStateContext } from "react-aria-components";
import { KjunButton, KjunIcon } from "./button";
import { KjunDropdown, KjunDropdownItem } from "./dropdown";
import { KjunBadge } from "./display";
import { KjunSelect } from "./select";
export * from "./tabs";
const AccordionContext = createContext<{
  opened: ReadonlySet<string>;
  toggle: (id: string) => void;
  register: (id: string, defaultOpen: boolean) => () => void;
} | null>(null);
export interface KjunAccordionProps {
  multiple?: boolean;
  tone?: "card" | "muted";
  /** Draws a line between items from the text start, like ListSection (default false: rows are set apart by height alone). */
  divider?: boolean;
  /** Gives every item its own rounded surface with a gap between them; divider has no effect then. */
  separated?: boolean;
  /** The heading level wrapping each header (default 3), or false for none, so headers join the page's outline. */
  headingLevel?: AccordionHeadingLevel;
  /** Open panels are labelled regions (default true). Turn off for long lists, where many landmarks crowd a screen reader. */
  region?: boolean;
  children: ReactNode;
}
export type AccordionHeadingLevel = 2 | 3 | 4 | 5 | 6 | false;
const AccordionLayoutContext = createContext<{ headingLevel: AccordionHeadingLevel; region: boolean }>({ headingLevel: 3, region: true });
export function KjunAccordion({
  multiple = false,
  tone = "card",
  divider = false,
  separated = false,
  headingLevel = 3,
  region = true,
  children,
}: KjunAccordionProps) {
  const state = useAccordionState(multiple);
  return (
    <AccordionContext.Provider
      value={state}
    >
      <AccordionLayoutContext.Provider value={{ headingLevel, region }}>
      <div className="kjun-accordion" data-tone={tone} data-divider={divider || undefined} data-separated={separated || undefined}
        // ↑↓ Home End move between headers, as in the WAI-ARIA accordion pattern.
        onKeyDown={event => {
          const triggers = Array.from(event.currentTarget.querySelectorAll<HTMLButtonElement>(":scope > .kjun-accordion-item > .kjun-accordion-trigger:not(:disabled), :scope > .kjun-accordion-item > .kjun-accordion-title > .kjun-accordion-trigger:not(:disabled)"));
          const next = accordionKeyTarget(event.key, triggers.indexOf(event.target as HTMLButtonElement), triggers.length);
          if (next === null) return;
          event.preventDefault();
          triggers[next].focus();
        }}>
        {children}
      </div>
      </AccordionLayoutContext.Provider>
    </AccordionContext.Provider>
  );
}
export interface KjunAccordionItemProps {
  title?: string;
  /** A secondary line under the title (caption, secondary text). */
  description?: string;
  /** Icon name drawn in a 40px leading column at the list icon size; the body and divider then start at the title. */
  icon?: string;
  defaultOpen?: boolean;
  /** Controlled open state. A controlled item follows this value only and stays out of the Accordion's single-open rule. */
  open?: boolean;
  /** Requests a change on a controlled item; reports every change on an uncontrolled one (also when a sibling closes it). */
  onOpenChange?: (open: boolean) => void;
  /** Keeps the body mounted after it first opens, so inputs keep their state while closed. */
  keepMounted?: boolean;
  disabled?: boolean;
  /** Replaces the title in the header; pass ariaLabel when it is not plain text. */
  header?: ReactNode;
  /** The header's accessible name when header is not plain text. */
  ariaLabel?: string;
  children: ReactNode;
}
export function KjunAccordionItem({
  title = "",
  description,
  icon,
  defaultOpen = false,
  disabled = false,
  header,
  ariaLabel,
  open: openProp,
  onOpenChange,
  keepMounted = false,
  children,
}: KjunAccordionItemProps) {
  const layout = useContext(AccordionLayoutContext);
  const Heading = layout.headingLevel ? (`h${layout.headingLevel}` as const) : Fragment;
  const controlled = openProp !== undefined,
    context = useContext(AccordionContext),
    group = controlled ? null : context,
    id = "kjun-" + useId(),
    [own, setOwn] = useState(defaultOpen),
    open = controlled ? openProp : group ? group.opened.has(id) : own;
  useEffect(() => {
    return group?.register(id, defaultOpen);
  }, []);
  // Uncontrolled items report each real change, including a sibling closing them. A defaultOpen item in an
  // Accordion opens once it registers after mount; that is its starting state, not a change.
  const reported = useRef(open), notify = useRef(onOpenChange), registering = useRef(!!group && defaultOpen);
  notify.current = onOpenChange;
  useEffect(() => {
    if (registering.current) { if (open) { registering.current = false; reported.current = open; } return; }
    if (controlled || reported.current === open) return;
    reported.current = open;
    notify.current?.(open);
  }, [open, controlled]);
  return (
    <div className="kjun-accordion-item" data-leading={icon ? "" : undefined}>
      <Heading {...(layout.headingLevel ? { className: "kjun-accordion-title" } : {})}>
      <button
        type="button"
        id={id + "-heading"}
        disabled={disabled}
        aria-expanded={open}
        aria-controls={id + "-panel"}
        aria-label={ariaLabel}
        className="kjun-accordion-trigger"
        onClick={() => { registering.current = false; controlled ? onOpenChange?.(!open) : group ? group.toggle(id) : setOwn(!own); }}
      >
        {icon && <span className="kjun-accordion-leading"><KjunIcon name={icon} size={tokens.extensions.accordion.leadingIconSize} /></span>}
        <span className="kjun-accordion-heading">{header || title}{description && <span className="kjun-accordion-description">{description}</span>}</span>
        <KjunIcon
          name="chevron-down"
          className="kjun-accordion-chevron"
          size={tokens.extensions.accordion.iconSize}
          style={{ transform: open ? "rotate(180deg)" : undefined }}
        />
      </button>
      </Heading>
      <Collapse open={open} keepMounted={keepMounted}>
        <div
          role={layout.region ? "region" : undefined}
          id={id + "-panel"}
          aria-labelledby={layout.region ? id + "-heading" : undefined}
          className="kjun-accordion-panel"
        >
          {children}
        </div>
      </Collapse>
    </div>
  );
}
export type { BreadcrumbItem };
export interface KjunBreadcrumbProps {
  items: BreadcrumbItem[];
  renderLink?: (item: BreadcrumbItem, children: ReactNode) => ReactNode;
  ariaLabel?: string;
  /** Folds a long trail: the first step and the last maxItems - 1 stay, and the steps between open from a "…" menu. */
  maxItems?: number;
}
export function KjunBreadcrumb({
  items,
  renderLink,
  ariaLabel,
  maxItems,
}: KjunBreadcrumbProps) {
  const m = useKjunMessages();
  ariaLabel ??= m.breadcrumb;
  if (!items.length) return null;
  const { shown, hidden, at } = collapseBreadcrumb(items, maxItems);
  const separator = <KjunIcon name="chevron-right" size={tokens.extensions.breadcrumb.separatorSize} />;
  const step = ({ item, index }: { item: BreadcrumbItem; index: number }, position: number) => {
    const current = breadcrumbCurrent(item, index, items.length);
    const label = <>{item.icon && <KjunIcon name={item.icon} size={tokens.extensions.breadcrumb.iconSize} />}<span className="kjun-breadcrumb-label">{item.label}</span></>;
    // A last item with `to` is a link too: apps that title the page elsewhere end the trail at its parent.
    const link = item.to ? renderLink?.(item, label) || <a href={item.to} aria-current={current ? "page" : undefined}>{label}</a> : null;
    return (
      <Fragment key={index}>
        {position === at && (
          <li className="kjun-breadcrumb-item">
            {separator}
            <KjunDropdown trigger={<KjunButton size="xs" variant="ghost" prefixIcon="dots" ariaLabel={m.showPath} />}>
              {hidden.map(({ item: folded, index: key }) => <KjunDropdownItem key={key} href={folded.to} icon={folded.icon}>{folded.label}</KjunDropdownItem>)}
            </KjunDropdown>
          </li>
        )}
        <li className="kjun-breadcrumb-item">
          {position > 0 && separator}
          {link ?? <span aria-current={current ? "page" : undefined}>{label}</span>}
        </li>
      </Fragment>
    );
  };
  return (
    <nav aria-label={ariaLabel} className="kjun-breadcrumb">
      <ol className="kjun-breadcrumb-list">{shown.map(step)}</ol>
    </nav>
  );
}
export interface KjunPaginationProps {
  currentPage?: number;
  page?: number;
  totalPages: number;
  totalRows?: number;
  pageSize?: number;
  pageSizeOptions?: number[];
  siblingCount?: number;
  showInfo?: boolean;
  showSizeSelector?: boolean;
  showFirstLast?: boolean;
  formatter?: (value: number) => string;
  onPageChange?: (page: number) => void;
  onChange?: (page: number) => void;
  onPageSizeChange?: (size: number) => void;
}
export function KjunPagination({
  currentPage,
  page,
  totalPages,
  totalRows = 0,
  pageSize = 20,
  pageSizeOptions = [10, 20, 50, 100],
  siblingCount = 1,
  showInfo = false,
  showSizeSelector = false,
  showFirstLast = true,
  formatter = String,
  onPageChange,
  onChange,
  onPageSizeChange,
}: KjunPaginationProps) {
  const m = useKjunMessages();
  const current = Math.max(1, Math.min(totalPages, currentPage ?? page ?? 1));
  if (totalPages <= 1 && !showSizeSelector && !(showInfo && totalRows > 0)) return null;
  const change = (v: number) => {
    if (v < 1 || v > totalPages || v === current) return;
    onPageChange?.(v);
    onChange?.(v);
  };
  const visible = new Set([
    1,
    totalPages,
    ...Array.from(
      { length: Math.min(totalPages, siblingCount * 2 + 1) },
      (_, i) => current - siblingCount + i
    ).filter((v) => v >= 1 && v <= totalPages),
  ]);
  const pages = [...visible]
    .sort((a, b) => a - b)
    .flatMap((v, i, all) => (i && v - all[i - 1] > 1 ? ["...", v] : [v]));
  const button = (target: number, label: string, icon: string) => (
    <button
      type="button"
      aria-label={label}
      disabled={target < 1 || target > totalPages || target === current}
      onClick={() => change(target)}
    >
      <KjunIcon name={icon} size={tokens.extensions.pagination.iconSize} />
    </button>
  );
  return (
    <nav aria-label={m.pagination} className="kjun-pagination">
      {showInfo && totalRows > 0 ? (
        <span>
          {m.pageRange((current - 1) * pageSize + 1, Math.min(current * pageSize, totalRows), formatter(totalRows))}
        </span>
      ) : (
        <span />
      )}
      <div className="kjun-pagination-controls">
        {showSizeSelector && (
          <div className="kjun-pagination-size"><KjunSelect
            size="sm"
            ariaLabel={m.itemsPerPage}
            value={pageSize}
            options={pageSizeOptions.map(n => ({ value: n, label: m.perPage(n) }))}
            onValueChange={(value) => {
              onPageSizeChange?.(Number(value));
              onPageChange?.(1);
              onChange?.(1);
            }}
          /></div>
        )}
        {totalPages > 1 && <div className="kjun-pagination-mobile">
          {button(current - 1, m.previousPage, "chevron-left")}
          <span>
            <strong>{current}</strong> / {totalPages}
          </span>
          {button(current + 1, m.nextPage, "chevron-right")}
        </div>}
        {totalPages > 1 && <div className="kjun-pagination-desktop">
          {showFirstLast && button(1, m.firstPage, "chevrons-left")}
          {button(current - 1, m.previousPage, "chevron-left")}
          {pages.map((n, i) =>
            typeof n === "string" ? (
              <span key={"dots" + i}>...</span>
            ) : (
              <button
                key={n}
                type="button"
                aria-label={m.page(n)}
                aria-current={current === n ? "page" : undefined}
                onClick={() => change(n)}
              >
                {n}
              </button>
            )
          )}
          {button(current + 1, m.nextPage, "chevron-right")}
          {showFirstLast &&
            button(totalPages, m.lastPage, "chevrons-right")}
        </div>}
      </div>
    </nav>
  );
}
