// Destination and count badges shared by BottomNavigation, FloatingNavigation, Tabs and Badge.
// true draws a dot; a number over the maximum shows "99+" while the accessible name keeps the real count.
// "" and NaN draw no badge (an empty pill reads as noise); 0 stays visible, as the documented contract promises.
export type NavigationBadge = string | number | boolean;
export const navigationBadgeMaximum = 99;

const empty = (badge: NavigationBadge | null | undefined) =>
  badge == null || badge === false || badge === "" || (typeof badge === "number" && Number.isNaN(badge));

/** The text a count badge shows, or null when there is nothing to count. */
export function badgeCount(count: number | null | undefined, max = navigationBadgeMaximum) {
  if (typeof count !== "number" || !(count > 0)) return null;
  return count > max ? max + "+" : String(count);
}

export function navigationBadge(badge: NavigationBadge | null | undefined, max = navigationBadgeMaximum) {
  if (empty(badge)) return null;
  if (badge === true) return { dot: true, text: "" };
  return { dot: false, text: typeof badge === "number" ? (badge > max ? max + "+" : String(badge)) : String(badge) };
}

/** What a badge says to a screen reader: "new" for a dot, the full count for a number, or its text; "" for none. */
export function badgeSpoken(badge: NavigationBadge | null | undefined, newContent: string, newCount?: (count: number) => string) {
  if (empty(badge)) return "";
  return badge === true ? newContent : typeof badge === "number" && newCount ? newCount(badge) : String(badge);
}
/** The destination's accessible name: its label, then what its badge says. */
export function navigationLabel(label: string, badge: NavigationBadge | null | undefined, newContent: string, newCount?: (count: number) => string) {
  const spoken = badgeSpoken(badge, newContent, newCount);
  return spoken ? label + ", " + spoken : label;
}
