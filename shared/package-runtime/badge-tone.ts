import { tokens } from "@kjun-ui/tokens";

type BadgeSize = keyof typeof tokens.extensions.badge.padding;

export type BadgeVariant = "default" | "secondary" | "primary" | "success" | "warning" | "danger" | "info" | "price-up" | "price-down";

export interface BadgeToneRoles { bg: string; text: string; dot: string }

/** Color roles a badge paints: the tone's subtle fill, its darker text and its accent dot. */
export function badgeToneRoles(variant: BadgeVariant): BadgeToneRoles {
  if (variant === "default" || variant === "secondary") return { bg: "secondary", text: "text-secondary", dot: "text-tertiary" };
  if (variant === "primary") return { bg: "brand-subtle-bg", text: "brand", dot: "brand" };
  // Price colors are domain colors with no dark/accent pair; the dot follows the text.
  if (variant === "price-up" || variant === "price-down") return { bg: variant + "-bg", text: variant, dot: variant };
  return { bg: variant + "-bg", text: variant + "-dark", dot: variant + "-accent" };
}

/** Size geometry shared by every platform: one type step, radius, gap and dot per size. */
export function badgeGeometry(size: BadgeSize) {
  const badge = tokens.extensions.badge;
  return { padding: badge.padding[size], radius: badge.radii[size], gap: badge.gaps[size], dotSize: badge.dotSizes[size],
    type: { ...badge.typography[size], fontWeight: badge.fontWeight } };
}
