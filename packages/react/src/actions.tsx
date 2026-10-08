import { typeStyle } from "./typography";
import { tokens,type ButtonSize } from "@kjun-ui/tokens";
import {
useContext,
useEffect,
useRef,
useState,
type CSSProperties,
type ReactNode,
} from "react";
import { DsButton,DsIcon,type DsButtonProps } from "./button";
import { DsSpinner } from "./display";
import { useOptionalKjunFeedback } from "./feedback-context";
import { DsTooltip, type DsTooltipProps } from "./popover";
import { useReducedMotion } from "./use-reduced-motion";
import { TopNavigationContext } from "./top-navigation-context";
export interface DsIconToggleProps {
  active?: boolean;
  activeIcon: string;
  inactiveIcon?: string;
  activeColorClass?: string;
  inactiveColorClass?: string;
  activeColor?: CSSProperties["color"];
  inactiveColor?: CSSProperties["color"];
  size?: ButtonSize;
  disabled?: boolean;
  loading?: boolean;
  ariaLabel: string;
  /** Defaults to ariaLabel, like RefreshButton; an empty string disables the hint. */
  tooltip?: string;
  tooltipPlacement?: DsTooltipProps["placement"];
  tooltipDelay?: number;
  onToggle?: () => void;
}
export function DsIconToggle({
  active = false,
  activeIcon,
  inactiveIcon,
  activeColorClass = "",
  inactiveColorClass = "",
  activeColor = "var(--_kjun-color-brand)",
  inactiveColor = "var(--_kjun-color-text-tertiary)",
  size = "md",
  disabled = false,
  loading = false,
  ariaLabel,
  tooltip,
  tooltipPlacement,
  tooltipDelay,
  onToggle,
}: DsIconToggleProps) {
  const navigation = useContext(TopNavigationContext);
  return (
    <DsTooltip content={disabled || loading ? "" : tooltip ?? ariaLabel} placement={tooltipPlacement} delay={tooltipDelay}>
    <button
      type="button"
      aria-label={ariaLabel}
      aria-pressed={active}
      aria-busy={loading || undefined}
      disabled={disabled || loading}
      className="kjun-icon-toggle"
      data-size={size}
      style={navigation ? { width: navigation.controlSize, height: navigation.controlSize } : undefined}
      onClick={(e) => {
        e.stopPropagation();
        onToggle?.();
      }}
    >
      {loading ? (
        navigation ? <DsIcon name="loader-2" spin size={navigation.iconSize} /> : <DsSpinner size="sm" />
      ) : (
        <DsIcon
          name={active ? activeIcon : inactiveIcon || activeIcon}
          filled={active}
          size={navigation?.iconSize ?? tokens.button.iconSizes[size]}
          // Passed as a variable so the shared hover rule can darken the inactive icon.
          style={{ ["--_kjun-icon-toggle-color" as string]: active ? activeColor : inactiveColor }}
          className={active ? activeColorClass : inactiveColorClass}
        />
      )}
    </button>
    </DsTooltip>
  );
}
export interface DsCopyButtonProps {
  value: string;
  ariaLabel?: string;
  text?: string;
  successText?: string;
  inline?: boolean;
  size?: "xs" | "sm" | "md";
  disabled?: boolean;
  copyText?: (value: string) => void | Promise<void>;
  onCopied?: (value: string) => void;
  onCopyError?: (error: unknown) => void;
}
async function browserCopy(value: string) {
  if (navigator.clipboard && window.isSecureContext) {
    await navigator.clipboard.writeText(value);
    return;
  }
  const previous = document.activeElement as HTMLElement | null,
    ta = document.createElement("textarea");
  ta.value = value;
  ta.style.cssText = "position:fixed;left:-9999px;top:-9999px";
  document.body.append(ta);
  ta.select();
  try {
    if (!document.execCommand("copy")) throw Error("Clipboard copy failed");
  } finally {
    ta.remove();
    previous?.focus();
  }
}
export function DsCopyButton({
  value,
  ariaLabel,
  text,
  successText = "복사됨",
  inline = false,
  size = "sm",
  disabled = false,
  copyText = browserCopy,
  onCopied,
  onCopyError,
}: DsCopyButtonProps) {
  const feedback = useOptionalKjunFeedback();
  const [copied, setCopied] = useState(false),
    [failed, setFailed] = useState(false),
    busy = useRef(false),
    timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined),
    mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      clearTimeout(timer.current);
    };
  }, []);
  return (
    <>
      <button
        type="button"
        disabled={disabled}
        aria-label={ariaLabel || text || "복사"}
        className="kjun-copy-button"
        data-inline={inline}
        style={{
          ...typeStyle(size === "xs" ? "controlSmall" : "control"),
          minHeight: tokens.button.heights[size],
          paddingBlock: 0,
          paddingInline: { xs: tokens.dimension.value4, sm: tokens.dimension.value8, md: tokens.dimension.value12 }[size],
        }}
        onClick={async (event) => {
          event.stopPropagation();
          if (copied || busy.current) return;
          busy.current = true;
          try {
            await copyText(value);
            if (mounted.current) {
              setCopied(true);
              setFailed(false);
              feedback?.toast.success(successText);
              onCopied?.(value);
              timer.current = setTimeout(() => setCopied(false), 1500);
            }
          } catch (error) {
            if (mounted.current) {
              setFailed(true);
              feedback?.toast.error("복사 실패");
              onCopyError?.(error);
            }
          } finally {
            busy.current = false;
          }
        }}
      >
        <DsIcon
          name={copied ? "check" : "copy"}
          size={tokens.button.iconSizes[size]}
          style={{ color: copied ? "var(--_kjun-color-success)" : undefined }}
        />
        {text && !inline && <span>{copied ? successText : text}</span>}
      </button>
      <span role={feedback ? undefined : "status"} aria-hidden={feedback ? true : undefined} className="kjun-sr-only">
        {copied ? successText : failed ? "복사 실패" : ""}
      </span>
    </>
  );
}
export interface DsRefreshButtonProps
  extends Omit<DsButtonProps, "onClick" | "children"> {
  targetName?: string;
  mode?: "icon" | "text";
  text?: string;
  /** Defaults to the icon button's accessible label; an empty string disables it. */
  tooltip?: string;
  tooltipPlacement?: DsTooltipProps["placement"];
  tooltipDelay?: number;
  onRefresh?: () => void;
}
export function DsRefreshButton({
  targetName = "",
  mode = "icon",
  text = "새로고침",
  size = "sm",
  variant = "ghost",
  ariaLabel,
  title,
  tooltip,
  tooltipPlacement,
  tooltipDelay,
  spinOnLoading = true,
  onRefresh,
  ...props
}: DsRefreshButtonProps) {
  const reduced = useReducedMotion();
  const label = ariaLabel || [targetName, "새로고침"].filter(Boolean).join(" ");
  const hint = tooltip ?? title ?? (mode === "icon" ? label : "");
  return (
    <DsTooltip content={props.disabled || props.loading ? "" : hint} placement={tooltipPlacement} delay={tooltipDelay}>
    <DsButton
      {...props}
      size={size}
      variant={variant}
      prefixIcon="refresh"
      spinOnLoading={!reduced && spinOnLoading}
      ariaLabel={label}
      onClick={onRefresh}
    >
      {mode === "text" ? text : undefined}
    </DsButton>
    </DsTooltip>
  );
}
export function safeExternalUrl(href: string) {
  try {
    const url = new URL(href);
    return ["http:", "https:"].includes(url.protocol) ? url.href : "";
  } catch {
    return "";
  }
}
export interface DsExternalLinkProps {
  href?: string;
  mode?: "icon" | "text";
  label?: string;
  children?: ReactNode;
}
export function DsExternalLink({
  href = "",
  mode = "text",
  label,
  children,
}: DsExternalLinkProps) {
  const url = safeExternalUrl(href),
    name = label || (mode === "icon" ? "외부 링크" : undefined),
    body = mode === "icon" ? <DsIcon name="external-link" /> : children;
  return url ? (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={name ? name + " (새 창)" : undefined}
      title={name}
      className="kjun-external-link"
      onClick={(e) => e.stopPropagation()}
    >
      {body}
      {mode === "text" && <DsIcon name="external-link" size={tokens.iconSizes.small} className="kjun-external-link-icon" />}
      {!name && <span className="kjun-sr-only"> (새 창)</span>}
    </a>
  ) : (
    <span aria-label={name}>{body}</span>
  );
}
export function DsScrollFade({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null),
    [edges, setEdges] = useState({ left: false, right: false });
  const update = () => {
    const el = ref.current;
    if (el)
      setEdges((prev) => {
        const next = {
          left: el.scrollLeft > 1,
          right: el.scrollLeft + el.clientWidth < el.scrollWidth - 1,
        };
        return prev.left === next.left && prev.right === next.right
          ? prev
          : next;
      });
  };
  useEffect(() => {
    update();
    const observer = new ResizeObserver(update);
    if (ref.current) {
      observer.observe(ref.current);
      Array.from(ref.current.children).forEach((el) => observer.observe(el));
    }
    return () => observer.disconnect();
  }, [children]);
  const mask =
    edges.left || edges.right
      ? `linear-gradient(to right, ${
          edges.left ? `transparent, currentColor ${tokens.extensions.scrollFade.width}px` : "currentColor"
        }, ${
          edges.right
            ? `currentColor calc(100% - ${tokens.extensions.scrollFade.width}px), transparent`
            : "currentColor"
        })`
      : undefined;
  return (
    <div
      ref={ref}
      onScroll={update}
      className="kjun-scroll-fade"
      style={{ maskImage: mask, WebkitMaskImage: mask }}
    >
      {children}
    </div>
  );
}
