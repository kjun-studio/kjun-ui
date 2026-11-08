// What a list row is, shared by every platform. A switch row (checked given) wins over href and onClick; a row given
// `selected` (true or false) is one choice: a radio, or a checkbox in a multiple-choice section.
export type ListRowKind = "switch" | "radio" | "checkbox" | "link" | "button" | "static";
export type ListSelectionMode = "none" | "single" | "multiple";
export function listRowKind({ checked, selected, href, pressable, mode = "none" }: { checked?: boolean; selected?: boolean; href?: string; pressable: boolean; mode?: ListSelectionMode }): ListRowKind {
  if (checked !== undefined) return "switch";
  if (selected !== undefined && (pressable || !!href)) return mode === "multiple" ? "checkbox" : "radio";
  if (href) return "link";
  return pressable ? "button" : "static";
}

/**
 * What a row draws at its end for its choice: a mark (an empty ring or box, filled when chosen) in an open section or a
 * multiple-choice list, so every choice shows it can be picked; otherwise a check on the chosen row only.
 */
export function listRowEnd({ kind, selected, mode, open }: { kind: ListRowKind; selected?: boolean; mode: ListSelectionMode; open: boolean }) {
  if ((kind === "radio" || kind === "checkbox") && (open || mode === "multiple")) return "mark" as const;
  return selected ? "check" as const : null;
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
export function warnListRowProps({ checked, selected, href, chevron, deviceLink, looseChoice }: { checked?: boolean; selected?: boolean; href?: string; chevron?: boolean; deviceLink?: boolean; looseChoice?: boolean }) {
  if (!developmentMode()) return;
  warnOnce("device-link", deviceLink, "href only navigates on the web; on a device pass onPress and navigate with the app's router.");
  warnOnce("switch", checked !== undefined && (href || selected !== undefined || chevron), "a switch row (checked) ignores href, selected and chevron; give each row one role.");
  warnOnce("choice-link", checked === undefined && selected !== undefined && href, "a choice row (selected) is a button and ignores href; navigate in the press handler instead.");
  warnOnce("loose-choice", looseChoice, "a choice row (selected) is outside a section with selectionMode; set selectionMode on its KjunListSection so the rows read as one group.");
}

/** Development warning, once: an open section draws no dividers, so an explicit `divider` does nothing there. */
export function warnListSectionProps({ open, divider }: { open: boolean; divider?: boolean }) {
  if (!developmentMode()) return;
  warnOnce("open-divider", open && divider === true, "divider has no effect in an open section; open rows are set apart by space. Use the default variant for divided rows.", "ListSection");
}

export type ListSectionCorner = "none" | "sm" | "md" | "lg" | "xl";
export type ListGroupVariant = "inset" | "flush" | "open";
export type ListSectionVariant = "default" | "open";
/**
 * How a section draws, the same on every platform: whether it is open (rows on the page with no card or dividers; the
 * section's variant, or the KjunListGroup's), its card corner (the group's when unset; none when open), whether its title
 * is the small label (a title without a description, unless titleVariant says otherwise) and whether its rows form a card
 * with the heading and footer outside it.
 */
export function listSectionShape<R extends ListSectionCorner>({ radius, group, variant, title, description, titleVariant }: {
  radius?: R; group?: ListGroupVariant | null; variant?: ListSectionVariant; title?: string; description?: string; titleVariant?: "title" | "label";
}) {
  const open = (variant ?? (group === "open" ? "open" : "default")) === "open";
  const corner: R | "lg" | "none" = open ? "none" : radius ?? (group === "inset" ? "lg" : "none");
  const bare = !!title && (titleVariant ? titleVariant === "label" : !description);
  return { open, corner, bare, outside: corner !== "none" };
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
