// Destination badges shared by BottomNavigation and FloatingNavigation.
// true draws a dot; a number over the maximum shows "99+" while the accessible name keeps the real count.
export type NavigationBadge = string | number | boolean;
export const navigationBadgeMaximum = 99;

export function navigationBadge(badge: NavigationBadge | null | undefined) {
  if (badge == null || badge === false) return null;
  if (badge === true) return { dot: true, text: "" };
  return { dot: false, text: typeof badge === "number" && badge > navigationBadgeMaximum ? navigationBadgeMaximum + "+" : String(badge) };
}

export function navigationLabel(label: string, badge: NavigationBadge | null | undefined, newContent: string) {
  if (badge == null || badge === false) return label;
  return label + ", " + (badge === true ? newContent : badge);
}
