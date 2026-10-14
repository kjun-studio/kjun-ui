import { computed, defineComponent, provide, type PropType } from "vue";
import type { ButtonSize } from "@kjun-ui/tokens";
import { kjunActionSizeKey } from "./keys";

/** Gives unsized buttons in its slot a default size, like React's ActionSizeContext provider. */
export const KjunActionSize = defineComponent({
  name: "KjunActionSize",
  props: { size: { type: String as PropType<ButtonSize>, required: true } },
  setup(props, { slots }) {
    provide(kjunActionSizeKey, computed(() => props.size));
    return () => slots.default?.();
  },
});
