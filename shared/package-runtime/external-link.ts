/** Only http(s) URLs open; anything else ("javascript:", relative paths, typos) yields "". */
export function safeExternalUrl(href: string) {
  try {
    const url = new URL(href);
    return ["http:", "https:"].includes(url.protocol) ? url.href : "";
  } catch {
    return "";
  }
}
/** An icon-only link's name: the app's label, or the generic one. A text link is named by its own text. */
export function externalLinkIconName(label: string | undefined, fallback: string) {
  return label || fallback;
}
