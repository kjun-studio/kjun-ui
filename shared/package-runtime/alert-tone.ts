/**
 * Color roles a soft-fill Alert paints per tone. Info has no fill role: it uses a translucent text tint so it
 * stays visible on any page background; the semantic tones carry the color, titles stay on the text role.
 */
export function alertToneRoles(tone: string): { bg: string | null; icon: string } {
  if (tone === "primary") return { bg: "brand-subtle-bg", icon: "brand" };
  if (tone === "info") return { bg: null, icon: "text" };
  return { bg: tone + "-bg", icon: tone + "-accent" };
}

export const alertIcons: Record<string, string> = {
  info: "info-circle",
  primary: "info-circle",
  success: "circle-check",
  warning: "alert-triangle",
  danger: "alert-circle",
};

/** Native has no color-mix: tints a hex or rgb() color with alpha, or returns undefined for other formats. */
export function tintColor(color: string, alpha: number): string | undefined {
  const value = color.trim();
  let channels: number[] | undefined;
  const hex = /^#([0-9a-f]{3,4}|[0-9a-f]{6}|[0-9a-f]{8})$/i.exec(value)?.[1];
  if (hex) {
    const full = hex.length <= 4 ? [...hex].map(c => c + c).join("") : hex;
    channels = [0, 2, 4].map(i => parseInt(full.slice(i, i + 2), 16));
  } else {
    const rgb = /^rgba?\(\s*([\d.]+)[\s,]+([\d.]+)[\s,]+([\d.]+)/i.exec(value);
    if (rgb) channels = rgb.slice(1, 4).map(Number);
  }
  return channels && `rgba(${channels.join(", ")}, ${alpha})`;
}
