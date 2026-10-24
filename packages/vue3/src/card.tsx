import { defineComponent, onMounted, ref, type ExtractPublicPropTypes, type PropType, type SlotsType, type VNodeChild } from "vue";
import type { CardElevation, CardPadding, CardRadius, CardSurface } from "@kjun-ui/tokens";
import { hasContent } from "./runtime/slots";

const kjunCardProps = {
  title: { type: String, default: undefined },
  subtitle: { type: String, default: undefined },
  padding: { type: String as PropType<CardPadding>, default: "md" },
  bodyPadding: { type: String as PropType<CardPadding>, default: undefined },
  radius: { type: String as PropType<CardRadius>, default: "md" },
  surface: { type: String as PropType<CardSurface>, default: "default" },
  elevation: { type: String as PropType<CardElevation>, default: "flat" },
  border: { type: Boolean, default: false },
  dividers: { type: Boolean, default: false },
  /** Makes the whole card one button (click). Do not put buttons or links inside a pressable card. */
  pressable: { type: Boolean, default: false },
  /** Blocks a pressable card and dims it. */
  disabled: { type: Boolean, default: false },
  /** Button name of a pressable card; defaults to the title. */
  ariaLabel: { type: String, default: undefined },
} as const;
const interactive = 'button, a[href], input, select, textarea, [tabindex]:not([tabindex="-1"])';
function developmentMode() {
  try { return !!process.env.NODE_ENV && process.env.NODE_ENV !== "production"; } catch { return false; }
}
export type KjunCardProps = ExtractPublicPropTypes<typeof kjunCardProps>;
/** Slots: default (body), header (replaces title/subtitle), headerActions, media, footer. */
export const KjunCard = defineComponent({
  name: "KjunCard",
  props: kjunCardProps,
  emits: { click: (_event: MouseEvent) => true },
  slots: Object as SlotsType<{
    default?: () => VNodeChild;
    header?: () => VNodeChild;
    headerActions?: () => VNodeChild;
    media?: () => VNodeChild;
    footer?: () => VNodeChild;
  }>,
  setup(props, { slots, emit }) {
    const root = ref<HTMLDivElement | null>(null);
    onMounted(() => {
      // Nested controls inside a button are unreachable for assistive technology.
      if (props.pressable && developmentMode() && root.value?.querySelector(interactive))
        console.warn("KJUN Card: a pressable card contains buttons or links; move them out or drop pressable.");
    });
    return () => {
      const press = props.pressable ? {
        role: "button", tabindex: props.disabled ? -1 : 0, "aria-disabled": props.disabled || undefined,
        "aria-label": props.ariaLabel ?? props.title, "data-pressable": "",
        onKeydown: (event: KeyboardEvent) => {
          if (props.disabled || (event.key !== "Enter" && event.key !== " ")) return;
          event.preventDefault();
          (event.currentTarget as HTMLElement).click();
        },
      } : {};
      const bodyPadding = props.bodyPadding ?? props.padding;
      const header = slots.header?.(), headerActions = slots.headerActions?.(), media = slots.media?.();
      const footer = slots.footer?.(), children = slots.default?.();
      const hasHeading = hasContent(header) || !!props.title || !!props.subtitle;
      const hasHeader = hasHeading || hasContent(headerActions);
      return (
        <div ref={root} {...press} onClick={(event: MouseEvent) => { if (!(props.pressable && props.disabled)) emit("click", event); }}
          class="kjun-card" data-surface={props.surface} data-padding={props.padding} data-body-padding={bodyPadding}
          data-border={String(props.border)} data-dividers={String(props.dividers)} data-elevation={props.elevation}
          style={{
            "--_kjun-card-padding": `var(--_kjun-geometry-card-padding-${props.padding})`,
            "--_kjun-card-body-padding": `var(--_kjun-geometry-card-padding-${bodyPadding})`,
            borderRadius: `var(--_kjun-geometry-card-radii-${props.radius})`,
            // A pressable card's shadow comes from CSS so its hover lift can replace it.
            ...(props.pressable ? { "--_kjun-card-shadow": `var(--_kjun-card-elevation-${props.elevation})` } : { boxShadow: `var(--_kjun-card-elevation-${props.elevation})` }),
          }}>
          {hasContent(media) && <div class="kjun-card-media">{media}</div>}
          {hasHeader && (
            <div class="kjun-card-header" data-description={String(!hasContent(header) && !!props.subtitle)}>
              {hasHeading && (
                <div class="kjun-card-heading">
                  {hasContent(header) ? header : <>
                    {props.title && <h3>{props.title}</h3>}
                    {props.subtitle && <p>{props.subtitle}</p>}
                  </>}
                </div>
              )}
              {hasContent(headerActions) && <div class="kjun-card-actions">{headerActions}</div>}
            </div>
          )}
          {hasContent(children) && <div class="kjun-card-body">{children}</div>}
          {hasContent(footer) && <div class="kjun-card-footer">{footer}</div>}
        </div>
      );
    };
  },
});
