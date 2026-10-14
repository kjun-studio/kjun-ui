import { computed, defineComponent, inject, watch, onBeforeUnmount, type InjectionKey, type Ref, type VNodeChild } from "vue";
import { useKjunId } from "./input";
import { kjunLayerScopeKey, useLayerContext } from "./runtime/layers";

export interface FeedbackOverlayHost {
  top: Readonly<Ref<string | undefined>>;
  register: (id: string, order: number) => () => void;
  render: () => VNodeChild;
}
export const kjunFeedbackOverlayKey: InjectionKey<FeedbackOverlayHost> = Symbol("kjunFeedbackOverlay");

/** Keeps actionable toast content in the active dialog's focus and accessibility scope. */
export const FeedbackLayerOutlet = defineComponent({
  name: "KjunFeedbackLayerOutlet",
  setup() {
    const { state, version } = useLayerContext();
    const scope = inject(kjunLayerScopeKey, undefined);
    const host = inject(kjunFeedbackOverlayKey, null);
    const id = useKjunId("kjun-");
    const placement = computed(() => {
      void version.value;
      const entry = scope ? state.entries.get(scope) : undefined;
      return { active: !!entry && state.isActive(entry.id), order: entry?.order ?? 0 };
    });
    let unregister: (() => void) | undefined;
    // A retained window can become active again without mounting a new outlet.
    watch(placement, ({ active, order }) => {
      unregister?.(); unregister = undefined;
      if (active && host) unregister = host.register(id, order);
    }, { immediate: true });
    onBeforeUnmount(() => unregister?.());
    return () => host?.top.value === id ? host.render() : null;
  },
});
