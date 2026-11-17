import { Children, createElement, type AriaAttributes, type AriaRole, type CSSProperties, type ReactNode, type Ref } from "react";
import {
  clampLines, defaultTextTag, isStackList, stackGapSteps, textToneAttribute, textTypeClass,
  type InlineAlign, type InlineGap, type InlineJustify, type StackAlign, type StackBreakpoint, type StackGap, type StackGapValue, type StackJustify, type StackTag,
  type TextAlign, type TextDecoration, type TextTag, type TextTone, type TextVariant,
} from "../../../shared/package-runtime/layout-primitives";
export type { InlineAlign, InlineGap, InlineJustify, StackAlign, StackBreakpoint, StackGap, StackGapValue, StackJustify, StackTag, TextAlign, TextDecoration, TextTag, TextTone, TextVariant };

// Only the id and ARIA attributes reach the root, like Vue 3's fallthrough attributes; no event handlers.
interface RootAttributes extends AriaAttributes { id?: string }
const join = (...names: (string | false | undefined)[]) => names.filter(Boolean).join(" ");

export interface KjunTextProps extends RootAttributes {
  /** Typography role; every size, line height and weight comes from tokens.typography. */
  variant?: TextVariant;
  /** Text color role; default follows the surrounding text color. */
  tone?: TextTone;
  /** Document tag. Size comes from variant, meaning from as. */
  as?: TextTag;
  align?: TextAlign;
  /** Clamp to this many lines with an ellipsis; the full text stays in the DOM. */
  maxLines?: number;
  /** Fixed-width digits, so amounts in a column line up. Size and weight stay the variant's. */
  numeric?: boolean;
  /** "lineThrough" strikes the text, e.g. a price before a discount. */
  decoration?: TextDecoration;
  /** Browser tooltip, e.g. the full sentence of a clamped text. */
  title?: string;
  lang?: string;
  dir?: "ltr" | "rtl" | "auto";
  /** The element, e.g. to move focus to a heading after the screen changes (with tabIndex={-1}). */
  ref?: Ref<HTMLElement>;
  /** -1 lets code focus the text without adding it to the Tab order. */
  tabIndex?: number;
  /** An ARIA role for the element, such as "status" for a message that should be announced. */
  role?: AriaRole;
  className?: string;
  style?: CSSProperties;
  children?: ReactNode;
}
export function KjunText({ variant = "body", tone = "default", as, align, maxLines, numeric, decoration, className, style, children, ...rest }: KjunTextProps) {
  const lines = clampLines(maxLines);
  return createElement(as ?? defaultTextTag(variant), {
    ...rest,
    className: join("kjun-text", textTypeClass(variant), className),
    // 안에 넣은 링크·강조 같은 앱 요소는 KJUN 리셋을 받지 않는다.
    "data-kjun-content": "",
    "data-tone": textToneAttribute(tone),
    "data-align": align,
    "data-numeric": numeric ? "" : undefined,
    "data-decoration": decoration === "lineThrough" ? "line-through" : undefined,
    "data-max-lines": lines,
    style: lines ? { ...style, ["--_kjun-text-lines" as string]: lines } : style,
  }, children);
}

export interface KjunStackProps extends RootAttributes {
  /** Space between children: space.stack (xs·sm·md·lg) or space.section (section-sm·md·lg). An object changes it with the
   * screen width, e.g. { base: "sm", medium: "lg" } (compact 640, medium 768, wide 1024 and up). */
  gap?: StackGapValue;
  /** Cross-axis alignment. With stretch (the default) blocks fill the width while buttons and badges keep their own;
   * a full-width button says so with block. */
  align?: StackAlign;
  /** How children share spare height when the stack is taller than they are: between puts the first at the top and the last at the bottom. */
  justify?: StackJustify;
  /** A hairline in the divider color between children, with the gap above and below it. */
  divider?: boolean;
  /** Element to render. ul and ol drop bullets and indent; give them li children. */
  as?: StackTag;
  className?: string;
  style?: CSSProperties;
  children?: ReactNode;
  ref?: Ref<HTMLElement>;
}
/** Vertical stack. It is not KJUN markup (a data attribute, no kjun- class), so app children keep the styles they would have without it; direct form groups drop their own bottom margin. */
export function KjunStack({ gap, align = "stretch", justify = "start", divider = false, as = "div", className, style, children, ...rest }: KjunStackProps) {
  const steps = stackGapSteps(gap), line = isStackList(as) ? "li" : "div";
  // The divider is the stack's own element between children, so no app child is restyled to draw it.
  const content = divider ? Children.toArray(children).flatMap((child, index) => index
    ? [createElement(line, { key: "kjun-divider-" + index, "data-kjun-stack-divider": "", "aria-hidden": true }), child] : [child]) : children;
  return createElement(as, { ...rest, className: className || undefined, style,
    "data-kjun-stack": "", "data-gap": steps.base, "data-gap-compact": steps.compact, "data-gap-medium": steps.medium, "data-gap-wide": steps.wide,
    "data-align": align, "data-justify": justify === "start" ? undefined : justify, "data-divider": divider ? "" : undefined }, content);
}

export interface KjunInlineProps extends RootAttributes {
  /** Space between children: space.inline (xs·sm·md·lg). */
  gap?: InlineGap;
  align?: InlineAlign;
  justify?: InlineJustify;
  /** Wrap onto new lines when the row runs out of width. Default true. */
  wrap?: boolean;
  className?: string;
  style?: CSSProperties;
  children?: ReactNode;
  ref?: Ref<HTMLDivElement>;
}
/** Horizontal row that wraps by default. Like KjunStack it is not KJUN markup, so app children keep their own styles. */
export function KjunInline({ gap = "sm", align = "center", justify = "start", wrap = true, className, style, children, ...rest }: KjunInlineProps) {
  return (
    <div {...rest} className={className || undefined} style={style}
      data-kjun-inline="" data-gap={gap} data-align={align} data-justify={justify} data-wrap={wrap ? undefined : "false"}>
      {children}
    </div>
  );
}
