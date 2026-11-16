import { computed, provide, type PropType } from "vue";
import { defineComponent } from "./component";
import type { ButtonSize } from "@kjun-ui/tokens";
import { kjunActionShapeKey, kjunActionSizeKey } from "./keys";

/** Gives unsized buttons in its slot a default size, like React's ActionSizeContext provider. */
export const KjunActionSize = defineComponent({
  name: "KjunActionSize",
  props: { size: { type: String as PropType<ButtonSize>, required: true }, /** "pill" rounds the buttons in its slot into pills. */ shape: { type: String as PropType<"pill">, default: undefined } },
  setup(props, { slots }) {
    provide(kjunActionSizeKey, computed(() => props.size));
    provide(kjunActionShapeKey, computed(() => props.shape ?? null));
    return () => slots.default?.();
  },
});
