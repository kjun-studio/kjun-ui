import { defineComponent, type ExtractPublicPropTypes, type PropType, type SlotsType, type VNodeChild } from "vue";
import {
  defaultTextTag, textTypeClass,
  type InlineAlign, type InlineGap, type InlineJustify, type StackAlign, type StackGap,
  type TextAlign, type TextTag, type TextTone, type TextVariant,
} from "../../../shared/package-runtime/layout-primitives";
export type { InlineAlign, InlineGap, InlineJustify, StackAlign, StackGap, TextAlign, TextTag, TextTone, TextVariant };

// class, style, id and aria-* fall through to the root, as in React.
const defaultSlot = Object as SlotsType<{ default?: () => VNodeChild }>;

const kjunTextProps = {
  /** Typography role; every size, line height and weight comes from tokens.typography. */
  variant: { type: String as PropType<TextVariant>, default: "body" },
  /** Text color role; default follows the surrounding text color. */
  tone: { type: String as PropType<TextTone>, default: "default" },
  /** Document tag. Size comes from variant, meaning from as. */
  as: { type: String as PropType<TextTag>, default: undefined },
  align: { type: String as PropType<TextAlign>, default: undefined },
  /** Clamp to this many lines with an ellipsis; the full text stays in the DOM. */
  maxLines: { type: Number, default: undefined },
} as const;
export type KjunTextProps = ExtractPublicPropTypes<typeof kjunTextProps>;
export const KjunText = defineComponent({
  name: "KjunText",
  props: kjunTextProps,
  slots: defaultSlot,
  setup(props, { slots }) {
    return () => {
      const Tag = props.as ?? defaultTextTag(props.variant);
      const lines = props.maxLines && props.maxLines > 0 ? Math.floor(props.maxLines) : undefined;
      return (
        <Tag class={["kjun-text", textTypeClass(props.variant)]} data-tone={props.tone === "default" ? undefined : props.tone}
          data-align={props.align} data-max-lines={lines} style={lines ? { "--_kjun-text-lines": lines } : undefined}>
          {slots.default?.()}
        </Tag>
      );
    };
  },
});

const kjunStackProps = {
  /** Space between children: space.stack (sm·md·lg) or space.section (section-sm·md·lg). */
  gap: { type: String as PropType<StackGap>, default: "md" },
  align: { type: String as PropType<StackAlign>, default: "stretch" },
  as: { type: String as PropType<"div" | "section">, default: "div" },
} as const;
export type KjunStackProps = ExtractPublicPropTypes<typeof kjunStackProps>;
/** Vertical stack. App children are not reset (data-kjun-content); direct form groups drop their own bottom margin. */
export const KjunStack = defineComponent({
  name: "KjunStack",
  props: kjunStackProps,
  slots: defaultSlot,
  setup(props, { slots }) {
    return () => {
      const Tag = props.as;
      return <Tag class="kjun-stack" data-kjun-content="" data-gap={props.gap} data-align={props.align}>{slots.default?.()}</Tag>;
    };
  },
});

const kjunInlineProps = {
  /** Space between children: space.inline (xs·sm·md·lg). */
  gap: { type: String as PropType<InlineGap>, default: "sm" },
  align: { type: String as PropType<InlineAlign>, default: "center" },
  justify: { type: String as PropType<InlineJustify>, default: "start" },
  /** Wrap onto new lines when the row runs out of width. */
  wrap: { type: Boolean, default: true },
} as const;
export type KjunInlineProps = ExtractPublicPropTypes<typeof kjunInlineProps>;
/** Horizontal row that wraps by default. App children are not reset (data-kjun-content). */
export const KjunInline = defineComponent({
  name: "KjunInline",
  props: kjunInlineProps,
  slots: defaultSlot,
  setup(props, { slots }) {
    return () => (
      <div class="kjun-inline" data-kjun-content="" data-gap={props.gap} data-align={props.align} data-justify={props.justify}
        data-wrap={props.wrap ? undefined : "false"}>
        {slots.default?.()}
      </div>
    );
  },
});
