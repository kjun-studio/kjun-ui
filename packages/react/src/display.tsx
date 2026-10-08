import { hasContent } from "../../../shared/package-runtime/content-presence";
import { tokens } from "@kjun/tokens";
import { domainColorRef } from "../../../shared/package-runtime/css-contract";
import { typeStyle } from "./typography";
import {
useState,
type CSSProperties,
type HTMLAttributes,
type ReactNode,
} from "react";
import { DsIcon } from "./button";
import { ActionSizeContext, alertActionSizes } from "../../../shared/package-runtime/action-size";
export type DisplaySize = "xs" | "sm" | "md" | "lg" | "xl";
export type SemanticTone =
  | "primary"
  | "success"
  | "warning"
  | "danger"
  | "info";
const role = (name: string) => `var(--_kjun-color-${name})`;
export interface DsBadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: "default" | "secondary" | SemanticTone | "price-up" | "price-down";
  size?: DisplaySize;
  dot?: boolean;
}
export function DsBadge({
  variant = "default",
  size = "sm",
  dot = false,
  children,
  style,
  ...props
}: DsBadgeProps) {
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
export { DsCard } from "./card";
export type { DsCardProps } from "./card";
export interface DsEmptyProps {
  text?: string;
  description?: string;
  icon?: string;
  children?: ReactNode;
}
export function DsEmpty({
  text = "데이터가 없습니다",
  description,
  icon,
  children,
}: DsEmptyProps) {
  return (
    <div className="kjun-empty">
      {icon && <DsIcon name={icon} size={tokens.extensions.empty.iconSize} />}
      <p>{text}</p>
      {description && <small>{description}</small>}
      {children && <div>{children}</div>}
    </div>
  );
}
export interface DsSpinnerProps {
  size?: DisplaySize;
  text?: string;
}
export function DsSpinner({ size = "md", text }: DsSpinnerProps) {
  // The stroke keeps a size-specific pixel weight instead of scaling with the 24-unit viewBox.
  const stroke = (tokens.extensions.spinner.strokeWidths[size] * 24) / tokens.extensions.spinner.sizes[size];
  return (
    <span role="status" aria-label={text || "로딩 중"} className="kjun-spinner">
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
export interface DsAlertProps {
  type?: "info" | "success" | "warning" | "danger" | "error";
  variant?: SemanticTone;
  size?: "sm" | "md" | "lg";
  title?: ReactNode;
  closable?: boolean;
  children?: ReactNode;
  /** Buttons placed under the message; unsized DsButtons follow the alert size. */
  actions?: ReactNode;
  onClose?: () => void;
}
export function DsAlert({
  type = "info",
  variant,
  size = "md",
  title,
  closable = false,
  children,
  actions,
  onClose,
}: DsAlertProps) {
  const [visible, setVisible] = useState(true);
  if (!visible) return null;
  const tone = variant || (type === "error" ? "danger" : type),
    small = size === "sm";
  return (
    <div
      role={tone === "danger" ? "alert" : "status"}
      className="kjun-alert"
      data-size={small ? "sm" : "md"}
      style={{
        background: role(tone === "primary" ? "brand-subtle-bg" : tone + "-bg"),
        borderColor: role(tone === "primary" ? "brand-light" : tone + "-light"),
      }}
    >
      <span className="kjun-alert-icon" style={{ color: role(tone === "primary" ? "brand" : tone + "-accent") }}>
        <DsIcon
          name={
            {
              info: "info-circle",
              primary: "info-circle",
              success: "circle-check",
              warning: "alert-triangle",
              danger: "alert-circle",
            }[tone]
          }
          size={tokens.extensions.alert.iconSizes[small ? "sm" : "md"]}
        />
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
          aria-label="닫기"
          onClick={() => {
            setVisible(false);
            onClose?.();
          }}
        >
          <DsIcon name="x" size={tokens.extensions.alert.closeIconSize} />
        </button>
      )}
    </div>
  );
}
export interface DsProgressProps {
  value?: number;
  max?: number;
  size?: "sm" | "md" | "lg";
  variant?: SemanticTone;
  showLabel?: boolean;
  label?: ReactNode;
  subLabel?: ReactNode;
}
export function DsProgress({
  value = 0,
  max = 100,
  size = "md",
  variant = "primary",
  showLabel = false,
  label,
  subLabel,
}: DsProgressProps) {
  const percentage =
    Number.isFinite(value) && max > 0
      ? Math.min(100, Math.max(0, Math.round((value / max) * 100)))
      : 0;
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
        aria-label={typeof label === "string" ? label : "진행률"}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={percentage}
        className="kjun-progress-track"
        style={{ height: tokens.extensions.progress.heights[size] }}
      >
        <div
          style={{
            width: percentage + "%",
            background: role(variant === "primary" ? "brand" : variant),
          }}
        />
      </div>
      {subLabel && <div className="kjun-progress-sub">{subLabel}</div>}
    </div>
  );
}
export interface DsSkeletonProps {
  type?: "text" | "avatar" | "card" | "table" | "chart" | "stat" | "block";
  rows?: number;
  columns?: number;
  height?: CSSProperties["height"];
  width?: CSSProperties["width"];
  animated?: boolean;
  rounded?: boolean;
}
export function DsSkeleton({
  type = "text",
  rows = 3,
  columns = 4,
  height,
  width,
  animated = true,
  rounded = true,
}: DsSkeletonProps) {
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
      {type === "chart" && (
        <div className="kjun-skeleton-chart" style={{ height: height || tokens.extensions.skeleton.chartHeight }}>
          <div className="kjun-skeleton-chart-bars">
            {[40, 65, 50, 80, 60, 90, 75].map((h, i) => (
              <div
                key={i}
                className="kjun-skeleton-chart-bar"
                style={{ height: h + "%" }}
              />
            ))}
          </div>
          <div className="kjun-skeleton-chart-axis" />
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
