import type { TypographyRole } from "@kjun-ui/tokens";

export type AvatarSize = "xs" | "sm" | "md" | "lg" | "xl";
/** The type role an avatar's initial (and AvatarGroup's short overflow count) draws at; Web CSS sets the same steps in extensions.css. */
export const avatarType = { xs: "controlSmall", sm: "control", md: "input", lg: "numberLg", xl: "pageTitle" } as const satisfies Record<AvatarSize, TypographyRole>;
/** One step down, for AvatarGroup overflow text of three or more characters. */
export const avatarCompactType = { xs: "controlSmall", sm: "controlSmall", md: "control", lg: "input", xl: "numberLg" } as const satisfies Record<AvatarSize, TypographyRole>;
