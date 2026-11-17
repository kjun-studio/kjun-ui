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
/** space.stack (xs 4 · sm 8 · smMd 12 · md 16 · lg 24) and space.section (sectionSm 32 · sectionMd 48 · sectionLg 64). */
export type StackGap = "none" | "xs" | "sm" | "smMd" | "md" | "lg" | "sectionSm" | "sectionMd" | "sectionLg";
/** Earlier spellings of the section steps; they still work and warn once in development. */
export type LegacyStackGap = "section-sm" | "section-md" | "section-lg";
/** The breakpoints a responsive value can change at: tokens.responsive.stackCompact·stackMedium·stackWide (640·768·1024 wide and up). */
export type StackBreakpoint = "compact" | "medium" | "wide";
/** One value, or a value per width: base below compact, then each named breakpoint and wider. */
export type Responsive<T> = T | ({ base?: T } & Partial<Record<StackBreakpoint, T>>);
export type StackGapValue = Responsive<StackGap | LegacyStackGap>;
export type StackAlign = "stretch" | "start" | "center" | "end";
export type StackJustify = "start" | "center" | "end" | "between";
/** Web only. ul and ol drop the list's bullets and indent; their children should be li. */
export type StackTag = "div" | "section" | "ul" | "ol" | "nav" | "header" | "footer" | "main" | "article" | "aside" | "form" | "fieldset";
/** column stacks children, row lines them up; Stack starts as column and Inline as row. */
export type FlexDirection = "column" | "row";
export type DirectionValue = Responsive<FlexDirection>;
/** space.inset: sm 12 · md 16 · lg 24. */
export type InsetStep = "none" | "sm" | "md" | "lg";
export type PaddingValue = Responsive<InsetStep>;
/** true or "full" is a hairline across the stack, "inset" starts it after dividerInset, "strong" is a band for sections. */
export type StackDivider = boolean | "full" | "inset" | "strong";
/** viewport follows the screen width (CSS media queries, right on the first paint); container measures the element itself. */
export type ResponsiveBasis = "viewport" | "container";
export type InlineGap = "none" | "xs" | "sm" | "md" | "lg";
export type InlineGapValue = Responsive<InlineGap>;
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
/** A responsive value as its steps: base (the fallback when absent) and any breakpoint the app named. */
export type Steps<T> = { base: T } & Partial<Record<StackBreakpoint, T>>;
export function responsiveSteps<T>(value: Responsive<T> | undefined, fallback: T): Steps<T> {
  if (value == null) return { base: fallback };
  if (typeof value !== "object") return { base: value as T };
  const { base, ...rest } = value as { base?: T } & Partial<Record<StackBreakpoint, T>>;
  const steps: Steps<T> = { base: base ?? fallback };
  for (const name of stackBreakpoints) if (rest[name] != null) steps[name] = rest[name];
  return steps;
}
/** The step that applies at a width: the widest breakpoint the width reaches wins over base. */
export function stepAt<T>(steps: Steps<T>, width: number, breakpoints: Record<StackBreakpoint, number>): T {
  return stackBreakpoints.reduce<T>((step, name) => width >= breakpoints[name] && steps[name] != null ? steps[name]! : step, steps.base);
}

declare const process: { env: { NODE_ENV?: string } };
const developmentMode = () => { try { return !!process.env.NODE_ENV && process.env.NODE_ENV !== "production"; } catch { return false; } };
const legacyGap: Record<LegacyStackGap, StackGap> = { "section-sm": "sectionSm", "section-md": "sectionMd", "section-lg": "sectionLg" };
let warnedLegacyGap = false;
/** sectionSm for the earlier section-sm spelling, with one development warning. */
export function stackGapName(step: StackGap | LegacyStackGap): StackGap {
  if (!(step in legacyGap)) return step as StackGap;
  if (!warnedLegacyGap && developmentMode()) {
    warnedLegacyGap = true;
    console.warn(`[KJUN] KjunStack gap="${step}" is now "${legacyGap[step as LegacyStackGap]}"; the old spelling still works.`);
  }
  return legacyGap[step as LegacyStackGap];
}
/** A gap as its steps: base (md when absent) and any breakpoint the app named, in the current spelling. */
export function stackGapSteps(gap: StackGapValue | undefined): Steps<StackGap> {
  const steps = responsiveSteps<StackGap | LegacyStackGap>(gap, "md"), out: Steps<StackGap> = { base: stackGapName(steps.base) };
  for (const name of stackBreakpoints) if (steps[name]) out[name] = stackGapName(steps[name]!);
  return out;
}
/** The step that applies at a width, given the breakpoint widths (Native reads the window; Web uses media queries). */
export function stackGapAt(gap: StackGapValue | undefined, width: number, breakpoints: Record<StackBreakpoint, number>): StackGap {
  return stepAt(stackGapSteps(gap), width, breakpoints);
}
/** Whether a stack's tag is a list, so its divider is an li too. */
export const isStackList = (tag: StackTag | undefined) => tag === "ul" || tag === "ol";
/** "full" for true, the variant for a string, undefined when off. */
export const dividerVariant = (divider: StackDivider | undefined): "full" | "inset" | "strong" | undefined =>
  divider === true ? "full" : divider ? divider : undefined;

/** Puts a separator between neighbouring children; none next to a spacer, which already parts them. */
export function interleave<T>(items: readonly T[], isSpacer: (item: T) => boolean, separator: (index: number) => T): T[] {
  return items.flatMap((item, index) => index && !isSpacer(item) && !isSpacer(items[index - 1]) ? [separator(index), item] : [item]);
}

// Web: each step is a token variable, so the CSS only switches which variable applies at each breakpoint.
const kebabStep = (name: string) => kebab(name);
/** The CSS value of a stack gap step: a space.stack or space.section token variable. */
export const stackGapCss = (step: StackGap) => step === "none" ? "0px"
  : step.startsWith("section") ? `var(--_kjun-geometry-space-section-${kebabStep(step.slice(7)).replace(/^-/, "")})`
    : `var(--_kjun-geometry-space-stack-${kebabStep(step)})`;
export const inlineGapCss = (step: InlineGap) => step === "none" ? "0px" : `var(--_kjun-geometry-space-inline-${step})`;
export const insetCss = (step: InsetStep) => step === "none" ? "0px" : `var(--_kjun-geometry-space-inset-${step})`;

export interface FlexLayoutInput {
  kind: "stack" | "inline";
  gap?: StackGapValue | InlineGapValue;
  direction?: DirectionValue;
  padding?: PaddingValue;
  paddingX?: PaddingValue;
  paddingY?: PaddingValue;
  dividerInset?: InsetStep;
  /** The measured width for responsive="container"; every responsive value then resolves to one step. */
  width?: number;
  breakpoints?: Record<StackBreakpoint, number>;
}
type Attrs = Record<string, string | undefined>;
/** Web attributes and style variables for a Stack or Inline: data-* names the steps (and turns on the breakpoint rules),
 * --_kjun-flex-* holds the token variable of each step. */
export function flexLayout(input: FlexLayoutInput): { attrs: Attrs; vars: Record<string, string> } {
  const stack = input.kind === "stack";
  const gap: Steps<string> = stack ? stackGapSteps(input.gap as StackGapValue) : responsiveSteps<InlineGap>(input.gap as InlineGapValue, "sm");
  const direction = responsiveSteps<FlexDirection>(input.direction, stack ? "column" : "row");
  const padding = responsiveSteps<InsetStep>(input.padding, "none");
  const pick = (own: PaddingValue | undefined) => own == null ? padding : responsiveSteps<InsetStep>(own, "none");
  const px = pick(input.paddingX), py = pick(input.paddingY);
  const measured = input.width != null && input.breakpoints;
  // In container mode the measured width picks one step, written as base, so no media rule applies.
  const flat = <T,>(steps: Steps<T>): Steps<T> => measured ? { base: stepAt(steps, input.width!, input.breakpoints!) } : steps;
  const g = flat(gap), d = flat(direction), x = flat(px), y = flat(py);
  const gapCss = (step: string) => stack ? stackGapCss(step as StackGap) : inlineGapCss(step as InlineGap);
  const attrs: Attrs = { "data-gap": g.base, "data-direction": d.base };
  const vars: Record<string, string> = { "--_kjun-flex-gap-base": gapCss(g.base) };
  const hasPadding = [x, y].some(steps => [steps.base, ...stackBreakpoints.map(name => steps[name])].some(step => step && step !== "none"));
  if (hasPadding) Object.assign(vars, { "--_kjun-flex-px-base": insetCss(x.base), "--_kjun-flex-py-base": insetCss(y.base) }), attrs["data-padding"] = "";
  for (const name of stackBreakpoints) {
    if (g[name]) attrs["data-gap-" + name] = g[name], vars["--_kjun-flex-gap-" + name] = gapCss(g[name]!);
    if (d[name]) attrs["data-direction-" + name] = d[name];
    if (hasPadding && x[name]) attrs["data-px-" + name] = x[name], vars["--_kjun-flex-px-" + name] = insetCss(x[name]!);
    if (hasPadding && y[name]) attrs["data-py-" + name] = y[name], vars["--_kjun-flex-py-" + name] = insetCss(y[name]!);
  }
  if (input.dividerInset && input.dividerInset !== "md") vars["--_kjun-flex-divider-inset"] = insetCss(input.dividerInset);
  return { attrs, vars };
}
/** Whether any value changes with the width, so container mode has something to measure. */
export const isResponsive = (...values: unknown[]) => values.some(value => value != null && typeof value === "object");
