import type { InjectionKey, Ref } from "vue";
import type { KjunIconRegistry } from "@kjun-ui/icons";
import type { ButtonSize } from "@kjun-ui/tokens";
import type { KjunMessageScope } from "../../../../shared/package-runtime/messages";

// Symbol keys cannot meet an app's own provide() names.
export const kjunIconsKey: InjectionKey<Readonly<Ref<KjunIconRegistry>>> = Symbol("kjunIcons");
// undefined (not provided) uses document.body; null waits for a mounting scope.
export const kjunPortalKey: InjectionKey<Readonly<Ref<HTMLElement | null>>> = Symbol("kjunPortal");
/** A container's default size for buttons that leave `size` unset; an explicit size always wins. */
export const kjunActionSizeKey: InjectionKey<Readonly<Ref<ButtonSize | null>>> = Symbol("kjunActionSize");
// Internal slot geometry; consuming applications still choose button variants.
export const kjunTopNavigationKey: InjectionKey<{ controlSize: number; iconSize: number } | null> =
  Symbol("kjunTopNavigation");
/** KjunProvider locale/messages resolved against any outer Provider. */
export const kjunMessagesKey: InjectionKey<Readonly<Ref<KjunMessageScope>>> = Symbol("kjunMessages");
