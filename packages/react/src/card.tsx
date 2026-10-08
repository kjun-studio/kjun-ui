import type { CardElevation, CardPadding, CardRadius, CardSurface } from "@kjun-ui/tokens";
import type { CSSProperties, HTMLAttributes, ReactNode } from "react";
import { hasContent as present } from "../../../shared/package-runtime/content-presence";

export interface DsCardProps extends HTMLAttributes<HTMLDivElement> {
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
}
export function DsCard({ title, subtitle, header, headerActions, media, footer,
  padding = "md", bodyPadding = padding, radius = "md", surface = "default",
  elevation = "flat", border = false, dividers = false, children, style, className = "", ...props
}: DsCardProps) {
  const hasHeading = present(header) || present(title) || present(subtitle);
  const hasHeader = hasHeading || present(headerActions);
  return <div {...props} className={["kjun-card", className].filter(Boolean).join(" ")}
    data-surface={surface} data-padding={padding} data-body-padding={bodyPadding}
    data-border={border} data-dividers={dividers} data-elevation={elevation}
    style={{
      "--_kjun-card-padding": `var(--_kjun-geometry-card-padding-${padding})`,
      "--_kjun-card-body-padding": `var(--_kjun-geometry-card-padding-${bodyPadding})`,
      borderRadius: `var(--_kjun-geometry-card-radii-${radius})`,
      boxShadow: `var(--_kjun-card-elevation-${elevation})`, ...style,
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
