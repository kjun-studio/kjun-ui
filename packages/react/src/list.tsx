import { useId, type MouseEvent, type ReactNode } from "react";
export interface DsListRowProps {
  title: string;
  description?: string;
  leading?: ReactNode;
  trailing?: ReactNode;
  actions?: ReactNode;
  href?: string;
  disabled?: boolean;
  onClick?: (event: MouseEvent<HTMLElement>) => void;
}
export function DsListRow({ title, description, leading, trailing, actions, href, disabled = false, onClick }: DsListRowProps) {
  const contents = <>{leading && <span className="kjun-list-leading">{leading}</span>}<span className="kjun-list-body"><span className="kjun-list-title">{title}</span>{description && <span className="kjun-list-description">{description}</span>}</span>{trailing && <span className="kjun-list-trailing">{trailing}</span>}</>;
  const main = href ? <a className="kjun-list-main" href={disabled ? undefined : href} aria-disabled={disabled || undefined} onClick={disabled ? e => e.preventDefault() : onClick}>{contents}</a> : onClick ? <button className="kjun-list-main" type="button" disabled={disabled} onClick={onClick}>{contents}</button> : <div className="kjun-list-main">{contents}</div>;
  return <li className="kjun-list-row">{main}{/* A disabled row disables its actions too, so the row never reads as partly available. */}{actions && <div className="kjun-list-actions" data-disabled={disabled || undefined} inert={disabled || undefined}>{actions}</div>}</li>;
}
export interface DsListSectionProps { title?: string; description?: string; actions?: ReactNode; children: ReactNode; ariaLabel?: string }
export function DsListSection({ title, description, actions, children, ariaLabel }: DsListSectionProps) {
  const id = useId();
  return <section className="kjun-list-section" aria-labelledby={title ? id : undefined} aria-label={title ? undefined : ariaLabel}>
    {(title || description || actions) && <div className="kjun-list-heading"><div>{title && <h3 id={id}>{title}</h3>}{description && <p>{description}</p>}</div>{actions}</div>}
    <ul className="kjun-list" aria-label={ariaLabel || title}>{children}</ul>
  </section>;
}
