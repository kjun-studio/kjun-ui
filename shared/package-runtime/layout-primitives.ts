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
export type StackGap = "none" | "sm" | "md" | "lg" | "section-sm" | "section-md" | "section-lg";
export type StackAlign = "stretch" | "start" | "center" | "end";
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
