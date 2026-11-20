/** Progress fill colours: primary takes the brand role, neutral the tertiary text role, other tones their own role. */
export type ProgressTone = "primary" | "success" | "warning" | "danger" | "info" | "neutral";
/** The KjunColors key a Native fill reads. */
export function progressColorKey(variant: ProgressTone) {
  return variant === "primary" ? "brand" : variant === "neutral" ? "textTertiary" : variant;
}
/** The web role name, read as var(--_kjun-color-<role>). */
export function progressColorRole(variant: ProgressTone) {
  return variant === "neutral" ? "text-tertiary" : progressColorKey(variant);
}
