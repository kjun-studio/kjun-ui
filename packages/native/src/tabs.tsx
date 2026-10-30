import { useKjunMessages } from "../../../shared/package-runtime/messages-context";
import { hasContent } from "../../../shared/package-runtime/content-presence";
import { tokens } from '@kjun-ui/tokens';
import { typeStyle, selectionTypeStyle } from "./typography";
import { Children, createContext, isValidElement, useContext, useCallback, useLayoutEffect, useRef, useId, useState, type ReactElement, type ReactNode } from "react";
import { useInitialTab } from "../../../shared/package-runtime/navigation";
import { Animated, Platform, ScrollView, View, type LayoutRectangle } from "react-native";
import { AccessiblePressable as Pressable } from "./a11y";
import { KjunIcon } from "./button";
import { BadgeView } from "./display-primitives";
import { KText, content } from "./internal";
import { useKjunStyles } from "./provider";
import { useTabKeyboard, usePanelFocus } from "./tabs-accessibility";
import { useButtonGroupMotion } from "./button-group-motion";
export interface TabItem {
  name: string;
  label: string;
  icon?: string;
  badge?: string | number;
  badgeVariant?: "danger" | "success" | "warning" | "info";
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
const TabContext = createContext({ value: "", id: "", names: [] as string[] });
export function KjunTabs({
  value,
  items = [],
  density = "comfortable",
  variant = "underline",
  fullWidth = false,
  actions,
  children,
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
  // A zoomed browser can round the measured bold label slightly narrower than
  // the regular label. Tabs stay on one line inside their horizontal scroller.
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
  useTabKeyboard(root, change);
  useInitialTab(value, tabs.find(tab => !tab.disabled)?.name, change);
  return (
    <TabContext.Provider value={{ value, id, names: tabs.map(tab => tab.name) }}>
      <View ref={root}>
        <ScrollView
          horizontal
          accessibilityRole="tablist"
          accessibilityLabel={ariaLabel}
          showsHorizontalScrollIndicator={false}
          // Underline tabs ring outside their label and indicator, and compact tabs extend their touch target.
          style={{ marginHorizontal: -roomX, marginVertical: -roomY }}
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
              backgroundColor: colors.brand,
              opacity: selectedTab?.disabled ? tokens.states.opacity.disabled : 1,
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
                  'aria-controls': panelNames.includes(tab.name) ? `${id}-panel-${tab.name}` : undefined,
                } : {})}
                ref={node => { if (node) tabRefs.current.set(tab.name, node); else tabRefs.current.delete(tab.name); }}
                onLayout={event => measureIndicator(tab.name, event.nativeEvent.layout)}
                accessibilityRole="tab"
                focusRingInset={!underline}
                hitSlop={slop ? { top: slop, bottom: slop } : undefined}
                accessibilityLabel={tab.label}
                accessibilityState={{
                  selected: active,
                  disabled: !!tab.disabled,
                }}
                disabled={tab.disabled}
                onPress={() => change(tab.name)}
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
                <View>
                  <KText accessible={false} accessibilityElementsHidden importantForAccessibility="no-hide-descendants"
                    style={{ opacity: 0, ...typeStyle("control"), ...singleLine }}>{tab.label}</KText>
                  <KText style={{ position: 'absolute', left: 0, right: 0, top: 0, ...selectionTypeStyle("md", active),
                     color: ink, ...singleLine }}>{tab.label}</KText>
                </View>
                {tab.badge != null && (
                  <BadgeView size="xs" variant={tab.badgeVariant ?? "default"}>{tab.badge}</BadgeView>
                )}
              </Pressable>
            );
          })}
          {content(actions)}
        </ScrollView>
        {hasContent(children) && <View style={{ marginTop: geometry.contentGap }}>{content(children)}</View>}
      </View>
    </TabContext.Provider>
  );
}
export interface KjunTabPaneProps extends TabItem {
  children?: ReactNode;
}
export function KjunTabPane({ name, children }: KjunTabPaneProps) {
  const { value, id, names } = useContext(TabContext);
  const root = useRef<View>(null);
  usePanelFocus(root);
  const hidden = value !== name;
  // Hiding a panel preserves its children's state; removing it releases them.
  return <View ref={root} style={hidden ? { display: 'none' } : undefined}
    accessibilityElementsHidden={hidden} importantForAccessibility={hidden ? 'no-hide-descendants' : 'auto'}
    pointerEvents={hidden ? 'none' : 'auto'} {...(Platform.OS === 'web' ? {
    role: 'tabpanel' as const, nativeID: `${id}-panel-${name}`,
    'aria-labelledby': names.includes(name) ? `${id}-tab-${name}` : undefined,
  } : {})}>{content(children)}</View>;
}
