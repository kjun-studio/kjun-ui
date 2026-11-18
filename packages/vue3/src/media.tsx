import { useKjunMessages } from "./runtime/messages";
import { Text, ref, watch, type ExtractPublicPropTypes, type PropType, type SlotsType, type VNode, type VNodeChild } from "vue";
import { defineComponent } from "./runtime/component";
import { tokens } from "@kjun-ui/tokens";
import { KjunIcon } from "./button";
import { css } from "./runtime/style";

const kjunImageProps = {
  src: { type: String, default: undefined },
  alt: { type: String, required: true },
  decorative: { type: Boolean, default: false },
  /** Width ÷ height; "auto" lets the loaded image set the height (a missing or failed image stays square). */
  aspectRatio: { type: [Number, String] as PropType<number | "auto">, default: 1 },
  fit: { type: String as PropType<"cover" | "contain">, default: "cover" },
  /** square (default), rounded corners, or a circle. */
  shape: { type: String as PropType<"square" | "rounded" | "circle">, default: "square" },
  lazy: { type: Boolean, default: true },
} as const;
export type KjunImageProps = ExtractPublicPropTypes<typeof kjunImageProps>;
/** Slot: fallback (shown while there is no source or after a load error). */
export const KjunImage = defineComponent({
  name: "KjunImage",
  props: kjunImageProps,
  emits: { load: () => true, error: () => true },
  slots: Object as SlotsType<{ fallback?: () => VNodeChild }>,
  setup(props, { slots, emit }) {
    // A late event from a previous source must not change the current one.
    const version = ref(0), state = ref<"loading" | "loaded" | "error">("loading");
    // The version whose result is already reported, so a load event after the complete check below does not repeat it.
    let settled = -1;
    watch(() => props.src, () => { version.value++; state.value = "loading"; });
    return () => {
      const current = version.value;
      const failed = !props.src || state.value === "error";
      const auto = props.aspectRatio === "auto";
      const ratio = auto ? (failed ? 1 : undefined) : Number(props.aspectRatio) > 0 ? Number(props.aspectRatio) : 1;
      const settle = (next: "loaded" | "error") => {
        if (version.value !== current || settled === current) return;
        settled = current;
        state.value = next;
        if (next === "loaded") emit("load"); else emit("error");
      };
      // An image the browser finished before Vue attached its handlers (server-rendered pages) sends no load event.
      const seen = (img: unknown) => {
        if (img instanceof HTMLImageElement && img.complete && settled !== current) queueMicrotask(() => settle(img.naturalWidth > 0 ? "loaded" : "error"));
      };
      // A text fallback is drawn as a caption under the photo icon (only the icon when the image is narrow).
      const custom = failed ? slots.fallback?.() as VNode[] | undefined : undefined;
      const textual = !!custom?.length && custom.every(node => node.type === Text);
      return (
        <span class="kjun-image" style={{ aspectRatio: ratio }} data-state={failed ? "error" : state.value}
          data-shape={props.shape === "square" ? undefined : props.shape} data-ratio={auto ? "auto" : undefined} data-fallback={failed && textual ? "text" : undefined}>
          {!failed && <img key={current} ref={seen} src={props.src} alt={props.decorative ? "" : props.alt} loading={props.lazy ? "lazy" : "eager"}
            style={{ objectFit: props.fit }} onLoad={() => settle("loaded")} onError={() => settle("error")} />}
          {failed && (
            <span class="kjun-image-fallback" data-text={textual ? "" : undefined} role={props.decorative ? undefined : "img"} aria-label={props.decorative ? undefined : props.alt}
              aria-hidden={props.decorative ? "true" : undefined}>
              {textual ? [<KjunIcon name="photo" size={tokens.extensions.image.fallbackIconSize} />, <span class="kjun-image-fallback-text">{custom}</span>]
                : custom ?? <KjunIcon name="photo" size={tokens.extensions.image.fallbackIconSize} />}
            </span>
          )}
        </span>
      );
    };
  },
});

const kjunAvatarProps = {
  src: { type: String, default: undefined },
  name: { type: String, default: "" },
  alt: { type: String, default: undefined },
  decorative: { type: Boolean, default: false },
  size: { type: String as PropType<"xs" | "sm" | "md" | "lg" | "xl">, default: "md" },
  shape: { type: String as PropType<"circle" | "square">, default: "circle" },
  color: { type: String, default: undefined },
  textColor: { type: String, default: undefined },
} as const;
export type KjunAvatarProps = ExtractPublicPropTypes<typeof kjunAvatarProps>;
/** Slot: fallback (defaults to the name's first character or a user icon). */
export const KjunAvatar = defineComponent({
  name: "KjunAvatar",
  props: kjunAvatarProps,
  emits: { load: () => true, error: () => true },
  slots: Object as SlotsType<{ fallback?: () => VNodeChild }>,
  setup(props, { slots, emit }) {
    const m = useKjunMessages();
    return () => {
      const initial = Array.from(props.name.trim())[0];
      // The fallback goes in a span, so the image does not treat initials as a text caption.
      return (
        <span class="kjun-avatar" data-shape={props.shape} data-size={props.size}
          style={css({ width: tokens.extensions.avatar[props.size], height: tokens.extensions.avatar[props.size], "--_kjun-avatar-color": props.color, "--_kjun-avatar-text-color": props.textColor })}>
          <KjunImage src={props.src} alt={props.alt || props.name || m.value.user} decorative={props.decorative}
            onLoad={() => emit("load")} onError={() => emit("error")}>
            {{ fallback: () => <span>{slots.fallback ? slots.fallback()
              : initial || <KjunIcon name="user" size={tokens.extensions.avatar.fallbackIconSizes[props.size]} />}</span> }}
          </KjunImage>
        </span>
      );
    };
  },
});
