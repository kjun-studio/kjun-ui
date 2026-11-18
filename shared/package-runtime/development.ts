/** True in a development build, where KJUN warns about misuse; bundlers replace NODE_ENV, and without it this is false. */
export function developmentMode() {
  try { return !!process.env.NODE_ENV && process.env.NODE_ENV !== "production"; } catch { return false; }
}
/** The warning for a FAB with neither a label nor an accessible name, or "" when it has one. */
export function fabNameWarning(label: unknown, ariaLabel: unknown) {
  return (typeof label === "string" && label.trim()) || (typeof ariaLabel === "string" && ariaLabel.trim())
    ? "" : "[KJUN] KjunFab needs a label or ariaLabel: an icon alone gives the button no name.";
}
