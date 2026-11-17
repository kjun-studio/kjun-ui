import { Children, Fragment, cloneElement, createElement, isValidElement, useCallback, useRef, useState,
  type AriaAttributes, type AriaRole, type ComponentPropsWithRef, type CSSProperties, type ReactElement, type ReactNode, type Ref } from "react";
import { tokens } from "@kjun-ui/tokens";
import {
  clampLines, defaultTextTag, dividerVariant, flexLayout, interleave, isResponsive, isStackList, textToneAttribute, textTypeClass,
  type DirectionValue, type FlexDirection, type InlineAlign, type InlineGap, type InlineGapValue, type InlineJustify, type InsetStep, type LegacyStackGap,
  type PaddingValue, type Responsive, type ResponsiveBasis, type StackAlign, type StackBreakpoint, type StackDivider, type StackGap, type StackGapValue,
  type StackJustify, type StackTag, type TextAlign, type TextDecoration, type TextTag, type TextTone, type TextVariant,
} from "../../../shared/package-runtime/layout-primitives";
export type { DirectionValue, FlexDirection, InlineAlign, InlineGap, InlineGapValue, InlineJustify, InsetStep, LegacyStackGap, PaddingValue, Responsive,
  ResponsiveBasis, StackAlign, StackBreakpoint, StackDivider, StackGap, StackGapValue, StackJustify, StackTag, TextAlign, TextDecoration, TextTag, TextTone, TextVariant };

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

/** Props both KjunStack and KjunInline take. */
interface FlexOwnProps {
  /** Lay the children out as a column or a row; an object changes it with the width, e.g. { base: "column", medium: "row" }. */
  direction?: DirectionValue;
  /** Inner space from space.inset (sm 12 · md 16 · lg 24) on every side; paddingX and paddingY replace one axis. Takes an object per width like gap. */
  padding?: PaddingValue;
  paddingX?: PaddingValue;
  paddingY?: PaddingValue;
  /** A divider between children: true or "full" a hairline, "inset" a hairline that starts after dividerInset, "strong" a band
   * for sections. A hairline sits inside the gap, so the distance between children stays the gap; a band adds its thickness. */
  divider?: StackDivider;
  /** Where an inset divider starts: space.inset (sm 12 · md 16 · lg 24). Default md. */
  dividerInset?: InsetStep;
  /** What the responsive values follow: viewport (default, CSS media queries) or container, the element's own width, measured. */
  responsive?: ResponsiveBasis;
  justify?: StackJustify;
  className?: string;
  style?: CSSProperties;
  children?: ReactNode;
}
/** The tag's own attributes (onSubmit for a form, disabled for a fieldset…) come with as. */
type WithTag<Own, T extends StackTag> = Own & { as?: T } & Omit<ComponentPropsWithRef<T>, keyof Own | "as">;

export interface KjunStackOwnProps extends FlexOwnProps {
  /** Space between children: space.stack (xs 4 · sm 8 · smMd 12 · md 16 · lg 24) or space.section (sectionSm 32 · sectionMd 48 · sectionLg 64).
   * An object changes it with the width, e.g. { base: "sm", medium: "lg" } (compact 640, medium 768, wide 1024 and up). */
  gap?: StackGapValue;
  /** Cross-axis alignment. With stretch (the default) blocks fill the width while buttons, badges, chips and other
   * content-width controls keep their own; a full-width button says so with block. */
  align?: StackAlign;
}
/** Element to render with as (ul and ol drop bullets and indent; give them li children); the tag's attributes and ref follow it. */
export type KjunStackProps<T extends StackTag = "div"> = WithTag<KjunStackOwnProps, T>;

export interface KjunInlineOwnProps extends FlexOwnProps {
  /** Space between children: space.inline (xs·sm·md·lg). An object changes it with the width like Stack's gap. */
  gap?: InlineGapValue;
  align?: InlineAlign;
  /** Wrap onto new lines when the row runs out of width. Default true. */
  wrap?: boolean;
}
export type KjunInlineProps<T extends StackTag = "div"> = WithTag<KjunInlineOwnProps, T>;

export interface KjunSpacerProps {
  className?: string;
  style?: CSSProperties;
}
/** Takes the spare length of a Stack or Inline, pushing what follows to the far end: a menu at the top and a profile at the bottom. */
export function KjunSpacer({ className, style }: KjunSpacerProps) {
  return <div className={className || undefined} style={style} data-kjun-spacer="" aria-hidden="true" />;
}

const breakpoints: Record<StackBreakpoint, number> = { compact: tokens.responsive.stackCompact, medium: tokens.responsive.stackMedium, wide: tokens.responsive.stackWide };
/** The element's width while responsive="container" asks for it; undefined until the first measurement (and on the server). */
function useContainerWidth(enabled: boolean, outer: Ref<HTMLElement> | undefined) {
  const [width, setWidth] = useState<number>();
  const observer = useRef<ResizeObserver | null>(null);
  const ref = useCallback((node: HTMLElement | null) => {
    observer.current?.disconnect();
    observer.current = null;
    if (node && enabled && typeof ResizeObserver !== "undefined") {
      setWidth(node.getBoundingClientRect().width);
      observer.current = new ResizeObserver(() => setWidth(node.getBoundingClientRect().width));
      observer.current.observe(node);
    }
    if (typeof outer === "function") outer(node);
    else if (outer) (outer as { current: HTMLElement | null }).current = node;
  }, [enabled, outer]);
  return [width, ref] as const;
}
// Fragments are opened so their children count as children (dividers go between them on every platform). Keys keep the
// app's own key and the place for an unkeyed child, the same with or without a divider, so toggling it keeps child state.
function flatten(children: ReactNode, path = ""): ReactNode[] {
  return Children.toArray(children).flatMap(child => {
    if (!isValidElement<{ children?: ReactNode }>(child)) return [child];
    if (child.type === Fragment) return flatten(child.props.children, path + child.key + "/");
    return [path ? cloneElement(child, { key: path + child.key }) : child];
  });
}
const isSpacer = (child: ReactNode) => isValidElement(child) && child.type === KjunSpacer;

type FlexRenderProps = FlexOwnProps & { kind: "stack" | "inline"; gap?: StackGapValue | InlineGapValue; as?: StackTag; ref?: Ref<HTMLElement>; extra: Record<string, string | undefined> };
function useFlexElement({ kind, gap, direction, padding, paddingX, paddingY, divider, dividerInset, responsive = "viewport", justify = "start",
  as = "div", className, style, children, ref, extra, ...rest }: FlexRenderProps) {
  const measure = responsive === "container" && isResponsive(gap, direction, padding, paddingX, paddingY);
  const [width, setRef] = useContainerWidth(measure, ref);
  const { attrs, vars } = flexLayout({ kind, gap, direction, padding, paddingX, paddingY, dividerInset, width: measure ? width : undefined, breakpoints });
  const variant = dividerVariant(divider), line = isStackList(as) ? "li" : "div";
  const items = flatten(children);
  // The divider is the stack's own element between children, so no app child is restyled to draw it.
  const content = variant ? interleave(items, isSpacer, index => createElement(line, { key: "kjun-divider-" + index, "data-kjun-stack-divider": variant, "aria-hidden": true })) : items;
  return createElement(as, { ...rest, ref: measure ? setRef : ref, className: className || undefined, style: { ...vars, ...style }, ...attrs, ...extra,
    "data-justify": justify === "start" ? undefined : justify, "data-divider": variant ? "" : undefined, "data-responsive": measure ? "container" : undefined }, content);
}

/** Vertical stack (direction turns it into a row). It is not KJUN markup (a data attribute, no kjun- class), so app children keep
 * the styles they would have without it; direct form groups drop their own bottom margin. */
export function KjunStack<T extends StackTag = "div">({ align = "stretch", ...props }: KjunStackProps<T>): ReactElement {
  return useFlexElement({ ...(props as unknown as Omit<FlexRenderProps, "kind" | "extra">), kind: "stack", extra: { "data-kjun-stack": "", "data-align": align } });
}

/** Horizontal row that wraps by default. Like KjunStack it is not KJUN markup, so app children keep their own styles. */
export function KjunInline<T extends StackTag = "div">({ align = "center", wrap = true, ...props }: KjunInlineProps<T>): ReactElement {
  return useFlexElement({ ...(props as unknown as Omit<FlexRenderProps, "kind" | "extra">), kind: "inline", gap: props.gap ?? "sm",
    extra: { "data-kjun-inline": "", "data-align": align, "data-wrap": wrap ? undefined : "false" } });
}
