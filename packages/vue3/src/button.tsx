import { computed, h, inject, onBeforeUnmount, ref, watch, type ExtractPublicPropTypes, type PropType, type SlotsType, type VNodeChild } from "vue";
import { spinnerGlyph } from "./spinner-glyph";
import { defineComponent } from "./runtime/component";
import { tokens, type ButtonSize, type ButtonVariant } from "@kjun-ui/tokens";
import { typeStyle } from "../../../shared/package-runtime/typography";
import { useIcon } from "./runtime/icons";
import { kjunActionShapeKey, kjunActionSizeKey, kjunTopNavigationKey, kjunCardActionsKey } from "./runtime/keys";
import { hasContent } from "./runtime/slots";
import { css } from "./runtime/style";

const kjunIconProps = {
  name: { type: String, required: true },
  size: { type: [Number, String] as PropType<number | string>, default: "1em" },
  spin: { type: Boolean, default: false },
  filled: { type: Boolean, default: false },
  /** Names an icon that carries meaning on its own; screen readers then read it as an image. Without it the icon is decorative and hidden. */
  ariaLabel: { type: String, default: undefined },
} as const;
export type KjunIconProps = ExtractPublicPropTypes<typeof kjunIconProps>;

export const KjunIcon = defineComponent({
  name: "KjunIcon",
  props: kjunIconProps,
  setup(props, { attrs }) {
    const icon = useIcon(() => props.name, () => props.filled);
    return () => {
      const { nodes, filled } = icon.value;
      // ariaLabel, or the aria-label attribute it stands for, makes the icon an image; otherwise it is hidden.
      const label = props.ariaLabel ?? (attrs["aria-label"] as string | undefined);
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
          aria-label={label}
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
  /** "circle" makes a button round: as wide as its height with a full radius. It takes an icon alone or a short label alone
   * (one or two characters, such as a day number); a label with an icon keeps its width. "pill" rounds a button with a label
   * fully and keeps its width, for a button inside a rounded bar. */
  shape: { type: String as PropType<"default" | "circle" | "pill">, default: "default" },
  loading: { type: Boolean, default: false },
  disabled: { type: Boolean, default: false },
  block: { type: Boolean, default: false },
  /** Long labels wrap: the size's height becomes a minimum and the button grows instead of overflowing. */
  wrap: { type: Boolean, default: false },
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
  slots: Object as SlotsType<{ default?: () => VNodeChild; prefix?: () => VNodeChild; suffix?: () => VNodeChild }>,
  setup(props, { attrs, slots, emit }) {
    const size = useActionSize(() => props.size, "md");
    const inheritedShape = inject(kjunActionShapeKey, null);
    const busy = useMinimumLoading(() => props.loading);
    const navigation = inject(kjunTopNavigationKey, null);
    // Card header actions wrap long labels, like a button given wrap.
    const cardActions = inject(kjunCardActionsKey, false);
    return () => {
      const children = slots.default?.();
      const content = hasContent(children);
      const s = size.value, loading = busy.value;
      // A prefix/suffix slot takes the icon's place, inset and loading rules; it wins over the icon name.
      const prefixSlot = slots.prefix?.(), suffixSlot = slots.suffix?.();
      const prefixNode = hasContent(prefixSlot), suffixNode = hasContent(suffixSlot);
      const prefixIcon = prefixNode || !!props.prefixIcon, suffixIcon = suffixNode || !!props.suffixIcon;
      const iconOnly = !content && !!(prefixIcon || suffixIcon || loading);
      // A circle with a short label alone (a day number, a count) is a round button as wide as its height: no label minimum or inset.
      const roundLabel = props.shape === "circle" && content && !prefixIcon && !suffixIcon && !props.block && props.variant !== "link";
      const height = Math.max(tokens.button.heights[s], navigation?.controlSize ?? 0);
      const iconSize = navigation?.iconSize ?? tokens.button.iconSizes[s];
      const contentHeight = Math.max(content ? tokens.button.typography[s].lineHeightPx : 0,
        prefixIcon || suffixIcon || (!content && loading) ? iconSize : 0);
      const spinPrefix = loading && !prefixNode && !!props.prefixIcon && (props.spinOnLoading ?? props.prefixIcon === "refresh");
      const before = prefixIcon && !(loading && !spinPrefix);
      // Only a hidden suffix sets its own opacity, so the disabled rule in the stylesheet can dim the node.
      const media = (node: VNodeChild, hidden = false) =>
        <span class="kjun-button-media" style={{ width: iconSize + "px", height: iconSize + "px", ...(hidden ? { opacity: 0 } : {}) }}>{node}</span>;
      const loader = () => spinnerGlyph({ size: iconSize });
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
          data-wrap={props.wrap || cardActions || undefined}
          data-disabled={String(props.disabled)}
          aria-label={props.ariaLabel || undefined}
          // A loading button stays focusable (a keyboard user keeps their place) and refuses presses itself.
          disabled={props.disabled}
          aria-disabled={loading && !props.disabled ? "true" : undefined}
          aria-busy={loading ? "true" : undefined}
          style={css({
            height,
            minHeight: height,
            width: props.block ? "100%" : iconOnly || props.shape === "circle" ? height : undefined,
            // A width set by the caller (fixed square controls) wins over the label minimum.
            minWidth: content && !props.block && !roundLabel && appWidth == null ? tokens.button.minWidths[s] : undefined,
            padding: iconOnly || roundLabel ? 0 : `0 ${suffixIcon ? iconSide : paddingX}px 0 ${prefixIcon ? iconSide : paddingX}px`,
            ...typeStyle(tokens.button.typography[s]),
            borderRadius: props.shape !== "default" || inheritedShape?.value === "pill" ? tokens.shape.pill : tokens.button.radii[s],
            gap: content ? tokens.button.contentGaps[s] : 0,
          }, (navigation || props.wrap || cardActions) && !roundLabel && { height: "auto", maxWidth: "100%", paddingBlock: Math.max(0, (height - contentHeight) / 2) },
            props.variant === "link" && { height: "auto", minHeight: 0, minWidth: 0, width: "auto", padding: 0, borderRadius: 0 })}
          onClick={(event: MouseEvent) => {
            // While loading the click does nothing, a submit button included. It still bubbles, like any click.
            if (loading) { event.preventDefault(); return; }
            if (!props.disabled) emit("click", event);
          }}
        >
          {loading && prefixIcon && !spinPrefix && loader()}
          {before && (prefixNode ? media(prefixSlot) : <KjunIcon name={props.prefixIcon!} filled={!loading && props.prefixIconFilled} spin={loading} size={iconSize} />)}
          <span class="kjun-button-label" style={{ opacity: overlayLoading ? 0 : 1 }}>{children}</span>
          {suffixIcon && (loading && !prefixIcon ? loader() : suffixNode ? media(suffixSlot, loading && prefixIcon) : (
            <KjunIcon name={props.suffixIcon!} filled={!loading && props.suffixIconFilled}
              style={{ opacity: loading && prefixIcon ? 0 : 1 }} size={iconSize} />
          ))}
          {overlayLoading && <span class="kjun-button-loader" aria-hidden="true">{loader()}</span>}
        </button>
      );
    };
  },
});
