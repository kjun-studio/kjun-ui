import { useKjunMessages } from "../../../shared/package-runtime/messages-context";
import { hasContent } from "../../../shared/package-runtime/content-presence";
import { tokens } from '@kjun-ui/tokens';
import { selectionTypeStyle } from "./typography";
import { Children, createContext, isValidElement, useContext, useCallback, useEffect, useLayoutEffect, useRef, useId, useState, type ReactElement, type ReactNode } from "react";
import { useInitialTab } from "../../../shared/package-runtime/navigation";
import { Animated, Platform, ScrollView, View, type LayoutRectangle, type ViewStyle } from "react-native";
import { AccessiblePressable as Pressable } from "./a11y";
import { KjunIcon } from "./button";
import { BadgeView } from "./display-primitives";
import { badgeToneRoles } from "../../../shared/package-runtime/badge-tone";
import { navigationBadge, navigationLabel } from "../../../shared/package-runtime/navigation-badge";
import { KText, content } from "./internal";
import { useKjunStyles } from "./provider";
import { useTabKeyboard, usePanelFocus } from "./tabs-accessibility";
import { useButtonGroupMotion } from "./button-group-motion";
import { ScrollFadeEdge } from "./scroll-fade-edge";
import { sameEdges, scrollEdges, type ScrollEdges } from "../../../shared/package-runtime/scroll-fade";
export interface TabItem {
  name: string;
  label: string;
  icon?: string;
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
  /** Native Web keeps the header inside its scroll container while the panels scroll. On iOS and Android, put the
   * tab bar in the parent ScrollView's stickyHeaderIndices instead: a view cannot stick on its own there. */
  stickyHeader?: boolean;
  /** Top gap of the sticky header on Native Web, in points. */
  stickyOffset?: number;
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
const TabContext = createContext({ value: "", id: "", names: [] as string[], lazy: false, seen: new Set<string>() as ReadonlySet<string> });
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
  const { colors } = useKjunStyles(),
    panes = Children.toArray(children).filter(
      isValidElement
    ) as ReactElement<KjunTabPaneProps>[];
  const tabs = items.length
    ? items
    : panes
        .filter((child) => child.type === KjunTabPane)
        .map((child) => child.props);
  const id = "kjun-" + useId(), root = useRef<View>(null);
  const menuState = useRef({ tabs, onTabMenu });
  menuState.current = { tabs, onTabMenu };
  const pressedMenu = useRef<string | null>(null);
  useLayoutEffect(() => {
    if (!onTabMenu || !tabs.some(tab => tab.name === pressedMenu.current && !tab.disabled)) pressedMenu.current = null;
  }, [tabs, onTabMenu]);
  const panelNames = panes.filter(child => child.type === KjunTabPane).map(child => child.props.name);
  const geometry = tokens.extensions.tabs;
  const underline = variant === 'underline';
  const [hoveredTab, setHoveredTab] = useState<string | null>(null);
  // Measurement copies stay on one line in the horizontal scroller, too.
  const singleLine = Platform.OS === 'web' ? { whiteSpace: 'nowrap' as const } : {};
  const compact = density === 'compact';
  const paddingX = underline ? (compact ? geometry.compactPaddingX : geometry.paddingX) : compact ? geometry.pillsCompactPaddingX : geometry.pillsPaddingX;
  const height = underline ? (compact ? geometry.compactHeight : geometry.height) : compact ? geometry.pillsCompactHeight : geometry.pillsHeight;
  const ringRoom = tokens.states.focus.width + tokens.states.focus.offset;
  // Compact tabs stay 32px tall but answer touches across the 44px minimum target.
  const slop = Math.max(0, (tokens.native.minimumTouchTarget - height) / 2);
  // The scroller only delivers touches and paints rings inside its bounds; grow it without moving the layout.
  const roomX = underline ? ringRoom : 0, roomY = Math.max(underline ? ringRoom : 0, slop);
  const selectedTab = tabs.find(tab => tab.name === value);
  const selection = useButtonGroupMotion(selectedTab ? { ...selectedTab, value: selectedTab.name } : undefined);
  const tabRefs = useRef(new Map<string, View>());
  const { updateLayout } = selection;
  const firstName = tabs[0]?.name;
  // An underline sits under the label, or under the whole tab when tabs share the row. Pills have no marker.
  const measureIndicator = useCallback((name: string, box: LayoutRectangle) => {
    const left = fullWidth ? 0 : name === firstName ? 0 : paddingX, right = fullWidth ? 0 : paddingX;
    if (underline) updateLayout(name, {
      x: box.x + left, y: box.y + box.height - geometry.indicatorHeight,
      width: Math.max(0, box.width - left - right), height: geometry.indicatorHeight,
    });
  }, [underline, fullWidth, paddingX, firstName, updateLayout, geometry]);
  useLayoutEffect(() => {
    // Native Web observes the content box: padding-only changes need a fresh measurement.
    for (const [name, node] of tabRefs.current) {
      node.measure((x, y, width, height) => measureIndicator(name, { x, y, width, height }));
    }
  }, [variant, density, fullWidth, measureIndicator]);
  const change = (name: string) => {
    onValueChange?.(name);
    onChange?.(name);
  };
  // Like React Aria and Vue, pressing the tab that is already selected reports nothing.
  const select = (name: string) => { if (name !== value) change(name); };
  useTabKeyboard(root, select);
  useInitialTab(value, tabs.find(tab => !tab.disabled)?.name, change);
  const seen = useRef(new Set<string>());
  if (value) seen.current.add(value);
  // The scroller's offset and sizes give the faded edges and where to scroll the selected tab, as on Web.
  const scroller = useRef<ScrollView>(null), boxes = useRef(new Map<string, { x: number; width: number }>());
  const box = useRef({ scrollLeft: 0, scrollTop: 0, clientWidth: 0, clientHeight: 0, scrollWidth: 0, scrollHeight: 0 });
  const [edges, setEdges] = useState<ScrollEdges>({ start: false, end: false });
  // The scroller reaches roomX past the row on each side; its edges sit inside that room.
  const updateBox = (next: Partial<typeof box.current>) => {
    box.current = { ...box.current, ...next };
    const { scrollLeft, clientWidth, scrollWidth } = box.current;
    const found = scrollEdges({ ...box.current, scrollLeft, clientWidth: clientWidth - 2 * roomX, scrollWidth: scrollWidth - 2 * roomX }, "horizontal");
    setEdges(previous => sameEdges(previous, found) ? previous : found);
  };
  const revealed = useRef(false), valueNow = useRef(value);
  valueNow.current = value;
  const reveal = () => {
    const tab = boxes.current.get(valueNow.current), { scrollLeft, clientWidth, scrollWidth } = box.current;
    if (!tab || !clientWidth || !scrollWidth) return;
    const pad = roomX + tokens.extensions.scrollFade.width, left = scrollLeft + pad, right = scrollLeft + clientWidth - pad;
    const target = tab.x < left ? tab.x - pad : tab.x + tab.width > right ? tab.x + tab.width - clientWidth + pad : scrollLeft;
    const x = Math.max(0, Math.min(target, scrollWidth - clientWidth));
    if (Math.abs(x - scrollLeft) >= 1) scroller.current?.scrollTo({ x, animated: revealed.current });
    revealed.current = true;
  };
  // The selected tab scrolls into the row when it changes; the first time it is measured it jumps there at once.
  useEffect(() => { if (revealed.current) reveal(); }, [value]);
  const firstReveal = () => { if (!revealed.current) reveal(); };
  return (
    <TabContext.Provider value={{ value, id, names: tabs.map(tab => tab.name), lazy, seen: seen.current }}>
      <View ref={root}>
        {/* Actions sit beside the tab list, not inside it, so they neither scroll away nor read as tabs. */}
        <View style={{ flexDirection: "row", alignItems: "center",
          ...(stickyHeader && Platform.OS === "web" ? ({ position: "sticky", top: stickyOffset, zIndex: tokens.layers.page.sticky,
            backgroundColor: colors.surface } as unknown as ViewStyle) : {}) }}>
        <View style={{ flexGrow: 1, flexShrink: 1, minWidth: 0 }}>
        <ScrollView
          ref={scroller}
          horizontal
          scrollEventThrottle={16}
          onLayout={event => { updateBox({ clientWidth: event.nativeEvent.layout.width }); firstReveal(); }}
          onContentSizeChange={scrollWidth => { updateBox({ scrollWidth }); firstReveal(); }}
          onScroll={event => {
            updateBox({ scrollLeft: event.nativeEvent.contentOffset.x });
            // Layout arrives late on Native Web: once the row has been scrolled (by focus or a finger), the first reveal must not pull it back.
            revealed.current = true;
          }}
          accessibilityRole="tablist"
          accessibilityLabel={ariaLabel}
          showsHorizontalScrollIndicator={false}
          // Underline tabs ring outside their label and indicator, and compact tabs extend their touch target.
          style={{ flexGrow: 1, marginHorizontal: -roomX, marginVertical: -roomY }}
          contentContainerStyle={{
            flexGrow: fullWidth ? 1 : undefined,
            flexDirection: "row",
            alignItems: "center",
            gap: underline ? geometry.gap : geometry.pillsGap,
            paddingHorizontal: roomX,
            paddingVertical: (underline ? 0 : geometry.pillsPaddingY) + roomY,
          }}
        >
          {underline && selection.layout && <Animated.View testID="kjun-tab-indicator" pointerEvents="none" accessible={false}
            style={{ position: 'absolute', left: 0,
              top: selection.layout.y,
              height: selection.layout.height,
              width: selection.width,
              transform: [{ translateX: selection.x }],
              borderRadius: geometry.indicatorHeight / 2,
              // A disabled selected tab paints its underline in the disabled-ink role, like its label.
              backgroundColor: selectedTab?.disabled ? colors.textDisabled : colors.brand,
            }} />}
          {tabs.map((tab, index) => {
            const active = value === tab.name;
            // Selected chips invert; disabled tabs fade their ink only, so chips keep their fill.
            const ink = tab.disabled ? colors.textDisabled : active ? (underline ? colors.text : colors.surface) : colors.textSecondary;
            const fill = underline ? undefined : active ? colors.text
              : !tab.disabled && hoveredTab === tab.name ? colors.hover : colors.secondary;
            return (
              <Pressable
                key={tab.name}
                {...(Platform.OS === 'web' ? {
                  nativeID: `${id}-tab-${tab.name}`,
                  dataSet: { tabName: tab.name },
                  'aria-controls': active && panelNames.includes(tab.name) ? `${id}-panel-${tab.name}` : undefined,
                } : {})}
                ref={node => { if (node) tabRefs.current.set(tab.name, node); else tabRefs.current.delete(tab.name); }}
                onLayout={event => {
                  const layout = event.nativeEvent.layout;
                  boxes.current.set(tab.name, { x: layout.x, width: layout.width });
                  measureIndicator(tab.name, layout);
                  if (tab.name === value) firstReveal();
                }}
                accessibilityRole="tab"
                focusRingInset={!underline}
                hitSlop={slop ? { top: slop, bottom: slop } : undefined}
                accessibilityLabel={navigationLabel(tab.label, tab.badge, m.newContent, m.newCount)}
                accessibilityState={{
                  selected: active,
                  disabled: !!tab.disabled,
                }}
                disabled={tab.disabled}
                onPress={() => select(tab.name)}
                onPressIn={() => { pressedMenu.current = !tab.disabled && onTabMenu ? tab.name : null; }}
                onPressOut={() => { pressedMenu.current = null; }}
                onLongPress={(event) => {
                  if (pressedMenu.current !== tab.name) return;
                  pressedMenu.current = null;
                  if (!menuState.current.tabs.some(item => item.name === tab.name && !item.disabled)) return;
                  menuState.current.onTabMenu?.({
                    name: tab.name,
                    x: event.nativeEvent.pageX,
                    y: event.nativeEvent.pageY,
                    pointer: "touch",
                  });
                }}
                delayLongPress={500}
                onHoverIn={() => setHoveredTab(tab.name)}
                onHoverOut={() => setHoveredTab(current => current === tab.name ? null : current)}
                style={{
                  height,
                  ...(fullWidth ? { flexGrow: 1, flexBasis: 0, justifyContent: "center" as const } : {}),
                  flexDirection: "row",
                  alignItems: "center",
                  gap: geometry.itemGap,
                  paddingLeft: underline && index === 0 && !fullWidth ? 0 : paddingX,
                  paddingRight: paddingX,
                  borderRadius: underline ? geometry.radius : geometry.pillsRadius,
                  backgroundColor: fill,
                }}
              >

                {!!tab.icon && (
                  <KjunIcon
                    name={tab.icon}
                    size={geometry.iconSize}
                    color={ink}
                  />
                )}
                {/* Reserve both faces like ButtonGroup, without squeezing the shown label to a rounded measurement. */}
                <View style={{ alignItems: 'flex-start' }}>
                  <KText accessible={false} accessibilityElementsHidden importantForAccessibility="no-hide-descendants"
                    style={{ opacity: 0, ...selectionTypeStyle("md", true), ...singleLine }}>{tab.label}</KText>
                  <View style={{ height: 0, overflow: 'hidden' }} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
                    <KText accessible={false} style={{ opacity: 0, ...selectionTypeStyle("md", false), ...singleLine }}>{tab.label}</KText>
                  </View>
                  <KText numberOfLines={1} style={{ position: 'absolute', top: 0, ...selectionTypeStyle("md", active),
                     color: ink, ...singleLine }}>{tab.label}</KText>
                </View>
                {navigationBadge(tab.badge) ? (
                  // A disabled tab dims its badge too; an unselected chip gives a default badge the surface so it stands off the chip.
                  <View style={{ opacity: tab.disabled ? tokens.states.opacity.disabled : 1 }}>
                    <BadgeView size="xs" variant={tab.badgeVariant ?? "default"}
                      paint={!underline && !active && (tab.badgeVariant ?? "default") === "default" ? { ...badgeToneRoles("default"), bg: "surface" } : undefined}>
                      {navigationBadge(tab.badge)!.text}
                    </BadgeView>
                  </View>
                ) : null}
              </Pressable>
            );
          })}
        </ScrollView>
        {/* More tabs past an edge fade it into the surface, as KjunScrollFade does. */}
        {edges.start ? <ScrollFadeEdge edge="start" horizontal color={colors.surface} /> : null}
        {edges.end ? <ScrollFadeEdge edge="end" horizontal color={colors.surface} /> : null}
        </View>
        {hasContent(actions) ? <View style={{ flexShrink: 0, flexDirection: "row", alignItems: "center" }}>{content(actions)}</View> : null}
        </View>
        {hasContent(children) && <View style={{ marginTop: geometry.contentGap }}>{content(children)}</View>}
      </View>
    </TabContext.Provider>
  );
}
export interface KjunTabPaneProps extends TabItem {
  children?: ReactNode;
}
export function KjunTabPane({ name, children }: KjunTabPaneProps) {
  const { value, id, names, lazy, seen } = useContext(TabContext);
  const root = useRef<View>(null);
  usePanelFocus(root);
  const hidden = value !== name;
  // Hiding a panel preserves its children's state; removing it releases them.
  return <View ref={root} style={hidden ? { display: 'none' } : undefined}
    accessibilityElementsHidden={hidden} importantForAccessibility={hidden ? 'no-hide-descendants' : 'auto'}
    pointerEvents={hidden ? 'none' : 'auto'} {...(Platform.OS === 'web' && !hidden ? {
    // Only the shown panel is a tabpanel, as React Aria and Vue draw it; its tab points here.
    role: 'tabpanel' as const, nativeID: `${id}-panel-${name}`,
    'aria-labelledby': names.includes(name) ? `${id}-tab-${name}` : undefined,
  } : {})}>{!lazy || seen.has(name) ? content(children) : null}</View>;
}
