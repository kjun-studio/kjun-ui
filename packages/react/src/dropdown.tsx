import { tokens } from "@kjun/tokens";
import { cloneElement, createContext, isValidElement, useCallback, useContext, useEffect, useId, useRef, useState, type ReactNode, type ReactElement } from "react";
import { Menu, MenuItem, Separator } from "react-aria-components";
import { DsButton, DsIcon, type DsButtonProps } from "./button";
import { FloatingPanel, type Placement } from "./floating-panel";
import { DsTooltip, type DsTooltipProps } from "./popover";
const DropdownContext = createContext<(() => void) | null>(null);
export interface DsDropdownProps {
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
export function DsDropdown({
  disabled = false,
  placement = "bottom-start",
  menuId,
  triggerId,
  menuClass = "",
  trigger,
  children,
  onOpen,
  onClose,
}: DsDropdownProps) {
  const [open, setOpen] = useState(false),
    currentOpen = useRef(false),
    ref = useRef<HTMLDivElement>(null),
    id = useId();
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
          menu.querySelector<HTMLElement>('[role="menuitem"]:not([data-disabled])');
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
  while (isValidElement<DsTooltipProps>(control) && control.type === DsTooltip)
    control = control.props.children;
  const unavailable = disabled || (isValidElement<DsButtonProps>(control) &&
    !!(control.props.disabled || control.props.loading));
  const controlId = triggerId || (isValidElement<DsButtonProps>(control) && control.props.id) || id;
  const popupId = menuId || id + "-menu";
  const bindTrigger = (node: ReactNode): ReactNode => {
    if (!isValidElement(node)) return node;
    if (node.type === DsTooltip) {
      const tooltip = node as ReactElement<DsTooltipProps>;
      return cloneElement(tooltip, {}, bindTrigger(tooltip.props.children));
    }
    const button = node as ReactElement<DsButtonProps>;
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
export interface DsDropdownItemProps {
  id?: string;
  variant?: "default" | "danger";
  icon?: string;
  disabled?: boolean;
  selected?: boolean | null;
  textValue?: string;
  children: ReactNode;
  onClick?: () => void;
}
export function DsDropdownItem({
  id,
  variant = "default",
  icon,
  disabled = false,
  selected = null,
  textValue,
  children,
  onClick,
}: DsDropdownItemProps) {
  const close = useContext(DropdownContext);
  return (
    <MenuItem
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
      {icon && <DsIcon name={icon} className="kjun-menu-icon" size={tokens.extensions.menu.iconSize} />}
      <span>{children}</span>
      {selected !== null && <DsIcon name="check" className="kjun-menu-check" size={tokens.extensions.menu.iconSize}
        style={{ visibility: selected ? "visible" : "hidden" }} />}
    </MenuItem>
  );
}
export function DsDropdownDivider() {
  return <Separator className="kjun-menu-divider" />;
}
export interface DsMenuButtonProps extends Omit<DsDropdownProps, "trigger"> {
  label?: string;
  size?: DsButtonProps["size"];
  variant?: DsButtonProps["variant"];
  /** Show a square dots-vertical button; label remains its accessible name. */
  compact?: boolean;
  loading?: boolean;
  tooltip?: string;
  tooltipPlacement?: DsTooltipProps["placement"];
  tooltipDelay?: number;
  ariaLabel?: string;
}
export function DsMenuButton({
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
}: DsMenuButtonProps) {
  const [open, setOpen] = useState(false);
  const button = (
    <DsButton
      className="kjun-menu-button"
      size={size}
      variant={variant}
      disabled={props.disabled}
      loading={loading}
      prefixIcon={compact || !label ? "dots-vertical" : undefined}
      suffixIcon={!compact && label ? open ? "chevron-up" : "chevron-down" : undefined}
      ariaLabel={ariaLabel || label || tooltip || "메뉴"}
    >
      {compact ? undefined : label}
    </DsButton>
  );
  return (
    <DsDropdown
      {...props}
      onOpen={() => { setOpen(true); onOpen?.(); }}
      onClose={() => { setOpen(false); onClose?.(); }}
      trigger={
        tooltip ? (
          <DsTooltip
            content={open ? '' : tooltip}
            placement={tooltipPlacement}
            delay={tooltipDelay}
          >
            {button}
          </DsTooltip>
        ) : (
          button
        )
      }
    />
  );
}
