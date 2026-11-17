// Names shared by KjunText, KjunStack and KjunInline on every platform. Each name maps to an existing token.
/** "inherit" takes the size, line height and weight of the text around it, for a part of a sentence. */
export type TextVariant = "pageTitle" | "sectionTitle" | "cardTitle" | "bodyLg" | "body" | "bodyLong" | "label" | "labelStrong" | "meta" | "caption" | "captionStrong"
  | "numberSm" | "numberMd" | "numberLg" | "displaySm" | "displayMd" | "displayLg" | "inherit";
/** onBrand·onDanger·onSuccess·onWarning are text on a surface filled with that color; inverse is the older name of onBrand. */
export type TextTone = "default" | "secondary" | "tertiary" | "disabled" | "brand" | "danger" | "success" | "warning" | "info"
  | "inverse" | "onBrand" | "onDanger" | "onSuccess" | "onWarning";
export type TextAlign = "start" | "center" | "end";
export type TextTag = "h1" | "h2" | "h3" | "h4" | "h5" | "h6" | "p" | "span" | "div"
  | "dt" | "dd" | "li" | "label" | "legend" | "figcaption" | "time" | "strong" | "em";
export type TextDecoration = "lineThrough";
export type StackGap = "none" | "xs" | "sm" | "md" | "lg" | "section-sm" | "section-md" | "section-lg";
/** The breakpoints a stack's gap can change at: tokens.responsive.stackCompact·stackMedium·stackWide (640·768·1024 wide and up). */
export type StackBreakpoint = "compact" | "medium" | "wide";
/** One step, or a step per screen width: base below compact, then each named breakpoint and wider. */
export type StackGapValue = StackGap | ({ base?: StackGap } & Partial<Record<StackBreakpoint, StackGap>>);
export type StackAlign = "stretch" | "start" | "center" | "end";
export type StackJustify = "start" | "center" | "end" | "between";
/** Web only. ul and ol drop the list's bullets and indent; their children should be li. */
export type StackTag = "div" | "section" | "ul" | "ol" | "nav" | "header" | "footer" | "main" | "article" | "aside" | "form" | "fieldset";
export type InlineGap = "none" | "xs" | "sm" | "md" | "lg";
export type InlineAlign = "start" | "center" | "end" | "baseline" | "stretch";
export type InlineJustify = "start" | "center" | "end" | "between";

export const titleVariants: readonly TextVariant[] = ["pageTitle", "sectionTitle", "cardTitle"];
const numeric = /^(number|display)/;
const kebab = (name: string) => name.replace(/[A-Z]/g, letter => "-" + letter.toLowerCase());

/** The .kjun-type-* role class (pageTitle → kjun-type-page-title); inherit has its own class and no role. */
export const textTypeClass = (variant: TextVariant) => variant === "inherit" ? "kjun-text-inherit" : "kjun-type-" + kebab(variant);
/** Document tag when the app gives no `as`: titles are headings, numbers and inherit are inline, the rest are paragraphs. */
export const defaultTextTag = (variant: TextVariant): TextTag =>
  variant === "pageTitle" ? "h1" : variant === "sectionTitle" ? "h2" : variant === "cardTitle" ? "h3"
    : variant === "inherit" || numeric.test(variant) ? "span" : "p";
export const isNumericVariant = (variant: TextVariant) => numeric.test(variant);
/** data-tone value (onDanger → on-danger); the default tone sets no attribute. */
export const textToneAttribute = (tone: TextTone) => tone === "default" ? undefined : kebab(tone);
/** Whole line count of 1 or more, or undefined: 0, a fraction below 1, NaN and negatives do not clamp. */
export const clampLines = (maxLines: number | undefined) => {
  const lines = Math.floor(maxLines ?? 0);
  return lines >= 1 ? lines : undefined;
};

export const stackBreakpoints: readonly StackBreakpoint[] = ["compact", "medium", "wide"];
/** A gap as its steps: base (md when absent) and any breakpoint the app named. */
export function stackGapSteps(gap: StackGapValue | undefined): { base: StackGap } & Partial<Record<StackBreakpoint, StackGap>> {
  if (gap == null) return { base: "md" };
  return typeof gap === "string" ? { base: gap } : { ...gap, base: gap.base ?? "md" };
}
/** The step that applies at a width, given the breakpoint widths (Native reads the window; Web uses media queries). */
export function stackGapAt(gap: StackGapValue | undefined, width: number, breakpoints: Record<StackBreakpoint, number>): StackGap {
  const steps = stackGapSteps(gap);
  return stackBreakpoints.reduce((step, name) => width >= breakpoints[name] && steps[name] ? steps[name]! : step, steps.base);
}
/** Whether a stack's tag is a list, so its divider is an li too. */
export const isStackList = (tag: StackTag | undefined) => tag === "ul" || tag === "ol";
