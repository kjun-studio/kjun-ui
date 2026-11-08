import type { InjectionKey } from "vue";

/** Whether the enclosing KjunListSection is open, so a row skeleton in its loading slot draws the open row's shape. */
export const kjunListOpenKey: InjectionKey<{ readonly value: boolean }> = Symbol("kjunListOpen");
