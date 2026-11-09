import { tokens, type CardRadius } from "@kjun-ui/tokens";
import { createContext, useContext, useEffect, useId, useMemo, useRef, useState, type CSSProperties, type MouseEvent, type ReactNode } from "react";
import { warnNestedControls } from "../../../shared/package-runtime/nested-controls";
import { hasContent } from "../../../shared/package-runtime/content-presence";
import { KjunIcon } from "./button";
import { listRowChoice, listRowEnd, listRowKind, listSectionShape, observeListHeadingActions, warnListRowProps, warnListSectionProps, warnListSelection, type ListChoiceValue, type ListGroupVariant, type ListSectionVariant, type ListSelection, type ListSelectionMode } from "../../../shared/package-runtime/list-row";
import { ListShapeContext } from "./list-context";
import { bindRadioKeyboard } from "../../../shared/package-runtime/radio-keyboard";
import { listLeadingGeometry, type ListLeadingSize } from "../../../shared/package-runtime/list-leading";
export type { ListChoiceValue, ListGroupVariant, ListSectionVariant } from "../../../shared/package-runtime/list-row";
export type { ListLeadingSize } from "../../../shared/package-runtime/list-leading";
// The section's selection mode and, when it owns the value, that value (a single-choice list is a radiogroup). Whether
// the section is open, which changes how a row draws its icon and its choice, comes from ListShapeContext.
const ListSelectionContext = createContext<ListSelection>({ mode: "none" });
export interface KjunListRowProps {
  title: string;
  description?: string;
  /** Content after the title, centered on its first line, such as a KjunBadge ("New", a count); a screen reader hears it with the title. */
  badge?: ReactNode;
  /** Icon name drawn in a 24px column (on a 40px rounded square in an open section); custom `leading` content uses a minimum 40px column and takes priority. */
  icon?: string;
  /** Leading square/icon sizes: xs 24/16, sm 32/20, md 40/24, lg 56/28. Custom content keeps its own size. */
  leadingSize?: ListLeadingSize;
  /** App-owned CSS color for the built-in icon; overrides its default/destructive color. */
  iconColor?: string;
  /** App-owned circular background color for the built-in icon; defaults leadingSize to sm. */
  iconBackground?: string;
  leading?: ReactNode;
  trailing?: ReactNode;
  actions?: ReactNode;
  href?: string;
  disabled?: boolean;
  /** Draws the title in the danger role, for rows such as "Delete account". */
  destructive?: boolean;
  /** Ends the row with a decorative chevron that marks it as navigation. */
  chevron?: boolean;
  /** One choice in a single-choice list: true draws a check at the end (in an open section or a multiple-choice list, a filled mark; unchosen rows an empty one). A pressable row given it (true or false) reads as a radio. */
  selected?: boolean;
  /** Makes the whole row a switch: it draws one at the end and toggles on any press. */
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  /** The row's last press is still being handled (such as a switch saving): presses (and a link's navigation) are ignored, the row reads as busy and draws a spinner, in a switch row's thumb or in place of its mark, check or chevron. */
  busy?: boolean;
  /** This row's value in a section that owns its selection (`value` on the section): it is selected when the section's value holds it. */
  value?: ListChoiceValue;
  onClick?: (event: MouseEvent<HTMLElement>) => void;
  /** Name of a pressable or link row, e.g. with the amount a screen reader should hear. */
  ariaLabel?: string;
  /** Display-only content under the description (a budget bar); no buttons or links inside a pressable row. */
  children?: ReactNode;
  /** Clamps the title (and the description) to this many lines, ending in an ellipsis. */
  titleLines?: number;
  descriptionLines?: number;
}
export function KjunListRow({ title, description, badge, icon, leadingSize, iconColor, iconBackground, leading, trailing, actions, href, disabled = false, destructive = false, chevron = false, selected: ownSelected, checked, onCheckedChange, busy = false, value, onClick: ownClick, ariaLabel, children, titleLines, descriptionLines }: KjunListRowProps) {
  const selection = useContext(ListSelectionContext), { open } = useContext(ListShapeContext), choice = listRowChoice(selection, value, ownSelected), selected = choice.selected;
  const handle = choice.press ? (event: MouseEvent<HTMLElement>) => { choice.press(); ownClick?.(event); } : ownClick;
  // A busy row ignores presses (a link its navigation too) but keeps its focus and role, so it stays reachable and reads as busy.
  const onClick = busy && (handle || href) ? (event: MouseEvent<HTMLElement>) => event.preventDefault() : handle;
  const kind = listRowKind({ checked, selected, href, pressable: !!(href || onClick), mode: selection.mode }), toggle = kind === "switch";
  const content = useRef<HTMLSpanElement>(null), pressable = kind !== "static";
  const looseChoice = (kind === "radio" || kind === "checkbox") && selection.mode === "none";
  useEffect(() => { if (pressable) warnNestedControls(content.current, "KJUN ListRow: a pressable row's content contains buttons or links; move them to actions."); }, [pressable]);
  useEffect(() => warnListRowProps({ checked, selected, href, chevron, looseChoice }), [checked !== undefined, selected !== undefined, !!href, chevron, looseChoice]);
  const clamp = (lines?: number) => lines ? { WebkitLineClamp: lines } as CSSProperties : undefined;
  const custom = hasContent(leading), geometry = listLeadingGeometry({ size: leadingSize, custom, background: iconBackground != null, open });
  const glyph = icon ? <KjunIcon name={icon} className="kjun-list-icon" size={geometry.iconSize} style={{ color: iconColor }} /> : null;
  const front = custom ? leading : glyph && geometry.tile ? <span className="kjun-list-icon-background" style={iconBackground != null ? { backgroundColor: iconBackground } : undefined} aria-hidden="true">{glyph}</span> : glyph;
  const choiceRow = kind === "radio" || kind === "checkbox", end = listRowEnd({ kind, selected, mode: selection.mode, open, busy });
  const mark = end === "spinner" ? <KjunIcon name="loader-2" spin className="kjun-list-busy" size={tokens.extensions.list.endIconSize} />
    : end === "mark" ? <span className="kjun-list-mark" data-kind={kind} data-checked={selected ? "" : undefined} aria-hidden="true">{selected && <KjunIcon name="check" size={tokens.extensions.list.markIconSize} />}</span>
    : end === "check" && <KjunIcon name="check" className="kjun-list-check" size={tokens.iconSizes.default} />;
  const leadingStyle = front && geometry.size ? { "--_kjun-list-leading-width": `${geometry.width}px`, "--_kjun-list-leading-height": `${geometry.width}px` } as CSSProperties : undefined;
  // A pressable row is named by its title, badge and end value and described by its description and content, like
  // Native's spoken name, rather than by every piece of text inside it.
  const id = "kjun-" + useId(), hasBadge = hasContent(badge), hasTrailing = hasContent(trailing), hasBody = hasContent(children);
  const names = ariaLabel ? undefined : [id + "-title", hasBadge && id + "-badge", hasTrailing && id + "-trailing"].filter(Boolean).join(" ");
  const notes = [description && id + "-description", hasBody && id + "-content"].filter(Boolean).join(" ") || undefined;
  const label = { "aria-label": ariaLabel, "aria-labelledby": names, "aria-describedby": notes };
  const titleText = <span id={id + "-title"} className="kjun-list-title" data-clamp={titleLines ? "" : undefined} style={clamp(titleLines)}>{title}</span>;
  const contents = <>{front && <span className="kjun-list-leading">{front}</span>}<span className="kjun-list-body">{hasBadge ? <span className="kjun-list-title-row">{titleText}<span id={id + "-badge"} className="kjun-list-badge">{badge}</span></span> : titleText}{description && <span id={id + "-description"} className="kjun-list-description" data-clamp={descriptionLines ? "" : undefined} style={clamp(descriptionLines)}>{description}</span>}{hasBody && <span ref={content} id={id + "-content"} className="kjun-list-content">{children}</span>}</span>{hasTrailing && <span id={id + "-trailing"} className="kjun-list-trailing">{trailing}</span>}{mark}{toggle && <span className={"kjun-switch kjun-switch--md" + (checked ? " kjun-switch--on" : "")} aria-hidden="true"><span className="kjun-switch-thumb">{busy && <span className="kjun-switch-spinner" />}</span></span>}{chevron && end !== "spinner" && <KjunIcon name="chevron-right" className="kjun-list-chevron" size={tokens.iconSizes.default} />}</>;
  // A switch row is one switch control: the drawn switch is decoration and the row carries role and state.
  // A choice row is a radio (a checkbox in a multiple-choice section), checked when selected; the check is its drawing.
  const main = toggle ? <button className="kjun-list-main" type="button" role="switch" aria-checked={checked} {...label} aria-busy={busy || undefined} disabled={disabled} onClick={(event) => { if (busy) return; onCheckedChange?.(!checked); onClick?.(event); }}>{contents}</button>
    : choiceRow ? <button className="kjun-list-main" type="button" role={kind} aria-checked={!!selected} {...label} aria-busy={busy || undefined} disabled={disabled} onClick={onClick}>{contents}</button>
    : href ? <a className="kjun-list-main" href={disabled ? undefined : href} {...label} aria-disabled={disabled || undefined} aria-busy={busy || undefined} onClick={disabled ? e => e.preventDefault() : onClick}>{contents}</a>
    : onClick ? <button className="kjun-list-main" type="button" {...label} aria-busy={busy || undefined} disabled={disabled} onClick={onClick}>{contents}</button> : <div className="kjun-list-main">{contents}</div>;
  // In a single-choice section the list is a radiogroup, so its items drop their listitem role.
  return <li className="kjun-list-row" role={selection.mode === "single" ? "none" : undefined} data-leading={front ? (custom ? "" : "icon") : undefined} data-leading-size={front ? geometry.size : undefined} style={leadingStyle} data-destructive={destructive || undefined} data-disabled={disabled || undefined}>{main}{/* A disabled row disables its actions too, so the row never reads as partly available. */}{hasContent(actions) && <div className="kjun-list-actions" data-disabled={disabled || undefined} inert={disabled || undefined}>{actions}</div>}</li>;
}
export interface KjunListSectionProps {
  title?: string; description?: string; actions?: ReactNode; children?: ReactNode; ariaLabel?: string;
  /** Paints the surface background (default true); false lets the page background show through. */
  surface?: boolean;
  /** Draws dividers between rows (default true). An open section draws none; giving it true warns in development. */
  divider?: boolean;
  /** "compact" rows keep the 16px inset but are 44 tall (the touch minimum) instead of 56. */
  density?: "default" | "compact";
  /** Rounds the rows into a card on the card radius steps; the title, actions and footer stay outside it (default "none", or the KjunListGroup's). An open section has no card. */
  radius?: CardRadius;
  /** "open" puts the rows on the page with no card or dividers: larger titles, icons on rounded squares, and a filled mark for the chosen row (default "default", or "open" in an open KjunListGroup). */
  variant?: ListSectionVariant;
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
  /** "single": the rows are one choice and the list a radio group with one Tab stop and arrow keys; "multiple": each row is a checkbox. Rows are choices when given `selected`, or a `value` with the section's `value`. */
  selectionMode?: ListSelectionMode;
  /** The chosen rows' values, owned by the app: one value (null for none) with "single", a list with "multiple". */
  value?: ListChoiceValue | null | ListChoiceValue[];
  /** Called with the next value (a list with "multiple") when a row with a `value` is pressed. */
  onValueChange?: (value: ListChoiceValue | ListChoiceValue[]) => void;
}
const ListGroupContext = createContext<ListGroupVariant | null>(null);
export function KjunListSection({ title, description, actions, children, ariaLabel, surface = true, divider: dividerProp, density = "default", radius, titleVariant, headingLevel = 3, empty, footer, loading, selectionMode = "none", value, onValueChange, variant }: KjunListSectionProps) {
  // A rounded section is a card of rows only: its title, actions and footer stay on the page, above and below it.
  const { open, corner, bare, outside } = listSectionShape({ radius, group: useContext(ListGroupContext), variant, title, description, titleVariant });
  const divider = dividerProp ?? true;
  useEffect(() => warnListSectionProps({ open, divider: dividerProp }), [open, dividerProp]);
  useEffect(() => warnListSelection({ mode: selectionMode, value, handled: !!onValueChange }), [selectionMode, Array.isArray(value), value === undefined, !!onValueChange]);
  const id = "kjun-" + useId(), Heading = `h${headingLevel}` as "h3";
  const choice = selectionMode === "single", [list, setList] = useState<HTMLUListElement | null>(null), [actionsBox, setActionsBox] = useState<HTMLDivElement | null>(null);
  useEffect(() => choice && list ? bindRadioKeyboard(list) : undefined, [choice, list]);
  useEffect(() => actionsBox ? observeListHeadingActions(actionsBox) : undefined, [actionsBox]);
  const hasFooter = hasContent(footer), describedBy = [description && id + "-description", hasFooter && id + "-footer"].filter(Boolean).join(" ") || undefined;
  const rounded = corner === "none" ? undefined : { borderRadius: `var(--_kjun-geometry-card-radii-${corner})` };
  const compact = density === "compact" ? "compact" : undefined;
  // Memoized, so a section drawing again for its own state (its measured heading actions) does not redraw every row.
  const shape = useMemo(() => ({ open, compact: !!compact }), [open, compact]);
  const selection = useMemo(() => ({ mode: selectionMode, value, onValueChange }), [selectionMode, value, onValueChange]);
  // The list carries the name and the description; a named section would make every settings group a page landmark.
  // Loading content announces itself (a skeleton's loadingText is a status), so the wrapper only places it.
  const rows = hasContent(loading) ? <div className="kjun-list-loading">{loading}</div>
    : hasContent(children)
    ? <ul ref={setList} className="kjun-list" role={choice ? "radiogroup" : undefined} aria-label={ariaLabel || undefined} aria-labelledby={ariaLabel || !title ? undefined : id} aria-describedby={describedBy} data-divider={divider ? undefined : "false"} data-density={compact} data-variant={open ? "open" : undefined}><ListSelectionContext.Provider value={selection}>{children}</ListSelectionContext.Provider></ul>
    : hasContent(empty) ? <div className="kjun-list-empty" data-density={compact}>{empty}</div> : null;
  return <ListShapeContext.Provider value={shape}><section className="kjun-list-section" data-surface={surface ? undefined : "false"} data-outside={outside || undefined} data-variant={open ? "open" : undefined}>
    {(title || description || hasContent(actions)) && <div className="kjun-list-heading" data-bare={bare ? "" : undefined}><div>{title && <Heading id={id}>{title}</Heading>}{description && <p id={id + "-description"}>{description}</p>}</div>{hasContent(actions) && <div ref={setActionsBox} className="kjun-list-heading-actions">{actions}</div>}</div>}
    {outside ? <div className="kjun-list-panel" data-surface={surface ? undefined : "false"} style={rounded}>{rows}</div> : rows}
    {hasFooter && <div id={id + "-footer"} className="kjun-list-footer">{footer}</div>}
  </section></ListShapeContext.Provider>;
}
export interface KjunListGroupProps {
  /** "inset" (default) rounds every section and keeps them 24px apart; "flush" keeps square sections 8px apart; "open" puts every section's rows on the page with no card or dividers, 20px apart. */
  variant?: ListGroupVariant;
  children: ReactNode;
}
/** Stacks KjunListSections with one spacing and corner rule, so sections never set radius or gaps one by one. */
export function KjunListGroup({ variant = "inset", children }: KjunListGroupProps) {
  return <ListGroupContext.Provider value={variant}><div className="kjun-list-group" data-variant={variant}>{children}</div></ListGroupContext.Provider>;
}
export interface KjunListItemProps { children: ReactNode }
/** Non-row content inside a KjunListSection (a theme switcher, a note) on the rows' inset and dividers. */
export function KjunListItem({ children }: KjunListItemProps) {
  return <li className="kjun-list-item" role={useContext(ListSelectionContext).mode === "single" ? "none" : undefined}>{children}</li>;
}
