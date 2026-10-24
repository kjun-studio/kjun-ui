// Pressable cards and rows render as one button; controls inside them are unreachable for assistive technology.
const interactive = 'button, a[href], input, select, textarea, [tabindex]:not([tabindex="-1"])';
function developmentMode() {
  try { return !!process.env.NODE_ENV && process.env.NODE_ENV !== "production"; } catch { return false; }
}
/** Development only: warns once per call when `root` holds a control. */
export function warnNestedControls(root: Element | null | undefined, message: string) {
  if (developmentMode() && root?.querySelector(interactive)) console.warn(message);
}
