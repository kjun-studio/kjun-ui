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
const useShown = () => useContext(MenuViewContext).view === useContext(MenuLevelContext);
export interface KjunDropdownProps {
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
  const [open, setOpen] = useState(false),
    currentOpen = useRef(false),
    ref = useRef<HTMLDivElement>(null),
    id = "kjun-" + useId();
  const [stack, setStack] = useState<string[]>([]);
  // A keyboard opening lands on the first item; a pointer opening paints nothing until the pointer or a key moves.
  const byKeyboard = useRef(false);
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
    menuFocusCleanup.current = () => {
      cancelAnimationFrame(frame);
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
  const change = (value: boolean) => {
    // The rendered button also covers its minimum loading interval.
    if (value === currentOpen.current || (value &&
      (unavailable || ref.current?.querySelector('button')?.disabled))) return;
    currentOpen.current = value;
    setOpen(value);
    if (!value) setStack([]);
    if (value) onOpen?.();
    else onClose?.();
  };
  useEffect(() => {
    if (unavailable) change(false);
  }, [unavailable]);
  const menuView: MenuView = { view, open: key => { byKeyboard.current = true; setStack(current => [...current, key]); }, back: () => setStack(current => current.slice(0, -1)) };
  return (
    <DropdownContext.Provider value={() => change(false)}>
      <div
        ref={ref}
        className="kjun-layer-trigger"
        // A click from Enter or Space has no pointer detail.
        onClickCapture={(e) => { byKeyboard.current = e.detail === 0; change(!currentOpen.current); }}
        onKeyDown={(e) => {
          if (["ArrowDown", "ArrowUp"].includes(e.key)) {
            e.preventDefault();
            byKeyboard.current = true;
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
          }}>
            <Menu
              key={view}
              ref={bindMenu}
              id={popupId}
              aria-labelledby={controlId}
              className={"kjun-menu " + menuClass}
              data-density={density === "compact" ? "compact" : undefined}
              autoFocus={view || byKeyboard.current ? "first" : true}
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
  children,
  onClick,
}: KjunDropdownItemProps) {
  const close = useContext(DropdownContext);
  const shown = useShown();
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
      className="kjun-menu-item"
      data-variant={variant}
      data-kjun-selected={selected === true || undefined}
      onAction={() => {
        onClick?.();
        close?.();
      }}
    >
      <MenuItemBody icon={icon} check={selected ?? checked} description={description} shortcut={shortcut}>{children}</MenuItemBody>
    </MenuItem>
  );
}
export interface KjunDropdownSectionProps {
  /** Small heading over the group; it names the group for screen readers. */
  title?: string;
  children: ReactNode;
}
export function KjunDropdownSection({ title, children }: KjunDropdownSectionProps) {
  const shown = useShown();
  if (!shown) return null;
  return <MenuSection className="kjun-menu-section">{title && <Header className="kjun-menu-section-title">{title}</Header>}{children}</MenuSection>;
}
export interface KjunDropdownSubmenuProps {
  /** Stable key for the submenu; defaults to the label. */
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
    <MenuLevelContext.Provider value={key}>{children}</MenuLevelContext.Provider>
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
  const button = (
    <KjunButton
      className="kjun-menu-button"
      size={size}
      variant={variant}
      disabled={props.disabled}
      loading={loading}
      prefixIcon={compact || !label ? "dots-vertical" : undefined}
      suffixIcon={!compact && label ? open ? "chevron-up" : "chevron-down" : undefined}
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
