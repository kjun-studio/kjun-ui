import { colorRoles, type KjunColors } from "@kjun-ui/tokens";

// An arbitrary consuming app, independent of the documentation's palettes.
export const appColors = {
  ...Object.fromEntries(colorRoles.map((role) => [role, "#445566"])),
  brand: "#1256A8",
  brandHover: "#2468BA",
  brandActive: "#13579B",
  surface: "#E3EEF9",
  text: "#0B1723",
  inverse: "#FFFFFF",
  overlay: "rgba(12, 34, 56, 0.4)",
  shadow: "rgba(12, 34, 56, 0.2)",
} as KjunColors;
export const scopedColors = (changed: boolean): KjunColors => ({
  ...appColors,
  brand: changed ? "#8C2359" : "#176B47",
  brandHover: changed ? "#9C3369" : "#277B57",
  brandActive: changed ? "#7C1349" : "#075B37",
  surface: changed ? "#F9E3EE" : "#E3F9EE",
  danger: changed ? "#B91C1C" : "#9F1239",
});
export const scopedFont = (changed: boolean) =>
  changed ? "serif" : "monospace";
export const cssValues = (colors: KjunColors, font = "monospace") =>
  Object.fromEntries([
    ...Object.entries(colors).map(([role, value]): [string, string] => [
      "--kjun-" + role.replace(/[A-Z]/g, (c) => "-" + c.toLowerCase()),
      value,
    ]),
    ["--kjun-font", font],
  ]);
export function setRootValues() {
  for (const [name, value] of Object.entries(cssValues(appColors)))
    document.documentElement.style.setProperty(name, value);
}
