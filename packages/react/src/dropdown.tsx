import { useKjunMessages } from "../../../shared/package-runtime/messages-context";
import { tokens } from "@kjun-ui/tokens";
import { cloneElement, createContext, isValidElement, useCallback, useContext, useEffect, useId, useRef, useState, type ReactNode, type ReactElement } from "react";
import { Menu, MenuItem, Separator } from "react-aria-components";
import { KjunButton, KjunIcon, type KjunButtonProps } from "./button";
import { FloatingPanel, type Placement } from "./floating-panel";
import { KjunTooltip, type KjunTooltipProps } from "./popover";
const DropdownContext = createContext<(() => void) | null>(null);
export interface KjunDropdownProps {
  disabled?: boolean;
  placement?: Extract<
    Placement,
    "bottom-start" | "bottom-end" | "top-start" | "top-end"
  >;
  menuId?: string;
  triggerId?: string;
  menuClass?: string;
  trigger: ReactNode;
  children: ReactNode;
  onOpen?: () => void;
  onClose?: () => void;
}
export function KjunDropdown({
  disabled = false,
  placement = "bottom-start",
  menuId,
  triggerId,
  menuClass = "",
  trigger,
  children,
  onOpen,
  onClose,
}: KjunDropdownProps) {
  const [open, setOpen] = useState(false),
    currentOpen = useRef(false),
    ref = useRef<HTMLDivElement>(null),
    id = "kjun-" + useId();
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
        const item = menu.querySelector<HTMLElement>('[data-focused="true"]:not([data-disabled])') ||
          menu.querySelector<HTMLElement>(':is([role="menuitem"], [role="menuitemradio"]):not([data-disabled])');
        item?.focus({ preventScroll: true });
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
    if (value) onOpen?.();
    else onClose?.();
  };
  useEffect(() => {
    if (unavailable) change(false);
  }, [unavailable]);
  return (
    <DropdownContext.Provider value={() => change(false)}>
      <div
        ref={ref}
        className="kjun-layer-trigger"
        onClickCapture={() => change(!currentOpen.current)}
        onKeyDown={(e) => {
          if (["ArrowDown", "ArrowUp"].includes(e.key)) {
            e.preventDefault();
            change(true);
          }
        }}
      >
        <span>{bindTrigger(trigger)}</span>
      </div>
      <FloatingPanel
        open={open}
        onOpenChange={change}
        triggerRef={ref}
        placement={placement}
        className="kjun-dropdown"
      >
        <Menu
          ref={bindMenu}
          id={popupId}
          aria-labelledby={controlId}
          className={"kjun-menu " + menuClass}
          autoFocus="first"
          onClose={() => change(false)}
        >
          {children}
        </Menu>
      </FloatingPanel>
    </DropdownContext.Provider>
  );
}
export interface KjunDropdownItemProps {
  id?: string;
  variant?: "default" | "danger";
  icon?: string;
  disabled?: boolean;
  selected?: boolean | null;
  textValue?: string;
  children: ReactNode;
  onClick?: () => void;
}
export function KjunDropdownItem({
  id,
  variant = "default",
  icon,
  disabled = false,
  selected = null,
  textValue,
  children,
  onClick,
}: KjunDropdownItemProps) {
  const close = useContext(DropdownContext);
  // A boolean `selected` makes this a single-choice item, like Native's radio. react-aria only assigns
  // radio roles through menu-wide selection, which would also turn plain action items into radios.
  // Applied whenever the rendered element attaches; react-aria keeps its own role value, so React never resets it.
  // An item that stops being single-choice goes back to react-aria's menuitem.
  const node = useCallback((element: HTMLDivElement | null) => {
    if (!element) return;
    if (selected === null) {
      element.setAttribute("role", "menuitem");
      element.removeAttribute("aria-checked");
      return;
    }
    element.setAttribute("role", "menuitemradio");
    element.setAttribute("aria-checked", String(selected));
  }, [selected]);
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
      {icon && <KjunIcon name={icon} className="kjun-menu-icon" size={tokens.extensions.menu.iconSize} />}
      <span>{children}</span>
      {selected !== null && <KjunIcon name="check" className="kjun-menu-check" size={tokens.extensions.menu.iconSize}
        style={{ visibility: selected ? "visible" : "hidden" }} />}
    </MenuItem>
  );
}
export function KjunDropdownDivider() {
  return <Separator className="kjun-menu-divider" />;
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
