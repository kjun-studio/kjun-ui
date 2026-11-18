import { menuButtonChevron, menuButtonIcon } from "../../../shared/package-runtime/menu-button";
import { useKjunMessages } from "../../../shared/package-runtime/messages-context";
import { tokens } from "@kjun-ui/tokens";
import { cloneElement, createContext, isValidElement, useCallback, useContext, useEffect, useId, useRef, useState, type ReactNode, type ReactElement } from "react";
import { Header, Menu, MenuItem, MenuSection, Separator } from "react-aria-components";
import { KjunButton, KjunIcon, type KjunButtonProps } from "./button";
import { FloatingPanel, resolveFocusReturn, type FocusReturn, type Placement } from "./floating-panel";
import { KjunTooltip, type KjunTooltipProps } from "./popover";
const DropdownContext = createContext<(() => void) | null>(null);
// Submenus open in place: the menu shows one level at a time, with a back row at the top of a submenu.
interface MenuView { view: string; open: (key: string) => void; back: () => void }
const MenuViewContext = createContext<MenuView>({ view: "", open: () => {}, back: () => {} });
const MenuLevelContext = createContext("");
// A section with `value` makes its items with a `value` one single choice.
interface Choice { value: string | null; onValueChange?: (value: string) => void }
const ChoiceContext = createContext<Choice | null>(null);
const useShown = () => useContext(MenuViewContext).view === useContext(MenuLevelContext);
export interface KjunDropdownProps {
  /** Controls visibility; omit for internal state. */
  open?: boolean;
  /** Asked to open or close; with `open`, update it to accept. onOpen and onClose report the visibility that follows. */
  onOpenChange?: (open: boolean) => void;
  disabled?: boolean;
  placement?: Extract<
    Placement,
    "bottom-start" | "bottom-end" | "top-start" | "top-end"
  >;
  menuId?: string;
  triggerId?: string;
  menuClass?: string;
  /** compact: 32px rows for desktop tables and toolbars (touch keeps 44px). */
  density?: "comfortable" | "compact";
  trigger: ReactNode;
  children: ReactNode;
  onOpen?: () => void;
  onClose?: () => void;
  /** Where focus goes when the menu closes by choosing or Escape, instead of the trigger (e.g. an edited cell). Web only. */
  returnFocus?: FocusReturn;
}
export function KjunDropdown({
  open: openProp,
  onOpenChange,
  disabled = false,
  placement = "bottom-start",
  menuId,
  triggerId,
  menuClass = "",
  density = "comfortable",
  trigger,
  children,
  onOpen,
  onClose,
  returnFocus,
}: KjunDropdownProps) {
  const [internal, setInternal] = useState(false),
    ref = useRef<HTMLDivElement>(null),
    id = "kjun-" + useId();
  const [stack, setStack] = useState<string[]>([]);
  // A keyboard opening lands on the first item (the last for ↑); a pointer opening paints nothing until the pointer or a key moves.
  const byKeyboard = useRef<false | "first" | "last">(false);
  // Going back from a submenu returns focus to the row that opened it.
  const returnTo = useRef("");
  const view = stack[stack.length - 1] ?? "";
  const menuFocusCleanup = useRef<() => void>(() => {});
  const bindMenu = useCallback((menu: HTMLDivElement | null) => {
    menuFocusCleanup.current();
    menuFocusCleanup.current = () => {};
    if (!menu) return;
    let frame = 0;
    const focusItem = () => {
      cancelAnimationFrame(frame);
      // Popover containment can focus the menu after its first item has been
      // marked focused. Keep DOM focus on that actual item as well.
      frame = requestAnimationFrame(() => {
        if (!currentOpen.current || !menu.isConnected || menu.ownerDocument.activeElement !== menu ||
            menu.closest('[inert], [aria-hidden="true"]')) return;
        menu.querySelector<HTMLElement>('[data-focused="true"]:not([data-disabled])')?.focus({ preventScroll: true });
      });
    };
    menu.addEventListener("focus", focusItem);
    focusItem();
    const row = returnTo.current;
    returnTo.current = "";
    // After react-aria's own first-item focus has landed; a frame of its own so focusItem cannot cancel it.
    let back = 0;
    if (row) back = requestAnimationFrame(() => { back = requestAnimationFrame(() =>
      Array.from(menu.querySelectorAll<HTMLElement>("[data-submenu]")).find(item => item.dataset.submenu === row)?.focus({ preventScroll: true })); });
    menuFocusCleanup.current = () => {
      cancelAnimationFrame(frame);
      cancelAnimationFrame(back);
      menu.removeEventListener("focus", focusItem);
    };
  }, []);
  let control = trigger;
  while (isValidElement<KjunTooltipProps>(control) && control.type === KjunTooltip)
    control = control.props.children;
  const unavailable = disabled || (isValidElement<KjunButtonProps>(control) &&
    !!(control.props.disabled || control.props.loading));
  const controlId = triggerId || (isValidElement<KjunButtonProps>(control) && control.props.id) || id;
  const popupId = menuId || id + "-menu";
  const bindTrigger = (node: ReactNode): ReactNode => {
    if (!isValidElement(node)) return node;
    if (node.type === KjunTooltip) {
      const tooltip = node as ReactElement<KjunTooltipProps>;
      return cloneElement(tooltip, {}, bindTrigger(tooltip.props.children));
    }
    const button = node as ReactElement<KjunButtonProps>;
    return cloneElement(button, {
      id: controlId, "aria-haspopup": "menu", "aria-expanded": open,
      "aria-controls": open ? popupId : undefined,
      disabled: disabled || button.props.disabled,
      "aria-disabled": disabled || button.props["aria-disabled"],
    });
  };
  const requested = openProp ?? internal, open = requested && !unavailable;
  // The latest request, so two requests from one event report once.
  const currentOpen = useRef(requested);
  currentOpen.current = requested;
  const change = (value: boolean) => {
    // The rendered button also covers its minimum loading interval: a loading Button stays focusable and says aria-busy.
    const button = ref.current?.querySelector('button');
    if (value === currentOpen.current || (value &&
      (unavailable || button?.disabled || button?.getAttribute("aria-busy") === "true"))) return;
    currentOpen.current = value;
    if (openProp === undefined) setInternal(value);
    onOpenChange?.(value);
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
  const menuView: MenuView = { view, open: key => { byKeyboard.current = "first"; returnTo.current = ""; setStack(current => [...current, key]); },
    back: () => { returnTo.current = view; setStack(current => current.slice(0, -1)); } };
  return (
    <DropdownContext.Provider value={() => change(false)}>
      <div
        ref={ref}
        className="kjun-layer-trigger"
        // A click from Enter or Space has no pointer detail.
        onClickCapture={(e) => { byKeyboard.current = e.detail === 0 && "first"; change(!currentOpen.current); }}
        onKeyDown={(e) => {
          if (["ArrowDown", "ArrowUp"].includes(e.key)) {
            e.preventDefault();
            byKeyboard.current = e.key === "ArrowUp" ? "last" : "first";
            change(true);
          }
        }}
      >
        <span>{bindTrigger(trigger)}</span>
      </div>
      <FloatingPanel
        open={open}
        onOpenChange={change}
        returnFocus={resolveFocusReturn(returnFocus)}
        triggerRef={ref}
        placement={placement}
        className="kjun-dropdown"
      >
        <MenuViewContext.Provider value={menuView}>
          <div onKeyDownCapture={(e) => {
            const item = (e.target as HTMLElement).closest<HTMLElement>("[data-submenu]");
            if (e.key === "ArrowRight" && item && !item.hasAttribute("data-disabled")) { e.preventDefault(); e.stopPropagation(); menuView.open(item.dataset.submenu!); }
            else if (e.key === "ArrowLeft" && view) { e.preventDefault(); e.stopPropagation(); menuView.back(); }
            // Escape in a submenu steps back one level; at the top it closes the menu.
            else if (e.key === "Escape" && view) { e.preventDefault(); e.stopPropagation(); menuView.back(); }
          }}>
            <Menu
              key={view}
              ref={bindMenu}
              id={popupId}
              aria-labelledby={controlId}
              className={"kjun-menu " + menuClass}
              data-density={density === "compact" ? "compact" : undefined}
              autoFocus={view ? "first" : byKeyboard.current || true}
            >
              {children}
            </Menu>
          </div>
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
  /** Independent toggle: a check in the leading column, announced as a checkbox item. */
  checked?: boolean | null;
  /** Second line under the label. */
  description?: string;
  /** Keyboard hint shown at the end, such as "⌘D". It only describes; wiring the keys is the app's job. */
  shortcut?: string;
  textValue?: string;
  /** Keeps the menu open after choosing, for toggles the user flips several times. */
  keepOpen?: boolean;
  /** Inside a KjunDropdownSection with `value`: the value this single choice stands for. */
  value?: string;
  /** Makes the item a link; the browser follows it. */
  href?: string;
  target?: string;
  children: ReactNode;
  onClick?: () => void;
}
function MenuItemBody({ icon, check, children, description, shortcut, chevron }: { icon?: string; check?: boolean | null; children: ReactNode; description?: string; shortcut?: string; chevron?: boolean }) {
  const size = tokens.extensions.menu.iconSize;
  return <>
    {check != null && <KjunIcon name="check" className="kjun-menu-check" size={size} style={{ visibility: check ? "visible" : "hidden" }} />}
    {icon && <KjunIcon name={icon} className="kjun-menu-icon" size={size} />}
    <span className="kjun-menu-label"><span>{children}</span>{description && <span className="kjun-menu-description">{description}</span>}</span>
    {shortcut && <kbd className="kjun-menu-shortcut">{shortcut}</kbd>}
    {chevron && <KjunIcon name="chevron-right" className="kjun-menu-chevron" size={size} />}
  </>;
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
  textValue,
  keepOpen = false,
  value,
  href,
  target,
  children,
  onClick,
}: KjunDropdownItemProps) {
  const close = useContext(DropdownContext), choice = useContext(ChoiceContext);
  const shown = useShown();
  if (choice && value !== undefined) selected = choice.value === value;
  // A boolean `selected` makes this a single-choice item and `checked` a toggle, like Native's radio and checkbox.
  // react-aria only assigns those roles through menu-wide selection, which would also turn plain action items into them.
  // Applied whenever the rendered element attaches; react-aria keeps its own role value, so React never resets it.
  const node = useCallback((element: HTMLDivElement | null) => {
    if (!element) return;
    const state = selected ?? checked;
    element.setAttribute("role", selected !== null ? "menuitemradio" : checked !== null ? "menuitemcheckbox" : "menuitem");
    if (state === null) element.removeAttribute("aria-checked"); else element.setAttribute("aria-checked", String(state));
    if (shortcut) element.setAttribute("aria-keyshortcuts", shortcut); else element.removeAttribute("aria-keyshortcuts");
  }, [selected, checked, shortcut]);
  if (!shown) return null;
  return (
    <MenuItem
      ref={node}
      id={id}
      textValue={
        textValue || (typeof children === "string" ? children : undefined)
      }
      isDisabled={disabled}
      href={href}
      target={target}
      className="kjun-menu-item"
      data-variant={variant}
      data-kjun-selected={selected === true || undefined}
      onAction={() => {
        onClick?.();
        if (choice && value !== undefined) choice.onValueChange?.(value);
        if (!keepOpen) close?.();
      }}
    >
      <MenuItemBody icon={icon} check={selected ?? checked} description={description} shortcut={shortcut}>{children}</MenuItemBody>
    </MenuItem>
  );
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
  const shown = useShown(), parent = useContext(ChoiceContext);
  const items = <ChoiceContext.Provider value={value === undefined ? parent : { value, onValueChange }}>{children}</ChoiceContext.Provider>;
  // Outside its own level the group draws nothing itself, but a submenu inside it may be the level shown.
  if (!shown) return items;
  return <MenuSection className="kjun-menu-section" aria-label={title ? undefined : ariaLabel}>{title && <Header className="kjun-menu-section-title">{title}</Header>}{items}</MenuSection>;
}
export interface KjunDropdownSubmenuProps {
  /** Stable key for the submenu; defaults to the label. Give each submenu its own id when two at one level share a label. */
  id?: string;
  label: string;
  icon?: string;
  disabled?: boolean;
  children: ReactNode;
}
/** An item that opens its own items in place of the menu, with a back row; → opens it and ← returns. */
export function KjunDropdownSubmenu({ id, label, icon, disabled = false, children }: KjunDropdownSubmenuProps) {
  const menu = useContext(MenuViewContext), level = useContext(MenuLevelContext);
  const key = (level ? level + "/" : "") + (id ?? label);
  const m = useKjunMessages();
  // Set on the element: react-aria treats an aria-haspopup prop as its own submenu trigger and then skips onAction.
  const popup = useCallback((element: HTMLDivElement | null) => element?.setAttribute("aria-haspopup", "menu"), []);
  return <>
    {menu.view === level && (
      <MenuItem ref={popup} className="kjun-menu-item" textValue={label} isDisabled={disabled} data-submenu={key} onAction={() => menu.open(key)}>
        <MenuItemBody icon={icon} chevron>{label}</MenuItemBody>
      </MenuItem>
    )}
    {menu.view === key && (
      <MenuItem className="kjun-menu-item kjun-menu-back" textValue={label} aria-label={m.back + ", " + label} onAction={menu.back}>
        <KjunIcon name="chevron-left" className="kjun-menu-icon" size={tokens.extensions.menu.iconSize} /><span className="kjun-menu-label"><span>{label}</span></span>
      </MenuItem>
    )}
    {/* A submenu's items are their own level, outside any single choice around the submenu row. */}
    <ChoiceContext.Provider value={null}><MenuLevelContext.Provider value={key}>{children}</MenuLevelContext.Provider></ChoiceContext.Provider>
  </>;
}
export function KjunDropdownDivider() {
  return useShown() ? <Separator className="kjun-menu-divider" /> : null;
}
export interface KjunMenuButtonProps extends Omit<KjunDropdownProps, "trigger"> {
  label?: string;
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
      className="kjun-menu-button"
      size={size}
      variant={variant}
      disabled={props.disabled}
      loading={loading}
      prefixIcon={menuButtonIcon(icon, compact, label)}
      suffixIcon={menuButtonChevron(chevron, compact, label, open)}
      ariaLabel={ariaLabel || label || tooltip || m.menu}
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
        tooltip ? (
          <KjunTooltip
            content={open ? '' : tooltip}
            placement={tooltipPlacement}
            delay={tooltipDelay}
          >
            {button}
          </KjunTooltip>
        ) : (
          button
        )
      }
    />
  );
}
