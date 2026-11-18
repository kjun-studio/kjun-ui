import { useKjunMessages } from "../../../shared/package-runtime/messages-context";
import { KjunSpinnerGlyph } from "./spinner-glyph";
import { typeStyle } from "./typography";
import { tokens,type ButtonSize } from "@kjun-ui/tokens";
import {
forwardRef,
useCallback,
useContext,
useEffect,
useImperativeHandle,
useLayoutEffect,
useRef,
useState,
type AnchorHTMLAttributes,
type ButtonHTMLAttributes,
type CSSProperties,
type MouseEvent,
type RefObject,
type HTMLAttributes,
type ReactNode,
} from "react";
import { KjunButton,KjunIcon,type KjunButtonProps } from "./button";
import { useOptionalKjunFeedback } from "./feedback-context";
import { KjunTooltip, type KjunTooltipProps } from "./popover";
import { useReducedMotion } from "./use-reduced-motion";
import { TopNavigationContext } from "./top-navigation-context";
import { browserCopy } from "../../../shared/package-runtime/clipboard";
import { useCopyFeedback } from "../../../shared/package-runtime/use-copy-feedback";
import { copyButtonGeometry } from "../../../shared/package-runtime/copy-button";
import { usePendingAction } from "../../../shared/package-runtime/use-pending-action";
import { externalLinkIconName, safeExternalUrl } from "../../../shared/package-runtime/external-link";
import { trackScrollFade, type ScrollEdges, type ScrollFadeDirection } from "../../../shared/package-runtime/scroll-fade";
export interface KjunIconToggleProps
  extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "type" | "disabled" | "children" | "color"> {
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
  /** Accessible name; aria-label or aria-labelledby may be used instead. */
  ariaLabel?: string;
  /** Defaults to the accessible label text, like RefreshButton; an empty string disables the hint. */
  tooltip?: string;
  tooltipPlacement?: KjunTooltipProps["placement"];
  tooltipDelay?: number;
  onToggle?: () => void;
}
/** The text an aria-labelledby reference names, read after the labels have mounted (the Vue form is runtime/icon-toggle-label.ts). */
function useLabelledByText(button: RefObject<HTMLButtonElement | null>, label: string | undefined, labelledBy: string | undefined) {
  const [text, setText] = useState("");
  const warned = useRef(false);
  const refresh = useCallback(() => {
    const doc = button.current?.ownerDocument;
    const labels = (labelledBy ?? "").trim().split(/\s+/).filter(Boolean)
      .map(id => doc?.getElementById(id)).filter((node): node is HTMLElement => !!node);
    setText(labels.length ? labels.map(node => node.textContent?.trim() ?? "").join(" ").trim() : label?.trim() ?? "");
    if (process.env.NODE_ENV !== "production") {
      const missing = !label?.trim() && !labelledBy?.trim();
      if (missing && !warned.current) console.warn("[KJUN] IconToggle needs an accessible name: aria-label, ariaLabel, or aria-labelledby referencing label text.");
      warned.current = missing;
    }
  }, [button, label, labelledBy]);
  useLayoutEffect(refresh);
  return { text, refresh };
}
export function KjunIconToggle({
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
  className,
  style,
  onClick,
  onFocus,
  onPointerEnter,
  ...rest
}: KjunIconToggleProps) {
  const navigation = useContext(TopNavigationContext);
  const button = useRef<HTMLButtonElement>(null);
  const label = ariaLabel ?? rest["aria-label"], labelledBy = rest["aria-labelledby"];
  const accessible = useLabelledByText(button, label, labelledBy);
  return (
    <KjunTooltip content={disabled || loading ? "" : tooltip ?? (labelledBy ? accessible.text : label ?? "")} placement={tooltipPlacement} delay={tooltipDelay}>
    <button
      {...rest}
      ref={button}
      type="button"
      aria-label={label}
      aria-labelledby={labelledBy}
      aria-pressed={active}
      aria-busy={loading || undefined}
      disabled={disabled || loading}
      className={className ? `kjun-icon-toggle ${className}` : "kjun-icon-toggle"}
      data-size={size}
      style={navigation ? { width: navigation.controlSize, height: navigation.controlSize, ...style } : style}
      onFocus={(e) => { accessible.refresh(); onFocus?.(e); }}
      onPointerEnter={(e) => { accessible.refresh(); onPointerEnter?.(e); }}
      onClick={(e) => {
        e.stopPropagation();
        // Toggle first, then the app's click, in the same order as Vue's merged handlers.
        onToggle?.();
        onClick?.(e);
      }}
    >
      {loading ? (
        <KjunSpinnerGlyph size={navigation?.iconSize ?? tokens.button.iconSizes[size]} />
      ) : (
        <KjunIcon
          name={active ? activeIcon : inactiveIcon || activeIcon}
          filled={active}
          size={navigation?.iconSize ?? tokens.button.iconSizes[size]}
          // Passed as a variable so the shared hover rule can darken the inactive icon. An app color
          // class opts the icon out of KJUN's color rules, so the class color shows.
          style={{ ["--_kjun-icon-toggle-color" as string]: active ? activeColor : inactiveColor }}
          className={active ? activeColorClass : inactiveColorClass}
          data-kjun-color-class={(active ? activeColorClass : inactiveColorClass) ? "" : undefined}
        />
      )}
    </button>
    </KjunTooltip>
  );
}
export interface KjunCopyButtonProps
  extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "type" | "value" | "disabled" | "children"> {
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
export function KjunCopyButton({
  value,
  ariaLabel,
  text,
  successText,
  inline = false,
  size = "sm",
  disabled = false,
  copyText = browserCopy,
  onCopied,
  onCopyError,
  className,
  style,
  onClick,
  ...rest
}: KjunCopyButtonProps) {
  const m = useKjunMessages();
  successText ??= m.copied;
  const feedback = useOptionalKjunFeedback();
  const geometry = copyButtonGeometry(size, !!text && !inline);
  const { copied, failed, copy } = useCopyFeedback(copyText, {
    onSuccess: (copiedValue) => { feedback?.toast.success(successText); onCopied?.(copiedValue); },
    onError: (error) => { feedback?.toast.error(m.copyFailed); onCopyError?.(error); },
  });
  return (
    <>
      <button
        {...rest}
        type="button"
        disabled={disabled}
        aria-label={ariaLabel || rest["aria-label"] || text || m.copy}
        className={className ? `kjun-copy-button ${className}` : "kjun-copy-button"}
        data-inline={inline}
        style={{
          ...typeStyle(size === "xs" ? "controlSmall" : "control"),
          minHeight: geometry.height,
          width: geometry.width,
          gap: geometry.gap,
          borderRadius: geometry.radius,
          paddingBlock: 0,
          paddingInlineStart: geometry.paddingStart,
          paddingInlineEnd: geometry.paddingEnd,
          ...style,
        }}
        onClick={(event) => {
          event.stopPropagation();
          onClick?.(event);
          if (!event.defaultPrevented) void copy(value);
        }}
      >
        <KjunIcon
          name={copied ? "check" : "copy"}
          size={tokens.button.iconSizes[size]}
          style={{ color: copied ? "var(--_kjun-color-success)" : undefined }}
        />
        {text && !inline && <span>{copied ? successText : text}</span>}
      </button>
      <span role={feedback ? undefined : "status"} aria-hidden={feedback ? true : undefined} className="kjun-sr-only">
        {copied ? successText : failed ? m.copyFailed : ""}
      </span>
    </>
  );
}
export interface KjunRefreshButtonProps
  extends Omit<KjunButtonProps, "onClick" | "children" | "prefix" | "suffix"> {
  targetName?: string;
  mode?: "icon" | "text";
  text?: string;
  /** Defaults to the icon button's accessible label; an empty string disables it. */
  tooltip?: string;
  tooltipPlacement?: KjunTooltipProps["placement"];
  tooltipDelay?: number;
  /** A returned promise shows loading until it settles; loading stays the app's to set otherwise. */
  onRefresh?: () => void | Promise<unknown>;
}
export function KjunRefreshButton({
  targetName = "",
  mode = "icon",
  text,
  size = "sm",
  variant = "ghost",
  ariaLabel,
  title,
  tooltip,
  tooltipPlacement,
  tooltipDelay,
  spinOnLoading = true,
  loading = false,
  onRefresh,
  ...props
}: KjunRefreshButtonProps) {
  const m = useKjunMessages();
  text ??= m.refresh;
  const reduced = useReducedMotion();
  const { pending, run } = usePendingAction();
  const busy = loading || pending;
  // Text mode speaks what it shows (WCAG 2.5.3); icon mode keeps the action name.
  const label = ariaLabel || [targetName, mode === "text" ? text : m.refresh].filter(Boolean).join(" ");
  const hint = tooltip ?? title ?? (mode === "icon" ? label : "");
  return (
    <KjunTooltip content={props.disabled || busy ? "" : hint} placement={tooltipPlacement} delay={tooltipDelay}>
    <KjunButton
      {...props}
      size={size}
      variant={variant}
      loading={busy}
      prefixIcon="refresh"
      spinOnLoading={!reduced && spinOnLoading}
      ariaLabel={label}
      onClick={() => run(onRefresh)}
    >
      {mode === "text" ? text : undefined}
    </KjunButton>
    </KjunTooltip>
  );
}
// Other anchor attributes (id, className, data-*) reach the link, as Vue's fallthrough attributes do;
// the URL, target and rel stay KJUN's so the link always opens safely in a new window.
export interface KjunExternalLinkProps extends Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href" | "target" | "rel" | "type" | "children" | "onClick" | "onChange" | "autoFocus"> {
  href?: string;
  mode?: "icon" | "text";
  /** The icon link's name (default "External link"); a text link shows it when it has no children. */
  label?: string;
  children?: ReactNode;
  /** Called when the link is opened (e.g. for analytics); the click does not reach the parent. */
  onClick?: (event: MouseEvent<HTMLAnchorElement>) => void;
}
/** Opens only http(s) URLs in a new window; anything else renders as plain text. */
export function KjunExternalLink({
  href = "",
  mode = "text",
  label,
  children,
  onClick,
  className,
  ...rest
}: KjunExternalLinkProps) {
  const m = useKjunMessages();
  const url = safeExternalUrl(href), icon = mode === "icon",
    name = icon ? externalLinkIconName(label, m.externalLink) : undefined,
    body = icon ? <KjunIcon name="external-link" /> : children ?? label;
  // An icon link is named by aria-label; a text link by its own text plus the new-window cue.
  return url ? (
    <a
      {...rest}
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={name ? name + m.newWindow : undefined}
      title={name}
      className={className ? "kjun-external-link " + className : "kjun-external-link"}
      onClick={(event) => { event.stopPropagation(); onClick?.(event); }}
    >
      {body}
      {!icon && <KjunIcon name="external-link" size={tokens.iconSizes.small} className="kjun-external-link-icon" />}
      {!icon && <span className="kjun-sr-only">{m.newWindow}</span>}
    </a>
  ) : (
    // Not a link: the text stays, and an icon keeps its name as text a screen reader reads.
    <span id={rest.id} className={className}>{body}{name && <span className="kjun-sr-only">{name}</span>}</span>
  );
}
// Other div attributes (id, data-*, onScroll) reach the scroller, as Vue's fallthrough attributes do.
// A scroller takes no value and no initial focus of its own, so those two are left out.
export interface KjunScrollFadeProps extends Omit<HTMLAttributes<HTMLDivElement>, "children" | "className" | "style" | "onChange" | "autoFocus"> {
  children?: ReactNode;
  /** Which way the content scrolls; vertical needs a height (style or class) to scroll within. */
  direction?: ScrollFadeDirection;
  /** Names the scroller; it then becomes a focusable region so the keyboard can scroll it. */
  ariaLabel?: string;
  className?: string;
  style?: CSSProperties;
}
/** Fades whichever edge along `direction` still has content to scroll to. The ref is the scrolling element. */
export const KjunScrollFade = forwardRef<HTMLDivElement, KjunScrollFadeProps>(function KjunScrollFade(
  { children, direction = "horizontal", ariaLabel, className, style, ...props }, forwarded) {
  const ref = useRef<HTMLDivElement>(null),
    [edges, setEdges] = useState<ScrollEdges>({ start: false, end: false });
  useImperativeHandle(forwarded, () => ref.current!, []);
  // One tracker for the scroller's life; it watches size, children, late images and fonts itself.
  const latest = useRef(direction);
  latest.current = direction;
  const tracker = useRef<ReturnType<typeof trackScrollFade>>(undefined);
  useEffect(() => {
    const instance = trackScrollFade(ref.current!, () => latest.current, setEdges);
    tracker.current = instance;
    return () => instance.destroy();
  }, []);
  useEffect(() => tracker.current?.update(), [direction]);
  return (
    <div
      {...props}
      ref={ref}
      className={className ? `kjun-scroll-fade ${className}` : "kjun-scroll-fade"}
      data-direction={direction}
      data-fade-start={edges.start || undefined}
      data-fade-end={edges.end || undefined}
      // A named scroller is a focusable region, so the keyboard can scroll content that takes no focus itself.
      {...(ariaLabel ? { role: "region", "aria-label": ariaLabel, tabIndex: 0 } : {})}
      style={style}
    >
      {children}
    </div>
  );
});
