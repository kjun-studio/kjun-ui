import { defineComponent, inject, onBeforeUnmount, onMounted, onUpdated, provide, shallowRef, watch, type PropType } from "vue";
import type { KjunIconRegistry } from "@kjun-ui/icons";
import { createPortalScope } from "../../../shared/package-runtime/portal-scope";
import { validateKjunCssScope } from "../../../shared/package-runtime/css-contract";
import { provideIcons } from "./runtime/icons";
import { kjunPortalKey } from "./runtime/keys";

export const KjunProvider = defineComponent({
  name: "KjunProvider",
  props: {
    icons: { type: Object as PropType<KjunIconRegistry>, default: undefined },
  },
  setup(props, { slots }) {
    provideIcons(() => props.icons);
    // undefined: the outermost Provider, which hosts the layer portal itself.
    const parentPortal = inject(kjunPortalKey, undefined);
    const portal = shallowRef<HTMLElement | null>(null);
    provide(kjunPortalKey, portal);
    const container = shallowRef<HTMLDivElement | null>(null);
    let destroyScope: (() => void) | undefined;
    onMounted(() => {
      if (!parentPortal) return;
      // A nested Provider's overlays render beside its ancestors' windows with this scope's variables.
      watch(parentPortal, parent => {
        destroyScope?.();
        destroyScope = undefined;
        portal.value = null;
        if (!parent || !container.value) return;
        const scope = createPortalScope(container.value, parent);
        portal.value = scope.element;
        destroyScope = scope.destroy;
      }, { immediate: true });
    });
    onBeforeUnmount(() => destroyScope?.());
    const validate = () => { if (container.value) validateKjunCssScope(container.value); };
    onMounted(validate);
    onUpdated(validate);
    return () => (
      <div ref={container} class="kjun-scope">
        {slots.default?.()}
        {parentPortal === undefined && <div ref={el => { portal.value = el as HTMLElement | null; }} data-kjun-layer-host="" />}
      </div>
    );
  },
});
