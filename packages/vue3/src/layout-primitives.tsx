import { Comment, Fragment, mergeProps, onBeforeUnmount, onUpdated, ref, useId, watch, type ExtractPublicPropTypes, type PropType, type SlotsType, type VNode, type VNodeChild } from "vue";
import { tokens } from "@kjun-ui/tokens";
import { defineComponent } from "./runtime/component";
import {
  clampLines, clampOverflows, defaultTextTag, dividerVariant, flexLayout, interleave, isResponsive, isStackList, textToneAttribute, textTypeClass,
  type DirectionValue, type FlexDirection, type InlineAlign, type InlineAlignValue, type InlineGap, type InlineGapValue, type InlineJustify, type InlineRowGap,
  type InlineRowGapValue, type InsetStep, type JustifyValue, type LegacyStackGap, type PaddingValue, type Responsive, type ResponsiveBasis, type StackAlign,
  type StackAlignValue, type StackBreakpoint, type StackDivider, type StackGap, type StackGapValue, type StackJustify, type StackTag, type TextAlign,
  type TextDecoration, type TextTag, type TextTone, type TextVariant,
} from "../../../shared/package-runtime/layout-primitives";
import { useKjunMessages } from "./runtime/messages";
import { KjunIcon } from "./button";
export type { DirectionValue, FlexDirection, InlineAlign, InlineAlignValue, InlineGap, InlineGapValue, InlineJustify, InlineRowGap, InlineRowGapValue, InsetStep,
  JustifyValue, LegacyStackGap, PaddingValue, Responsive, ResponsiveBasis, StackAlign, StackAlignValue, StackBreakpoint, StackDivider, StackGap, StackGapValue,
  StackJustify, StackTag, TextAlign, TextDecoration, TextTag, TextTone, TextVariant };

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
  /** With maxLines, a "더보기" button under the text opens the rest and turns into "접기". It shows only while the text
   * overflows (or is open). The text and the button sit in a wrapper div; class, style, id and aria-* stay on the text element. */
  expandable: { type: Boolean, default: false },
  /** v-model:expanded: whether the expandable text is open; leave it out to let the text keep it. */
  expanded: { type: Boolean, default: undefined },
} as const;
export type KjunTextProps = ExtractPublicPropTypes<typeof kjunTextProps>;
export const KjunText = defineComponent({
  name: "KjunText",
  // Fallthrough attributes go to the text element itself, also when an expandable text adds a wrapper.
  inheritAttrs: false,
  props: kjunTextProps,
  emits: { "update:expanded": (_expanded: boolean) => true },
  slots: defaultSlot,
  setup(props, { slots, attrs, emit }) {
    const own = ref(false), element = ref<HTMLElement>(), overflows = ref(false), autoId = "kjun-text-" + useId().replace(/[^\w-]/g, "");
    const m = useKjunMessages();
    let observer: ResizeObserver | undefined;
    const expanded = () => props.expanded ?? own.value;
    const toggles = () => props.expandable && !!clampLines(props.maxLines);
    const clamped = () => toggles() && expanded() ? undefined : clampLines(props.maxLines);
    const check = () => { if (element.value && clamped()) overflows.value = clampOverflows(element.value); };
    // The button shows while the clamped text overflows: measured after each render and when the element resizes.
    watch([element, toggles, clamped], ([node, on, lines]) => {
      observer?.disconnect();
      observer = undefined;
      if (!node || !on || !lines) return;
      check();
      if (typeof ResizeObserver !== "undefined") (observer = new ResizeObserver(check)).observe(node);
    }, { flush: "post" });
    onUpdated(check);
    onBeforeUnmount(() => observer?.disconnect());
    const change = (next: boolean) => { if (props.expanded === undefined) own.value = next; emit("update:expanded", next); };
    return () => {
      const Tag = props.as ?? defaultTextTag(props.variant);
      const lines = clamped(), toggle = toggles(), id = (attrs.id as string | undefined) ?? (toggle ? autoId : undefined);
      const text = (
        <Tag {...mergeProps(attrs, { id, ref: toggle ? element : undefined, class: ["kjun-text", textTypeClass(props.variant)], "data-kjun-content": "",
          "data-tone": textToneAttribute(props.tone), "data-align": props.align, "data-numeric": props.numeric ? "" : undefined,
          "data-decoration": props.decoration === "lineThrough" ? "line-through" : undefined,
          "data-max-lines": lines, style: lines ? { "--_kjun-text-lines": lines } : undefined })}>
          {slots.default?.()}
        </Tag>
      );
      if (!toggle) return text;
      const open = expanded();
      return (
        <div class="kjun-text-expandable">
          {text}
          {(open || overflows.value) && <button type="button" class="kjun-text-toggle" aria-expanded={open ? "true" : "false"} aria-controls={id}
            onClick={() => change(!open)}>{open ? m.value.showLessText : m.value.showMoreText}
            <KjunIcon name={open ? "chevron-up" : "chevron-down"} size={tokens.button.iconSizes.sm} /></button>}
        </div>
      );
    };
  },
});

/** Props both KjunStack and KjunInline take. */
const flexProps = {
  /** Lay the children out as a column or a row; an object changes it with the width, e.g. { base: "column", medium: "row" }. */
  direction: { type: [String, Object] as PropType<DirectionValue>, default: undefined },
  /** Inner space from space.inset (sm 12 · md 16 · lg 24) on every side; paddingX and paddingY replace one axis. Takes an object per width like gap. */
  padding: { type: [String, Object] as PropType<PaddingValue>, default: undefined },
  paddingX: { type: [String, Object] as PropType<PaddingValue>, default: undefined },
  paddingY: { type: [String, Object] as PropType<PaddingValue>, default: undefined },
  /** A divider between children: true or "full" a hairline, "inset" a hairline that starts after dividerInset, "strong" a band
   * for sections. A hairline sits inside the gap, so the distance between children stays the gap; a band adds its thickness. */
  divider: { type: [Boolean, String] as PropType<StackDivider>, default: false },
  /** Where an inset divider starts: space.inset (sm 12 · md 16 · lg 24). */
  dividerInset: { type: String as PropType<InsetStep>, default: "md" },
  /** What the responsive values follow: viewport (CSS media queries) or container, the element's own width, measured. */
  responsive: { type: String as PropType<ResponsiveBasis>, default: "viewport" },
  /** How children share the spare length: between puts the first at the start and the last at the end. Takes an object per width. */
  justify: { type: [String, Object] as PropType<JustifyValue>, default: "start" },
  /** Element to render. ul and ol drop bullets and indent; give them li children. */
  as: { type: String as PropType<StackTag>, default: "div" },
} as const;
const kjunStackProps = {
  /** Space between children: space.stack (xs 4 · sm 8 · smMd 12 · md 16 · lg 24) or space.section (sectionSm 32 · sectionMd 48 · sectionLg 64).
   * An object changes it with the width, e.g. { base: "sm", medium: "lg" } (compact 640, medium 768, wide 1024 and up). */
  gap: { type: [String, Object] as PropType<StackGapValue>, default: "md" },
  /** Cross-axis alignment. With stretch (the default) blocks fill the width while buttons, badges, chips and other
   * content-width controls keep their own; a full-width button says so with block. An object changes it with the width. */
  align: { type: [String, Object] as PropType<StackAlignValue>, default: "stretch" },
  ...flexProps,
} as const;
// Slot content as the children a reader sees: fragments (v-for) opened, comments (a false v-if) dropped.
const visible = (nodes: VNode[] = []): VNode[] => nodes.flatMap(node =>
  node.type === Fragment ? visible(node.children as VNode[]) : node.type === Comment ? [] : [node]);
export type KjunStackProps = ExtractPublicPropTypes<typeof kjunStackProps>;

/** Takes the spare length of a Stack or Inline, pushing what follows to the far end: a menu at the top and a profile at the bottom. */
export const KjunSpacer = defineComponent({
  name: "KjunSpacer",
  setup() {
    return () => <div data-kjun-spacer="" aria-hidden="true" />;
  },
});
export type KjunSpacerProps = Record<string, never>;

const breakpoints: Record<StackBreakpoint, number> = { compact: tokens.responsive.stackCompact, medium: tokens.responsive.stackMedium, wide: tokens.responsive.stackWide };
type FlexProps = { gap?: StackGapValue | InlineGapValue; align?: StackAlignValue | InlineAlignValue; rowGap?: InlineRowGapValue; direction?: DirectionValue;
  padding?: PaddingValue; paddingX?: PaddingValue; paddingY?: PaddingValue; divider: StackDivider; dividerInset: InsetStep; responsive: ResponsiveBasis;
  justify: JustifyValue; as: StackTag };
/** Renders a Stack or Inline; responsive="container" measures the root while a responsive value needs it. */
function useFlex(kind: "stack" | "inline", props: FlexProps, slots: { default?: () => VNodeChild }, extra: () => Record<string, string | undefined>) {
  const root = ref<HTMLElement>(), width = ref<number>();
  let observer: ResizeObserver | undefined;
  const measuring = () => props.responsive === "container"
    && isResponsive(props.gap, props.direction, props.padding, props.paddingX, props.paddingY, props.align, props.justify, props.rowGap);
  watch([root, measuring], ([node, on]) => {
    observer?.disconnect();
    observer = undefined;
    if (!node || !on || typeof ResizeObserver === "undefined") return;
    width.value = node.getBoundingClientRect().width;
    observer = new ResizeObserver(() => { width.value = node.getBoundingClientRect().width; });
    observer.observe(node);
  }, { flush: "post" });
  onBeforeUnmount(() => observer?.disconnect());
  return () => {
    const measure = measuring();
    // Before the first measurement the container mode draws the base step (width 0), as on Native.
    const { attrs, vars } = flexLayout({ kind, gap: props.gap, align: props.align, justify: props.justify, rowGap: props.rowGap, direction: props.direction,
      padding: props.padding, paddingX: props.paddingX, paddingY: props.paddingY, dividerInset: props.dividerInset, width: measure ? width.value ?? 0 : undefined, breakpoints });
    const Tag = props.as, variant = dividerVariant(props.divider), Line = isStackList(props.as) ? "li" : "div";
    const children = slots.default?.() as VNode[] | undefined;
    // The divider is the stack's own element between children, so no app child is restyled to draw it.
    const content = variant ? interleave(visible(children), node => node.type === KjunSpacer,
      index => <Line key={"kjun-divider-" + index} data-kjun-stack-divider={variant} aria-hidden="true" />) : children;
    return <Tag ref={root} style={vars} {...attrs} {...extra()}
      data-divider={variant ? "" : undefined} data-responsive={measure ? "container" : undefined}>{content}</Tag>;
  };
}

/** Vertical stack (direction turns it into a row). It is not KJUN markup (a data attribute, no kjun- class), so app children keep the styles they would have without it; direct form groups drop their own bottom margin. */
export const KjunStack = defineComponent({
  name: "KjunStack",
  props: kjunStackProps,
  slots: defaultSlot,
  setup(props, { slots }) {
    return useFlex("stack", props, slots, () => ({ "data-kjun-stack": "" }));
  },
});

const kjunInlineProps = {
  /** Space between children: space.inline (xs·sm·md·lg). An object changes it with the width like Stack's gap. */
  gap: { type: [String, Object] as PropType<InlineGapValue>, default: "sm" },
  /** The space between wrapped lines: space.stack (xs 4 · sm 8 · smMd 12 · md 16 · lg 24); absent, the lines keep the gap. Takes an object per width. */
  rowGap: { type: [String, Object] as PropType<InlineRowGapValue>, default: undefined },
  /** Cross-axis alignment; an object changes it with the width. */
  align: { type: [String, Object] as PropType<InlineAlignValue>, default: "center" },
  /** Wrap onto new lines when the row runs out of width. */
  wrap: { type: Boolean, default: true },
  ...flexProps,
} as const;
export type KjunInlineProps = ExtractPublicPropTypes<typeof kjunInlineProps>;
/** Horizontal row that wraps by default. Like KjunStack it is not KJUN markup, so app children keep their own styles. */
export const KjunInline = defineComponent({
  name: "KjunInline",
  props: kjunInlineProps,
  slots: defaultSlot,
  setup(props, { slots }) {
    return useFlex("inline", props, slots, () => ({ "data-kjun-inline": "", "data-wrap": props.wrap ? undefined : "false" }));
  },
});
