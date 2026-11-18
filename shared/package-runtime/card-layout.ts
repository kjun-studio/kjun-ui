import { tokens, type CardPadding, type CardSurface } from "@kjun-ui/tokens";

export type CardHeadingLevel = false | 2 | 3 | 4 | 5 | 6;
export type CardMediaPosition = "top" | "start";
export type CardMediaAspect = keyof typeof tokens.card.mediaAspects;

/** Which parts a card draws; each platform passes its own content checks so React nodes and Vue slots share one rule. */
export interface CardParts { header: boolean; title: boolean; subtitle: boolean; actions: boolean; body: boolean; footer: boolean; media: boolean }

/** Layout decisions every platform makes the same way. */
export function cardLayout(parts: CardParts, options: { pressable: boolean; headingLevel: CardHeadingLevel; surface: CardSurface; padding: CardPadding; mediaPosition: CardMediaPosition }) {
  const heading = parts.header || parts.title || parts.subtitle;
  return {
    heading,
    header: heading || parts.actions,
    /** A title drawn from the title prop (not a custom header) keeps a minimum width beside its actions and aligns them to its first line. */
    titled: heading && !parts.header,
    /** A pressable card is one button, whose content is not a heading. */
    titleLevel: (!options.pressable && options.headingLevel ? options.headingLevel : false) as CardHeadingLevel,
    /** A tinted surface lifts its badges onto the plain surface colour. */
    tinted: options.surface !== "default" && options.surface !== "glass",
    /** Without a divider the header sits a step closer to the body than to the card edge. */
    headerGap: tokens.card.headerGaps[options.padding],
    sideMedia: parts.media && options.mediaPosition === "start",
  };
}

let deviceLinkWarned = false;
/** Development only, once: Native on a device does not follow href, so a link card there needs onPress. */
export function warnCardDeviceLink(deviceLink: boolean) {
  let development = false;
  try { development = !!process.env.NODE_ENV && process.env.NODE_ENV !== "production"; } catch { /* no process */ }
  if (!development || !deviceLink || deviceLinkWarned) return;
  deviceLinkWarned = true;
  console.warn("KJUN Card: href only navigates on the web; on a device pass onPress and navigate with the app's router.");
}
