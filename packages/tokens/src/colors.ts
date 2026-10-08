import { coreColorRoles, colorRoles, colorRoleFallbacks } from "./color-roles";
export type { CoreColorRole, ColorRole, DomainColorRole } from "./color-roles";
import type { CoreColorRole, ColorRole, DomainColorRole } from "./color-roles";

export type OptionalColorRole = Exclude<ColorRole, CoreColorRole>;
export type KjunCoreColors<Color = string> = Readonly<Record<CoreColorRole, Color>>;
export type KjunColors<Color = string> = KjunCoreColors<Color> & Readonly<Partial<Record<OptionalColorRole, Color>>>;
export type ResolvedKjunColors<Color = string> = Readonly<Record<ColorRole, Color>>;
export type KjunDomainColors<Color = string> = Readonly<Record<DomainColorRole, Color>>;

/** Resolves role aliases using only app-supplied values, retaining native ColorValue objects. */
export function resolveKjunColors<Color>(colors: KjunColors<Color>): ResolvedKjunColors<Color> {
  const missing = coreColorRoles.filter(role => colors?.[role] == null || colors[role] === "");
  if (missing.length) throw Error("Missing KJUN colors: " + missing.join(", "));
  const resolved: Partial<Record<ColorRole, Color>> = {};
  const resolve = (role: ColorRole): Color => {
    const supplied = colors[role];
    if (supplied != null && supplied !== "") return supplied;
    const fallback = colorRoleFallbacks[role as OptionalColorRole];
    return resolved[role] ??= resolve(fallback);
  };
  for (const role of colorRoles) resolved[role] = resolve(role);
  return resolved as ResolvedKjunColors<Color>;
}
