// Pressable cards and rows render as one button; controls inside them are unreachable for assistive technology.
const interactive = 'button, a[href], input, select, textarea, [tabindex]:not([tabindex="-1"])';
function developmentMode() {
  try { return !!process.env.NODE_ENV && process.env.NODE_ENV !== "production"; } catch { return false; }
}
/** Development only: warns once per call when `root` holds a control. */
export function warnNestedControls(root: Element | null | undefined, message: string) {
  if (developmentMode() && root?.querySelector(interactive)) console.warn(message);
}
/** Whether a click on a clickable row or card started on a control inside it (a button, link or field), which acts on its
 * own, or came from outside the row's DOM (React bubbles portal events, such as a popover opened from a cell). The row
 * then leaves the click alone. Controls do not stop clicks from bubbling, so page-level listeners still see them. */
export function fromNestedControl(event: { target: EventTarget | null; currentTarget: EventTarget | null }) {
  const target = event.target as Element | null, row = event.currentTarget as Element | null;
  if (!target || !row) return false;
  if (!row.contains(target)) return true;
  const control = target.closest?.(interactive);
  return !!control && control !== row;
}
