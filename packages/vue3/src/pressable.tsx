import { mergeProps, type ExtractPublicPropTypes, type PropType, type SlotsType, type VNodeChild } from "vue";
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
// An app listener given as an attribute: one function or, after Vue merges duplicates, several.
const call = (listener: unknown, event: KeyboardEvent) => {
  for (const one of Array.isArray(listener) ? listener : [listener]) if (typeof one === "function") one(event);
};
export const KjunPressable = defineComponent({
  name: "KjunPressable",
  // Attributes are placed by hand so the app's own key listeners run first and disabled always wins over its tabindex, as in React.
  inheritAttrs: false,
  props: kjunPressableProps,
  emits: { click: (_event: MouseEvent) => true },
  slots: Object as SlotsType<{ default?: () => VNodeChild }>,
  setup(props, { slots, emit, attrs }) {
    // Like a native button: Enter presses once on keydown (a held key does not repeat), Space presses on release.
    const key = (event: KeyboardEvent, up: boolean) => {
      call(attrs[up ? "onKeyup" : "onKeydown"], event);
      if (event.defaultPrevented || props.disabled || event.target !== event.currentTarget || (event.key !== " " && (up || event.key !== "Enter"))) return;
      event.preventDefault();
      if (up ? event.key === " " : event.key === "Enter" && !event.repeat) (event.currentTarget as HTMLElement).click();
    };
    return () => {
      const { tabindex, onKeydown: _down, onKeyup: _up, ...rest } = attrs;
      return <div {...mergeProps({ role: "button", class: "kjun-pressable" }, rest, {
        tabindex: props.disabled ? -1 : tabindex ?? 0,
        "aria-label": props.ariaLabel ?? rest["aria-label"], "aria-disabled": props.disabled || undefined,
        "data-press-effect": props.pressEffect === "none" ? "none" : undefined, "data-focus-inset": props.focusRingInset ? "" : undefined,
        onClick: (event: MouseEvent) => { if (!props.disabled) emit("click", event); },
        onKeydown: (event: KeyboardEvent) => key(event, false), onKeyup: (event: KeyboardEvent) => key(event, true),
      })}>{slots.default?.()}</div>;
    };
  },
});
