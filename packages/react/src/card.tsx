import type { CardElevation, CardPadding, CardRadius, CardSurface } from "@kjun-ui/tokens";
import { useEffect, useRef, type CSSProperties, type HTMLAttributes, type KeyboardEvent, type MouseEvent, type ReactNode } from "react";
import { hasContent as present } from "../../../shared/package-runtime/content-presence";

export interface KjunCardProps extends HTMLAttributes<HTMLDivElement> {
  title?: string;
  subtitle?: string;
  header?: ReactNode;
  headerActions?: ReactNode;
  media?: ReactNode;
  footer?: ReactNode;
  padding?: CardPadding;
  bodyPadding?: CardPadding;
  radius?: CardRadius;
  surface?: CardSurface;
  elevation?: CardElevation;
  border?: boolean;
  dividers?: boolean;
  /** Makes the whole card one button (onClick). Do not put buttons or links inside a pressable card. */
  pressable?: boolean;
  /** Blocks a pressable card and dims it. */
  disabled?: boolean;
  /** Button name of a pressable card; defaults to the title. */
  ariaLabel?: string;
}
const interactive = 'button, a[href], input, select, textarea, [tabindex]:not([tabindex="-1"])';
function developmentMode() {
  try { return !!process.env.NODE_ENV && process.env.NODE_ENV !== "production"; } catch { return false; }
}
export function KjunCard({ title, subtitle, header, headerActions, media, footer,
  padding = "md", bodyPadding = padding, radius = "md", surface = "default",
  elevation = "flat", border = false, dividers = false, pressable = false, disabled = false, ariaLabel,
  children, style, className = "", onClick, onKeyDown, ...props
}: KjunCardProps) {
  const root = useRef<HTMLDivElement>(null);
  useEffect(() => {
    // Nested controls inside a button are unreachable for assistive technology.
    if (pressable && developmentMode() && root.current?.querySelector(interactive))
      console.warn("KJUN Card: a pressable card contains buttons or links; move them out or drop pressable.");
  }, [pressable]);
  const press = pressable ? {
    role: "button", tabIndex: disabled ? -1 : 0, "aria-disabled": disabled || undefined, "aria-label": ariaLabel ?? title,
    "data-pressable": "",
    onClick: (event: MouseEvent<HTMLDivElement>) => { if (!disabled) onClick?.(event); },
    onKeyDown: (event: KeyboardEvent<HTMLDivElement>) => {
      onKeyDown?.(event);
      if (event.defaultPrevented || disabled || (event.key !== "Enter" && event.key !== " ")) return;
      event.preventDefault();
      event.currentTarget.click();
    },
  } : { onClick, onKeyDown };
  const hasHeading = present(header) || present(title) || present(subtitle);
  const hasHeader = hasHeading || present(headerActions);
  return <div {...props} {...press} ref={root} className={["kjun-card", className].filter(Boolean).join(" ")}
    data-surface={surface} data-padding={padding} data-body-padding={bodyPadding}
    data-border={border} data-dividers={dividers} data-elevation={elevation}
    style={{
      "--_kjun-card-padding": `var(--_kjun-geometry-card-padding-${padding})`,
      "--_kjun-card-body-padding": `var(--_kjun-geometry-card-padding-${bodyPadding})`,
      borderRadius: `var(--_kjun-geometry-card-radii-${radius})`,
      // A pressable card's shadow comes from CSS so its hover lift can replace it.
      [pressable ? "--_kjun-card-shadow" : "boxShadow"]: `var(--_kjun-card-elevation-${elevation})`, ...style,
    } as CSSProperties}>
    {present(media) && <div className="kjun-card-media">{media}</div>}
    {hasHeader && <div className="kjun-card-header" data-description={!present(header) && present(subtitle)}>
      {hasHeading && <div className="kjun-card-heading">
        {present(header) ? header : <>
          {title && <h3>{title}</h3>}
          {subtitle && <p>{subtitle}</p>}
        </>}
      </div>}
      {present(headerActions) && <div className="kjun-card-actions">{headerActions}</div>}
    </div>}
    {present(children) && <div className="kjun-card-body">{children}</div>}
    {present(footer) && <div className="kjun-card-footer">{footer}</div>}
  </div>;
}
