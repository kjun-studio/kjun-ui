import { useKjunMessages } from "./runtime/messages";
import { defineComponent, type ExtractPublicPropTypes, type PropType } from "vue";
import { tokens } from "@kjun-ui/tokens";
import { KjunIcon } from "./button";

const kjunChipProps = {
  label: { type: String, required: true },
  icon: { type: String, default: undefined },
  removable: { type: Boolean, default: false },
  disabled: { type: Boolean, default: false },
  size: { type: String as PropType<"sm" | "md" | "lg">, default: "md" },
  removeLabel: { type: String, default: undefined },
} as const;
export type KjunChipProps = ExtractPublicPropTypes<typeof kjunChipProps>;
export const KjunChip = defineComponent({
  name: "KjunChip",
  props: kjunChipProps,
  emits: { remove: () => true },
  setup(props, { emit }) {
    const m = useKjunMessages();
    return () => (
      <span class="kjun-chip" data-size={props.size} data-disabled={String(props.disabled)} data-removable={String(props.removable)}>
        {props.icon && <KjunIcon name={props.icon} size={tokens.extensions.chip.iconSizes[props.size]} />}
        <span>{props.label}</span>
        {props.removable && (
          <button type="button" aria-label={props.removeLabel || m.value.remove(props.label)} disabled={props.disabled} onClick={() => emit("remove")}>
            <KjunIcon name="x" size={tokens.extensions.chip.removeIconSizes[props.size]} />
          </button>
        )}
      </span>
    );
  },
});
