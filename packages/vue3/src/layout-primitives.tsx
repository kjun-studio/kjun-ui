import { Comment, Fragment, type ExtractPublicPropTypes, type PropType, type SlotsType, type VNode, type VNodeChild } from "vue";
import { defineComponent } from "./runtime/component";
import {
  clampLines, defaultTextTag, isStackList, stackGapSteps, textToneAttribute, textTypeClass,
  type InlineAlign, type InlineGap, type InlineJustify, type StackAlign, type StackBreakpoint, type StackGap, type StackGapValue, type StackJustify, type StackTag,
  type TextAlign, type TextDecoration, type TextTag, type TextTone, type TextVariant,
} from "../../../shared/package-runtime/layout-primitives";
export type { InlineAlign, InlineGap, InlineJustify, StackAlign, StackBreakpoint, StackGap, StackGapValue, StackJustify, StackTag, TextAlign, TextDecoration, TextTag, TextTone, TextVariant };

// class, style, id, title, lang, dir and aria-* fall through to the root, as in React.
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
  /** Fixed-width digits, so amounts in a column line up. Size and weight stay the variant's. */
  numeric: { type: Boolean, default: false },
  /** "lineThrough" strikes the text, e.g. a price before a discount. */
  decoration: { type: String as PropType<TextDecoration>, default: undefined },
} as const;
export type KjunTextProps = ExtractPublicPropTypes<typeof kjunTextProps>;
export const KjunText = defineComponent({
  name: "KjunText",
  props: kjunTextProps,
  slots: defaultSlot,
  setup(props, { slots }) {
    return () => {
      const Tag = props.as ?? defaultTextTag(props.variant);
      const lines = clampLines(props.maxLines);
      return (
        <Tag class={["kjun-text", textTypeClass(props.variant)]} data-kjun-content="" data-tone={textToneAttribute(props.tone)}
          data-align={props.align} data-numeric={props.numeric ? "" : undefined}
          data-decoration={props.decoration === "lineThrough" ? "line-through" : undefined}
          data-max-lines={lines} style={lines ? { "--_kjun-text-lines": lines } : undefined}>
          {slots.default?.()}
        </Tag>
      );
    };
  },
});

const kjunStackProps = {
  /** Space between children: space.stack (xs·sm·md·lg) or space.section (section-sm·md·lg). An object changes it with the
   * screen width, e.g. { base: "sm", medium: "lg" } (compact 640, medium 768, wide 1024 and up). */
  gap: { type: [String, Object] as PropType<StackGapValue>, default: "md" },
  /** Cross-axis alignment. With stretch (the default) blocks fill the width while buttons and badges keep their own;
   * a full-width button says so with block. */
  align: { type: String as PropType<StackAlign>, default: "stretch" },
  /** How children share spare height when the stack is taller than they are: between puts the first at the top and the last at the bottom. */
  justify: { type: String as PropType<StackJustify>, default: "start" },
  /** A hairline in the divider color between children, with the gap above and below it. */
  divider: { type: Boolean, default: false },
  /** Element to render. ul and ol drop bullets and indent; give them li children. */
  as: { type: String as PropType<StackTag>, default: "div" },
} as const;
// Slot content as the children a reader sees: fragments (v-for) opened, comments (a false v-if) dropped.
const visible = (nodes: VNode[] = []): VNode[] => nodes.flatMap(node =>
  node.type === Fragment ? visible(node.children as VNode[]) : node.type === Comment ? [] : [node]);
export type KjunStackProps = ExtractPublicPropTypes<typeof kjunStackProps>;
/** Vertical stack. It is not KJUN markup (a data attribute, no kjun- class), so app children keep the styles they would have without it; direct form groups drop their own bottom margin. */
export const KjunStack = defineComponent({
  name: "KjunStack",
  props: kjunStackProps,
  slots: defaultSlot,
  setup(props, { slots }) {
    return () => {
      const Tag = props.as, steps = stackGapSteps(props.gap), Line = isStackList(props.as) ? "li" : "div";
      const children = slots.default?.() as VNode[] | undefined;
      // The divider is the stack's own element between children, so no app child is restyled to draw it.
      const content = props.divider ? visible(children).flatMap((child, index) => index
        ? [<Line key={"kjun-divider-" + index} data-kjun-stack-divider="" aria-hidden="true" />, child] : [child]) : children;
      return <Tag data-kjun-stack="" data-gap={steps.base} data-gap-compact={steps.compact} data-gap-medium={steps.medium} data-gap-wide={steps.wide}
        data-align={props.align} data-justify={props.justify === "start" ? undefined : props.justify} data-divider={props.divider ? "" : undefined}>{content}</Tag>;
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
/** Horizontal row that wraps by default. Like KjunStack it is not KJUN markup, so app children keep their own styles. */
export const KjunInline = defineComponent({
  name: "KjunInline",
  props: kjunInlineProps,
  slots: defaultSlot,
  setup(props, { slots }) {
    return () => (
      <div data-kjun-inline="" data-gap={props.gap} data-align={props.align} data-justify={props.justify}
        data-wrap={props.wrap ? undefined : "false"}>
        {slots.default?.()}
      </div>
    );
  },
});
