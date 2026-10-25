import { tokens, type CardRadius } from "@kjun-ui/tokens";
import { useEffect, useId, useRef, type MouseEvent, type ReactNode } from "react";
import { warnNestedControls } from "../../../shared/package-runtime/nested-controls";
import { hasContent } from "../../../shared/package-runtime/content-presence";
import { KjunIcon } from "./button";
export interface KjunListRowProps {
  title: string;
  description?: string;
  leading?: ReactNode;
  trailing?: ReactNode;
  actions?: ReactNode;
  href?: string;
  disabled?: boolean;
  /** Draws the title in the danger role, for rows such as "Delete account". */
  destructive?: boolean;
  /** Ends the row with a decorative chevron that marks it as navigation. */
  chevron?: boolean;
  onClick?: (event: MouseEvent<HTMLElement>) => void;
  /** Name of a pressable or link row, e.g. with the amount a screen reader should hear. */
  ariaLabel?: string;
  /** Display-only content under the description (a budget bar); no buttons or links inside a pressable row. */
  children?: ReactNode;
}
export function KjunListRow({ title, description, leading, trailing, actions, href, disabled = false, destructive = false, chevron = false, onClick, ariaLabel, children }: KjunListRowProps) {
  const content = useRef<HTMLSpanElement>(null), pressable = !!(href || onClick);
  useEffect(() => { if (pressable) warnNestedControls(content.current, "KJUN ListRow: a pressable row's content contains buttons or links; move them to actions."); }, [pressable]);
  const contents = <>{leading && <span className="kjun-list-leading">{leading}</span>}<span className="kjun-list-body"><span className="kjun-list-title">{title}</span>{description && <span className="kjun-list-description">{description}</span>}{hasContent(children) && <span ref={content} className="kjun-list-content">{children}</span>}</span>{trailing && <span className="kjun-list-trailing">{trailing}</span>}{chevron && <KjunIcon name="chevron-right" className="kjun-list-chevron" size={tokens.iconSizes.default} />}</>;
  const main = href ? <a className="kjun-list-main" href={disabled ? undefined : href} aria-label={ariaLabel} aria-disabled={disabled || undefined} onClick={disabled ? e => e.preventDefault() : onClick}>{contents}</a> : onClick ? <button className="kjun-list-main" type="button" aria-label={ariaLabel} disabled={disabled} onClick={onClick}>{contents}</button> : <div className="kjun-list-main">{contents}</div>;
  return <li className="kjun-list-row" data-destructive={destructive || undefined}>{main}{/* A disabled row disables its actions too, so the row never reads as partly available. */}{actions && <div className="kjun-list-actions" data-disabled={disabled || undefined} inert={disabled || undefined}>{actions}</div>}</li>;
}
export interface KjunListSectionProps {
  title?: string; description?: string; actions?: ReactNode; children: ReactNode; ariaLabel?: string;
  /** Paints the surface background (default true); false lets the page background show through. */
  surface?: boolean;
  /** Draws dividers between rows (default true). */
  divider?: boolean;
  /** "compact" rows keep the 16px inset but are 44 tall (the touch minimum) instead of 56. */
  density?: "default" | "compact";
  /** Rounds the section on the card radius steps and clips its rows to the corners (default "none"). */
  radius?: CardRadius;
}
export function KjunListSection({ title, description, actions, children, ariaLabel, surface = true, divider = true, density = "default", radius = "none" }: KjunListSectionProps) {
  const id = "kjun-" + useId();
  return <section className="kjun-list-section" data-surface={surface ? undefined : "false"}
    data-radius={radius === "none" ? undefined : radius} style={radius === "none" ? undefined : { borderRadius: `var(--_kjun-geometry-card-radii-${radius})` }} aria-labelledby={title ? id : undefined} aria-label={title ? undefined : ariaLabel}>
    {(title || description || actions) && <div className="kjun-list-heading"><div>{title && <h3 id={id}>{title}</h3>}{description && <p>{description}</p>}</div>{actions}</div>}
    <ul className="kjun-list" aria-label={ariaLabel || title} data-divider={divider ? undefined : "false"} data-density={density === "compact" ? "compact" : undefined}>{children}</ul>
  </section>;
}
export interface KjunListItemProps { children: ReactNode }
/** Non-row content inside a KjunListSection (a theme switcher, a note) on the rows' inset and dividers. */
export function KjunListItem({ children }: KjunListItemProps) {
  return <li className="kjun-list-item">{children}</li>;
}
