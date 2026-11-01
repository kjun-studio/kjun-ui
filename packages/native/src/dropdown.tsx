import { useKjunMessages } from "../../../shared/package-runtime/messages-context";
import { tokens } from "@kjun-ui/tokens";
import {
Children,
Fragment,
createContext,
isValidElement,
useContext,
useEffect,
useRef,
useState,
type ReactNode
} from "react";
import {
Platform,
View
} from "react-native";
import { AccessiblePressable as Pressable } from "./a11y";
import { KjunButton,KjunIcon,type KjunButtonProps } from "./button";
import { FloatingPanel,LayerTrigger } from "./floating-panel";
import { KText, content, finePointer } from "./internal";
import { typeStyle } from "./typography";
import { tintColor } from "../../../shared/package-runtime/alert-tone";
import { KjunTooltip,type KjunTooltipProps } from "./popover";
import { useKjunStyles } from "./provider";
export const DropdownContext = createContext<(() => void) | null>(null);
// Submenus open in place: the menu shows one level at a time, with a back row at the top of a submenu.
interface MenuView { view: string; open: (key: string) => void; back: () => void; compact: boolean }
const MenuViewContext = createContext<MenuView>({ view: "", open: () => {}, back: () => {}, compact: false });
const MenuLevelContext = createContext("");
const useShown = () => useContext(MenuViewContext).view === useContext(MenuLevelContext);
// The check and icon columns each appear once any item in the open menu uses them, so every label shares one start line.
interface LeadingSlots { check: boolean; icon: boolean }
const MenuIconSlotContext = createContext<LeadingSlots>({ check: false, icon: false });
type LeadingProps = { icon?: string; selected?: boolean | null; checked?: boolean | null; id?: string; label?: string; children?: ReactNode };
function hasLeading(node: ReactNode, slot: (props: LeadingProps) => boolean): boolean {
  return Children.toArray(node).some(child => isValidElement<LeadingProps>(child) &&
    (child.type === Fragment || child.type === KjunDropdownSection ? hasLeading(child.props.children, slot)
      : (child.type === KjunDropdownItem || child.type === KjunDropdownSubmenu) && slot(child.props)));
}
/** The children of the level the menu shows: the top level, or the open submenu's items. */
function levelChildren(node: ReactNode, view: string, level = ""): ReactNode | undefined {
  if (view === level) return node;
  for (const child of Children.toArray(node)) {
    if (!isValidElement<LeadingProps>(child)) continue;
    const key = child.type === KjunDropdownSubmenu ? (level ? level + "/" : "") + (child.props.id ?? child.props.label) : level;
    if (child.type === Fragment || child.type === KjunDropdownSection || child.type === KjunDropdownSubmenu) {
      const found = levelChildren(child.props.children, view, key);
      if (found !== undefined) return found;
    }
  }
  return undefined;
}
/** A trigger's own name, so the menu is named after it like the web menu (aria-labelledby). */
function triggerName(node: ReactNode): string | undefined {
  if (!isValidElement<{ ariaLabel?: string; accessibilityLabel?: string; children?: ReactNode }>(node)) return undefined;
  if (node.type === KjunTooltip) return triggerName(node.props.children);
  return node.props.ariaLabel || node.props.accessibilityLabel || (typeof node.props.children === "string" ? node.props.children : undefined);
}
export interface KjunDropdownProps {
  disabled?: boolean;
  placement?: "bottom-start" | "bottom-end" | "top-start" | "top-end";
  menuId?: string;
  triggerId?: string;
  /** compact: 32px rows on Native Web's fine pointers; touch keeps 44px. */
  density?: "comfortable" | "compact";
  trigger: ReactNode;
  children: ReactNode;
  onOpen?: () => void;
  onClose?: () => void;
}
export function KjunDropdown({
  disabled = false,
  placement = "bottom-start",
  menuId,
  density = "comfortable",
  trigger,
  children,
  onOpen,
  onClose,
}: KjunDropdownProps) {
  const m = useKjunMessages();
  const [open, setOpen] = useState(false),
    [stack, setStack] = useState<string[]>([]),
    currentOpen = useRef(false),
    ref = useRef<View>(null);
  let control = trigger;
  while (isValidElement<KjunTooltipProps>(control) && control.type === KjunTooltip)
    control = control.props.children;
  const unavailable = disabled || (isValidElement<KjunButtonProps>(control) &&
    !!(control.props.disabled || control.props.loading));
  const change = (v: boolean) => {
    if (v === currentOpen.current || (v && unavailable)) return;
    currentOpen.current = v;
    setOpen(v);
    if (!v) setStack([]);
    if (v) onOpen?.();
    else onClose?.();
  };
  useEffect(() => {
    if (unavailable) change(false);
  }, [unavailable]);
  const view = stack[stack.length - 1] ?? "";
  const shownChildren = levelChildren(children, view) ?? children;
  // Compact rows only where the pointer is fine; touch keeps the full target.
  const menuView: MenuView = { view, open: key => setStack(current => [...current, key]), back: () => setStack(current => current.slice(0, -1)), compact: density === "compact" && finePointer() };
  return (
    <DropdownContext.Provider value={() => change(false)}>
      <View ref={ref} collapsable={false}>
        <LayerTrigger
          trigger={trigger}
          disabled={disabled}
          expanded={open}
          popup="menu"
          onPress={() => change(!currentOpen.current)}
        />
      </View>
      <FloatingPanel
        open={open}
        onOpenChange={change}
        triggerRef={ref}
        placement={placement}
        ariaLabel={m.menu}
        menu
      >
        <MenuViewContext.Provider value={menuView}>
          {/* Leading columns are reserved for the level on show, as on Web. */}
          <MenuIconSlotContext.Provider value={{ check: hasLeading(shownChildren, p => p.selected != null || p.checked != null), icon: hasLeading(shownChildren, p => !!p.icon) }}>
            {/* Native Web reads the rows as a menu, like the web packages. */}
            <View nativeID={menuId} {...(Platform.OS === "web" ? { role: "menu" as const, "aria-label": triggerName(control) ?? m.menu } : {})}>{children}</View>
          </MenuIconSlotContext.Provider>
        </MenuViewContext.Provider>
      </FloatingPanel>
    </DropdownContext.Provider>
  );
}
export interface KjunDropdownItemProps {
  id?: string;
  variant?: "default" | "danger";
  icon?: string;
  disabled?: boolean;
  /** Single choice: a check in the leading column, announced as a radio item. */
  selected?: boolean | null;
  /** Independent toggle: a check in the leading column, announced as a checkbox. */
  checked?: boolean | null;
  /** Second line under the label. */
  description?: string;
  /** Keyboard hint shown at the end on Native Web, such as "⌘D". It only describes; wiring the keys is the app's job. */
  shortcut?: string;
  /** Keeps the menu open after choosing, for toggles the user flips several times. */
  keepOpen?: boolean;
  children: ReactNode;
  onPress?: () => void;
}
function MenuRow({ variant = "default", icon, disabled = false, check = null, description, shortcut, chevron, back, accessibilityRole, accessibilityLabel, nativeID, children, onPress }: {
  variant?: "default" | "danger"; icon?: string; disabled?: boolean; check?: boolean | null; description?: string; shortcut?: string; chevron?: boolean; back?: boolean;
  accessibilityRole: "menuitem" | "radio" | "checkbox"; accessibilityLabel?: string; nativeID?: string; children: ReactNode; onPress: () => void }) {
  const { colors } = useKjunStyles(), menu = useContext(MenuViewContext), reserve = useContext(MenuIconSlotContext);
  const geometry = tokens.extensions.menu;
  const [hovered, setHovered] = useState(false);
  const danger = variant === "danger";
  const color = disabled ? colors.textDisabled : danger ? colors.danger : colors.text;
  // Leading icons sit a step below the regular-weight label; danger items keep their role color.
  const iconColor = disabled ? colors.textDisabled : danger ? colors.danger : colors.textSecondary;
  // Danger keeps a light tint of its own colour in both themes instead of a heavy fill.
  const dangerTint = typeof colors.danger === "string" ? tintColor(colors.danger, tokens.states.opacity.tintHover) : undefined;
  return (
    <Pressable
      focusRingInset
      accessibilityRole={accessibilityRole}
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ disabled, ...(check === null ? {} : { checked: check }) }}
      nativeID={nativeID}
      // A submenu row says it opens a menu, as on Web. Inside role="menu", choices are menu radio and checkbox items.
      {...(Platform.OS === "web" ? {
        ...(chevron ? { "aria-haspopup": "menu" } : {}),
        // React Native's Role type has no menu radio or checkbox items; React Native Web passes the role through.
        role: (accessibilityRole === "radio" ? "menuitemradio" : accessibilityRole === "checkbox" ? "menuitemcheckbox" : "menuitem") as "menuitem",
        ...(check === null ? {} : { "aria-checked": check }),
      } : {})}
      disabled={disabled}
      onHoverIn={() => setHovered(true)}
      onHoverOut={() => setHovered(false)}
      onPress={onPress}
      style={({ pressed }) => ({
        flexDirection: "row",
        alignItems: description ? "flex-start" : "center",
        gap: tokens.dimension.value8,
        paddingVertical: menu.compact ? geometry.compactOptionPaddingY : geometry.optionPaddingY,
        paddingHorizontal: menu.compact ? geometry.compactOptionPaddingX : geometry.optionPaddingX,
        minHeight: menu.compact ? geometry.compactOptionHeight : Math.max(geometry.itemHeight, tokens.native.minimumTouchTarget),
        borderRadius: geometry.optionRadius,
        backgroundColor: check && accessibilityRole === "radio" ? colors.selectedBg : !disabled && (pressed || hovered)
          ? danger ? dangerTint ?? colors.dangerBg : colors.hover : undefined,
      })}
    >
      {check != null ? <View style={{ opacity: check ? 1 : 0 }} accessible={false}><KjunIcon name="check" size={geometry.iconSize} color={disabled ? colors.textDisabled : colors.brand} /></View>
        : reserve.check && <View style={{ width: geometry.iconSize }} accessible={false} />}
      {icon ? <KjunIcon name={icon} size={geometry.iconSize} color={iconColor} />
        : reserve.icon && <View style={{ width: geometry.iconSize }} accessible={false} />}
      <View style={{ flexGrow: 1, flexShrink: 1 }}>
        {content(children, { color, fontSize: geometry.optionFontSize, lineHeight: geometry.optionLineHeight, ...(back ? { fontWeight: typeStyle("control").fontWeight } : {}) })}
        {!!description && <KText style={{ ...typeStyle("caption"), marginTop: geometry.descriptionGap, color: disabled ? colors.textDisabled : colors.textSecondary }}>{description}</KText>}
      </View>
      {!!shortcut && Platform.OS === "web" && <KText style={{ ...typeStyle("meta"), fontVariant: ["tabular-nums"], color: disabled ? colors.textDisabled : colors.textTertiary }}>{shortcut}</KText>}
      {chevron && <KjunIcon name="chevron-right" size={geometry.iconSize} color={colors.textTertiary} />}
    </Pressable>
  );
}
export function KjunDropdownItem({
  id,
  variant = "default",
  icon,
  disabled = false,
  selected = null,
  checked = null,
  description,
  shortcut,
  keepOpen = false,
  children,
  onPress,
}: KjunDropdownItemProps) {
  const close = useContext(DropdownContext);
  if (!useShown()) return null;
  return <MenuRow variant={variant} icon={icon} disabled={disabled} check={selected ?? checked} description={description} shortcut={shortcut} nativeID={id}
    accessibilityRole={selected !== null ? "radio" : checked !== null ? "checkbox" : "menuitem"}
    onPress={() => { onPress?.(); if (!keepOpen) close?.(); }}>{children}</MenuRow>;
}
export interface KjunDropdownSectionProps {
  /** Small heading over the group; it names the group for screen readers. */
  title?: string;
  /** Names the group for screen readers when it has no visible title. */
  ariaLabel?: string;
  children: ReactNode;
}
export function KjunDropdownSection({ title, ariaLabel, children }: KjunDropdownSectionProps) {
  const { colors } = useKjunStyles(), menu = useContext(MenuViewContext);
  const geometry = tokens.extensions.menu;
  // Outside its own level the group draws nothing itself, but a submenu inside it may be the level shown.
  if (!useShown()) return <>{children}</>;
  return <View role="group" aria-label={title || ariaLabel}>
    {!!title && <KText aria-hidden={true} style={{ ...typeStyle("meta"), color: colors.textTertiary, paddingTop: geometry.sectionPaddingTop, paddingBottom: geometry.sectionPaddingBottom,
      paddingHorizontal: menu.compact ? geometry.compactOptionPaddingX : geometry.optionPaddingX }}>{title}</KText>}
    {content(children)}
  </View>;
}
export interface KjunDropdownSubmenuProps {
  /** Stable key for the submenu; defaults to the label. */
  id?: string;
  label: string;
  icon?: string;
  disabled?: boolean;
  children: ReactNode;
}
/** An item that opens its own items in place of the menu, with a back row. */
export function KjunDropdownSubmenu({ id, label, icon, disabled = false, children }: KjunDropdownSubmenuProps) {
  const m = useKjunMessages(), menu = useContext(MenuViewContext), level = useContext(MenuLevelContext);
  const key = (level ? level + "/" : "") + (id ?? label);
  return <>
    {menu.view === level && <MenuRow icon={icon} disabled={disabled} chevron accessibilityRole="menuitem" onPress={() => menu.open(key)}>{label}</MenuRow>}
    {menu.view === key && <MenuRow icon="chevron-left" back accessibilityRole="menuitem" accessibilityLabel={m.back + ", " + label} onPress={menu.back}>{label}</MenuRow>}
    <MenuLevelContext.Provider value={key}>{children}</MenuLevelContext.Provider>
  </>;
}
export function KjunDropdownDivider() {
  const { colors } = useKjunStyles();
  if (!useShown()) return null;
  return (
    <View
      role="separator"
      style={{ height: tokens.extensions.menu.dividerHeight, marginVertical: tokens.dimension.value4, backgroundColor: colors.border }}
    />
  );
}
export interface KjunMenuButtonProps extends Omit<KjunDropdownProps, "trigger"> {
  label?: string;
  size?: KjunButtonProps["size"];
  variant?: KjunButtonProps["variant"];
  /** Show a square dots-vertical button; label remains its accessible name. */
  compact?: boolean;
  loading?: boolean;
  tooltip?: string;
  tooltipPlacement?: KjunTooltipProps["placement"];
  tooltipDelay?: number;
  ariaLabel?: string;
}
export function KjunMenuButton({
  label,
  size = "md",
  variant = "secondary",
  compact = false,
  loading = false,
  tooltip,
  tooltipPlacement,
  tooltipDelay,
  ariaLabel,
  onOpen,
  onClose,
  ...props
}: KjunMenuButtonProps) {
  const m = useKjunMessages();
  const [open, setOpen] = useState(false);
  return (
    <KjunDropdown
      {...props}
      onOpen={() => { setOpen(true); onOpen?.(); }}
      onClose={() => { setOpen(false); onClose?.(); }}
      trigger={
        <KjunTooltip
          content={open ? '' : tooltip}
          placement={tooltipPlacement}
          delay={tooltipDelay}
        >
          <KjunButton
            size={size}
            variant={variant}
            disabled={props.disabled}
            loading={loading}
            accessibilityState={{ expanded: open }}
            prefixIcon={compact || !label ? "dots-vertical" : undefined}
            suffixIcon={!compact && label ? open ? "chevron-up" : "chevron-down" : undefined}
            ariaLabel={ariaLabel || label || tooltip || m.menu}
          >
            {compact ? undefined : label}
          </KjunButton>
        </KjunTooltip>
      }
    />
  );
}
