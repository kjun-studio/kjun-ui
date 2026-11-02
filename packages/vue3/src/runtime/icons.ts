import { stableValue } from "../../../../shared/package-runtime/stable-value";
import { computed, inject, provide, shallowRef } from "vue";
import type { KjunIconRegistry } from "@kjun-ui/icons";
import { defaultIcons, mergeIcons, resolveIcon, withFallbackIcons } from "../../../../shared/package-runtime/icon-registry";
import { kjunIconsKey } from "./keys";

const registry = () => inject(kjunIconsKey, shallowRef(defaultIcons));

export function provideIcons(icons: () => KjunIconRegistry | undefined) {
  const parent = registry(), stable = stableValue<KjunIconRegistry | undefined>();
  let last: { parent: KjunIconRegistry; own: KjunIconRegistry | undefined; merged: KjunIconRegistry } | undefined;
  provide(kjunIconsKey, computed(() => {
    const inherited = parent.value, own = stable(icons());
    if (!last || last.parent !== inherited || last.own !== own) last = { parent: inherited, own, merged: mergeIcons(inherited, own) };
    return last.merged;
  }));
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
