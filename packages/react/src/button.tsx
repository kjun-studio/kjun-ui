import { typeStyle } from "./typography";
import { TopNavigationContext } from "./top-navigation-context";
import { useActionSize } from "../../../shared/package-runtime/action-size";
import { tokens,type ButtonSize,type ButtonVariant } from "@kjun/tokens";
import { useIcon } from "../../../shared/package-runtime/icon-context";
import {
createElement,
useContext,
forwardRef,
useEffect,
useRef,
useState,
type ButtonHTMLAttributes,
type SVGProps,
} from "react";
export interface DsIconProps extends SVGProps<SVGSVGElement> {
  name: string;
  size?: number | string;
  spin?: boolean;
  filled?: boolean;
}
export function DsIcon({
  name,
  size = "1em",
  spin = false,
  filled = false,
  className = "",
  ...props
}: DsIconProps) {
  const { nodes, filled: renderFilled } = useIcon(name, filled);
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={renderFilled ? "currentColor" : "none"}
      stroke={renderFilled ? "none" : "currentColor"}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden={props["aria-label"] ? undefined : true}
      role={props["aria-label"] ? "img" : undefined}
      className={"kjun-icon " + (spin ? "kjun-spin " : "") + className}
      {...props}
    >
      {nodes.map(([tag, attrs], i) => createElement(tag, { ...attrs, key: i }))}
    </svg>
  );
}
export function useMinimumLoading(loading: boolean) {
  const [active, setActive] = useState(loading);
  const began = useRef(loading ? Date.now() : 0);
  useEffect(() => {
    if (loading) {
      began.current = Date.now();
      setActive(true);
      return;
    }
    const wait = Math.max(
      0,
      tokens.button.loadingMinimum - (Date.now() - began.current)
    );
    const timer = setTimeout(() => setActive(false), wait);
    return () => clearTimeout(timer);
  }, [loading]);
  return loading || active;
}
export interface DsButtonProps
  extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "size"> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  block?: boolean;
  prefixIcon?: string;
  suffixIcon?: string;
  prefixIconFilled?: boolean;
  suffixIconFilled?: boolean;
  ariaLabel?: string;
  spinOnLoading?: boolean;
}
export const DsButton = forwardRef<HTMLButtonElement, DsButtonProps>(
  function DsButton(
    props,
    ref
  ) {
    const {
      variant = "primary",
      size: declaredSize = "md",
      loading = false,
      disabled = false,
      block = false,
      prefixIcon,
      suffixIcon,
      prefixIconFilled,
      suffixIconFilled,
      ariaLabel,
      spinOnLoading,
      children,
      className = "",
      style,
      onClick,
      type = "button",
      ...rest
    } = props;
    const size = useActionSize(props.size, declaredSize);
    const busy = useMinimumLoading(loading);
    const hasContent =
      children !== undefined &&
      children !== null &&
      children !== "" &&
      children !== false;
    const iconOnly = !hasContent && !!(prefixIcon || suffixIcon || busy);
    const navigation = useContext(TopNavigationContext);
    const height = Math.max(tokens.button.heights[size], navigation?.controlSize ?? 0);
    const iconSize = navigation?.iconSize ?? tokens.button.iconSizes[size];
    const contentHeight = Math.max(hasContent ? tokens.button.typography[size].lineHeightPx : 0,
      prefixIcon || suffixIcon || (!hasContent && busy) ? iconSize : 0);
    const spinPrefix =
      busy && prefixIcon && (spinOnLoading ?? prefixIcon === "refresh");
    const before = prefixIcon && (busy ? (spinPrefix ? prefixIcon : "loader-2") : prefixIcon);
    const overlayLoading = busy && !prefixIcon && !suffixIcon;
    // Icon glyphs carry their own side bearing, so the icon side takes a tighter inset.
    const paddingX = tokens.button.paddingX[size];
    const iconSide = tokens.button.iconSidePaddingX[size];
    return (
      <button
        {...rest}
        ref={ref}
        type={type}
        className={"kjun-button " + className}
        data-variant={variant}
        data-size={size}
        data-disabled={disabled}
        aria-label={ariaLabel || rest["aria-label"]}
        disabled={disabled || busy}
        aria-busy={busy || undefined}
        style={{
          height,
          minHeight: height,
          width: block ? "100%" : iconOnly ? height : undefined,
          // A width set by the caller (fixed square controls) wins over the label minimum.
          minWidth: hasContent && !block && style?.width == null ? tokens.button.minWidths[size] : undefined,
          padding: iconOnly ? 0 : `0 ${suffixIcon ? iconSide : paddingX}px 0 ${prefixIcon ? iconSide : paddingX}px`,
          ...typeStyle(tokens.button.typography[size]),
          borderRadius: tokens.button.radii[size],
          gap: hasContent ? tokens.button.contentGaps[size] : 0,
          ...(navigation ? {
            height: 'auto', maxWidth: '100%',
            paddingBlock: Math.max(0, (height - contentHeight) / 2),
          } : {}),
          ...style,
        }}
        onClick={(e) => {
          e.stopPropagation();
          if (!disabled && !busy) onClick?.(e);
        }}
      >
        {before && (
          <DsIcon
            name={before}
            filled={!busy && prefixIconFilled}
            spin={busy}
            size={iconSize}
          />
        )}
        <span className="kjun-button-label" style={{ opacity: overlayLoading ? 0 : 1 }}>{children}</span>
        {suffixIcon && (
          <DsIcon
            name={busy && !prefixIcon ? "loader-2" : suffixIcon}
            filled={!busy && suffixIconFilled}
            spin={busy && !prefixIcon}
            style={{ opacity: busy && prefixIcon ? 0 : 1 }}
            size={iconSize}
          />
        )}
        {overlayLoading && <span className="kjun-button-loader" aria-hidden="true">
          <DsIcon name="loader-2" spin size={iconSize} />
        </span>}
      </button>
    );
  }
);
