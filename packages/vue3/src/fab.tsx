import { fabOffset } from "../../../shared/package-runtime/bottom-bar";
import { type ExtractPublicPropTypes, type PropType } from "vue";
import { defineComponent } from "./runtime/component";
import { tokens } from "@kjun-ui/tokens";
import { KjunIcon, useMinimumLoading } from "./button";

export type KjunFabSize = "sm" | "md";
const kjunFabProps = {
  icon: { type: String, required: true },
  /** Visible text beside the icon; the circle becomes a capsule of the same height. */
  label: { type: String, default: undefined },
  /** The accessible name. Required without a label, since the icon alone says nothing. */
  ariaLabel: { type: String, default: undefined },
  /** "md" (default) is 56, "sm" is 48. Both take a label, loading and every state. */
  size: { type: String as PropType<KjunFabSize>, default: "md" },
  /** Swaps the icon for a spinner and stops presses; the button keeps its colour. */
  loading: { type: Boolean, default: false },
  disabled: { type: Boolean, default: false },
  /** Stays above the bottom safe area from KjunProvider. */
  safeArea: { type: Boolean, default: true },
  /** Stays above the app's KjunBottomNavigation and KjunBottomActionBar; false where the bar is not under the FAB. */
  avoidBottomBar: { type: Boolean, default: true },
  /** Extra space below, in px. */
  offsetBottom: { type: Number, default: 0 },
} as const;
export type KjunFabProps = ExtractPublicPropTypes<typeof kjunFabProps>;
/** A primary action pinned to the bottom end of the viewport: a circle, or a capsule with a label. Emits click. */
export const KjunFab = defineComponent({
  name: "KjunFab",
  props: kjunFabProps,
  emits: { click: (_event: MouseEvent) => true },
  setup(props, { emit }) {
    const busy = useMinimumLoading(() => props.loading);
    return () => {
      const loading = busy.value, offset = fabOffset(props.offsetBottom), size = props.size === "sm" ? "sm" : "md";
      return (
        <button type="button" class="kjun-fab" data-size={size} data-label={props.label ? "" : undefined}
          data-safe-area={props.safeArea ? undefined : "false"} data-bottom-bar={props.avoidBottomBar ? undefined : "false"}
          aria-label={props.ariaLabel || undefined} aria-busy={loading ? "true" : undefined} disabled={props.disabled}
          onClick={(event: MouseEvent) => { if (!loading) emit("click", event); }}
          style={offset ? { "--_kjun-fab-offset": offset + "px" } : undefined}>
          <KjunIcon name={loading ? "loader-2" : props.icon} spin={loading} size={size === "sm" ? tokens.extensions.fab.smallIconSize : tokens.extensions.fab.iconSize} />
          {props.label && <span class="kjun-fab-label">{props.label}</span>}
        </button>
      );
    };
  },
});
