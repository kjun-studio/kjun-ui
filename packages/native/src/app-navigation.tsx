import { useKjunMessages } from "../../../shared/package-runtime/messages-context";
import { hasContent } from "../../../shared/package-runtime/content-presence";
import { navigationBadge, navigationLabel, type NavigationBadge } from "../../../shared/package-runtime/navigation-badge";
import { shadowLayers } from "../../../shared/package-runtime/elevation";
import { typeStyle } from "./typography";
import { tokens } from "@kjun-ui/tokens";
import { Children, Fragment, isValidElement, useState, type ReactNode } from "react";
import { View, Platform, type ColorValue, type TextStyle, type GestureResponderEvent, type LayoutChangeEvent } from "react-native";
import { AccessiblePressable as Pressable } from "./a11y";
import { KjunIcon } from "./button";
import { KText, content } from "./internal";
import { useKjunStyles } from "./provider";
import { TopNavigationContext } from "./top-navigation-context";
import { BottomActionBarContext } from "./bottom-action-bar-context";
export interface KjunTopNavigationProps { title: string; description?: string; leading?: ReactNode; actions?: ReactNode; safeAreaTop?: number;
  /** Paints the surface background (default true); false lets the page background show through, so the bar does not read as a separate band. */
  surface?: boolean }
export function KjunTopNavigation({ title, description, leading, actions, safeAreaTop = 0, surface = true }: KjunTopNavigationProps) {
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
    <View style={{ flexShrink: 0, paddingTop: Math.max(0, safeAreaTop), backgroundColor: surface ? colors.surface : "transparent" }}>
      <View style={{ minHeight: geometry.minimumHeight, flexDirection: "row", flexWrap: "wrap", alignItems: "flex-start", gap: geometry.gap, paddingVertical: geometry.paddingY, paddingHorizontal: geometry.paddingX }}>
        {hasContent(leading) && <TopNavigationContext.Provider value={{ ...geometry, slot: 'leading' }}><View onLayout={square("leading")} style={{ minHeight: geometry.controlSize, minWidth: 0, maxWidth: '40%', flexShrink: 1, justifyContent: "center", marginLeft: iconEdges.leading ? -edgeInset : 0 }}>{content(leading)}</View></TopNavigationContext.Provider>}
        <View style={{ flexGrow: 1, flexShrink: 1, flexBasis: geometry.titleMinimumWidth, minWidth: 0, paddingVertical: titleInset }}>
          <KText accessibilityRole="header" style={{ ...wrapping, ...typeStyle('sectionTitle'), fontWeight: typeStyle('control').fontWeight }}>{title}</KText>
          {!!description && <KText style={{ ...wrapping, marginTop: geometry.descriptionGap, color: colors.textSecondary, ...typeStyle('caption') }}>{description}</KText>}
        </View>
        {hasContent(actions) && <TopNavigationContext.Provider value={{ ...geometry, slot: 'actions' }}><View style={{ minHeight: geometry.controlSize, minWidth: 0, maxWidth: "100%", marginLeft: 'auto', flexShrink: 1, flexDirection: "row", flexWrap: "wrap", alignItems: "center", justifyContent: "flex-end", gap: geometry.actionsGap }}>
          {actionList.map((action, index) => index < actionList.length - 1 ? content(action)
            : <View key="trailing" onLayout={square("trailing")} style={{ flexShrink: 1, minWidth: 0, maxWidth: "100%", marginRight: iconEdges.trailing ? -edgeInset : 0 }}>{content(action)}</View>)}
        </View></TopNavigationContext.Provider>}
      </View>
    </View>
  </TopNavigationContext.Provider>;
}
export interface NavigationDestination { key: string; label: string; href?: string; icon?: string;
  /** A count or short text; true draws a dot. Numbers over 99 show 99+, and the accessible name keeps the value. */
  badge?: NavigationBadge; disabled?: boolean }
// The ring that cuts a badge out of the icon is a border here (a box-shadow outside the box on Web), so the box grows by it.
function NavigationBadgeMark({ badge, ring, onIcon }: { badge: NavigationDestination["badge"]; ring: ColorValue; onIcon: boolean }) {
  const { colors } = useKjunStyles();
  const geometry = tokens.extensions.bottomNavigation;
  const width = tokens.border.controlWidth;
  const mark = navigationBadge(badge);
  if (!mark) return null;
  const size = mark.dot ? geometry.dotSize : geometry.badgeMinimumSize;
  return <View pointerEvents="none" aria-hidden={true} style={{
    position: "absolute", top: (mark.dot ? 0 : -geometry.badgeOffset) - width,
    left: onIcon ? (mark.dot ? geometry.iconSize - geometry.dotSize : geometry.iconSize - geometry.badgeOverlap - width) : "100%",
    marginLeft: onIcon ? 0 : geometry.badgeOffset - width,
    minWidth: size + 2 * width, minHeight: size + 2 * width,
    paddingHorizontal: mark.dot ? 0 : geometry.badgePaddingX, borderRadius: geometry.badgeRadius,
    borderWidth: width, borderColor: ring, backgroundColor: colors.danger, alignItems: "center", justifyContent: "center",
  }}>{!mark.dot && <KText style={{ ...typeStyle('caption'), fontWeight: typeStyle('control').fontWeight, fontVariant: ["tabular-nums"], color: colors.onDanger }}>{mark.text}</KText>}</View>;
}
type PressState = { pressed: boolean; hovered?: boolean };
export interface KjunBottomNavigationProps { items: NavigationDestination[]; value: string; ariaLabel?: string; safeAreaBottom?: number; keyboardVisible?: boolean; hideOnKeyboard?: boolean; onNavigate?: (key: string, event: GestureResponderEvent) => void;
  /** Paints the surface background (default true); false lets the page background show through, so the bar does not read as a separate band. */
  surface?: boolean }
export function KjunBottomNavigation({ items, value, ariaLabel, safeAreaBottom = 0, keyboardVisible = false, hideOnKeyboard = true, onNavigate, surface = true }: KjunBottomNavigationProps) {
  const m = useKjunMessages();
  ariaLabel ??= m.mainNavigation;
  const { colors } = useKjunStyles();
  const geometry = tokens.extensions.bottomNavigation;
  const hasIcons = items.some(item => item.icon);
  if (keyboardVisible && hideOnKeyboard) return null;
  // Without a surface the bar shows the page background, so the badge ring takes that colour.
  const ring = surface ? colors.surface : colors.background;
  const label = typeStyle('caption');
  return <View role="navigation" accessibilityLabel={ariaLabel} style={{ flexShrink: 0, flexDirection: "row", backgroundColor: surface ? colors.surface : "transparent", paddingBottom: Math.max(0, safeAreaBottom) }}>
    {/* A hairline on the surface keeps the bar apart from content scrolling under it, without adding height. */}
    {surface && <View pointerEvents="none" aria-hidden={true} style={{ position: "absolute", top: 0, left: 0, right: 0, height: tokens.border.defaultWidth, backgroundColor: colors.divider }} />}
    {items.map(item => {
      const selected = item.key === value;
      const ink = selected ? colors.brand : colors.textSecondary;
      const badge = <NavigationBadgeMark badge={item.badge} ring={ring} onIcon={hasIcons} />;
      // Press feedback: a circle behind the icon, or a pill behind a text-only label.
      const press = ({ pressed, hovered }: PressState) => !item.disabled && (pressed || hovered) ? (pressed ? colors.active : colors.hover) : "transparent";
      // Bottom bars meet the screen edges, so the ring stays inside the item, like tabs.
      return <Pressable key={item.key} focusRingInset
        {...(Platform.OS === "web" ? { href: item.disabled ? undefined : item.href, "aria-current": selected ? "page" : undefined } : {})}
        accessibilityRole={Platform.OS === "web" && item.href ? "link" : "button"}
        accessibilityLabel={navigationLabel(item.label, item.badge, m.newContent)}
        accessibilityState={{ selected, disabled: !!item.disabled }} disabled={item.disabled}
        onPress={event => onNavigate?.(item.key, event)}
        style={{ flex: 1, minWidth: 0, minHeight: geometry.minimumHeight, alignItems: "center",
          justifyContent: hasIcons ? "flex-start" : "center", gap: geometry.itemGap,
          paddingHorizontal: geometry.itemPaddingX, paddingVertical: geometry.itemPaddingY,
          opacity: item.disabled ? tokens.states.opacity.disabled : 1 }}>
        {(state: PressState) => <>
          {hasIcons && <View style={{ width: geometry.iconSize, height: geometry.iconSize, flexShrink: 0 }}>
            <View pointerEvents="none" style={{ position: "absolute", top: (geometry.iconSize - geometry.pressSize) / 2, left: (geometry.iconSize - geometry.pressSize) / 2, width: geometry.pressSize, height: geometry.pressSize, borderRadius: geometry.pressSize / 2, backgroundColor: press(state) }} />
            {!!item.icon && <KjunIcon name={item.icon} filled={selected} size={geometry.iconSize} color={ink} />}{badge}
          </View>}
          <View style={{ maxWidth: "100%" }}>
            {!hasIcons && <View pointerEvents="none" style={{ position: "absolute", top: (label.lineHeight - geometry.pressSize) / 2, left: -geometry.pressPaddingX, right: -geometry.pressPaddingX, height: geometry.pressSize, borderRadius: geometry.pressSize / 2, backgroundColor: press(state) }} />}
            <KText style={{ ...label, textAlign: "center", fontWeight: selected ? typeStyle('control').fontWeight : typeStyle('label').fontWeight, color: ink }}>{item.label}</KText>{!hasIcons && badge}
          </View>
        </>}
      </Pressable>;
    })}
  </View>;
}
export interface KjunFloatingNavigationProps { items: NavigationDestination[]; value: string; ariaLabel?: string; safeAreaBottom?: number; keyboardVisible?: boolean; hideOnKeyboard?: boolean; onNavigate?: (key: string, event: GestureResponderEvent) => void }
/** A capsule detached from the screen edge. Destinations with an icon show only the icon; the label stays their accessible name. */
export function KjunFloatingNavigation({ items, value, ariaLabel, safeAreaBottom = 0, keyboardVisible = false, hideOnKeyboard = true, onNavigate }: KjunFloatingNavigationProps) {
  const m = useKjunMessages();
  ariaLabel ??= m.mainNavigation;
  const { colors } = useKjunStyles();
  const geometry = tokens.extensions.floatingNavigation;
  const border = tokens.border.defaultWidth;
  if (keyboardVisible && hideOnKeyboard) return null;
  // The outline is a border inside the box (a ring outside it on Web), so the padding gives it back.
  return <View role="navigation" accessibilityLabel={ariaLabel} style={{
    flexShrink: 0, alignSelf: "center", flexDirection: "row", maxWidth: "100%", marginBottom: geometry.offset + Math.max(0, safeAreaBottom),
    padding: geometry.padding - border, gap: geometry.gap, borderRadius: geometry.radius, borderWidth: border, borderColor: colors.border,
    backgroundColor: colors.surface, boxShadow: shadowLayers(tokens.elevation.floating, colors),
  }}>
    {items.map(item => {
      const selected = item.key === value;
      const ink = selected ? colors.surface : colors.textSecondary;
      const badge = <NavigationBadgeMark badge={item.badge} ring={selected ? colors.text : colors.surface} onIcon={!!item.icon} />;
      return <Pressable key={item.key}
        {...(Platform.OS === "web" ? { href: item.disabled ? undefined : item.href, "aria-current": selected ? "page" : undefined } : {})}
        accessibilityRole={Platform.OS === "web" && item.href ? "link" : "button"}
        accessibilityLabel={navigationLabel(item.label, item.badge, m.newContent)}
        accessibilityState={{ selected, disabled: !!item.disabled }} disabled={item.disabled}
        onPress={event => onNavigate?.(item.key, event)}
        style={({ pressed, hovered }: PressState) => ({ minWidth: geometry.itemSize, height: geometry.itemSize, borderRadius: geometry.radius,
          alignItems: "center", justifyContent: "center", paddingHorizontal: item.icon ? 0 : geometry.textPaddingX,
          backgroundColor: selected ? colors.text : !item.disabled && pressed ? colors.active : !item.disabled && hovered ? colors.hover : "transparent",
          opacity: item.disabled ? tokens.states.opacity.disabled : 1 })}>
        {item.icon
          ? <View style={{ width: geometry.iconSize, height: geometry.iconSize }}><KjunIcon name={item.icon} filled={selected} size={geometry.iconSize} color={ink} />{badge}</View>
          : <View><KText style={{ ...typeStyle('control'), color: ink }}>{item.label}</KText>{badge}</View>}
      </Pressable>;
    })}
  </View>;
}
export interface KjunBottomActionBarProps { description?: string; children: ReactNode; safeAreaBottom?: number; keyboardVisible?: boolean; hideOnKeyboard?: boolean;
  /** Paints the surface background (default true); false lets the page background show through, so the bar does not read as a separate band. */
  surface?: boolean }
export function KjunBottomActionBar({ description, children, safeAreaBottom = 0, keyboardVisible = false, hideOnKeyboard = false, surface = true }: KjunBottomActionBarProps) {
  const { colors } = useKjunStyles();
  const [width, setWidth] = useState(0);
  const geometry = tokens.extensions.navigation;
  const wide = width >= tokens.responsive.bottomAction + geometry.padding * 2;
  const wrapping = Platform.OS === "web" ? { wordBreak: "keep-all", overflowWrap: "anywhere" } as TextStyle : {};
  if (keyboardVisible && hideOnKeyboard) return null;
  return <BottomActionBarContext.Provider value={!wide}>
    <View onLayout={event => setWidth(event.nativeEvent.layout.width)} style={{
      flexShrink: 0, minWidth: 0, maxWidth: "100%", backgroundColor: surface ? colors.surface : "transparent",
      padding: geometry.padding, paddingBottom: geometry.padding + Math.max(0, safeAreaBottom),
      gap: geometry.actionGap, flexDirection: wide ? "row" : "column", alignItems: wide ? "center" : "stretch",
    }}>
      {!!description && <KText style={{ ...typeStyle('body'), ...wrapping, color: colors.textSecondary, flex: wide ? 1 : undefined, minWidth: 0 }}>{description}</KText>}
      <View style={{ flexDirection: "row", flexWrap: "wrap", justifyContent: "flex-end", alignItems: "center", gap: geometry.actionsGap, minWidth: 0, maxWidth: "100%", flexShrink: 1 }}>{content(children)}</View>
    </View>
  </BottomActionBarContext.Provider>;
}
