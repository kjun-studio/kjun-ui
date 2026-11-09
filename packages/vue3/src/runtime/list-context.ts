import type { InjectionKey } from "vue";

/**
 * The enclosing KjunListSection's shape: whether it is open and compact, so its rows and a row skeleton in its loading
 * slot draw the same row (open rows' larger lines, compact rows' height).
 */
export const kjunListShapeKey: InjectionKey<{ readonly value: { open: boolean; compact: boolean } }> = Symbol("kjunListShape");
