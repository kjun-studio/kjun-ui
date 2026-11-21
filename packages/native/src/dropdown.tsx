import { menuButtonChevron, menuButtonIcon } from "../../../shared/package-runtime/menu-button";
import { hasContent as present } from "../../../shared/package-runtime/content-presence";
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
import { createTypeahead } from "../../../shared/package-runtime/typeahead";
import { KjunTooltip,type KjunTooltipProps } from "./popover";
import { useKjunStyles } from "./provider";
export const DropdownContext = createContext<(() => void) | null>(null);
// Submenus open in place: the menu shows one level at a time, with a back row at the top of a submenu.
interface MenuView { view: string; open: (key: string) => void; back: () => void; compact: boolean }
const MenuViewContext = createContext<MenuView>({ view: "", open: () => {}, back: () => {}, compact: false });
const MenuLevelContext = createContext("");
const useShown = () => useContext(MenuViewContext).view === useContext(MenuLevelContext);
// The check and icon columns each appear once any item in the open menu uses them, so every label shares one start line.
// They share one column unless a row uses both, as on Web.
interface LeadingSlots { check: boolean; icon: boolean; both: boolean }
const MenuIconSlotContext = createContext<LeadingSlots>({ check: false, icon: false, both: false });
type LeadingProps = { icon?: string; selected?: boolean | null; checked?: boolean | null; id?: string; label?: string; value?: string; children?: ReactNode };
function hasLeading(node: ReactNode, slot: (props: LeadingProps, choice: boolean) => boolean, choice = false): boolean {
  return Children.toArray(node).some(child => isValidElement<LeadingProps>(child) &&
    (child.type === Fragment ? hasLeading(child.props.children, slot, choice)
      : child.type === KjunDropdownSection ? hasLeading(child.props.children, slot, child.props.value !== undefined)
      : (child.type === KjunDropdownItem || child.type === KjunDropdownSubmenu) && slot(child.props, choice && child.type === KjunDropdownItem)));
}
const hasCheck = (p: LeadingProps, choice: boolean) => p.selected != null || p.checked != null || (choice && p.value !== undefined);
// A section with `value` makes its items with a `value` one single choice.
interface Choice { value: string | null; onValueChange?: (value: string) => void }
const ChoiceContext = createContext<Choice | null>(null);
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
  /** Controls visibility; omit for internal state. */
  open?: boolean;
  /** Asked to open or close; with `open`, update it to accept. onOpen and onClose report the visibility that follows. */
  onOpenChange?: (open: boolean) => void;
  disabled?: boolean;
  placement?: "bottom-start" | "bottom-end" | "top-start" | "top-end";
  menuId?: string;
  /** Id for the trigger; Native Web names the menu after it. */
  triggerId?: string;
  /** compact: 32px rows on Native Web's fine pointers; touch keeps 44px. */
  density?: "comfortable" | "compact";
  trigger: ReactNode;
  children: ReactNode;
  onOpen?: () => void;
  onClose?: () => void;
}
/** Enabled rows of the menu on Native Web, in order. */
const menuRows = (menu: HTMLElement | null) => menu ? [...menu.querySelectorAll<HTMLElement>('[role^="menuitem"]')].filter(row => row.getAttribute("aria-disabled") !== "true") : [];
// Typeahead reads the label line only, not the description or shortcut.
const rowLabel = (row: HTMLElement) => (row.innerText || row.textContent || "").split("\n")[0];
export function KjunDropdown({
  open: openProp,
  onOpenChange,
  disabled = false,
  placement = "bottom-start",
  menuId,
  triggerId,
  density = "comfortable",
  trigger,
  children,
  onOpen,
  onClose,
}: KjunDropdownProps) {
  const m = useKjunMessages();
  const [internal, setInternal] = useState(false),
    [stack, setStack] = useState<string[]>([]),
    ref = useRef<View>(null),
    menuNode = useRef<HTMLElement | null>(null);
  let control = trigger;
  while (isValidElement<KjunTooltipProps>(control) && control.type === KjunTooltip)
    control = control.props.children;
  const unavailable = disabled || (isValidElement<KjunButtonProps>(control) &&
    !!(control.props.disabled || control.props.loading));
  const requested = openProp ?? internal, open = requested && !unavailable;
  // The latest request, so two requests from one event report once.
  const currentOpen = useRef(requested);
  currentOpen.current = requested;
  const change = (v: boolean) => {
    if (v === currentOpen.current || (v && unavailable)) return;
    currentOpen.current = v;
    if (openProp === undefined) setInternal(v);
    onOpenChange?.(v);
  };
  // Lifecycle callbacks describe accepted visibility, not a request the parent may reject.
  const shown = useRef(false);
  useEffect(() => {
    if (open === shown.current) return;
    shown.current = open;
    if (open) onOpen?.();
    else { setStack([]); onClose?.(); }
  }, [open]);
  useEffect(() => {
    if (unavailable && requested) change(false);
  }, [unavailable]);
  const view = stack[stack.length - 1] ?? "";
  // Native Web: moving between levels puts focus on the new level's first row, or back on the row that opened it.
  const moved = useRef(false), returnTo = useRef("");
  useEffect(() => {
    if (Platform.OS !== "web" || !open || !moved.current) return;
    moved.current = false;
    const frame = requestAnimationFrame(() => {
      const rows = menuRows(menuNode.current), row = returnTo.current && rows.find(item => item.dataset.submenu === returnTo.current);
      returnTo.current = "";
      (row || rows[0])?.focus({ preventScroll: true });
    });
    return () => cancelAnimationFrame(frame);
  }, [view, open]);
  const typeahead = useRef(createTypeahead()).current;
  const shownChildren = levelChildren(children, view) ?? children;
  // Compact rows only where the pointer is fine; touch keeps the full target.
  const menuView: MenuView = {
    view,
    open: key => { moved.current = true; returnTo.current = ""; setStack(current => [...current, key]); },
    back: () => { moved.current = true; returnTo.current = view; setStack(current => current.slice(0, -1)); },
    compact: density === "compact" && finePointer(),
  };
  // Native Web keys follow the web menus: arrows, Home/End and typeahead walk the rows, → and ← enter and leave submenus.
  const onKeyDown = (event: KeyboardEvent) => {
    const rows = menuRows(menuNode.current), active = document.activeElement as HTMLElement | null;
    const current = active ? rows.indexOf(active) : -1;
    const go = (index: number) => { event.preventDefault(); rows[index]?.focus({ preventScroll: true }); };
    if (event.key === "ArrowRight" && active?.dataset.submenu && current >= 0) { event.preventDefault(); menuView.open(active.dataset.submenu); }
    else if (event.key === "ArrowLeft" && view) { event.preventDefault(); menuView.back(); }
    // Escape in a submenu steps back one level; the layer keyboard leaves a prevented Escape alone, so only the top level closes.
    else if (event.key === "Escape" && view) { event.preventDefault(); menuView.back(); }
    else if (event.key === "ArrowDown") go(current < 0 ? 0 : Math.min(rows.length - 1, current + 1));
    else if (event.key === "ArrowUp") go(current < 0 ? rows.length - 1 : Math.max(0, current - 1));
    else if (event.key === "Home" || event.key === "PageUp") go(0);
    else if (event.key === "End" || event.key === "PageDown") go(rows.length - 1);
    else if (!event.ctrlKey && !event.metaKey && !event.altKey && event.key !== " ") {
      const match = typeahead(event.key, rows.map(rowLabel), current);
      if (match >= 0) go(match);
    }
  };
  const webMenu = Platform.OS === "web" ? {
    role: "menu" as const,
    ...(triggerId ? { "aria-labelledby": triggerId } : { "aria-label": triggerName(control) ?? m.menu }),
    ref: (node: unknown) => { menuNode.current = node as HTMLElement | null; },
    onKeyDown,
  } : {};
  return (
    <DropdownContext.Provider value={() => change(false)}>
      <View ref={ref} collapsable={false}>
        <LayerTrigger
          trigger={trigger}
          disabled={disabled}
          expanded={open}
          popup="menu"
          nativeID={triggerId}
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
          {/* Leading columns are reserved for the level on show, as on Web; a submenu's back row always uses the icon column. */}
          <MenuIconSlotContext.Provider value={{ check: hasLeading(shownChildren, hasCheck), icon: !!view || hasLeading(shownChildren, p => !!p.icon), both: hasLeading(shownChildren, (p, choice) => hasCheck(p, choice) && !!p.icon) }}>
            {/* Native Web reads the rows as a menu, like the web packages. */}
            <View nativeID={menuId} {...(webMenu as object)}>{children}</View>
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
  /** Inside a KjunDropdownSection with `value`: the value this single choice stands for. */
  value?: string;
  children: ReactNode;
  onPress?: () => void;
}
function MenuRow({ variant = "default", icon, disabled = false, check = null, description, shortcut, chevron, submenu, back, accessibilityRole, accessibilityLabel, nativeID, children, onPress }: {
  variant?: "default" | "danger"; icon?: string; disabled?: boolean; check?: boolean | null; description?: string; shortcut?: string; chevron?: boolean; submenu?: string; back?: boolean;
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
        // Native Web keys find the submenu a row opens by this key (data-submenu).
        ...(submenu ? { dataSet: { submenu } } : {}),
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
        // A chosen row is marked by its check alone, like a toggle; the fill stays for the current row.
        backgroundColor: !disabled && (pressed || hovered)
          ? danger ? dangerTint ?? colors.dangerBg : colors.hover : undefined,
      })}
    >
      {check != null ? <View style={{ opacity: check ? 1 : 0 }} accessible={false}><KjunIcon name="check" size={geometry.iconSize} color={disabled ? colors.textDisabled : colors.brand} /></View>
        : reserve.both && <View style={{ width: geometry.iconSize }} accessible={false} />}
      {icon ? <KjunIcon name={icon} size={geometry.iconSize} color={iconColor} />
        : (reserve.both || (check == null && (reserve.check || reserve.icon))) && <View style={{ width: geometry.iconSize }} accessible={false} />}
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
  value,
  children,
  onPress,
}: KjunDropdownItemProps) {
  const close = useContext(DropdownContext), choice = useContext(ChoiceContext);
  if (!useShown()) return null;
  const chosen = choice && value !== undefined ? choice.value === value : selected;
  return <MenuRow variant={variant} icon={icon} disabled={disabled} check={chosen ?? checked} description={description} shortcut={shortcut} nativeID={id}
    accessibilityRole={chosen !== null ? "radio" : checked !== null ? "checkbox" : "menuitem"}
    onPress={() => { onPress?.(); if (choice && value !== undefined) choice.onValueChange?.(value); if (!keepOpen) close?.(); }}>{children}</MenuRow>;
}
export interface KjunDropdownSectionProps {
  /** Small heading over the group; it names the group for screen readers. */
  title?: string;
  /** Names the group for screen readers when it has no visible title. */
  ariaLabel?: string;
  /** Makes the items with a `value` one single choice: the item whose value matches shows the check. null chooses none. */
  value?: string | null;
  /** Called with the chosen item's value. */
  onValueChange?: (value: string) => void;
  children: ReactNode;
}
export function KjunDropdownSection({ title, ariaLabel, value, onValueChange, children }: KjunDropdownSectionProps) {
  const { colors } = useKjunStyles(), menu = useContext(MenuViewContext), parent = useContext(ChoiceContext);
  const geometry = tokens.extensions.menu;
  const items = <ChoiceContext.Provider value={value === undefined ? parent : { value, onValueChange }}>{children}</ChoiceContext.Provider>;
  // Outside its own level the group draws nothing itself, but a submenu inside it may be the level shown.
  if (!useShown()) return items;
  return <View role="group" aria-label={title || ariaLabel}>
    {!!title && <KText aria-hidden={true} style={{ ...typeStyle("meta"), color: colors.textTertiary, paddingTop: geometry.sectionPaddingTop, paddingBottom: geometry.sectionPaddingBottom,
      paddingHorizontal: menu.compact ? geometry.compactOptionPaddingX : geometry.optionPaddingX }}>{title}</KText>}
    {content(items)}
  </View>;
}
export interface KjunDropdownSubmenuProps {
  /** Stable key for the submenu; defaults to the label. Give each submenu its own id when two at one level share a label. */
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
    {menu.view === level && <MenuRow icon={icon} disabled={disabled} chevron submenu={key} accessibilityRole="menuitem" onPress={() => menu.open(key)}>{label}</MenuRow>}
    {menu.view === key && <MenuRow icon="chevron-left" back accessibilityRole="menuitem" accessibilityLabel={m.back + ", " + label} onPress={menu.back}>{label}</MenuRow>}
    {/* A submenu's items are their own level, outside any single choice around the submenu row. */}
    <ChoiceContext.Provider value={null}><MenuLevelContext.Provider value={key}>{children}</MenuLevelContext.Provider></ChoiceContext.Provider>
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
  /** The visible label; a node can carry an icon or a colour swatch. Without readable text in it, give ariaLabel. */
  label?: ReactNode;
  size?: KjunButtonProps["size"];
  variant?: KjunButtonProps["variant"];
  /** Show a square dots-vertical button; label remains its accessible name. */
  compact?: boolean;
  /** Icon before the label, or in place of dots-vertical when compact or unlabelled. */
  icon?: string;
  /** Show the chevron after a visible label (default true); false where the icon already says it opens a menu. */
  chevron?: boolean;
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
  icon,
  chevron = true,
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
  const button = (
    <KjunButton
      size={size}
      variant={variant}
      disabled={props.disabled}
      loading={loading}
      accessibilityState={{ expanded: open }}
      prefixIcon={menuButtonIcon(icon, compact, label)}
      suffixIcon={menuButtonChevron(chevron, compact, label, open)}
      // A node label names the button by its own text unless ariaLabel says otherwise.
      ariaLabel={ariaLabel || (typeof label === "string" ? label : undefined) || (present(label) && !compact ? undefined : tooltip || m.menu)}
    >
      {compact ? undefined : label}
    </KjunButton>
  );
  return (
    <KjunDropdown
      {...props}
      onOpen={() => { setOpen(true); onOpen?.(); }}
      onClose={() => { setOpen(false); onClose?.(); }}
      trigger={
        // Like Web, the tooltip wraps the button only when there is one to show.
        tooltip ? (
          <KjunTooltip content={open ? "" : tooltip} placement={tooltipPlacement} delay={tooltipDelay}>
            {button}
          </KjunTooltip>
        ) : button
      }
    />
  );
}
