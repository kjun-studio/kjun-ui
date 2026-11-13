import { warnNestedControls } from "../../../shared/package-runtime/nested-controls";
import { cardLayout, type CardHeadingLevel, type CardMediaAspect, type CardMediaPosition } from "../../../shared/package-runtime/card-layout";
import { onMounted, onUpdated, provide, ref, type ExtractPublicPropTypes, type PropType, type SlotsType, type VNodeChild } from "vue";
import { defineComponent } from "./runtime/component";
import { tokens, type CardElevation, type CardPadding, type CardRadius, type CardSurface } from "@kjun-ui/tokens";
import { hasContent } from "./runtime/slots";
import { kjunCardActionsKey } from "./runtime/keys";

/** Internal: wraps the header actions so buttons there wrap long labels. */
const CardActions = defineComponent({
  name: "KjunCardActions",
  setup(_props, { slots }) {
    provide(kjunCardActionsKey, true);
    return () => <div class="kjun-card-actions">{slots.default?.()}</div>;
  },
});

const kjunCardProps = {
  /** The card title; the title slot can carry an icon or an emphasised number instead. */
  title: { type: String, default: undefined },
  subtitle: { type: String, default: undefined },
  padding: { type: String as PropType<CardPadding>, default: "md" },
  bodyPadding: { type: String as PropType<CardPadding>, default: undefined },
  radius: { type: String as PropType<CardRadius>, default: "md" },
  surface: { type: String as PropType<CardSurface>, default: "default" },
  elevation: { type: String as PropType<CardElevation>, default: "flat" },
  border: { type: Boolean, default: false },
  dividers: { type: Boolean, default: false },
  /** top (default) puts the media above the header; start puts it in a fixed column beside the content, such as a thumbnail. */
  mediaPosition: { type: String as PropType<CardMediaPosition>, default: "top" },
  /** Fixes the media frame's ratio (wide 16:9, standard 4:3, square 1:1); images and video crop to it. */
  mediaAspect: { type: String as PropType<CardMediaAspect>, default: undefined },
  /** Makes the whole card one button (click). Do not put buttons or links inside a pressable card. */
  pressable: { type: Boolean, default: false },
  /** Blocks a pressable card and dims it. */
  disabled: { type: Boolean, default: false },
  /** Button name of a pressable card; defaults to the title prop. */
  ariaLabel: { type: String, default: undefined },
  /** Title level in the page outline (h2–h6, default 3); false keeps plain text. A pressable card's title is never a heading. */
  headingLevel: { type: [Boolean, Number] as PropType<CardHeadingLevel>, default: 3 },
  /** Where the footer places its content: start (default) or end, such as confirm and cancel actions. */
  footerAlign: { type: String as PropType<"start" | "end">, default: "start" },
} as const;
export type KjunCardProps = ExtractPublicPropTypes<typeof kjunCardProps>;
/** Slots: default (body), title (replaces the title text), header (replaces title/subtitle), headerActions, media, footer. */
export const KjunCard = defineComponent({
  name: "KjunCard",
  props: kjunCardProps,
  emits: { click: (_event: MouseEvent) => true },
  slots: Object as SlotsType<{
    default?: () => VNodeChild;
    title?: () => VNodeChild;
    header?: () => VNodeChild;
    headerActions?: () => VNodeChild;
    media?: () => VNodeChild;
    footer?: () => VNodeChild;
  }>,
  setup(props, { slots, emit }) {
    const root = ref<HTMLDivElement | null>(null);
    // Checked after every render, so a control added later still warns.
    const warn = () => {
      if (props.pressable) warnNestedControls(root.value, "KJUN Card: a pressable card contains buttons or links; move them out or drop pressable.");
    };
    onMounted(warn);
    onUpdated(warn);
    return () => {
      // Like a native button: Enter presses once on keydown (a held key does not repeat), Space presses on release.
      const press = props.pressable ? {
        role: "button", tabindex: props.disabled ? -1 : 0, "aria-disabled": props.disabled || undefined,
        "aria-label": props.ariaLabel ?? props.title, "data-pressable": "",
        onKeydown: (event: KeyboardEvent) => {
          if (event.defaultPrevented || props.disabled || (event.key !== "Enter" && event.key !== " ")) return;
          event.preventDefault();
          if (event.key === "Enter" && !event.repeat) (event.currentTarget as HTMLElement).click();
        },
        onKeyup: (event: KeyboardEvent) => {
          if (event.defaultPrevented || props.disabled || event.key !== " ") return;
          event.preventDefault();
          (event.currentTarget as HTMLElement).click();
        },
      } : {};
      const bodyPadding = props.bodyPadding ?? props.padding;
      const header = slots.header?.(), headerActions = slots.headerActions?.(), media = slots.media?.();
      const footer = slots.footer?.(), children = slots.default?.(), titleNode = slots.title?.();
      const title = hasContent(titleNode) ? titleNode : props.title;
      const parts = { header: hasContent(header), title: hasContent(titleNode) || !!props.title, subtitle: !!props.subtitle, actions: hasContent(headerActions),
        body: hasContent(children), footer: hasContent(footer), media: hasContent(media) };
      const layout = cardLayout(parts, { pressable: props.pressable, headingLevel: props.headingLevel, surface: props.surface, padding: props.padding, mediaPosition: props.mediaPosition });
      // Typed as "p" so JSX accepts the tag variable; h2–h6 take the same attributes.
      const Title = (layout.titleLevel ? `h${layout.titleLevel}` : "p") as "p";
      const rows = [layout.header, parts.body, parts.footer].filter(Boolean).length;
      return (
        <div ref={root} {...press} onClick={(event: MouseEvent) => { if (!(props.pressable && props.disabled)) emit("click", event); }}
          class="kjun-card" data-surface={props.surface} data-padding={props.padding} data-body-padding={bodyPadding}
          data-border={String(props.border)} data-dividers={String(props.dividers)} data-elevation={props.elevation} data-media={layout.sideMedia ? "start" : undefined}
          style={{
            "--_kjun-card-padding": `var(--_kjun-geometry-card-padding-${props.padding})`,
            "--_kjun-card-body-padding": `var(--_kjun-geometry-card-padding-${bodyPadding})`,
            "--_kjun-card-header-gap": `${layout.headerGap}px`,
            borderRadius: `var(--_kjun-geometry-card-radii-${props.radius})`,
            // A pressable card's shadow comes from CSS so its hover lift can replace it.
            ...(props.pressable ? { "--_kjun-card-shadow": `var(--_kjun-card-elevation-${props.elevation})` } : { boxShadow: `var(--_kjun-card-elevation-${props.elevation})` }),
          }}>
          {parts.media && <div class="kjun-card-media" data-side={layout.sideMedia || undefined} data-aspect={props.mediaAspect}
            style={{ ...(props.mediaAspect ? { aspectRatio: String(tokens.card.mediaAspects[props.mediaAspect]) } : {}), ...(layout.sideMedia ? { gridRow: `1 / span ${Math.max(rows, 1)}` } : {}) }}>{media}</div>}
          {layout.header && (
            <div class="kjun-card-header" data-description={String(!parts.header && parts.subtitle)} data-titled={layout.titled || undefined}>
              {layout.heading && (
                <div class="kjun-card-heading" data-title={layout.titled ? "" : undefined}>
                  {parts.header ? header : <>
                    {parts.title && <Title class="kjun-card-title">{title}</Title>}
                    {props.subtitle && <p class="kjun-card-subtitle">{props.subtitle}</p>}
                  </>}
                </div>
              )}
              {parts.actions && <CardActions>{{ default: () => headerActions }}</CardActions>}
            </div>
          )}
          {parts.body && <div class="kjun-card-body">{children}</div>}
          {parts.footer && <div class="kjun-card-footer" data-align={props.footerAlign}>{footer}</div>}
        </div>
      );
    };
  },
});
