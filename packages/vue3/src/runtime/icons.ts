import { computed, inject, provide, shallowRef } from "vue";
import type { KjunIconRegistry } from "@kjun-ui/icons";
import { defaultIcons, mergeIcons, resolveIcon, withFallbackIcons } from "../../../../shared/package-runtime/icon-registry";
import { kjunIconsKey } from "./keys";

const registry = () => inject(kjunIconsKey, shallowRef(defaultIcons));

export function provideIcons(icons: () => KjunIconRegistry | undefined) {
  const parent = registry();
  provide(kjunIconsKey, computed(() => mergeIcons(parent.value, icons())));
}

/** Adds component-owned icons without overriding a project's registration. */
export function provideFallbackIcons(icons: KjunIconRegistry) {
  const parent = registry();
  provide(kjunIconsKey, computed(() => withFallbackIcons(parent.value, icons)));
}

export function useIcon(name: () => string, filled: () => boolean) {
  const icons = registry();
  return computed(() => resolveIcon(icons.value, name(), filled()));
}
