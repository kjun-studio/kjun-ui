import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { coreColorRoles, colorRoles, colorRoleFallbacks, resolveKjunColors } from "../packages/tokens/dist/index.js";
import { createVueStyleTheme } from "../packages/vue2/style-theme.mjs";
const core = () => Object.fromEntries(coreColorRoles.map(role => [role, `app-${role}`]));

test("core colors resolve every optional role without supplying a package palette", () => {
  const app = Object.freeze(core()), resolved = resolveKjunColors(app);
  assert.equal(coreColorRoles.length, 27);
  assert.equal(Object.keys(colorRoleFallbacks).length, colorRoles.length - coreColorRoles.length);
  assert.deepEqual(new Set(Object.keys(resolved)), new Set(colorRoles));
  assert.ok(Object.values(resolved).every(value => Object.values(app).includes(value)));
  assert.equal(resolved.inputBorderFocus, app.focusRing);
  assert.equal(resolved.chartTooltipBg, app.text);
  assert.equal(resolved.cardAccentStart, app.secondary);
  assert.equal(resolved.cardAccentEnd, app.surface);
  assert.equal(resolved.cardSubtleStart, app.secondary);
  assert.equal(resolved.cardSubtleEnd, app.surface);
  assert.equal(resolved.cardSubtleBorder, app.border);
  assert.equal(Object.keys(app).length, 27);
});

test("card role overrides retain project values without exposing retired names", () => {
  const app = { ...core(), cardAccentStart: "app-emphasis", cardSubtleBorder: "app-outline" };
  const resolved = resolveKjunColors(app);
  assert.equal(resolved.cardAccentStart, app.cardAccentStart);
  assert.equal(resolved.cardSubtleBorder, app.cardSubtleBorder);
  assert.equal(resolved.cardAccentEnd, app.surface);
  for (const name of ["cardBlueStart", "cardBlueEnd", "cardIndigoStart", "cardIndigoEnd", "cardIndigoBorder"])
    assert.ok(!colorRoles.includes(name));
});

test("optional overrides and native ColorValue objects survive role resolution", () => {
  const dynamic = Object.freeze({ dynamic: { light: "app-light", dark: "app-dark" } });
  const app = { ...core(), dangerBg: dynamic, chartGrid: "app-grid" };
  const resolved = resolveKjunColors(app);
  assert.equal(resolved.dangerBg, dynamic);
  assert.equal(resolved.dangerLight, dynamic);
  assert.equal(resolved.dangerLightEnd, dynamic);
  assert.equal(resolved.chartGrid, "app-grid");
  const complete = Object.fromEntries(colorRoles.map(role => [role, `app-${role}`]));
  assert.deepEqual(resolveKjunColors(complete), complete);
  assert.equal(resolveKjunColors({ ...app, focusRing: "updated-focus" }).inputBorderFocus, "updated-focus");
});

test("missing required colors still fail even when component overrides are supplied", () => {
  assert.throws(() => resolveKjunColors(undefined), /Missing KJUN colors/);
  assert.throws(() => resolveKjunColors({ ...core(), focusRing: undefined, inputBorderFocus: "app-input" }), /focusRing/);
  assert.throws(() => resolveKjunColors({ ...core(), brand: "" }), /brand/);
});

test("Vue utility geometry follows current KJUN tokens independently of historical settings", async () => {
  const tokens = JSON.parse(await readFile("packages/tokens/src/tokens.json", "utf8"));
  const utilities = JSON.parse(await readFile("packages/vue2/style-utilities.json", "utf8"));
  tokens.button.radius = 17;
  tokens.layers.page.navigation = 4321;
  tokens.card.radii.md = 20;
  tokens.dimension.value18 = 18;
  const theme = createVueStyleTheme(tokens, utilities);
  assert.equal(theme.extend.borderRadius.button, "17px");
  assert.equal(theme.extend.zIndex.navigation, "4321");
  assert.equal(theme.extend.borderRadius.card, "20px");
  assert.equal(theme.extend.spacing["4"], "16px");
  assert.equal(theme.extend.spacing["4.5"], "18px");
  assert.equal(theme.extend.fontFamily.sans[0], "var(--kjun-font)");
});
