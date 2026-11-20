import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import ts from "typescript";

const read = path => readFile(new URL("../" + path, import.meta.url), "utf8");
// Plain rules shared by the three layouts; transpiled here so the test needs no build.
const source = ts.transpileModule(await read("shared/package-runtime/side-navigation-layout.ts"), { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } }).outputText;
const runtime = await import("data:text/javascript;base64," + Buffer.from(source).toString("base64"));
const g = { spacesColumnWidth: 60, spacesPanelWidth: 216, spacesPanelInset: 8 };

test("the spaces column is 284 with a card panel, 276 flat and 60 with the panel collapsed", () => {
  assert.equal(runtime.spacesColumnWidth(g, "card", false), 284);
  assert.equal(runtime.spacesColumnWidth(g, "flat", false), 276);
  assert.equal(runtime.spacesColumnWidth(g, "card", true), 60);
  assert.equal(runtime.spacesColumnWidth(g, "flat", true), 60);
});

test("focus goes to the expand button when the panel closes around it or by its button, to the collapse button when a button opens it", () => {
  assert.equal(runtime.spacesFocusAfterChange(true, true, false), "expand");
  assert.equal(runtime.spacesFocusAfterChange(true, false, true), "expand");
  assert.equal(runtime.spacesFocusAfterChange(true, false, false), null);
  assert.equal(runtime.spacesFocusAfterChange(false, false, true), "collapse");
  assert.equal(runtime.spacesFocusAfterChange(false, true, false), null);
  assert.equal(runtime.spacesFocusAfterChange(false, false, false), null);
});

test("props the spaces layout ignores are named only when set", () => {
  assert.deepEqual(runtime.spacesIgnoredProps({}), []);
  assert.deepEqual(runtime.spacesIgnoredProps({ collapsed: false, railLabels: false, width: "md" }), []);
  assert.deepEqual(runtime.spacesIgnoredProps({ collapsed: true, railLabels: true, width: "lg" }), ["collapsed", "railLabels", "width"]);
});

test("tokens carry the spaces geometry and the rail colour role falls back to secondary", async () => {
  const geometry = JSON.parse(await read("packages/tokens/src/definitions/geometry-extensions.json"));
  const nav = geometry.extensions.sideNavigation;
  assert.equal(nav.spacesColumnWidth, 60);
  assert.equal(nav.spacesPanelWidth, 216);
  for (const key of ["spacesPanelInset", "spacesPanelRadius", "spacesPanelHeadHeight"]) assert.ok(nav[key]?.$ref, key + " is a $ref");
  const colors = JSON.parse(await read("packages/tokens/src/definitions/colors.json"));
  assert.ok(colors.colorRoles.includes("navigationRailBg"));
  assert.equal(colors.roleBindings["navigation-rail-bg"], "navigationRailBg");
  assert.equal(colors.colorRoleFallbacks.navigationRailBg, "secondary");
  assert.match(await read("packages/tokens/src/bindings.css"), /--_kjun-color-navigation-rail-bg: var\(--kjun-navigation-rail-bg, var\(--kjun-secondary\)\);/);
});

test("the panel messages exist in Korean and English", async () => {
  for (const [file, words] of [["ko", ["메뉴 패널", "메뉴 패널 접기", "메뉴 패널 펼치기"]], ["en", ["Menu panel", "Collapse menu panel", "Expand menu panel"]]]) {
    const text = await read(`shared/package-runtime/messages/${file}.ts`);
    for (const [key, word] of [["spacesPanel", words[0]], ["collapseSpacesPanel", words[1]], ["expandSpacesPanel", words[2]]]) assert.ok(text.includes(`${key}: "${word}"`), file + " " + key);
  }
});
