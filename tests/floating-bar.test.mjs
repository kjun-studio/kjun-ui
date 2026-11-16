import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = path => readFile(new URL("../" + path, import.meta.url), "utf8");
const css = await read("packages/tokens/src/extensions.css"), tokens = JSON.parse(await read("packages/tokens/src/tokens.json"));
const rules = css.split("}").filter(rule => rule.includes("[data-variant=floating]"));

test("the floating bar is a capsule on KjunFloatingNavigation's own tokens", () => {
  const capsule = rules.find(rule => rule.includes("> .kjun-bottom-action-content {"));
  for (const part of ["padding:var(--_kjun-extension-floating-navigation-padding)", "border-radius:var(--_kjun-extension-floating-navigation-radius)",
    "var(--_kjun-floating-navigation-elevation)", "0 0 0 var(--_kjun-border-default-width) var(--_kjun-color-border)"]) assert.ok(capsule.includes(part), part);
  assert.match(css, /\.kjun-bottom-action-bar\[data-variant=floating\] \{ background:transparent; padding:0 var\(--_kjun-extension-floating-navigation-offset\); \}/);
  // No dimension of its own: the variant adds no token and no literal length.
  for (const rule of rules) assert.doesNotMatch(rule.split("{")[1] ?? "", /\d+px/, rule);
});

test("padding 6 around lg buttons makes the 60 tall bar", () => {
  const { padding } = tokens.extensions.floatingNavigation;
  assert.equal(2 * padding + tokens.button.heights.lg, 60);
});

test("the capsule never wraps: the description is one line and the actions keep theirs", () => {
  const description = rules.find(rule => rule.includes("> p {"));
  for (const part of ["white-space:nowrap", "overflow:hidden", "text-overflow:ellipsis"]) assert.ok(description.includes(part), part);
  assert.match(css, /\[data-variant=floating\] > \.kjun-bottom-action-content > \.kjun-navigation-actions \{ flex:0 0 auto; flex-wrap:nowrap; \}/);
});

test("every platform gives the bar's buttons the lg size and the pill shape through context", async () => {
  const shared = await read("shared/package-runtime/action-size.ts");
  assert.match(shared, /export const ActionShapeContext = createContext<"pill" \| null>\(null\);/);
  for (const platform of ["react", "native"]) {
    const bar = await read(`packages/${platform}/src/app-navigation.tsx`);
    assert.match(bar, /<ActionSizeContext\.Provider value="lg"><ActionShapeContext\.Provider value="pill">/, platform);
    assert.match(await read(`packages/${platform}/src/button.tsx`), /pill = useActionPill\(shape\)/, platform);
  }
  assert.match(await read("packages/vue3/src/app-navigation.tsx"), /<KjunActionSize size="lg" shape="pill">/);
  assert.match(await read("packages/vue3/src/button.tsx"), /inheritedShape\?\.value === "pill"/);
});
