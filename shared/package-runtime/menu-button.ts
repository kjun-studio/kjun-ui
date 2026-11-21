// The MenuButton trigger's icons, shared by every platform.
/** The icon before the label: the app's icon, or dots-vertical when only an icon shows. */
export function menuButtonIcon(icon: string | undefined, compact: boolean, label: unknown) {
  return icon || (compact || !label ? "dots-vertical" : undefined);
}
/** The chevron after a visible label; it turns up while the menu is open. */
export function menuButtonChevron(chevron: boolean, compact: boolean, label: unknown, open: boolean) {
  return chevron && !compact && label ? open ? "chevron-up" : "chevron-down" : undefined;
}
