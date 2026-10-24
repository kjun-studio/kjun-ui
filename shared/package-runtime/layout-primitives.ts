// Names shared by KjunText, KjunStack and KjunInline on every platform. Each name maps to an existing token.
export type TextVariant = "pageTitle" | "sectionTitle" | "cardTitle" | "body" | "label" | "meta" | "caption"
  | "numberSm" | "numberMd" | "numberLg" | "displaySm" | "displayMd" | "displayLg";
export type TextTone = "default" | "secondary" | "tertiary" | "disabled" | "brand" | "danger" | "success" | "warning" | "inverse";
export type TextAlign = "start" | "center" | "end";
export type TextTag = "h1" | "h2" | "h3" | "h4" | "h5" | "h6" | "p" | "span" | "div";
export type StackGap = "none" | "sm" | "md" | "lg" | "section-sm" | "section-md" | "section-lg";
export type StackAlign = "stretch" | "start" | "center" | "end";
export type InlineGap = "none" | "xs" | "sm" | "md" | "lg";
export type InlineAlign = "start" | "center" | "end" | "baseline" | "stretch";
export type InlineJustify = "start" | "center" | "end" | "between";

export const titleVariants: readonly TextVariant[] = ["pageTitle", "sectionTitle", "cardTitle"];
const numeric = /^(number|display)/;

/** The .kjun-type-* role class (pageTitle → kjun-type-page-title). */
export const textTypeClass = (variant: TextVariant) => "kjun-type-" + variant.replace(/[A-Z]/g, letter => "-" + letter.toLowerCase());
/** Document tag when the app gives no `as`: titles are headings, numbers are inline, the rest are paragraphs. */
export const defaultTextTag = (variant: TextVariant): TextTag =>
  variant === "pageTitle" ? "h1" : variant === "sectionTitle" ? "h2" : variant === "cardTitle" ? "h3" : numeric.test(variant) ? "span" : "p";
export const isNumericVariant = (variant: TextVariant) => numeric.test(variant);
