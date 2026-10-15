import { defineComponent, type ExtractPublicPropTypes, type PropType, type SlotsType, type VNodeChild } from "vue";
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
} as const;
export type KjunCardProps = ExtractPublicPropTypes<typeof kjunCardProps>;
/** Slots: default (body), header (replaces title/subtitle), headerActions, media, footer. */
export const KjunCard = defineComponent({
  name: "KjunCard",
  props: kjunCardProps,
  slots: Object as SlotsType<{
    default?: () => VNodeChild;
    header?: () => VNodeChild;
    headerActions?: () => VNodeChild;
    media?: () => VNodeChild;
    footer?: () => VNodeChild;
  }>,
  setup(props, { slots }) {
    return () => {
      const bodyPadding = props.bodyPadding ?? props.padding;
      const header = slots.header?.(), headerActions = slots.headerActions?.(), media = slots.media?.();
      const footer = slots.footer?.(), children = slots.default?.();
      const hasHeading = hasContent(header) || !!props.title || !!props.subtitle;
      const hasHeader = hasHeading || hasContent(headerActions);
      return (
        <div class="kjun-card" data-surface={props.surface} data-padding={props.padding} data-body-padding={bodyPadding}
          data-border={String(props.border)} data-dividers={String(props.dividers)} data-elevation={props.elevation}
          style={{
            "--_kjun-card-padding": `var(--_kjun-geometry-card-padding-${props.padding})`,
            "--_kjun-card-body-padding": `var(--_kjun-geometry-card-padding-${bodyPadding})`,
            borderRadius: `var(--_kjun-geometry-card-radii-${props.radius})`,
            boxShadow: `var(--_kjun-card-elevation-${props.elevation})`,
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
