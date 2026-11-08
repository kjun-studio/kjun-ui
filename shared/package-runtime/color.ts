// Color values for KjunColorPicker: hex parsing and formatting and HSV conversion. The values are data the app owns, not theme colors.
export type Rgba = { r: number; g: number; b: number; a: number };
export type Hsv = { h: number; s: number; v: number };

const clamp = (n: number, min: number, max: number) => Math.min(max, Math.max(min, n));
const hex2 = (n: number) => Math.round(clamp(n, 0, 255)).toString(16).toUpperCase().padStart(2, "0");

/** Reads #RGB, #RGBA, #RRGGBB or #RRGGBBAA, with or without #, in any case. */
export function parseColor(text: string): Rgba | null {
  if (typeof text !== "string") return null;
  let t = text.trim().replace(/^#/, "");
  if (!/^[0-9a-f]+$/i.test(t) || ![3, 4, 6, 8].includes(t.length)) return null;
  if (t.length < 5) t = [...t].map(c => c + c).join("");
  const n = (i: number) => parseInt(t.slice(i, i + 2), 16);
  return { r: n(0), g: n(2), b: n(4), a: t.length === 8 ? n(6) / 255 : 1 };
}

/** Uppercase #RRGGBB, or #RRGGBBAA when alpha is on. */
export function formatColor(c: Rgba, alpha: boolean): string {
  return "#" + hex2(c.r) + hex2(c.g) + hex2(c.b) + (alpha ? hex2(c.a * 255) : "");
}

/** The picker's value form of anything, or null for an invalid or empty value. */
export function normalizeColor(value: unknown, alpha: boolean): string | null {
  const c = typeof value === "string" ? parseColor(value) : null;
  return c ? formatColor(c, alpha) : null;
}

export function sameColor(a: string | null, b: string | null, alpha: boolean): boolean {
  return normalizeColor(a, alpha) === normalizeColor(b, alpha);
}

export function rgbToHsv({ r, g, b }: Rgba): Hsv {
  const R = r / 255, G = g / 255, B = b / 255, max = Math.max(R, G, B), d = max - Math.min(R, G, B);
  let h = 0;
  if (d) h = max === R ? ((G - B) / d) % 6 : max === G ? (B - R) / d + 2 : (R - G) / d + 4;
  h *= 60;
  return { h: h < 0 ? h + 360 : h, s: max ? d / max : 0, v: max };
}

export function hsvToRgb({ h, s, v }: Hsv, a = 1): Rgba {
  const f = (n: number) => { const k = (n + h / 60) % 6; return Math.round((v - v * s * Math.max(0, Math.min(k, 4 - k, 1))) * 255); };
  return { r: f(5), g: f(3), b: f(1), a };
}

/** Which ink reads on a color: dark on light colors, light on dark ones (WCAG relative luminance). Mostly transparent colors take dark ink over the light checkerboard. */
export function readableInk(value: string): "light" | "dark" {
  const c = parseColor(value);
  if (!c) return "dark";
  const lin = (n: number) => { const x = n / 255; return x <= 0.03928 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4; };
  const l = 0.2126 * lin(c.r) + 0.7152 * lin(c.g) + 0.0722 * lin(c.b);
  return c.a < 0.5 || l > 0.4 ? "dark" : "light";
}
