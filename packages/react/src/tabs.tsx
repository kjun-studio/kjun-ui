import { useKjunMessages } from "../../../shared/package-runtime/messages-context";
import { navigationBadge, navigationLabel } from "../../../shared/package-runtime/navigation-badge";
import { tokens } from '@kjun-ui/tokens';
import { useInitialTab } from "../../../shared/package-runtime/navigation";
import { useSelectionIndicator } from "./use-selection-indicator";
import { manageTabList, revealTab } from "../../../shared/package-runtime/tab-keyboard";
import { trackScrollFade } from "../../../shared/package-runtime/scroll-fade";
import {
Children,
createContext,
isValidElement,
useContext,
useEffect,
useLayoutEffect,
useRef,
useState,
type ReactElement,
type ReactNode,
} from "react";
import { Tab,TabList,TabPanel,Tabs,TabListStateContext } from "react-aria-components";
import { KjunIcon } from "./button";
import { KjunBadge } from "./display";
export interface TabItem {
  name: string;
  label: string;
  icon?: string;
  /** A count or short text after the label; numbers over 99 show 99+, and 0 or "" draws nothing. */
  badge?: string | number;
  badgeVariant?: "default" | "secondary" | "primary" | "danger" | "success" | "warning" | "info";
  disabled?: boolean;
}
export interface KjunTabsProps {
  value: string;
  items?: TabItem[];
  density?: "comfortable" | "compact";
  variant?: "underline" | "pills";
  /** Tabs share the row equally; an underline then spans the whole tab. */
  fullWidth?: boolean;
  actions?: ReactNode;
  children?: ReactNode;
  /** Keep the header inside its scroll container while the tab panels scroll. */
  stickyHeader?: boolean;
  /** Top gap of the sticky header: a number in px or a CSS length. */
  stickyOffset?: number | string;
  /** Each TabPane draws its content the first time its tab is selected, then keeps it (hidden) like the others. */
  lazy?: boolean;
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
// Which panes may draw their content: all of them, or under lazy the ones whose tab has been selected.
const TabsLazyContext = createContext<{ lazy: boolean; seen: ReadonlySet<string> }>({ lazy: false, seen: new Set() });
function TabActions({ children }: { children?: ReactNode }) {
  // Actions may own a collection (Select, Dropdown). Render them only after
  // React Aria has collected this TabList, so their items cannot become tabs.
  return useContext(TabListStateContext) ? children : null;
}
export function KjunTabs({
  value,
  items = [],
  density = "comfortable",
  variant = "underline",
  fullWidth = false,
  actions,
  children,
  stickyHeader = false,
  stickyOffset = 0,
  lazy = false,
  ariaLabel,
  onValueChange,
  onChange,
  onTabMenu,
}: KjunTabsProps) {
  const m = useKjunMessages();
  ariaLabel ??= m.tabs;
  const { group, indicator } = useSelectionIndicator(true);
  const panes = Children.toArray(children).filter(
    isValidElement
  ) as ReactElement<KjunTabPaneProps>[];
  const tabs = items.length
    ? items
    : panes
        .filter((child) => child.type === KjunTabPane)
        .map((child) => child.props);
  useLayoutEffect(() => {
    const list = group.current?.querySelector<HTMLElement>('[role="tablist"]');
    // React Aria owns ordinary keyboard selection. The adapter handles invalid
    // entry values and focus when every available item disappears or disables.
    if (list) return manageTabList(list, () => {}, false);
  }, [group]);
  useLayoutEffect(() => {
    const panelNames = new Set(panes.filter(child => child.type === KjunTabPane).map(child => child.props.name));
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
  const seen = useRef(new Set<string>());
  if (value) seen.current.add(value);
  // An overflowing tab list fades at the edges that have more tabs past them, like KjunScrollFade.
  useLayoutEffect(() => {
    const track = group.current;
    if (!track || typeof ResizeObserver === "undefined") return;
    const fade = trackScrollFade(track, () => "horizontal", edges => {
      track.toggleAttribute("data-fade-start", edges.start);
      track.toggleAttribute("data-fade-end", edges.end);
    });
    return fade.destroy;
  }, [group]);
  // The selected tab is scrolled into the track when it changes, and at once on the first render.
  const revealed = useRef(false);
  useLayoutEffect(() => {
    const reveal = () => {
      const track = group.current, tab = track?.querySelector<HTMLElement>('[role="tab"][aria-selected="true"]');
      if (!track || !tab) return false;
      revealTab(track, tab, tokens.extensions.scrollFade.width, revealed.current);
      revealed.current = true;
      return true;
    };
    // React Aria may draw the tabs a frame after the list is mounted.
    if (reveal()) return;
    const frame = requestAnimationFrame(reveal);
    return () => cancelAnimationFrame(frame);
  }, [group, value]);
  return (
    <TabsLazyContext.Provider value={{ lazy, seen: seen.current }}>
    <TabListStateContext.Provider value={null}>
    <Tabs
      selectedKey={value}
      // React Aria reports a press on the tab that is already selected; like Vue and Native, report only real changes.
      onSelectionChange={(key) => { if (String(key) !== value) change(String(key)); }}
      className="kjun-tabs"
      data-variant={variant}
      data-density={density}
      data-full-width={fullWidth || undefined}
    >
      <div className="kjun-tabs-header" data-sticky={stickyHeader || undefined}
        style={stickyHeader ? { position: "sticky", top: stickyOffset, zIndex: tokens.layers.page.sticky, background: "var(--_kjun-color-surface)" } : undefined}>
        <div className="kjun-tabs-track" ref={group} tabIndex={-1}>
        <TabList aria-label={ariaLabel} className="kjun-tabs-list">
          {tabs.map((tab) => (
            <Tab
              id={tab.name}
              data-tab-name={tab.name}
              key={tab.name}
              isDisabled={tab.disabled}
              className="kjun-tab"
              // The count joins the tab's name as "알림, 새 항목 3개"; the drawn badge is hidden from screen readers.
              aria-label={navigationBadge(tab.badge) ? navigationLabel(tab.label, tab.badge, m.newContent, m.newCount) : undefined}
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
              {tab.icon && <KjunIcon name={tab.icon} size={tokens.extensions.tabs.iconSize} />} <span className="kjun-motion-label" data-label={tab.label}><span>{tab.label}</span></span>
              {navigationBadge(tab.badge) && <>
                <KjunBadge className="kjun-tab-badge" size="xs" variant={tab.badgeVariant ?? "default"} aria-hidden="true">
                  {navigationBadge(tab.badge)!.text}
                </KjunBadge>
              </>}
            </Tab>
          ))}
        </TabList>
        <span ref={indicator} className="kjun-tab-indicator" aria-hidden="true" hidden />
        </div>
        <TabActions>{actions}</TabActions>
      </div>
      {children && <div className="kjun-tab-content">{children}</div>}
    </Tabs>
    </TabListStateContext.Provider>
    </TabsLazyContext.Provider>
  );
}
export interface KjunTabPaneProps extends TabItem {
  children?: ReactNode;
}
export function KjunTabPane({ name, children }: KjunTabPaneProps) {
  const { lazy, seen } = useContext(TabsLazyContext);
  return (
    <TabPanel id={name} className="kjun-tab-panel" shouldForceMount
      style={({ isInert }) => ({ display: isInert ? 'none' : undefined })}>
      {!lazy || seen.has(name) ? children : null}
    </TabPanel>
  );
}
