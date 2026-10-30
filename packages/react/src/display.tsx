import { useKjunMessages } from "../../../shared/package-runtime/messages-context";
import { hasContent } from "../../../shared/package-runtime/content-presence";
import { alertRole, type AlertLive } from "../../../shared/package-runtime/alert-live";
import { alertIcons, alertToneRoles } from "../../../shared/package-runtime/alert-tone";
import { collapseAlert } from "../../../shared/package-runtime/alert-exit";
import { tokens } from "@kjun-ui/tokens";
import { progressCircle } from "../../../shared/package-runtime/progress-circle";
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
}
export function KjunBadge({
  variant = "default",
  size = "sm",
  dot = false,
  children,
  style,
  ...props
}: KjunBadgeProps) {
  const { x, y } = tokens.extensions.badge.padding[size];
  const neutral = variant === "default" || variant === "secondary";
  return (
    <span
      {...props}
      ref={domainColorRef(variant.startsWith('price-'))}
      className={"kjun-badge " + (props.className || "")}
      style={{
        padding: `${y}px ${x}px`,
        ...typeStyle(size === "xl" ? "controlLarge" : size === "lg" ? "control" : "controlSmall"),
        background: role(
          neutral
            ? "secondary"
            : variant === "primary"
            ? "brand-subtle-bg"
            : variant + "-bg"
        ),
        color: role(
          neutral
            ? "text-secondary"
            : variant === "primary"
            ? "brand-hover"
            : variant
        ),
        ...style,
      }}
    >
      {dot && <span className="kjun-badge-dot" />}
      {children}
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
  value?: number;
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
  max = 100,
  size = "md",
  variant = "primary",
  showLabel = false,
  label,
  subLabel,
  shape = "bar",
}: KjunProgressProps) {
  const m = useKjunMessages();
  const percentage =
    Number.isFinite(value) && max > 0
      ? Math.min(100, Math.max(0, Math.round((value / max) * 100)))
      : 0;
  const name = typeof label === "string" ? label : m.progress, color = role(variant === "primary" ? "brand" : variant);
  if (shape === "circle") {
    const c = progressCircle(size, percentage);
    return (
      <div className="kjun-progress" data-shape="circle" data-size={size}>
        <div role="progressbar" aria-label={name} aria-valuemin={0} aria-valuemax={100} aria-valuenow={percentage}
          className="kjun-progress-circle" style={{ width: c.diameter, height: c.diameter }}>
          <svg width={c.diameter} height={c.diameter} viewBox={`0 0 ${c.diameter} ${c.diameter}`} fill="none" aria-hidden="true">
            <circle className="kjun-progress-circle-track" cx={c.centre} cy={c.centre} r={c.radius} strokeWidth={c.stroke} />
            {percentage > 0 && <circle className="kjun-progress-circle-value" cx={c.centre} cy={c.centre} r={c.radius} strokeWidth={c.stroke}
              stroke={color} strokeLinecap="round" strokeDasharray={c.circumference} strokeDashoffset={c.offset}
              transform={`rotate(-90 ${c.centre} ${c.centre})`} />}
          </svg>
          {showLabel && c.showsPercentage && <span className="kjun-progress-circle-percent">{percentage}%</span>}
        </div>
        {label && <div className="kjun-progress-circle-label">{label}</div>}
        {subLabel && <div className="kjun-progress-sub">{subLabel}</div>}
      </div>
    );
  }
  return (
    <div className="kjun-progress">
      {(label || showLabel) && (
        <div className="kjun-progress-label">
          {label && <span>{label}</span>}
          {showLabel && <span>{percentage}%</span>}
        </div>
      )}
      <div
        role="progressbar"
        aria-label={name}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={percentage}
        className="kjun-progress-track"
        style={{ height: tokens.extensions.progress.heights[size] }}
      >
        <div
          style={{
            width: percentage + "%",
            background: color,
          }}
        />
      </div>
      {subLabel && <div className="kjun-progress-sub">{subLabel}</div>}
    </div>
  );
}
export interface KjunSkeletonProps {
  type?: "text" | "avatar" | "card" | "table" | "stat" | "block";
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
}: KjunSkeletonProps) {
  const line = (w: CSSProperties["width"], key?: number, h?: number) => (
    <div
      key={key}
      className="kjun-skeleton-line"
      style={{ width: w, height: h }}
    />
  );
  const avatar = (sm = false) => (
    <div
      className={
        "kjun-skeleton-avatar" + (sm ? " kjun-skeleton-avatar-sm" : "")
      }
      style={
        sm
          ? undefined
          : {
              width: width || tokens.extensions.skeleton.avatarSize,
              height: height || tokens.extensions.skeleton.avatarSize,
              borderRadius: rounded ? "50%" : tokens.radius.radius8,
            }
      }
    />
  );
  const count = (n: number) =>
    Array.from({ length: Math.max(0, Math.floor(n)) }, (_, i) => i + 1);
  return (
    <div
      aria-hidden="true"
      className={"kjun-skeleton" + (animated ? " kjun-skeleton-animated" : "")}
      style={{ width }}
    >
      {type === "text" &&
        count(rows).map((i) =>
          line(
            i === rows ? "60%" : ["100%", "90%", "80%", "70%", "60%"][i % 5],
            i
          )
        )}
      {type === "avatar" && avatar()}
      {type === "card" && (
        <div className="kjun-skeleton-card">
          <div className="kjun-skeleton-card-header">
            {avatar(true)}
            <div className="kjun-skeleton-card-header-text">
              {line("60%")}
              {line("40%", undefined, tokens.extensions.skeleton.lineHeights.sm)}
            </div>
          </div>
          <div className="kjun-skeleton-card-body">
            {line("100%")} {line("80%")} {line("60%")}
          </div>
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
          <div className="kjun-skeleton-stat-content">
            {line("40%", 0, tokens.extensions.skeleton.lineHeights.sm)}
            {line("60%", 1, tokens.extensions.skeleton.lineHeights.lg)}
            {line("30%", 2, tokens.extensions.skeleton.lineHeights.sm)}
          </div>
          <div className="kjun-skeleton-stat-chart">
            <div className="kjun-skeleton-sparkline" />
          </div>
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
