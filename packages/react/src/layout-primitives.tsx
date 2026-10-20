import { createElement, type AriaAttributes, type CSSProperties, type ReactNode } from "react";
import {
  defaultTextTag, textTypeClass,
  type InlineAlign, type InlineGap, type InlineJustify, type StackAlign, type StackGap,
  type TextAlign, type TextTag, type TextTone, type TextVariant,
} from "../../../shared/package-runtime/layout-primitives";
export type { InlineAlign, InlineGap, InlineJustify, StackAlign, StackGap, TextAlign, TextTag, TextTone, TextVariant };

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
  className?: string;
  style?: CSSProperties;
  children?: ReactNode;
}
export function KjunText({ variant = "body", tone = "default", as, align, maxLines, className, style, children, ...rest }: KjunTextProps) {
  const lines = maxLines && maxLines > 0 ? Math.floor(maxLines) : undefined;
  return createElement(as ?? defaultTextTag(variant), {
    ...rest,
    className: join("kjun-text", textTypeClass(variant), className),
    // 안에 넣은 링크·강조 같은 앱 요소는 KJUN 리셋을 받지 않는다.
    "data-kjun-content": "",
    "data-tone": tone === "default" ? undefined : tone,
    "data-align": align,
    "data-max-lines": lines,
    style: lines ? { ...style, ["--_kjun-text-lines" as string]: lines } : style,
  }, children);
}

export interface KjunStackProps extends RootAttributes {
  /** Space between children: space.stack (sm·md·lg) or space.section (section-sm·md·lg). */
  gap?: StackGap;
  align?: StackAlign;
  as?: "div" | "section";
  className?: string;
  style?: CSSProperties;
  children?: ReactNode;
}
/** Vertical stack. It is not KJUN markup (a data attribute, no kjun- class), so app children keep the styles they would have without it; direct form groups drop their own bottom margin. */
export function KjunStack({ gap = "md", align = "stretch", as = "div", className, style, children, ...rest }: KjunStackProps) {
  return createElement(as, { ...rest, className: className || undefined, style,
    "data-kjun-stack": "", "data-gap": gap, "data-align": align }, children);
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
