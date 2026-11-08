// What a list row is, shared by every platform. A switch row (checked given) wins over href and onClick; a row given
// `selected` (true or false) is one choice in a single-choice list and reads as a radio.
export type ListRowKind = "switch" | "radio" | "link" | "button" | "static";
export function listRowKind({ checked, selected, href, pressable }: { checked?: boolean; selected?: boolean; href?: string; pressable: boolean }): ListRowKind {
  if (checked !== undefined) return "switch";
  if (selected !== undefined && (pressable || !!href)) return "radio";
  if (href) return "link";
  return pressable ? "button" : "static";
}

const developmentMode = () => { try { return !!process.env.NODE_ENV && process.env.NODE_ENV !== "production"; } catch { return false; } };
let warned = false;
let warnedDeviceLink = false;
/**
 * One development warning when a row is given props that cannot apply together. `deviceLink` (Native on a device: an
 * href with no onPress) warns that the row reads as a link but has nowhere to go, since only the web follows href.
 */
export function warnListRowProps({ checked, selected, href, chevron, deviceLink }: { checked?: boolean; selected?: boolean; href?: string; chevron?: boolean; deviceLink?: boolean }) {
  if (!developmentMode()) return;
  if (deviceLink && !warnedDeviceLink) {
    warnedDeviceLink = true;
    console.warn("KJUN ListRow: href only navigates on the web; on a device pass onPress and navigate with the app's router.");
  }
  const clash = checked !== undefined && (href || selected !== undefined || chevron);
  if (warned || !clash) return;
  warned = true;
  console.warn("KJUN ListRow: a switch row (checked) ignores href, selected and chevron; give each row one role.");
}

export type ListSectionCorner = "none" | "sm" | "md" | "lg" | "xl";
/**
 * How a section draws, the same on every platform: its card corner (the KjunListGroup's when unset), whether its title is
 * the small label (a title without a description, unless titleVariant says otherwise) and whether its rows form a card
 * with the heading and footer outside it.
 */
export function listSectionShape<R extends ListSectionCorner>({ radius, group, title, description, titleVariant }: {
  radius?: R; group?: "inset" | "flush" | null; title?: string; description?: string; titleVariant?: "title" | "label";
}) {
  const corner: R | "lg" | "none" = radius ?? (group === "inset" ? "lg" : "none");
  const bare = !!title && (titleVariant ? titleVariant === "label" : !description);
  return { corner, bare, outside: corner !== "none" };
}
