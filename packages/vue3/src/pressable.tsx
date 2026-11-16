import { type ExtractPublicPropTypes, type PropType, type SlotsType, type VNodeChild } from "vue";
import { defineComponent } from "./runtime/component";

const kjunPressableProps = {
  /** The name read by screen readers; needed when the content has no text of its own. */
  ariaLabel: { type: String, default: undefined },
  /** Blocks presses and dims the content. */
  disabled: { type: Boolean, default: false },
  /** "overlay" (default) lays a tint over the content on hover and press, which shows on photos as well as on text; "none" leaves the content to show its own. */
  pressEffect: { type: String as PropType<"overlay" | "none">, default: "overlay" },
  /** Draws the keyboard focus ring inside the area, for one that reaches the screen edge or sits in a clipping parent. */
  focusRingInset: { type: Boolean, default: false },
} as const;
export type KjunPressableProps = ExtractPublicPropTypes<typeof kjunPressableProps>;
/**
 * An area that presses, with no shape of its own: for content that is not a button, a card or a list row
 * (a map preview, a photo tile). The app gives the shape through class or style; KJUN supplies the press layer,
 * the focus ring, the button role and the disabled state. Do not put buttons or links inside. Event: click.
 */
export const KjunPressable = defineComponent({
  name: "KjunPressable",
  props: kjunPressableProps,
  emits: { click: (_event: MouseEvent) => true },
  slots: Object as SlotsType<{ default?: () => VNodeChild }>,
  setup(props, { slots, emit }) {
    // Like a native button: Enter presses once on keydown (a held key does not repeat), Space presses on release.
    const key = (event: KeyboardEvent, up: boolean) => {
      if (event.defaultPrevented || props.disabled || event.target !== event.currentTarget || (event.key !== " " && (up || event.key !== "Enter"))) return;
      event.preventDefault();
      if (up ? event.key === " " : event.key === "Enter" && !event.repeat) (event.currentTarget as HTMLElement).click();
    };
    return () => <div role="button" class="kjun-pressable" tabindex={props.disabled ? -1 : 0} aria-label={props.ariaLabel} aria-disabled={props.disabled || undefined}
      data-press-effect={props.pressEffect === "none" ? "none" : undefined} data-focus-inset={props.focusRingInset ? "" : undefined}
      onClick={(event: MouseEvent) => { if (!props.disabled) emit("click", event); }}
      onKeydown={(event: KeyboardEvent) => key(event, false)} onKeyup={(event: KeyboardEvent) => key(event, true)}>{slots.default?.()}</div>;
  },
});
