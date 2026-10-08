import { readFile, writeFile, mkdir } from "node:fs/promises";
import { resolve, dirname } from "node:path";
const root = resolve(import.meta.dirname, "..");
import { readTokenDefinitions, compileTokens, colorExpression, shadowCss, typographyCss, extensionGeometryCss, kebab } from "./token-model.mjs";
import { tokenCssUnit } from "./token-validation.mjs";
const definitions = await readTokenDefinitions(root);
const data = compileTokens(definitions);
const expression = role => colorExpression(data, role);
const css =
  "/* Project-owned values; package defines bindings only. */\n.kjun-scope {\n" +
  [...data.colorRoles, ...data.domainColorRoles]
    .map(role => `  --_kjun-color-${kebab(role)}: ${expression(role)};`).join("\n") + "\n" +
  Object.entries(data.roleBindings)
    .map(([key, value]) => `  --${key}: var(--${value === "font" ? "kjun" : "_kjun-color"}-${kebab(value)});`)
    .join("\n") +
  `\n  --font-numeric: var(--kjun-font-numeric, var(--kjun-font));\n  --control-label-size: var(--_kjun-type-control-size);\n  --radius-card: ${data.card.radii.md}px;\n  --kpi-value-size: var(--_kjun-type-display-lg-size);\n  --kpi-value-size-mobile: var(--_kjun-type-display-md-size);\n  --font-medium: var(--_kjun-type-label-weight);\n  --font-semibold: var(--_kjun-type-control-weight);\n` +
  Object.entries(data.elevation)
    .map(([key, value]) => `  --_kjun-elevation-${key}: ${shadowCss(value)};`)
    .join("\n") +
  "\n" +
  Object.entries(data.motion)
    .map(([key, value]) =>
      typeof value === "number"
        ? `  --motion-${kebab(key)}: ${value}ms;`
        : `  --${kebab(key)}: ${value};`
    )
    .join("\n") +
  "\n" + Object.entries(data.layers.page).map(([key,value]) => `  --_kjun-layer-page-${kebab(key)}: ${value};`).join("\n") +
  "\n" + componentElevationCss() + "\n" + extensionGeometryCss(data, definitions) +
  "\n" + Object.entries(data.states.opacity).map(([key, value]) => `  --_kjun-state-opacity-${kebab(key)}: ${value};`).join("\n") +
  "\n" + Object.entries(data.states.focus).map(([key, value]) => `  --_kjun-state-focus-${kebab(key)}: ${value}px;`).join("\n") +
  "\n" + Object.entries(data.border).map(([key, value]) => `  --_kjun-border-${kebab(key)}: ${value}px;`).join("\n") +
  "\n" + Object.entries(data.motionDistance).map(([key, value]) => `  --_kjun-motion-distance-${kebab(key)}: ${value}px;`).join("\n") +
  "\n  font-family: var(--kjun-font); color: var(--kjun-text);\n}\n";
function componentElevationCss() {
  const lines = [];
  function visit(value, path) {
    if (Array.isArray(value)) {
      lines.push(`  --_kjun-${path.map(kebab).join('-')}: ${shadowCss(value)};`);
    } else if (value && typeof value === 'object') for (const [key, child] of Object.entries(value)) visit(child, [...path, key]);
  }
  visit(data.card.elevation, ['card', 'elevation']);
  visit(data.modal.elevation, ['modal', 'elevation']);
  for (const [name, value] of Object.entries(data.extensions)) if (value.elevation) visit(value.elevation, [name, 'elevation']);
  for (const direction of ['left', 'right', 'top', 'bottom']) {
    const layers = data.extensions.drawer.elevation.map(layer => ({ ...layer,
      offsetX: direction === 'left' ? layer.offsetY : direction === 'right' ? -layer.offsetY : layer.offsetX,
      offsetY: direction === 'bottom' ? -layer.offsetY : direction === 'top' ? layer.offsetY : layer.offsetX,
    }));
    lines.push(`  --_kjun-drawer-elevation-${direction}: ${shadowCss(layers)};`);
  }
  return lines.join('\n');
}
const geometryVars = [];
function geometry(value, path) {
  // Typography and durations have their own unit-aware bindings above.
  if (["fontSizes","typography","weight","loadingMinimum"].includes(path.at(-1))) return;
  if (typeof value === "number") {
    const unit = path[1] === 'itemRadii' ? 'px' : tokenCssUnit(definitions, path.join('.'));
    geometryVars.push(`  --_kjun-geometry-${path.map(kebab).join("-")}: ${unit === 'rem' ? value / 16 : value}${unit};`);
  }
  else if (value && typeof value === "object" && !Array.isArray(value)) for (const [k,v] of Object.entries(value)) geometry(v, [...path,k]);
}
for (const group of ["button","buttonGroup","input","modal","card","table","dimension","radius","native","space","shape"]) geometry(data[group], [group]);
const geometryCss = "\n.kjun-scope {\n" + geometryVars.join("\n") + "\n}\n";
const cardCss = Object.entries(data.cardSurfaces).map(([name, surface]) => {
  const color = role => `var(--_kjun-color-${kebab(role)})`;
  return `.kjun-scope .kjun-card[data-surface="${name}"] {\n` +
    `  --_kjun-card-background: ${surface.gradientEnd ? `linear-gradient(135deg, ${color(surface.background)}, ${color(surface.gradientEnd)})` : color(surface.background)};\n` +
    `  --_kjun-card-text: ${color(surface.text)};\n  --_kjun-card-description: ${color(surface.description)};\n  --_kjun-card-border: ${color(surface.border)};\n}\n`;
}).join('');
const source = `export const tokens = ${JSON.stringify(data)} as const;
export { colorRoles, coreColorRoles, domainColorRoles, colorRoleFallbacks } from "./color-roles";
export * from "./colors";
export interface ShadowLayer { readonly offsetX: number; readonly offsetY: number; readonly blurRadius: number; readonly spreadDistance: number; readonly inset: boolean; readonly colorRole: import("./color-roles").ColorRole }
export type ElevationRole = keyof typeof tokens.elevation;
export type CardElevation = keyof typeof tokens.card.elevation;
export type CardPadding = keyof typeof tokens.card.padding;
export type CardRadius = keyof typeof tokens.card.radii;
export type CardSurface = keyof typeof tokens.cardSurfaces;
export type TypographyRole = keyof typeof tokens.typography;
export interface TypographyToken { fontSizePx: number; lineHeightPx: number; fontWeight: 400 | 500 | 600 | 700; letterSpacingEm: number }
export {initialQueryDisplay,advanceQueryDisplay,queryDisplayStatus} from "./query-state";
export type {QueryDisplayProps,QueryDisplayState} from "./query-state";
export * from "./input-contract";
export * from "./table-contract";
export { createFeedbackController } from "./feedback";
export type { KjunFeedback, ToastOptions, ToastItem, ConfirmOptions, PromptOptions, FeedbackRequest } from "./feedback";
export type ButtonSize = keyof typeof tokens.button.heights;
export type InputSize = keyof typeof tokens.input;
export type ButtonVariant = typeof tokens.button.variants[number];
`;
const outputs = {
  "packages/tokens/src/index.ts": source,
  "packages/tokens/src/tokens.json": JSON.stringify(data, null, 2) + "\n",
  "packages/tokens/src/typography.css": typographyCss(data),
  "packages/tokens/src/color-roles.ts": "// Generated from definitions/colors.json by scripts/tokens.mjs.\n" +
    ["colorRoles", "coreColorRoles", "domainColorRoles", "colorRoleFallbacks"].map(key => `export const ${key} = ${JSON.stringify(data[key])} as const;`).join("\n") +
    "\nexport type ColorRole = typeof colorRoles[number];\nexport type CoreColorRole = typeof coreColorRoles[number];\nexport type DomainColorRole = typeof domainColorRoles[number];\n",
  "packages/tokens/src/bindings.css": css + geometryCss + cardCss,
  "apps/docs/lib/generated/tokens.json": JSON.stringify(data, null, 2) + "\n",
  "apps/docs/lib/generated/component-catalog.json": await readFile(
    resolve(root, "shared/component-catalog.json"),
    "utf8"
  ),
};
for (const [path, contents] of Object.entries(outputs)) {
  const target = resolve(root, path);
  if (process.argv.includes("--check")) {
    if ((await readFile(target, "utf8").catch(() => null)) !== contents)
      throw Error(path + " is out of date. Run tokens:generate.");
  } else {
    await mkdir(dirname(target), { recursive: true });
    await writeFile(target, contents);
  }
}
console.log(
  process.argv.includes("--check")
    ? "Generated contracts are current."
    : "Generated typed contracts, bindings and documentation data."
);
