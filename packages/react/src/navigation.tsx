import { tokens } from '@kjun/tokens';
import { Collapse } from "./collapse";
import { useInitialTab, useAccordionState } from "../../../shared/package-runtime/navigation";
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
import { Tab,TabList,TabPanel,Tabs } from "react-aria-components";
import { DsIcon } from "./button";
import { DsSelect } from "./select";
export interface TabItem {
  name: string;
  label: string;
  icon?: string;
  badge?: string | number;
  badgeVariant?: "danger" | "success" | "warning" | "info";
  disabled?: boolean;
}
export interface DsTabsProps {
  value: string;
  items?: TabItem[];
  density?: "comfortable" | "compact";
  variant?: "underline" | "pills";
  actions?: ReactNode;
  children?: ReactNode;
  ariaLabel?: string;
  onValueChange?: (value: string) => void;
  onChange?: (value: string) => void;
  onTabMenu?: (event: {
    name: string;
    x: number;
    y: number;
    pointer: "mouse" | "touch";
  }) => void;
}
export function DsTabs({
  value,
  items = [],
  density = "comfortable",
  variant = "underline",
  actions,
  children,
  ariaLabel = "탭",
  onValueChange,
  onChange,
  onTabMenu,
}: DsTabsProps) {
  const { group, indicator } = useSelectionIndicator(true);
  const panes = Children.toArray(children).filter(
    isValidElement
  ) as ReactElement<DsTabPaneProps>[];
  const tabs = items.length
    ? items
    : panes
        .filter((child) => child.type === DsTabPane)
        .map((child) => child.props);
  useLayoutEffect(() => {
    const list = group.current?.querySelector<HTMLElement>('[role="tablist"]');
    // React Aria owns ordinary keyboard selection. The adapter handles invalid
    // entry values and focus when every available item disappears or disables.
    if (list) return manageTabList(list, () => {}, false);
  }, [group]);
  useLayoutEffect(() => {
    const panelNames = new Set(panes.filter(child => child.type === DsTabPane).map(child => child.props.name));
    for (const tab of group.current?.querySelectorAll<HTMLElement>('[role="tab"]') || []) {
      if (!panelNames.has(tab.dataset.tabName!)) tab.removeAttribute('aria-controls');
    }
  });
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined),
    press = useRef<{ name: string; x: number; y: number } | null>(null);
  const menuState = useRef({ tabs, onTabMenu });
  menuState.current = { tabs, onTabMenu };
  const canOpenMenu = (name: string) => !!menuState.current.onTabMenu &&
    menuState.current.tabs.some(tab => tab.name === name && !tab.disabled);
  const clear = () => {
    clearTimeout(timer.current);
    press.current = null;
  };
  useEffect(() => clear, []);
  useLayoutEffect(() => {
    if (press.current && !canOpenMenu(press.current.name)) clear();
  }, [tabs, onTabMenu]);
  const change = (name: string) => {
    onValueChange?.(name);
    onChange?.(name);
  };
  useInitialTab(value, tabs.find(tab => !tab.disabled)?.name, change);
  return (
    <Tabs
      selectedKey={value}
      onSelectionChange={(key) => change(String(key))}
      className="kjun-tabs"
      data-variant={variant}
      data-density={density}
    >
      <div className="kjun-tabs-header">
        <div className="kjun-tabs-track" ref={group} tabIndex={-1}>
        <TabList aria-label={ariaLabel} className="kjun-tabs-list">
          {tabs.map((tab) => (
            <Tab
              id={tab.name}
              data-tab-name={tab.name}
              key={tab.name}
              isDisabled={tab.disabled}
              className="kjun-tab"
              onContextMenu={(event) => {
                if (onTabMenu && !tab.disabled) {
                  event.preventDefault();
                  onTabMenu({
                    name: tab.name,
                    x: event.clientX,
                    y: event.clientY,
                    pointer: "mouse",
                  });
                }
              }}
              onTouchStart={(event) => {
                clear();
                if (!canOpenMenu(tab.name)) return;
                const touch = event.touches[0];
                if (!touch) return;
                press.current = { name: tab.name, x: touch.clientX, y: touch.clientY };
                timer.current = setTimeout(() => {
                  const pending = press.current;
                  clear();
                  if (pending && canOpenMenu(pending.name))
                    menuState.current.onTabMenu?.({ ...pending, pointer: "touch" });
                }, 500);
              }}
              onTouchMove={(event) => {
                const touch = event.touches[0];
                if (
                  press.current && touch &&
                  (Math.abs(touch.clientX - press.current.x) > 10 ||
                    Math.abs(touch.clientY - press.current.y) > 10)
                )
                  clear();
              }}
              onTouchEnd={clear}
              onTouchCancel={clear}
            >
              {tab.icon && <DsIcon name={tab.icon} size={tokens.extensions.tabs.iconSize} />} <span className="kjun-motion-label" data-label={tab.label}><span>{tab.label}</span></span>
              {tab.badge != null && (
                <span
                  className="kjun-tab-badge"
                  style={{
                    color: tab.badgeVariant
                      ? `var(--_kjun-color-${tab.badgeVariant})`
                      : undefined,
                  }}
                >
                  {tab.badge}
                </span>
              )}
            </Tab>
          ))}
        </TabList>
        <span ref={indicator} className="kjun-tab-indicator" aria-hidden="true" hidden />
        </div>
        {actions}
      </div>
      {children && <div className="kjun-tab-content">{children}</div>}
    </Tabs>
  );
}
export interface DsTabPaneProps extends TabItem {
  children?: ReactNode;
}
export function DsTabPane({ name, children }: DsTabPaneProps) {
  return (
    <TabPanel id={name} className="kjun-tab-panel" shouldForceMount
      style={({ isInert }) => ({ display: isInert ? 'none' : undefined })}>
      {children}
    </TabPanel>
  );
}
const AccordionContext = createContext<{
  opened: Set<string>;
  toggle: (id: string) => void;
  register: (id: string, defaultOpen: boolean) => () => void;
} | null>(null);
export interface DsAccordionProps {
  multiple?: boolean;
  tone?: "card" | "muted";
  children: ReactNode;
}
export function DsAccordion({
  multiple = false,
  tone = "card",
  children,
}: DsAccordionProps) {
  const state = useAccordionState(multiple);
  return (
    <AccordionContext.Provider
      value={state}
    >
      <div className="kjun-accordion" data-tone={tone}>
        {children}
      </div>
    </AccordionContext.Provider>
  );
}
export interface DsAccordionItemProps {
  title?: string;
  defaultOpen?: boolean;
  disabled?: boolean;
  header?: ReactNode;
  children: ReactNode;
}
export function DsAccordionItem({
  title = "",
  defaultOpen = false,
  disabled = false,
  header,
  children,
}: DsAccordionItemProps) {
  const group = useContext(AccordionContext),
    id = useId(),
    [own, setOwn] = useState(defaultOpen),
    open = group ? group.opened.has(id) : own;
  useEffect(() => {
    return group?.register(id, defaultOpen);
  }, []);
  return (
    <div className="kjun-accordion-item">
      <button
        type="button"
        id={id + "-heading"}
        disabled={disabled}
        aria-expanded={open}
        aria-controls={id + "-panel"}
        className="kjun-accordion-trigger"
        onClick={() => (group ? group.toggle(id) : setOwn(!own))}
      >
        <span className="kjun-accordion-heading">{header || title}</span>
        <DsIcon
          name="chevron-down"
          className="kjun-accordion-chevron"
          size={tokens.extensions.accordion.iconSize}
          style={{ transform: open ? "rotate(180deg)" : undefined }}
        />
      </button>
      <Collapse open={open}>
        <div
          role="region"
          id={id + "-panel"}
          aria-labelledby={id + "-heading"}
          className="kjun-accordion-panel"
        >
          {children}
        </div>
      </Collapse>
    </div>
  );
}
export interface BreadcrumbItem {
  label: string;
  to?: string;
  icon?: string;
}
export interface DsBreadcrumbProps {
  items: BreadcrumbItem[];
  renderLink?: (item: BreadcrumbItem, children: ReactNode) => ReactNode;
  ariaLabel?: string;
}
export function DsBreadcrumb({
  items,
  renderLink,
  ariaLabel = "현재 위치",
}: DsBreadcrumbProps) {
  return (
    <nav aria-label={ariaLabel} className="kjun-breadcrumb">
      {items.map((item, i) => {
        const label = (
          <>
            {item.icon && <DsIcon name={item.icon} size={tokens.extensions.breadcrumb.iconSize} />} {item.label}
          </>
        );
        return (
          <Fragment key={i}>
            {i > 0 && <DsIcon name="chevron-right" size={tokens.extensions.breadcrumb.separatorSize} />}{" "}
            {item.to && i < items.length - 1 ? (
              renderLink?.(item, label) || <a href={item.to}>{label}</a>
            ) : (
              <span aria-current={i === items.length - 1 ? "page" : undefined}>
                {label}
              </span>
            )}
          </Fragment>
        );
      })}
    </nav>
  );
}
export interface DsPaginationProps {
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
export function DsPagination({
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
}: DsPaginationProps) {
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
      <DsIcon name={icon} size={tokens.extensions.pagination.iconSize} />
    </button>
  );
  return (
    <nav aria-label="페이지 탐색" className="kjun-pagination">
      {showInfo && totalRows > 0 ? (
        <span>
          {(current - 1) * pageSize + 1} -{" "}
          {Math.min(current * pageSize, totalRows)} / {formatter(totalRows)}개
        </span>
      ) : (
        <span />
      )}
      <div className="kjun-pagination-controls">
        {showSizeSelector && (
          <div className="kjun-pagination-size"><DsSelect
            size="sm"
            ariaLabel="페이지당 항목 수"
            value={pageSize}
            options={pageSizeOptions.map(n => ({ value: n, label: `${n}개씩` }))}
            onValueChange={(value) => {
              onPageSizeChange?.(Number(value));
              onPageChange?.(1);
              onChange?.(1);
            }}
          /></div>
        )}
        {totalPages > 1 && <div className="kjun-pagination-mobile">
          {button(current - 1, "이전 페이지", "chevron-left")}
          <span>
            <strong>{current}</strong> / {totalPages}
          </span>
          {button(current + 1, "다음 페이지", "chevron-right")}
        </div>}
        {totalPages > 1 && <div className="kjun-pagination-desktop">
          {showFirstLast && button(1, "첫 페이지", "chevrons-left")}
          {button(current - 1, "이전 페이지", "chevron-left")}
          {pages.map((n, i) =>
            typeof n === "string" ? (
              <span key={"dots" + i}>...</span>
            ) : (
              <button
                key={n}
                type="button"
                aria-label={`${n} 페이지`}
                aria-current={current === n ? "page" : undefined}
                onClick={() => change(n)}
              >
                {n}
              </button>
            )
          )}
          {button(current + 1, "다음 페이지", "chevron-right")}
          {showFirstLast &&
            button(totalPages, "마지막 페이지", "chevrons-right")}
        </div>}
      </div>
    </nav>
  );
}
