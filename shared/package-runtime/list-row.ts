import { tokens } from "@kjun-ui/tokens";

// What a list row is, shared by every platform. A switch row (checked given) wins over href and onClick; a row given
// `selected` (true or false) is one choice: a radio, or a checkbox in a multiple-choice section.
export type ListRowKind = "switch" | "radio" | "checkbox" | "link" | "button" | "static";
export type ListSelectionMode = "none" | "single" | "multiple";
/** A link row's rel: the app's own, else "noopener noreferrer" for a new tab so the opened page gets neither the opener nor the referrer. */
export const linkRel = (target?: string, rel?: string) => rel ?? (target === "_blank" ? "noopener noreferrer" : undefined);

export function listRowKind({ checked, selected, href, pressable, mode = "none" }: { checked?: boolean; selected?: boolean; href?: string; pressable: boolean; mode?: ListSelectionMode }): ListRowKind {
  if (checked !== undefined) return "switch";
  if (selected !== undefined && (pressable || !!href)) return mode === "multiple" ? "checkbox" : "radio";
  if (href) return "link";
  return pressable ? "button" : "static";
}

/** A row opens its own content when `expanded` is given and it has no other role (switch, choice or link). */
export const listRowExpandable = ({ expanded, checked, selected, href }: { expanded?: boolean; checked?: boolean; selected?: boolean; href?: string }) =>
  expanded !== undefined && checked === undefined && selected === undefined && !href;

/**
 * What a row draws at its end for its choice: a mark (an empty ring or box, filled when chosen) in an open section or a
 * multiple-choice list, so every choice shows it can be picked; otherwise a check on the chosen row only. A busy
 * pressable row (not a switch, whose thumb spins) draws a spinner in place of its mark, check and chevron.
 */
export function listRowEnd({ kind, selected, mode, open, busy = false }: { kind: ListRowKind; selected?: boolean; mode: ListSelectionMode; open: boolean; busy?: boolean }) {
  if (busy && kind !== "switch" && kind !== "static") return "spinner" as const;
  if ((kind === "radio" || kind === "checkbox") && (open || mode === "multiple")) return "mark" as const;
  return selected ? "check" as const : null;
}

/**
 * The aria-current a row's own control takes when it is the item open now (a message open beside its list, the settings
 * page shown): "page" on a link row, "true" on any other row. A switch or choice row has its own state, so it takes none.
 */
export function listRowCurrent(kind: ListRowKind, current?: boolean) {
  if (!current || kind === "switch" || kind === "radio" || kind === "checkbox") return undefined;
  return kind === "link" ? "page" as const : "true" as const;
}

export type ListTypeRole = "label" | "input" | "caption" | "body";
/**
 * A row's metrics for its section's variant and density, the numbers Web's row variables hold, for Native rows and
 * row skeletons: vertical and horizontal padding, gap, minimum height, actions padding and the title, description and
 * end value type roles.
 */
export function listRowMetrics({ open, compact, details = false }: { open: boolean; compact: boolean; details?: boolean }) {
  const list = tokens.extensions.list, o = list.open, d = list.details;
  // A details section's rows are read, not pressed: 32 tall, the label in the body type and the value one step heavier.
  if (details) return { paddingY: d.paddingY, paddingX: list.padding, gap: list.gap, minimumHeight: d.minimumHeight, actionsPadding: list.actionsPadding, title: "body" as ListTypeRole, description: "caption" as ListTypeRole, trailing: "label" as ListTypeRole };
  return open
    ? { paddingY: compact ? o.compactPaddingY : o.paddingY, paddingX: o.paddingX, gap: o.gap, minimumHeight: compact ? o.compactMinimumHeight : o.minimumHeight, actionsPadding: o.paddingX, title: "input" as ListTypeRole, description: "body" as ListTypeRole, trailing: "label" as ListTypeRole }
    : { paddingY: compact ? list.compactPaddingY : list.padding, paddingX: list.padding, gap: list.gap, minimumHeight: compact ? list.compactMinimumHeight : list.minimumHeight, actionsPadding: list.actionsPadding, title: "label" as ListTypeRole, description: "caption" as ListTypeRole, trailing: "body" as ListTypeRole };
}

export type ListChoiceValue = string | number;
/** A section's selection: its mode and, when the section owns the value, that value and its change handler. */
export interface ListSelection {
  mode: ListSelectionMode;
  value?: ListChoiceValue | null | readonly ListChoiceValue[];
  onValueChange?: (value: never) => void;
}
/**
 * A row's choice state. A row with a `value` inside a section that owns its value (value given) reads its selection from
 * the section and changes it when pressed; any other row keeps its own `selected` and press handler.
 */
export function listRowChoice(selection: ListSelection | undefined, rowValue: ListChoiceValue | undefined, selected: boolean | undefined) {
  if (!selection || selection.mode === "none" || rowValue === undefined || selection.value === undefined) return { selected, owned: false, press: undefined };
  const change = selection.onValueChange as ((value: unknown) => void) | undefined;
  if (selection.mode === "multiple") {
    const values = Array.isArray(selection.value) ? selection.value as readonly ListChoiceValue[] : [], on = values.includes(rowValue);
    return { selected: on, owned: true, press: () => change?.(on ? values.filter(value => value !== rowValue) : [...values, rowValue]) };
  }
  const on = selection.value === rowValue;
  return { selected: on, owned: true, press: () => { if (!on) change?.(rowValue); } };
}

const developmentMode = () => { try { return !!process.env.NODE_ENV && process.env.NODE_ENV !== "production"; } catch { return false; } };
const warned = new Set<string>();
const warnOnce = (key: string, when: unknown, message: string, component = "ListRow") => {
  if (!when || warned.has(key)) return;
  warned.add(key);
  console.warn("KJUN " + component + ": " + message);
};
/**
 * Development warnings, once each, for props that cannot apply together. `deviceLink` (Native on a device: an href with
 * no onPress) has nowhere to go, since only the web follows href; `looseChoice` is a choice row outside a section with a
 * selection mode, so it cannot join one radio group.
 */
export function warnListRowProps({ checked, selected, href, chevron, deviceLink, looseChoice, expanded, pressableDetails, current }: { checked?: boolean; selected?: boolean; href?: string; chevron?: boolean; deviceLink?: boolean; looseChoice?: boolean; expanded?: boolean; pressableDetails?: boolean; current?: boolean }) {
  if (!developmentMode()) return;
  warnOnce("details-press", pressableDetails, "a details section's rows are 32 tall, below the touch minimum, and read as information; put pressable rows in a default section.");
  warnOnce("device-link", deviceLink, "href only navigates on the web; on a device pass onPress and navigate with the app's router.");
  warnOnce("switch", checked !== undefined && (href || selected !== undefined || chevron), "a switch row (checked) ignores href, selected and chevron; give each row one role.");
  warnOnce("choice-link", checked === undefined && selected !== undefined && href, "a choice row (selected) is a button and ignores href; navigate in the press handler instead.");
  warnOnce("expand", expanded !== undefined && (checked !== undefined || selected !== undefined || !!href || chevron), "an expandable row (expanded) opens its own content and ignores href, checked, selected and chevron; give each row one role.");
  warnOnce("current", current && (checked !== undefined || selected !== undefined), "current marks the item open now and has no effect on a switch or choice row (checked, selected); a choice shows its own state.");
  warnOnce("loose-choice", looseChoice, "a choice row (selected) is outside a section with selectionMode; set selectionMode on its KjunListSection so the rows read as one group.");
}

/**
 * Development warnings, once each: an open section draws no dividers, so an explicit `divider` does nothing there; a
 * details section keeps its own 32px rows, so `density` does nothing there.
 */
export function warnListSectionProps({ open, divider, details = false, compact = false }: { open: boolean; divider?: boolean; details?: boolean; compact?: boolean }) {
  if (!developmentMode()) return;
  warnOnce("open-divider", open && divider === true, "divider has no effect in an open section; open rows are set apart by space. Use the default variant for divided rows.", "ListSection");
  warnOnce("details-density", details && compact, "density has no effect in a details section; its rows are always 32 tall.", "ListSection");
}
/**
 * Development warnings, once each, for a section selection that would otherwise be ignored without a word: a value
 * with no selection mode, a single value for "multiple" (read as none chosen), a list for "single", and a value with
 * no change handler, whose rows look pressable but never change. Vue always has its update event, so it passes
 * `handled`.
 */
export function warnListSelection({ mode, value, handled }: { mode: ListSelectionMode; value: unknown; handled: boolean }) {
  if (!developmentMode() || value === undefined) return;
  warnOnce("selection-none", mode === "none", "value has no effect without selectionMode; set selectionMode to \"single\" or \"multiple\".", "ListSection");
  warnOnce("selection-multiple", mode === "multiple" && !Array.isArray(value), "selectionMode \"multiple\" takes a list of values; a single value reads as nothing chosen.", "ListSection");
  warnOnce("selection-single", mode === "single" && Array.isArray(value), "selectionMode \"single\" takes one value (or null); a list reads as nothing chosen.", "ListSection");
  warnOnce("selection-handler", mode !== "none" && !handled, "value is given without onValueChange, so pressing a row never changes the choice; pass onValueChange.", "ListSection");
}

export type ListSectionCorner = "none" | "sm" | "md" | "lg" | "xl";
export type ListGroupVariant = "inset" | "flush" | "open";
/** "details": rows that are read, not pressed, such as "Payment method / Visa": 32 tall, no dividers by default, the
 * label in the secondary body type and the value in the text color, given the room the label leaves. */
export type ListSectionVariant = "default" | "open" | "details";
/** A section's fill: true paints the surface, false none, "muted" the muted (secondary) fill that sets rows apart inside a white card or modal. */
export type ListSectionSurface = boolean | "muted";
/**
 * How a section's fill draws, the same on every platform: whether it paints at all, whether it is the muted fill, and the
 * web data-surface value (none for the plain surface, "false" for no fill, "muted"). On the muted fill a badge takes the
 * plain surface like inside a tinted card, dividers take the border role and an open row's icon square the surface, so
 * none of them dissolves into the fill.
 */
export function listSectionSurface(surface: ListSectionSurface = true) {
  const muted = surface === "muted", painted = muted || surface === true;
  return { painted, muted, attribute: muted ? "muted" as const : painted ? undefined : "false" as const };
}
/** Where a row's trailing value sits: beside the text, on the title line, or on its own line under the title. */
export type ListTrailingPosition = "side" | "title" | "below";
/**
 * How a section draws, the same on every platform: whether it is open (rows on the page with no card or dividers; the
 * section's variant, or the KjunListGroup's) or details (read-only rows; only its own variant), its card corner (the group's when unset; none when open), whether its title
 * is the small label (a title without a description, unless titleVariant says otherwise) and whether its rows form a card
 * with the heading and footer outside it. A bleeding section (not an open one, whose rows keep their own inset) is flat: it
 * runs to its container's edge, so it has no corner and keeps its heading and footer with the rows.
 */
export function listSectionShape<R extends ListSectionCorner>({ radius, group, variant, title, description, titleVariant, bleed: wantsBleed = false }: {
  radius?: R; group?: ListGroupVariant | null; variant?: ListSectionVariant; title?: string; description?: string; titleVariant?: "title" | "label"; bleed?: boolean;
}) {
  const resolved = variant ?? (group === "open" ? "open" : "default"), open = resolved === "open", details = resolved === "details";
  const bleed = wantsBleed && !open;
  const corner: R | "lg" | "none" = open || bleed ? "none" : radius ?? (group === "inset" ? "lg" : "none");
  const bare = !!title && (titleVariant ? titleVariant === "label" : !description);
  return { open, details, corner, bare, outside: corner !== "none", bleed };
}

/**
 * How far a bleeding section reaches past its container and the inset its rows, heading and footer take: the container's
 * own inset (a KjunCard body's padding) when it gives one, otherwise the rows' standard inset, so text keeps to the
 * content line around the section while fills and dividers run to the container's edge. Native reads it; the web
 * stylesheet does the same with the card's --_kjun-card-body-padding.
 */
export function listSectionInset(bleed: boolean, containerInset: number | null | undefined, rowInset: number) {
  const inset = bleed && containerInset != null && Number.isFinite(containerInset) && containerInset >= 0 ? containerInset : rowInset;
  return { inset, margin: bleed ? -inset : 0 };
}

/**
 * Web heading actions: records the tallest action's height on the heading, so any control (not only a KjunButton, which
 * the stylesheet already knows) centers on the title's first line. Returns the cleanup.
 */
export function observeListHeadingActions(actions: HTMLElement) {
  const heading = actions.parentElement;
  if (!heading || typeof ResizeObserver === "undefined") return () => {};
  const update = () => heading.style.setProperty("--_kjun-list-action-height", actions.offsetHeight + "px");
  const observer = new ResizeObserver(update);
  observer.observe(actions);
  update();
  return () => { observer.disconnect(); heading.style.removeProperty("--_kjun-list-action-height"); };
}
