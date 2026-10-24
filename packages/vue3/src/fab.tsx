import { defineComponent, type ExtractPublicPropTypes } from "vue";
import { tokens } from "@kjun-ui/tokens";
import { KjunIcon } from "./button";
import { css } from "./runtime/style";

const kjunFabProps = {
  icon: { type: String, required: true },
  /** The FAB has no visible text, so it needs a name. */
  ariaLabel: { type: String, required: true },
  disabled: { type: Boolean, default: false },
  /** Bottom safe area (px) the FAB stays above. */
  safeAreaBottom: { type: Number, default: 0 },
  /** Extra space below, e.g. a bottom navigation's height. */
  offsetBottom: { type: Number, default: 0 },
} as const;
export type KjunFabProps = ExtractPublicPropTypes<typeof kjunFabProps>;
/** A round primary action pinned to the bottom end of the viewport. Emits click. */
export const KjunFab = defineComponent({
  name: "KjunFab",
  props: kjunFabProps,
  emits: { click: (_event: MouseEvent) => true },
  setup(props, { emit }) {
    return () => (
      <button type="button" class="kjun-fab" aria-label={props.ariaLabel} disabled={props.disabled} onClick={(event: MouseEvent) => emit("click", event)}
        style={css({ bottom: tokens.extensions.fab.inset + Math.max(0, props.safeAreaBottom) + Math.max(0, props.offsetBottom) })}>
        <KjunIcon name={props.icon} size={tokens.extensions.fab.iconSize} />
      </button>
    );
  },
});
