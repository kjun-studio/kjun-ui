import { useKjunMessages } from "./runtime/messages";
import { ref, type ExtractPublicPropTypes, type PropType } from "vue";
import { defineComponent } from "./runtime/component";
import { chipSize } from "../../../shared/package-runtime/chip-size";
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
const KjunChipComponent = defineComponent({
  name: "KjunChip",
  props: kjunChipProps,
  emits: { remove: () => true },
  setup(props, { emit, expose }) {
    const m = useKjunMessages();
    // Like Input, the chip exposes its only focus target: the removal button, null when the chip is not removable.
    const remove = ref<HTMLButtonElement | null>(null);
    expose({ focus: () => remove.value?.focus(), el: remove });
    return () => {
      const size = chipSize(props.size);
      return (
      <span class="kjun-chip" data-size={size} data-disabled={String(props.disabled)} data-removable={String(props.removable)}
        aria-disabled={props.disabled && !props.removable ? "true" : undefined}>
        {props.icon && <KjunIcon name={props.icon} size={tokens.extensions.chip.iconSizes[size]} />}
        <span title={props.label}>{props.label}</span>
        {props.removable && (
          <button ref={remove} type="button" aria-label={props.removeLabel || m.value.remove(props.label)} disabled={props.disabled} onClick={() => emit("remove")}>
            <KjunIcon name="x" size={tokens.extensions.chip.removeIconSizes[size]} />
          </button>
        )}
      </span>
      );
    };
  },
});

// Make the expose() contract visible to template refs; Vue unwraps el there.
export const KjunChip = KjunChipComponent as typeof KjunChipComponent & {
  new(): InstanceType<typeof KjunChipComponent> & { focus(): void; el: HTMLButtonElement | null };
};
