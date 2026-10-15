import { computed, defineComponent, h, inject, onBeforeUnmount, ref, watch, type ExtractPublicPropTypes, type PropType, type SlotsType, type VNodeChild } from "vue";
import { tokens, type ButtonSize, type ButtonVariant } from "@kjun-ui/tokens";
import { typeStyle } from "../../../shared/package-runtime/typography";
import { useIcon } from "./runtime/icons";
import { kjunActionSizeKey, kjunTopNavigationKey } from "./runtime/keys";
import { hasContent } from "./runtime/slots";
import { css } from "./runtime/style";

const kjunIconProps = {
  name: { type: String, required: true },
  size: { type: [Number, String] as PropType<number | string>, default: "1em" },
  spin: { type: Boolean, default: false },
  filled: { type: Boolean, default: false },
} as const;
export type KjunIconProps = ExtractPublicPropTypes<typeof kjunIconProps>;

export const KjunIcon = defineComponent({
  name: "KjunIcon",
  props: kjunIconProps,
  setup(props, { attrs }) {
    const icon = useIcon(() => props.name, () => props.filled);
    return () => {
      const { nodes, filled } = icon.value;
      const label = attrs["aria-label"];
      return (
        <svg
          width={props.size}
          height={props.size}
          viewBox="0 0 24 24"
          fill={filled ? "currentColor" : "none"}
          stroke={filled ? "none" : "currentColor"}
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
          aria-hidden={label ? undefined : "true"}
          role={label ? "img" : undefined}
          class={"kjun-icon " + (props.spin ? "kjun-spin" : "")}
        >
          {nodes.map(([tag, nodeAttrs], i) => h(tag, { ...nodeAttrs, key: i }))}
        </svg>
      );
    };
  },
});

/** Keeps a loading state visible for the token minimum so a fast request does not flash. */
export function useMinimumLoading(loading: () => boolean) {
  const active = ref(loading());
  let began = loading() ? Date.now() : 0;
  let timer: ReturnType<typeof setTimeout> | undefined;
  watch(loading, value => {
    clearTimeout(timer);
    if (value) { began = Date.now(); active.value = true; return; }
    timer = setTimeout(() => { active.value = false; }, Math.max(0, tokens.button.loadingMinimum - (Date.now() - began)));
  });
  onBeforeUnmount(() => clearTimeout(timer));
  return computed(() => loading() || active.value);
}

export function useActionSize(requested: () => ButtonSize | undefined, fallback: ButtonSize) {
  const inherited = inject(kjunActionSizeKey, null);
  return computed(() => requested() ?? inherited?.value ?? fallback);
}

const kjunButtonProps = {
  variant: { type: String as PropType<ButtonVariant>, default: "primary" },
  size: { type: String as PropType<ButtonSize>, default: undefined },
  loading: { type: Boolean, default: false },
  disabled: { type: Boolean, default: false },
  block: { type: Boolean, default: false },
  prefixIcon: { type: String, default: undefined },
  suffixIcon: { type: String, default: undefined },
  prefixIconFilled: { type: Boolean, default: false },
  suffixIconFilled: { type: Boolean, default: false },
  ariaLabel: { type: String, default: undefined },
  spinOnLoading: { type: Boolean, default: undefined },
  type: { type: String as PropType<"button" | "submit" | "reset">, default: "button" },
} as const;
export type KjunButtonProps = ExtractPublicPropTypes<typeof kjunButtonProps>;

export const KjunButton = defineComponent({
  name: "KjunButton",
  props: kjunButtonProps,
  emits: { click: (_event: MouseEvent) => true },
  slots: Object as SlotsType<{ default?: () => VNodeChild }>,
  setup(props, { attrs, slots, emit }) {
    const size = useActionSize(() => props.size, "md");
    const busy = useMinimumLoading(() => props.loading);
    const navigation = inject(kjunTopNavigationKey, null);
    return () => {
      const children = slots.default?.();
      const content = hasContent(children);
      const s = size.value, loading = busy.value;
      const { prefixIcon, suffixIcon } = props;
      const iconOnly = !content && !!(prefixIcon || suffixIcon || loading);
      const height = Math.max(tokens.button.heights[s], navigation?.controlSize ?? 0);
      const iconSize = navigation?.iconSize ?? tokens.button.iconSizes[s];
      const contentHeight = Math.max(content ? tokens.button.typography[s].lineHeightPx : 0,
        prefixIcon || suffixIcon || (!content && loading) ? iconSize : 0);
      const spinPrefix = loading && prefixIcon && (props.spinOnLoading ?? prefixIcon === "refresh");
      const before = prefixIcon && (loading ? (spinPrefix ? prefixIcon : "loader-2") : prefixIcon);
      const overlayLoading = loading && !prefixIcon && !suffixIcon;
      // Icon glyphs carry their own side bearing, so the icon side takes a tighter inset.
      const paddingX = tokens.button.paddingX[s];
      const iconSide = tokens.button.iconSidePaddingX[s];
      const appWidth = (attrs.style as Record<string, unknown> | undefined)?.width;
      return (
        <button
          type={props.type}
          class="kjun-button"
          data-variant={props.variant}
          data-size={s}
          data-disabled={String(props.disabled)}
          aria-label={props.ariaLabel || undefined}
          disabled={props.disabled || loading}
          aria-busy={loading ? "true" : undefined}
          style={css({
            height,
            minHeight: height,
            width: props.block ? "100%" : iconOnly ? height : undefined,
            // A width set by the caller (fixed square controls) wins over the label minimum.
            minWidth: content && !props.block && appWidth == null ? tokens.button.minWidths[s] : undefined,
            padding: iconOnly ? 0 : `0 ${suffixIcon ? iconSide : paddingX}px 0 ${prefixIcon ? iconSide : paddingX}px`,
            ...typeStyle(tokens.button.typography[s]),
            borderRadius: tokens.button.radii[s],
            gap: content ? tokens.button.contentGaps[s] : 0,
          }, navigation && { height: "auto", maxWidth: "100%", paddingBlock: Math.max(0, (height - contentHeight) / 2) })}
          onClick={(event: MouseEvent) => {
            event.stopPropagation();
            if (!props.disabled && !loading) emit("click", event);
          }}
        >
          {before && <KjunIcon name={before} filled={!loading && props.prefixIconFilled} spin={loading} size={iconSize} />}
          <span class="kjun-button-label" style={{ opacity: overlayLoading ? 0 : 1 }}>{children}</span>
          {suffixIcon && (
            <KjunIcon name={loading && !prefixIcon ? "loader-2" : suffixIcon} filled={!loading && props.suffixIconFilled}
              spin={loading && !prefixIcon} style={{ opacity: loading && prefixIcon ? 0 : 1 }} size={iconSize} />
          )}
          {overlayLoading && <span class="kjun-button-loader" aria-hidden="true"><KjunIcon name="loader-2" spin size={iconSize} /></span>}
        </button>
      );
    };
  },
});
