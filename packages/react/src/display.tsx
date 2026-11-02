import { useKjunMessages } from "../../../shared/package-runtime/messages-context";
import { badgeCount } from "../../../shared/package-runtime/navigation-badge";
import { hasContent } from "../../../shared/package-runtime/content-presence";
import { skeletonLineBox, skeletonTextWidths } from "../../../shared/package-runtime/skeleton-text";
import { alertRole, type AlertLive } from "../../../shared/package-runtime/alert-live";
import { alertIcons, alertToneRoles } from "../../../shared/package-runtime/alert-tone";
import { badgeGeometry, badgeToneRoles } from "../../../shared/package-runtime/badge-tone";
import { collapseAlert } from "../../../shared/package-runtime/alert-exit";
import { tokens, type TypographyRole } from "@kjun-ui/tokens";
import { progressCircle, progressState } from "../../../shared/package-runtime/progress-circle";
import { domainColorRef } from "../../../shared/package-runtime/css-contract";
import { typeStyle } from "./typography";
import {
useRef,
useState,
type CSSProperties,
type HTMLAttributes,
type ReactNode,
} from "react";
import { KjunIcon } from "./button";
import { useSkeletonPhase } from "./skeleton-phase";
import { useReducedMotion } from "./use-reduced-motion";
import { ActionSizeContext, alertActionSizes } from "../../../shared/package-runtime/action-size";
export type DisplaySize = "xs" | "sm" | "md" | "lg" | "xl";
export type SemanticTone =
  | "primary"
  | "success"
  | "warning"
  | "danger"
  | "info";
const role = (name: string) => `var(--_kjun-color-${name})`;
export interface KjunBadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: "default" | "secondary" | SemanticTone | "price-up" | "price-down";
  size?: DisplaySize;
  dot?: boolean;
  /** Shows this number instead of children; over max it shows "99+", and 0 or less draws no badge at all. */
  count?: number;
  /** The largest count shown in full (default 99). */
  max?: number;
  /** What the badge means to a screen reader, e.g. "읽지 않은 알림 3개"; the drawn text is then hidden from it. Give it to a dot-only badge. */
  label?: string;
}
export function KjunBadge({
  variant = "default",
  size = "sm",
  dot = false,
  count,
  max,
  label,
  children,
  style,
  ...props
}: KjunBadgeProps) {
  const { padding, radius, gap, dotSize, type } = badgeGeometry(size);
  const paint = badgeToneRoles(variant);
  const counted = count === undefined ? undefined : badgeCount(count, max);
  if (counted === null) return null;
  return (
    <span
      {...props}
      ref={domainColorRef(variant.startsWith('price-'))}
      className={"kjun-badge " + (props.className || "")}
      data-variant={variant}
      style={{
        ["--_kjun-badge-dot" as string]: dotSize + "px",
        padding: `${padding.y}px ${padding.x}px`,
        ...typeStyle(type),
        gap,
        borderRadius: radius,
        background: role(paint.bg),
        color: role(paint.text),
        ...style,
      }}
    >
      {dot && <span className="kjun-badge-dot" style={{ background: role(paint.dot) }} />}
      {label ? <><span className="kjun-sr-only">{label}</span><span aria-hidden="true">{counted ?? children}</span></> : counted ?? children}
    </span>
  );
}
export { KjunCard } from "./card";
export type { KjunCardProps } from "./card";
export interface KjunEmptyProps {
  text?: string;
  description?: string;
  icon?: string;
  children?: ReactNode;
}
export function KjunEmpty({
  text,
  description,
  icon,
  children,
}: KjunEmptyProps) {
  const m = useKjunMessages();
  text ??= m.noData;
  return (
    <div className="kjun-empty">
      {icon && <KjunIcon name={icon} size={tokens.extensions.empty.iconSize} />}
      <p>{text}</p>
      {description && <small>{description}</small>}
      {children && <div>{children}</div>}
    </div>
  );
}
export interface KjunSpinnerProps {
  size?: DisplaySize;
  text?: string;
}
export function KjunSpinner({ size = "md", text }: KjunSpinnerProps) {
  const m = useKjunMessages();
  // The stroke keeps a size-specific pixel weight instead of scaling with the 24-unit viewBox.
  const stroke = (tokens.extensions.spinner.strokeWidths[size] * 24) / tokens.extensions.spinner.sizes[size];
  return (
    <span role="status" aria-label={text || m.loading} className="kjun-spinner">
      <svg
        className="kjun-spin"
        width={tokens.extensions.spinner.sizes[size]}
        height={tokens.extensions.spinner.sizes[size]}
        viewBox="0 0 24 24"
        fill="none"
        aria-hidden="true"
      >
        <circle
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth={stroke}
          opacity=".25"
        />
        <path
          d="M22 12A10 10 0 0 0 12 2"
          stroke="currentColor"
          strokeWidth={stroke}
        />
      </svg>
      {text && <span>{text}</span>}
    </span>
  );
}
export interface KjunAlertProps {
  type?: "info" | "success" | "warning" | "danger" | "error";
  variant?: SemanticTone;
  size?: "sm" | "md" | "lg";
  title?: ReactNode;
  closable?: boolean;
  /** How screen readers announce it: assertive (role alert), polite (status) or off; defaults to alert for danger, status otherwise. */
  live?: AlertLive;
  children?: ReactNode;
  /** Buttons placed under the message; unsized KjunButtons follow the alert size. */
  actions?: ReactNode;
  onClose?: () => void;
}
export function KjunAlert({
  type = "info",
  variant,
  size = "md",
  title,
  closable = false,
  live,
  children,
  actions,
  onClose,
}: KjunAlertProps) {
  const m = useKjunMessages();
  const [visible, setVisible] = useState(true);
  const root = useRef<HTMLDivElement>(null), closing = useRef(false);
  const reduced = useReducedMotion();
  if (!visible) return null;
  const tone = variant || (type === "error" ? "danger" : type),
    small = size === "sm",
    paint = alertToneRoles(tone);
  return (
    <div
      ref={root}
      role={alertRole(tone, live)}
      className="kjun-alert"
      data-size={small ? "sm" : "md"}
      data-tone={tone}
      style={paint.bg ? { background: role(paint.bg) } : undefined}
    >
      <span className="kjun-alert-icon" style={{ color: role(paint.icon) }}>
        <KjunIcon name={alertIcons[tone]} filled size={tokens.extensions.alert.iconSizes[small ? "sm" : "md"]} />
      </span>
      <div className="kjun-alert-content">
        {hasContent(title) && <div className="kjun-alert-title">{title}</div>}
        {hasContent(children) && <div className="kjun-alert-description">{children}</div>}
        {hasContent(actions) && (
          <ActionSizeContext.Provider value={alertActionSizes[small ? "sm" : "md"]}>
            <div className="kjun-alert-actions">{actions}</div>
          </ActionSizeContext.Provider>
        )}
      </div>
      {closable && (
        <button
          className="kjun-alert-close"
          type="button"
          aria-label={m.close}
          onClick={() => {
            if (closing.current) return;
            closing.current = true;
            collapseAlert(root.current, reduced, () => {
              setVisible(false);
              onClose?.();
            });
          }}
        >
          <KjunIcon name="x" size={tokens.extensions.alert.closeIconSize} />
        </button>
      )}
    </div>
  );
}
export interface KjunProgressProps {
  /** null is missing data; omission keeps the zero default. */
  value?: number | null;
  /** Work is active but its completion percentage is unknown; takes precedence over null. */
  indeterminate?: boolean;
  max?: number;
  size?: "sm" | "md" | "lg";
  variant?: SemanticTone;
  showLabel?: boolean;
  label?: ReactNode;
  subLabel?: ReactNode;
  shape?: "bar" | "circle";
}
export function KjunProgress({
  value = 0,
  indeterminate = false,
  max = 100,
  size = "md",
  variant = "primary",
  showLabel = false,
  label,
  subLabel,
  shape = "bar",
}: KjunProgressProps) {
  const m = useKjunMessages();
  const state = progressState(value, max, indeterminate);
  const percentage = state === "determinate" ? Math.min(100, Math.max(0, Math.round((value! / max) * 100))) : 0;
  const text = state === "indeterminate" ? m.loadingEllipsis : state === "missing" ? "—" : `${percentage}%`;
  const name = typeof label === "string" ? label : m.progress, color = role(variant === "primary" ? "brand" : variant);
  const accessibility = {
    role: state === "missing" ? "img" : "progressbar",
    "aria-label": state === "missing" ? `${name}: ${m.noData}` : name,
    "aria-valuemin": state === "missing" ? undefined : 0,
    "aria-valuemax": state === "missing" ? undefined : 100,
    "aria-valuenow": state === "determinate" ? percentage : undefined,
    "aria-valuetext": state === "indeterminate" ? m.loadingEllipsis : undefined,
    "aria-busy": state === "indeterminate" || undefined,
  };
  if (shape === "circle") {
    const c = progressCircle(size, state === "indeterminate" ? 25 : percentage);
    return (
      <div className="kjun-progress" data-shape="circle" data-size={size} data-state={state}>
        <div {...accessibility} className="kjun-progress-circle" style={{ width: c.diameter, height: c.diameter }}>
          <svg className={state === "indeterminate" ? "kjun-spin" : undefined} width={c.diameter} height={c.diameter} viewBox={`0 0 ${c.diameter} ${c.diameter}`} fill="none" aria-hidden="true">
            <circle className="kjun-progress-circle-track" cx={c.centre} cy={c.centre} r={c.radius} strokeWidth={c.stroke} />
            {(percentage > 0 || state === "indeterminate") && <circle className="kjun-progress-circle-value" cx={c.centre} cy={c.centre} r={c.radius} strokeWidth={c.stroke}
              stroke={color} strokeLinecap="round" strokeDasharray={c.circumference} strokeDashoffset={c.offset}
              transform={`rotate(-90 ${c.centre} ${c.centre})`} />}
          </svg>
          {showLabel && c.showsPercentage && state !== "indeterminate" && <span className="kjun-progress-circle-percent">{text}</span>}
        </div>
        {label && <div className="kjun-progress-circle-label">{label}</div>}
        {subLabel && <div className="kjun-progress-sub">{subLabel}</div>}
      </div>
    );
  }
  return (
    <div className="kjun-progress" data-state={state}>
      {(label || showLabel) && (
        <div className="kjun-progress-label">
          {label && <span>{label}</span>}
          {showLabel && <span>{text}</span>}
        </div>
      )}
      <div {...accessibility} className="kjun-progress-track" style={{ height: tokens.extensions.progress.heights[size] }}>
        <div style={{ width: (state === "indeterminate" ? 30 : percentage) + "%", background: color }} />
      </div>
      {subLabel && <div className="kjun-progress-sub">{subLabel}</div>}
    </div>
  );
}
export interface KjunSkeletonProps {
  /** "line" is one line of text: a bar in the line box of `role`, or of the surrounding text when no role is given. */
  type?: "text" | "line" | "avatar" | "card" | "table" | "stat" | "block";
  /** Typography role for type="line"; omit it to take the surrounding text's line height. */
  role?: TypographyRole;
  /** Announces loading to screen readers (a status); the skeleton itself stays silent. */
  loadingText?: string;
  rows?: number;
  columns?: number;
  height?: CSSProperties["height"];
  width?: CSSProperties["width"];
  animated?: boolean;
  rounded?: boolean;
}
export function KjunSkeleton({
  type = "text",
  rows = 3,
  columns = 4,
  height,
  width,
  animated = true,
  rounded = true,
  role,
  loadingText,
}: KjunSkeletonProps) {
  const root = useSkeletonPhase(animated);
  const line = (w: CSSProperties["width"], key?: number, h?: number) => (
    <div
      key={key}
      className="kjun-skeleton-line"
      style={{ width: w, height: h }}
    />
  );
  // A bar inside a line box of a type role, so the skeleton is as tall as that text.
  const slot = (w: CSSProperties["width"], lineRole?: TypographyRole | "inherit", key?: number) => (
    <div key={key} className="kjun-skeleton-slot"
      style={lineRole ? { "--_kjun-skeleton-slot": skeletonLineBox(lineRole === "inherit" ? undefined : lineRole) } as CSSProperties : undefined}>
      {line(w)}
    </div>
  );
  const avatar = () => (
    <div
      className="kjun-skeleton-avatar"
      style={{
        width: width || tokens.extensions.skeleton.avatarSize,
        height: height || tokens.extensions.skeleton.avatarSize,
        borderRadius: rounded ? tokens.radius.radius9999 : tokens.radius.radius8,
      }}
    />
  );
  const count = (n: number) =>
    Array.from({ length: Math.max(0, Math.floor(n)) }, (_, i) => i + 1);
  return (
    <div
      ref={root}
      aria-hidden={loadingText ? undefined : true}
      role={loadingText ? "status" : undefined}
      className={"kjun-skeleton" + (animated ? " kjun-skeleton-animated" : "")}
      data-type={type}
      style={{ width }}
    >
      {loadingText && <span className="kjun-sr-only">{loadingText}</span>}
      {type === "text" && skeletonTextWidths(rows).map((w, i) => slot(w, undefined, i))}
      {type === "line" && slot("100%", role ?? "inherit")}
      {type === "avatar" && avatar()}
      {type === "card" && (
        <div className="kjun-skeleton-card">
          <div className="kjun-skeleton-card-header">
            {slot("40%", "cardTitle")}
            {slot("28%", "caption")}
          </div>
          {rows > 0 && <div className="kjun-skeleton-card-body">{skeletonTextWidths(rows).map((w, i) => slot(w, undefined, i))}</div>}
        </div>
      )}
      {type === "table" && (
        <div className="kjun-skeleton-table">
          {[0, ...count(rows)].map((row) => (
            <div
              key={row}
              className={
                row === 0
                  ? "kjun-skeleton-table-header"
                  : "kjun-skeleton-table-row"
              }
            >
              {count(columns).map((col) => (
                <div key={col} className="kjun-skeleton-table-cell">
                  {line(
                    row === 0
                      ? "70%"
                      : ["45%", "55%", "65%", "75%", "85%"][(row + col) % 5]
                  )}
                </div>
              ))}
            </div>
          ))}
        </div>
      )}
      {type === "stat" && (
        <div className="kjun-skeleton-stat">
          {slot("40%", "caption")}
          {slot("64%", "displaySm")}
          {slot("30%", "caption")}
        </div>
      )}
      {type === "block" && (
        <div
          className="kjun-skeleton-block"
          style={{ width: width || "100%", height: height ?? tokens.extensions.skeleton.blockHeight }}
        />
      )}
    </div>
  );
}

