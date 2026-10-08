import { tokens } from "@kjun/tokens";
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
View
} from "react-native";
import { AccessiblePressable as Pressable } from "./a11y";
import { DsButton,DsIcon,type DsButtonProps } from "./button";
import { FloatingPanel,LayerTrigger } from "./floating-panel";
import { content } from "./internal";
import { DsTooltip,type DsTooltipProps } from "./popover";
import { useKjunStyles } from "./provider";
export const DropdownContext = createContext<(() => void) | null>(null);
// True once any item in the open menu has a leading icon, so icon-less labels share its start line.
const MenuIconSlotContext = createContext(false);
function hasLeadingIcon(node: ReactNode): boolean {
  return Children.toArray(node).some(child => isValidElement<{ icon?: string; children?: ReactNode }>(child) &&
    (child.type === Fragment ? hasLeadingIcon(child.props.children) : child.type === DsDropdownItem && !!child.props.icon));
}
export interface DsDropdownProps {
  disabled?: boolean;
  placement?: "bottom-start" | "bottom-end" | "top-start" | "top-end";
  menuId?: string;
  triggerId?: string;
  trigger: ReactNode;
  children: ReactNode;
  onOpen?: () => void;
  onClose?: () => void;
}
export function DsDropdown({
  disabled = false,
  placement = "bottom-start",
  trigger,
  children,
  onOpen,
  onClose,
}: DsDropdownProps) {
  const [open, setOpen] = useState(false),
    currentOpen = useRef(false),
    ref = useRef<View>(null);
  let control = trigger;
  while (isValidElement<DsTooltipProps>(control) && control.type === DsTooltip)
    control = control.props.children;
  const unavailable = disabled || (isValidElement<DsButtonProps>(control) &&
    !!(control.props.disabled || control.props.loading));
  const change = (v: boolean) => {
    if (v === currentOpen.current || (v && unavailable)) return;
    currentOpen.current = v;
    setOpen(v);
    if (v) onOpen?.();
    else onClose?.();
  };
  useEffect(() => {
    if (unavailable) change(false);
  }, [unavailable]);
  return (
    <DropdownContext.Provider value={() => change(false)}>
      <View ref={ref} collapsable={false}>
        <LayerTrigger
          trigger={trigger}
          disabled={disabled}
          onPress={() => change(!currentOpen.current)}
        />
      </View>
      <FloatingPanel
        open={open}
        onOpenChange={change}
        triggerRef={ref}
        placement={placement}
        ariaLabel="메뉴"
        menu
      >
        <MenuIconSlotContext.Provider value={hasLeadingIcon(children)}>{children}</MenuIconSlotContext.Provider>
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
  children: ReactNode;
  onPress?: () => void;
}
export function DsDropdownItem({
  variant = "default",
  icon,
  disabled = false,
  selected = null,
  children,
  onPress,
}: DsDropdownItemProps) {
  const { colors } = useKjunStyles(),
    close = useContext(DropdownContext),
    color = variant === "danger" ? colors.danger : colors.text,
    // Leading icons sit a step below the regular-weight label; danger items keep their role color.
    iconColor = variant === "danger" ? colors.danger : colors.textSecondary,
    reserveIcon = useContext(MenuIconSlotContext);
  const [hovered, setHovered] = useState(false);
  return (
    <Pressable
      focusRingInset
      accessibilityRole={selected === null ? "menuitem" : "radio"}
      accessibilityState={{
        disabled,
        ...(selected === null ? {} : { checked: selected }),
      }}
      disabled={disabled}
      onHoverIn={() => setHovered(true)}
      onHoverOut={() => setHovered(false)}
      onPress={() => {
        onPress?.();
        close?.();
      }}
      style={({ pressed }) => ({
        flexDirection: "row",
        alignItems: "center",
        gap: tokens.dimension.value8,
        paddingVertical: tokens.extensions.menu.optionPaddingY,
        paddingHorizontal: tokens.extensions.menu.optionPaddingX,
        minHeight: tokens.extensions.menu.optionHeight,
        borderRadius: tokens.extensions.menu.optionRadius,
        backgroundColor: selected ? colors.selectedBg : !disabled && (pressed || hovered)
          ? variant === "danger" ? colors.dangerBg : colors.hover : undefined,
        opacity: disabled ? tokens.states.opacity.disabled : 1,
      })}
    >
      {icon ? <DsIcon name={icon} size={tokens.extensions.menu.iconSize} color={iconColor} />
        : reserveIcon && <View style={{ width: tokens.extensions.menu.iconSize }} accessible={false} />}
      <View style={{ flexGrow: 1, flexShrink: 1 }}>{content(children, { color, fontSize: tokens.extensions.menu.optionFontSize, lineHeight: tokens.extensions.menu.optionLineHeight })}</View>
      {selected !== null && <View style={{ opacity: selected ? 1 : 0 }} accessible={false}>
        <DsIcon name="check" size={tokens.extensions.menu.iconSize} color={colors.brand} />
      </View>}
    </Pressable>
  );
}
export function DsDropdownDivider() {
  const { colors } = useKjunStyles();
  return (
    <View
      role="separator"
      style={{ height: tokens.extensions.menu.dividerHeight, marginVertical: tokens.dimension.value4, backgroundColor: colors.border }}
    />
  );
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
  return (
    <DsDropdown
      {...props}
      onOpen={() => { setOpen(true); onOpen?.(); }}
      onClose={() => { setOpen(false); onClose?.(); }}
      trigger={
        <DsTooltip
          content={open ? '' : tooltip}
          placement={tooltipPlacement}
          delay={tooltipDelay}
        >
          <DsButton
            size={size}
            variant={variant}
            disabled={props.disabled}
            loading={loading}
            accessibilityState={{ expanded: open }}
            prefixIcon={compact || !label ? "dots-vertical" : undefined}
            suffixIcon={!compact && label ? open ? "chevron-up" : "chevron-down" : undefined}
            ariaLabel={ariaLabel || label || tooltip || "메뉴"}
          >
            {compact ? undefined : label}
          </DsButton>
        </DsTooltip>
      }
    />
  );
}
