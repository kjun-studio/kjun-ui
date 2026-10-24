import { hasContent } from "../../../shared/package-runtime/content-presence";
import { typeStyle } from "./typography";
import { tokens } from "@kjun-ui/tokens";
import { Children, createContext, useContext, type ReactNode } from "react";
import { View, Platform, type GestureResponderEvent } from "react-native";
import { AccessiblePressable as Pressable } from "./a11y";
import { KText, content } from "./internal";
import { KjunIcon } from "./button";
import { useKjunStyles } from "./provider";
// A section tells its rows whether to draw a divider (never after the last, like Web's :last-child) and how dense they are.
const ListRowContext = createContext({ divider: true, compact: false });
export interface KjunListRowProps {
  title: string; description?: string; leading?: ReactNode; trailing?: ReactNode; actions?: ReactNode; href?: string; disabled?: boolean;
  /** Draws the title in the danger role, for rows such as "Delete account". */
  destructive?: boolean;
  /** Ends the row with a decorative chevron that marks it as navigation. */
  chevron?: boolean;
  onPress?: (event: GestureResponderEvent) => void;
}
export function KjunListRow({ title, description, leading, trailing, actions, href, disabled = false, destructive = false, chevron = false, onPress }: KjunListRowProps) {
  const { colors } = useKjunStyles(), { divider, compact } = useContext(ListRowContext);
  const parts = <>{hasContent(leading) && <View>{content(leading)}</View>}<View style={{ flex: 1, minWidth: 0 }}><KText style={{ ...typeStyle('label'), ...(destructive ? { color: colors.danger } : {}) }}>{title}</KText>{!!description && <KText style={{ marginTop: tokens.extensions.list.descriptionGap, color: colors.textSecondary, ...typeStyle('caption'),  }}>{description}</KText>}</View>{hasContent(trailing) && <View style={{ maxWidth: "35%" }}>{content(trailing)}</View>}{chevron && <View accessible={false} importantForAccessibility="no-hide-descendants" accessibilityElementsHidden><KjunIcon name="chevron-right" size={tokens.iconSizes.default} color={colors.textTertiary} /></View>}</>;
  const style = { flex: 1, minWidth: 0, minHeight: compact ? tokens.extensions.list.compactMinimumHeight : tokens.extensions.list.minimumHeight, flexDirection: "row" as const, alignItems: "center" as const, gap: tokens.extensions.list.gap, padding: tokens.extensions.list.padding, ...(compact ? { paddingVertical: tokens.extensions.list.compactPaddingY } : {}) };
  return <View role="listitem" style={{ flexDirection: "row", alignItems: "center", gap: tokens.extensions.list.gap, borderBottomWidth: divider ? tokens.border.defaultWidth : 0, borderBottomColor: colors.divider }}>
    {onPress || href ? <Pressable {...(Platform.OS === "web" && href && !disabled ? { href } : {})} accessibilityRole={href ? "link" : "button"} accessibilityLabel={title + (description ? ", " + description : "")} disabled={disabled} accessibilityState={{ disabled }} onPress={onPress} style={({ pressed }) => ({ ...style, opacity: disabled ? tokens.states.opacity.disabled : 1, backgroundColor: pressed ? colors.hover : "transparent" })}>{parts}</Pressable> : <View style={style}>{parts}</View>}
    {/* A disabled row disables its actions too, so the row never reads as partly available. */}
    {hasContent(actions) && <View pointerEvents={disabled ? "none" : "auto"} {...(disabled && Platform.OS === "web" ? { inert: true } : {})} style={{ maxWidth: "45%", flexDirection: "row", flexWrap: "wrap", gap: tokens.extensions.list.actionsGap, paddingRight: tokens.extensions.list.actionsPadding, opacity: disabled ? tokens.states.opacity.disabled : 1 }}>{content(actions)}</View>}
  </View>;
}
export interface KjunListSectionProps {
  title?: string; description?: string; actions?: ReactNode; children: ReactNode; ariaLabel?: string;
  /** Paints the surface background (default true); false lets the page background show through. */
  surface?: boolean;
  /** Draws dividers between rows (default true). */
  divider?: boolean;
  /** "compact" rows keep the 16px inset but are 44 tall (the touch minimum) instead of 56. */
  density?: "default" | "compact";
}
export function KjunListSection({ title, description, actions, children, ariaLabel, surface = true, divider = true, density = "default" }: KjunListSectionProps) {
  const { colors } = useKjunStyles();
  return <View style={{ minWidth: 0, backgroundColor: surface ? colors.surface : "transparent" }}>
    {!!(title || description || actions) && <View style={{ flexDirection: "row", alignItems: "center", gap: tokens.extensions.list.gap, padding: tokens.extensions.list.padding }}><View style={{ flex: 1 }}>{!!title && <KText accessibilityRole="header" style={{ ...typeStyle('cardTitle'),  }}>{title}</KText>}{!!description && <KText style={{ marginTop: tokens.extensions.list.descriptionGap, color: colors.textSecondary, ...typeStyle('caption'),  }}>{description}</KText>}</View>{content(actions)}</View>}
    <View role="list" accessibilityLabel={ariaLabel || title}>{Children.toArray(children).map((row, i, rows) => <ListRowContext.Provider key={i} value={{ divider: divider && i < rows.length - 1, compact: density === "compact" }}>{row}</ListRowContext.Provider>)}</View>
  </View>;
}
export interface KjunListItemProps { children: ReactNode }
/** Non-row content inside a KjunListSection (a theme switcher, a note) on the rows' inset and dividers. */
export function KjunListItem({ children }: KjunListItemProps) {
  const { colors } = useKjunStyles(), { divider, compact } = useContext(ListRowContext);
  return <View role="listitem" style={{ padding: tokens.extensions.list.padding, ...(compact ? { paddingVertical: tokens.extensions.list.compactPaddingY } : {}),
    borderBottomWidth: divider ? tokens.border.defaultWidth : 0, borderBottomColor: colors.divider, minWidth: 0 }}>{content(children)}</View>;
}
