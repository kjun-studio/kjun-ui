import { typeStyle } from "./typography";
import { tokens } from "@kjun/tokens";
import { Children, createContext, useContext, type ReactNode } from "react";
import { View, Platform, type GestureResponderEvent } from "react-native";
import { AccessiblePressable as Pressable } from "./a11y";
import { KText, content } from "./internal";
import { useKjunStyles } from "./provider";
// A section tells its last row so the divider stays between rows, like Web's :last-child.
const LastListRow = createContext(false);
export interface DsListRowProps { title: string; description?: string; leading?: ReactNode; trailing?: ReactNode; actions?: ReactNode; href?: string; disabled?: boolean; onPress?: (event: GestureResponderEvent) => void }
export function DsListRow({ title, description, leading, trailing, actions, href, disabled = false, onPress }: DsListRowProps) {
  const { colors } = useKjunStyles(), last = useContext(LastListRow);
  const parts = <>{leading && <View>{content(leading)}</View>}<View style={{ flex: 1, minWidth: 0 }}><KText style={{  ...typeStyle('label'),  }}>{title}</KText>{description && <KText style={{ marginTop: tokens.extensions.list.descriptionGap, color: colors.textSecondary, ...typeStyle('caption'),  }}>{description}</KText>}</View>{trailing && <View style={{ maxWidth: "35%" }}>{content(trailing)}</View>}</>;
  const style = { flex: 1, minWidth: 0, minHeight: tokens.extensions.list.minimumHeight, flexDirection: "row" as const, alignItems: "center" as const, gap: tokens.extensions.list.gap, padding: tokens.extensions.list.padding };
  return <View role="listitem" style={{ flexDirection: "row", alignItems: "center", gap: tokens.extensions.list.gap, borderBottomWidth: last ? 0 : tokens.border.defaultWidth, borderBottomColor: colors.divider }}>
    {onPress || href ? <Pressable {...(Platform.OS === "web" && href && !disabled ? { href } : {})} accessibilityRole={href ? "link" : "button"} accessibilityLabel={title + (description ? ", " + description : "")} disabled={disabled} accessibilityState={{ disabled }} onPress={onPress} style={({ pressed }) => ({ ...style, opacity: disabled ? tokens.states.opacity.disabled : 1, backgroundColor: pressed ? colors.hover : "transparent" })}>{parts}</Pressable> : <View style={style}>{parts}</View>}
    {/* A disabled row disables its actions too, so the row never reads as partly available. */}
    {actions && <View pointerEvents={disabled ? "none" : "auto"} {...(disabled && Platform.OS === "web" ? { inert: true } : {})} style={{ maxWidth: "45%", flexDirection: "row", flexWrap: "wrap", gap: tokens.extensions.list.actionsGap, paddingRight: tokens.extensions.list.actionsPadding, opacity: disabled ? tokens.states.opacity.disabled : 1 }}>{content(actions)}</View>}
  </View>;
}
export interface DsListSectionProps { title?: string; description?: string; actions?: ReactNode; children: ReactNode; ariaLabel?: string }
export function DsListSection({ title, description, actions, children, ariaLabel }: DsListSectionProps) {
  const { colors } = useKjunStyles();
  return <View style={{ minWidth: 0, backgroundColor: colors.surface }}>
    {(title || description || actions) && <View style={{ flexDirection: "row", alignItems: "center", gap: tokens.extensions.list.gap, padding: tokens.extensions.list.padding }}><View style={{ flex: 1 }}>{title && <KText accessibilityRole="header" style={{ ...typeStyle('cardTitle'),  }}>{title}</KText>}{description && <KText style={{ marginTop: tokens.extensions.list.descriptionGap, color: colors.textSecondary, ...typeStyle('caption'),  }}>{description}</KText>}</View>{content(actions)}</View>}
    <View role="list" accessibilityLabel={ariaLabel || title}>{Children.toArray(children).map((row, i, rows) => <LastListRow.Provider key={i} value={i === rows.length - 1}>{row}</LastListRow.Provider>)}</View>
  </View>;
}
