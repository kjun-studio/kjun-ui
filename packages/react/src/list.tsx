import { tokens, type CardRadius } from "@kjun-ui/tokens";
import { createContext, useContext, useEffect, useId, useRef, useState, type CSSProperties, type MouseEvent, type ReactNode } from "react";
import { warnNestedControls } from "../../../shared/package-runtime/nested-controls";
import { hasContent } from "../../../shared/package-runtime/content-presence";
import { KjunIcon } from "./button";
import { listRowKind, listSectionShape, warnListRowProps } from "../../../shared/package-runtime/list-row";
import { bindRadioKeyboard } from "../../../shared/package-runtime/radio-keyboard";
// True inside a single-choice section, whose list is a radiogroup.
const ListChoiceContext = createContext(false);
export interface KjunListRowProps {
  title: string;
  description?: string;
  /** Icon name drawn in a 24px column; custom `leading` content uses a minimum 40px column and takes priority. */
  icon?: string;
  leading?: ReactNode;
  trailing?: ReactNode;
  actions?: ReactNode;
  href?: string;
  disabled?: boolean;
  /** Draws the title in the danger role, for rows such as "Delete account". */
  destructive?: boolean;
  /** Ends the row with a decorative chevron that marks it as navigation. */
  chevron?: boolean;
  /** One choice in a single-choice list: true draws a check at the end. A pressable row given it (true or false) reads as a radio. */
  selected?: boolean;
  /** Makes the whole row a switch: it draws one at the end and toggles on any press. */
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  onClick?: (event: MouseEvent<HTMLElement>) => void;
  /** Name of a pressable or link row, e.g. with the amount a screen reader should hear. */
  ariaLabel?: string;
  /** Display-only content under the description (a budget bar); no buttons or links inside a pressable row. */
  children?: ReactNode;
  /** Clamps the title (and the description) to this many lines, ending in an ellipsis. */
  titleLines?: number;
  descriptionLines?: number;
}
export function KjunListRow({ title, description, icon, leading, trailing, actions, href, disabled = false, destructive = false, chevron = false, selected, checked, onCheckedChange, onClick, ariaLabel, children, titleLines, descriptionLines }: KjunListRowProps) {
  const choice = useContext(ListChoiceContext);
  const kind = listRowKind({ checked, selected, href, pressable: !!(href || onClick) }), toggle = kind === "switch";
  const content = useRef<HTMLSpanElement>(null), pressable = kind !== "static";
  useEffect(() => { if (pressable) warnNestedControls(content.current, "KJUN ListRow: a pressable row's content contains buttons or links; move them to actions."); }, [pressable]);
  useEffect(() => warnListRowProps({ checked, selected, href, chevron }), [checked !== undefined, selected !== undefined, !!href, chevron]);
  const clamp = (lines?: number) => lines ? { WebkitLineClamp: lines } as CSSProperties : undefined;
  const front = leading || (icon ? <KjunIcon name={icon} className="kjun-list-icon" size={tokens.extensions.list.iconSize} /> : null);
  const contents = <>{front && <span className="kjun-list-leading">{front}</span>}<span className="kjun-list-body"><span className="kjun-list-title" data-clamp={titleLines ? "" : undefined} style={clamp(titleLines)}>{title}</span>{description && <span className="kjun-list-description" data-clamp={descriptionLines ? "" : undefined} style={clamp(descriptionLines)}>{description}</span>}{hasContent(children) && <span ref={content} className="kjun-list-content">{children}</span>}</span>{hasContent(trailing) && <span className="kjun-list-trailing">{trailing}</span>}{selected && <KjunIcon name="check" className="kjun-list-check" size={tokens.iconSizes.default} />}{toggle && <span className={"kjun-switch kjun-switch--md" + (checked ? " kjun-switch--on" : "")} aria-hidden="true"><span className="kjun-switch-thumb" /></span>}{chevron && <KjunIcon name="chevron-right" className="kjun-list-chevron" size={tokens.iconSizes.default} />}</>;
  // A switch row is one switch control: the drawn switch is decoration and the row carries role and state.
  // A choice row is a radio (checked when selected); the check is its drawing.
  const main = toggle ? <button className="kjun-list-main" type="button" role="switch" aria-checked={checked} aria-label={ariaLabel} disabled={disabled} onClick={(event) => { onCheckedChange?.(!checked); onClick?.(event); }}>{contents}</button>
    : kind === "radio" ? <button className="kjun-list-main" type="button" role="radio" aria-checked={!!selected} aria-label={ariaLabel} disabled={disabled} onClick={onClick}>{contents}</button>
    : href ? <a className="kjun-list-main" href={disabled ? undefined : href} aria-label={ariaLabel} aria-disabled={disabled || undefined} onClick={disabled ? e => e.preventDefault() : onClick}>{contents}</a>
    : onClick ? <button className="kjun-list-main" type="button" aria-label={ariaLabel} disabled={disabled} onClick={onClick}>{contents}</button> : <div className="kjun-list-main">{contents}</div>;
  // In a single-choice section the list is a radiogroup, so its items drop their listitem role.
  return <li className="kjun-list-row" role={choice ? "none" : undefined} data-leading={front ? (leading ? "" : "icon") : undefined} data-destructive={destructive || undefined} data-disabled={disabled || undefined}>{main}{/* A disabled row disables its actions too, so the row never reads as partly available. */}{hasContent(actions) && <div className="kjun-list-actions" data-disabled={disabled || undefined} inert={disabled || undefined}>{actions}</div>}</li>;
}
export interface KjunListSectionProps {
  title?: string; description?: string; actions?: ReactNode; children?: ReactNode; ariaLabel?: string;
  /** Paints the surface background (default true); false lets the page background show through. */
  surface?: boolean;
  /** Draws dividers between rows (default true). */
  divider?: boolean;
  /** "compact" rows keep the 16px inset but are 44 tall (the touch minimum) instead of 56. */
  density?: "default" | "compact";
  /** Rounds the rows into a card on the card radius steps; the title, actions and footer stay outside it (default "none", or the KjunListGroup's). */
  radius?: CardRadius;
  /** "title" is the 16px heading, "label" the small caption above the rows; by default a title with a description is a heading and one without is a label. */
  titleVariant?: "title" | "label";
  /** Heading level of the title (default 3). */
  headingLevel?: 2 | 3 | 4;
  /** Shown in place of the rows when the section has none, such as a KjunEmpty. */
  empty?: ReactNode;
  /** Supporting text under the rows, such as what a setting applies to. */
  footer?: ReactNode;
  /** Shown in place of the rows (and the empty content) while they load, such as a KjunListSkeleton with variant "row". */
  loading?: ReactNode;
  /** "single": the rows are one choice (rows given `selected`); the list becomes a radio group with one Tab stop and arrow keys. */
  selectionMode?: "none" | "single";
}
const ListGroupContext = createContext<"inset" | "flush" | null>(null);
export function KjunListSection({ title, description, actions, children, ariaLabel, surface = true, divider = true, density = "default", radius, titleVariant, headingLevel = 3, empty, footer, loading, selectionMode = "none" }: KjunListSectionProps) {
  // A rounded section is a card of rows only: its title, actions and footer stay on the page, above and below it.
  const { corner, bare, outside } = listSectionShape({ radius, group: useContext(ListGroupContext), title, description, titleVariant });
  const id = "kjun-" + useId(), Heading = `h${headingLevel}` as "h3";
  const choice = selectionMode === "single", [list, setList] = useState<HTMLUListElement | null>(null);
  useEffect(() => choice && list ? bindRadioKeyboard(list) : undefined, [choice, list]);
  const rounded = corner === "none" ? undefined : { borderRadius: `var(--_kjun-geometry-card-radii-${corner})` };
  const compact = density === "compact" ? "compact" : undefined;
  // The list carries the name and the description; a named section would make every settings group a page landmark.
  const rows = hasContent(loading) ? <div className="kjun-list-loading" aria-busy="true">{loading}</div>
    : hasContent(children)
    ? <ul ref={setList} className="kjun-list" role={choice ? "radiogroup" : undefined} aria-label={ariaLabel || undefined} aria-labelledby={ariaLabel || !title ? undefined : id} aria-describedby={description ? id + "-description" : undefined} data-divider={divider ? undefined : "false"} data-density={compact}><ListChoiceContext.Provider value={choice}>{children}</ListChoiceContext.Provider></ul>
    : hasContent(empty) ? <div className="kjun-list-empty" data-density={compact}>{empty}</div> : null;
  return <section className="kjun-list-section" data-surface={surface ? undefined : "false"} data-outside={outside || undefined}>
    {(title || description || hasContent(actions)) && <div className="kjun-list-heading" data-bare={bare ? "" : undefined}><div>{title && <Heading id={id}>{title}</Heading>}{description && <p id={id + "-description"}>{description}</p>}</div>{hasContent(actions) && <div className="kjun-list-heading-actions">{actions}</div>}</div>}
    {outside ? <div className="kjun-list-panel" data-surface={surface ? undefined : "false"} style={rounded}>{rows}</div> : rows}
    {hasContent(footer) && <div className="kjun-list-footer">{footer}</div>}
  </section>;
}
export interface KjunListGroupProps {
  /** "inset" (default) rounds every section and keeps them 24px apart; "flush" keeps square sections 8px apart. */
  variant?: "inset" | "flush";
  children: ReactNode;
}
/** Stacks KjunListSections with one spacing and corner rule, so sections never set radius or gaps one by one. */
export function KjunListGroup({ variant = "inset", children }: KjunListGroupProps) {
  return <ListGroupContext.Provider value={variant}><div className="kjun-list-group" data-variant={variant}>{children}</div></ListGroupContext.Provider>;
}
export interface KjunListItemProps { children: ReactNode }
/** Non-row content inside a KjunListSection (a theme switcher, a note) on the rows' inset and dividers. */
export function KjunListItem({ children }: KjunListItemProps) {
  return <li className="kjun-list-item" role={useContext(ListChoiceContext) ? "none" : undefined}>{children}</li>;
}
