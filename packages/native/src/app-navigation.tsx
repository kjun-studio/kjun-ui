import { typeStyle } from "./typography";
import { tokens } from "@kjun/tokens";
import { Children, Fragment, isValidElement, useState, type ReactNode } from "react";
import { View, Platform, type TextStyle, type GestureResponderEvent, type LayoutChangeEvent } from "react-native";
import { AccessiblePressable as Pressable } from "./a11y";
import { DsIcon } from "./button";
import { KText, content } from "./internal";
import { useKjunStyles } from "./provider";
import { TopNavigationContext } from "./top-navigation-context";
import { BottomActionBarContext } from "./bottom-action-bar-context";
export interface DsTopNavigationProps { title: string; description?: string; leading?: ReactNode; actions?: ReactNode; safeAreaTop?: number }
export function DsTopNavigation({ title, description, leading, actions, safeAreaTop = 0 }: DsTopNavigationProps) {
  const { colors } = useKjunStyles();
  const geometry = tokens.extensions.topNavigation;
  const titleInset = Math.max(0, (geometry.controlSize - tokens.typography.sectionTitle.lineHeightPx) / 2);
  const wrapping = Platform.OS === "web" ? { wordBreak: "keep-all", overflowWrap: "anywhere" } as TextStyle : {};
  // Icon-only controls at either end align their glyph, not their 44px target, with the content gutter (like Web).
  // A square control-sized box is the icon-only case; text buttons keep their own padding.
  const edgeInset = (geometry.controlSize - geometry.iconSize) / 2;
  const [iconEdges, setIconEdges] = useState({ leading: false, trailing: false });
  const square = (key: "leading" | "trailing") => (event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout;
    const next = Math.abs(width - height) < 1 && Math.abs(height - geometry.controlSize) < 1;
    setIconEdges(current => current[key] === next ? current : { ...current, [key]: next });
  };
  // Fragments are unwrapped so only the actual last control is measured and wrapped.
  const flatten = (node: ReactNode): ReactNode[] => Children.toArray(node).flatMap(child =>
    isValidElement<{ children?: ReactNode }>(child) && child.type === Fragment ? flatten(child.props.children) : [child]);
  const actionList = flatten(actions);
  return <TopNavigationContext.Provider value={geometry}>
    <View style={{ flexShrink: 0, paddingTop: Math.max(0, safeAreaTop), backgroundColor: colors.surface }}>
      <View style={{ minHeight: geometry.minimumHeight, flexDirection: "row", flexWrap: "wrap", alignItems: "flex-start", gap: geometry.gap, paddingVertical: geometry.paddingY, paddingHorizontal: geometry.paddingX }}>
        {leading && <TopNavigationContext.Provider value={{ ...geometry, slot: 'leading' }}><View onLayout={square("leading")} style={{ minHeight: geometry.controlSize, minWidth: 0, maxWidth: '40%', flexShrink: 1, justifyContent: "center", marginLeft: iconEdges.leading ? -edgeInset : 0 }}>{content(leading)}</View></TopNavigationContext.Provider>}
        <View style={{ flexGrow: 1, flexShrink: 1, flexBasis: geometry.titleMinimumWidth, minWidth: 0, paddingVertical: titleInset }}>
          <KText accessibilityRole="header" style={{ ...wrapping, ...typeStyle('sectionTitle'), fontWeight: typeStyle('control').fontWeight }}>{title}</KText>
          {description && <KText style={{ ...wrapping, marginTop: geometry.descriptionGap, color: colors.textSecondary, ...typeStyle('caption') }}>{description}</KText>}
        </View>
        {actions && <TopNavigationContext.Provider value={{ ...geometry, slot: 'actions' }}><View style={{ minHeight: geometry.controlSize, minWidth: 0, maxWidth: "100%", marginLeft: 'auto', flexShrink: 1, flexDirection: "row", flexWrap: "wrap", alignItems: "center", justifyContent: "flex-end", gap: geometry.actionsGap }}>
          {actionList.map((action, index) => index < actionList.length - 1 ? content(action)
            : <View key="trailing" onLayout={square("trailing")} style={{ flexShrink: 1, minWidth: 0, maxWidth: "100%", marginRight: iconEdges.trailing ? -edgeInset : 0 }}>{content(action)}</View>)}
        </View></TopNavigationContext.Provider>}
      </View>
    </View>
  </TopNavigationContext.Provider>;
}
export interface NavigationDestination { key: string; label: string; href?: string; icon?: string; badge?: string | number; disabled?: boolean }
export interface DsBottomNavigationProps { items: NavigationDestination[]; value: string; ariaLabel?: string; safeAreaBottom?: number; keyboardVisible?: boolean; hideOnKeyboard?: boolean; onNavigate?: (key: string, event: GestureResponderEvent) => void }
export function DsBottomNavigation({ items, value, ariaLabel = "주요 탐색", safeAreaBottom = 0, keyboardVisible = false, hideOnKeyboard = true, onNavigate }: DsBottomNavigationProps) {
  const { colors } = useKjunStyles();
  const geometry = tokens.extensions.bottomNavigation;
  const hasIcons = items.some(item => item.icon);
  if (keyboardVisible && hideOnKeyboard) return null;
  return <View role="navigation" accessibilityLabel={ariaLabel} style={{ flexShrink: 0, flexDirection: "row", backgroundColor: colors.surface, paddingBottom: Math.max(0, safeAreaBottom) }}>
    {items.map(item => {
      const selected = item.key === value;
      const ink = selected ? colors.brand : colors.textSecondary;
      // A filled count reads against the bar; the surface ring (drawn as a border outside the Web box) cuts it out of the icon.
      const ring = tokens.border.controlWidth;
      const badge = item.badge != null && <View pointerEvents="none" aria-hidden={true} style={{
        position: "absolute", top: -geometry.badgeOffset - ring,
        left: hasIcons ? geometry.iconSize - geometry.badgeOverlap - ring : "100%",
        marginLeft: hasIcons ? 0 : geometry.badgeOffset - ring,
        minWidth: geometry.badgeMinimumSize + 2 * ring, minHeight: geometry.badgeMinimumSize + 2 * ring,
        paddingHorizontal: geometry.badgePaddingX, borderRadius: geometry.badgeRadius,
        borderWidth: ring, borderColor: colors.surface,
        backgroundColor: colors.brand, alignItems: "center", justifyContent: "center",
      }}><KText style={{ ...typeStyle('caption'), fontWeight: typeStyle('control').fontWeight, color: colors.onBrand }}>{item.badge}</KText></View>;
      // Bottom bars meet the screen edges, so the ring stays inside the item, like tabs.
      return <Pressable key={item.key} focusRingInset
        {...(Platform.OS === "web" ? { href: item.disabled ? undefined : item.href, "aria-current": selected ? "page" : undefined } : {})}
        accessibilityRole={Platform.OS === "web" && item.href ? "link" : "button"}
        accessibilityLabel={item.label + (item.badge != null ? ", " + item.badge : "")}
        accessibilityState={{ selected, disabled: !!item.disabled }} disabled={item.disabled}
        onPress={event => onNavigate?.(item.key, event)}
        style={{ flex: 1, minWidth: 0, minHeight: geometry.minimumHeight, alignItems: "center",
          justifyContent: hasIcons ? "flex-start" : "center", gap: geometry.itemGap,
          paddingHorizontal: geometry.itemPaddingX, paddingVertical: geometry.itemPaddingY,
          opacity: item.disabled ? tokens.states.opacity.disabled : 1 }}>
        {hasIcons && <View style={{ width: geometry.iconSize, height: geometry.iconSize, flexShrink: 0 }}>
          {item.icon && <DsIcon name={item.icon} size={geometry.iconSize} color={ink} />}{badge}
        </View>}
        <View style={{ maxWidth: "100%" }}><KText style={{ ...typeStyle('caption'), textAlign: "center", fontWeight: selected ? typeStyle('control').fontWeight : typeStyle('label').fontWeight, color: ink }}>{item.label}</KText>{!hasIcons && badge}
          {/* Under the label, so a neighbour's wrapped label does not pull it away. */}
          {selected && <View pointerEvents="none" aria-hidden={true} style={{ position: "absolute", top: "100%", marginTop: geometry.indicatorOffset, left: "50%", marginLeft: -geometry.indicatorWidth / 2, width: geometry.indicatorWidth, height: geometry.indicatorHeight, borderRadius: geometry.indicatorHeight, backgroundColor: ink }} />}
        </View>
      </Pressable>;
    })}
  </View>;
}
export interface DsBottomActionBarProps { description?: string; children: ReactNode; safeAreaBottom?: number; keyboardVisible?: boolean; hideOnKeyboard?: boolean }
export function DsBottomActionBar({ description, children, safeAreaBottom = 0, keyboardVisible = false, hideOnKeyboard = false }: DsBottomActionBarProps) {
  const { colors } = useKjunStyles();
  const [width, setWidth] = useState(0);
  const geometry = tokens.extensions.navigation;
  const wide = width >= tokens.responsive.bottomAction + geometry.padding * 2;
  const wrapping = Platform.OS === "web" ? { wordBreak: "keep-all", overflowWrap: "anywhere" } as TextStyle : {};
  if (keyboardVisible && hideOnKeyboard) return null;
  return <BottomActionBarContext.Provider value={!wide}>
    <View onLayout={event => setWidth(event.nativeEvent.layout.width)} style={{
      flexShrink: 0, minWidth: 0, maxWidth: "100%", backgroundColor: colors.surface,
      padding: geometry.padding, paddingBottom: geometry.padding + Math.max(0, safeAreaBottom),
      gap: geometry.actionGap, flexDirection: wide ? "row" : "column", alignItems: wide ? "center" : "stretch",
    }}>
      {description && <KText style={{ ...typeStyle('body'), ...wrapping, color: colors.textSecondary, flex: wide ? 1 : undefined, minWidth: 0 }}>{description}</KText>}
      <View style={{ flexDirection: "row", flexWrap: "wrap", justifyContent: "flex-end", alignItems: "center", gap: geometry.actionsGap, minWidth: 0, maxWidth: "100%", flexShrink: 1 }}>{content(children)}</View>
    </View>
  </BottomActionBarContext.Provider>;
}
