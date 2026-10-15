import { defineComponent, ref, watch, type ExtractPublicPropTypes, type PropType, type SlotsType, type VNodeChild } from "vue";
import { tokens } from "@kjun-ui/tokens";
import { KjunIcon } from "./button";
import { css } from "./runtime/style";

const kjunImageProps = {
  src: { type: String, default: undefined },
  alt: { type: String, required: true },
  decorative: { type: Boolean, default: false },
  aspectRatio: { type: Number, default: 1 },
  fit: { type: String as PropType<"cover" | "contain">, default: "cover" },
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
    watch(() => props.src, () => { version.value++; state.value = "loading"; });
    return () => {
      const current = version.value;
      const failed = !props.src || state.value === "error";
      const settle = (next: "loaded" | "error") => {
        if (version.value !== current) return;
        state.value = next;
        if (next === "loaded") emit("load"); else emit("error");
      };
      return (
        <span class="kjun-image" style={{ aspectRatio: props.aspectRatio > 0 ? props.aspectRatio : 1 }} data-state={failed ? "error" : state.value}>
          {!failed && <img key={current} src={props.src} alt={props.decorative ? "" : props.alt} loading={props.lazy ? "lazy" : "eager"}
            style={{ objectFit: props.fit }} onLoad={() => settle("loaded")} onError={() => settle("error")} />}
          {failed && (
            <span class="kjun-image-fallback" role={props.decorative ? undefined : "img"} aria-label={props.decorative ? undefined : props.alt}
              aria-hidden={props.decorative ? "true" : undefined}>
              {slots.fallback ? slots.fallback() : <KjunIcon name="image" size={tokens.extensions.image.fallbackIconSize} />}
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
  size: { type: String as PropType<"sm" | "md" | "lg">, default: "md" },
  shape: { type: String as PropType<"circle" | "square">, default: "circle" },
} as const;
export type KjunAvatarProps = ExtractPublicPropTypes<typeof kjunAvatarProps>;
/** Slot: fallback (defaults to the name's first character or a user icon). */
export const KjunAvatar = defineComponent({
  name: "KjunAvatar",
  props: kjunAvatarProps,
  emits: { load: () => true, error: () => true },
  slots: Object as SlotsType<{ fallback?: () => VNodeChild }>,
  setup(props, { slots, emit }) {
    return () => {
      const initial = Array.from(props.name.trim())[0];
      return (
        <span class="kjun-avatar" data-shape={props.shape} data-size={props.size}
          style={css({ width: tokens.extensions.avatar[props.size], height: tokens.extensions.avatar[props.size] })}>
          <KjunImage src={props.src} alt={props.alt || props.name || "사용자"} decorative={props.decorative}
            onLoad={() => emit("load")} onError={() => emit("error")}>
            {{ fallback: () => slots.fallback ? slots.fallback()
              : initial || <KjunIcon name="user" size={tokens.extensions.avatar.fallbackIconSizes[props.size]} /> }}
          </KjunImage>
        </span>
      );
    };
  },
});
