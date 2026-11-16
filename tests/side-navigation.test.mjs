import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import ts from "typescript";

const read = path => readFile(new URL("../" + path, import.meta.url), "utf8");
// The runtime is plain data handling; it is transpiled here (with the badge rules it imports) so the test needs no build.
const transpile = async path => ts.transpileModule(await read(path), { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } }).outputText;
const moduleUrl = source => "data:text/javascript;base64," + Buffer.from(source).toString("base64");
const badges = moduleUrl(await transpile("shared/package-runtime/navigation-badge.ts"));
const runtime = await import(moduleUrl((await transpile("shared/package-runtime/side-navigation.ts")).replace('"./navigation-badge"', JSON.stringify(badges))));
const link = (key, extra = {}) => ({ key, label: key, href: "#" + key, ...extra });
const entries = [link("home"), link("tasks"), { title: "문서", items: [{ key: "projects", label: "프로젝트", children: [link("brand"), link("checkout")] }, link("archive")] }, link("help"), { title: "관리", items: [link("settings")] }];

test("loose items between groups form untitled sections, in order", () => {
  const sections = runtime.sideNavigationSections(entries);
  assert.deepEqual(sections.map(section => [section.title ?? null, section.items.map(item => item.key)]),
    [[null, ["home", "tasks"]], ["문서", ["projects", "archive"]], [null, ["help"]], ["관리", ["settings"]]]);
  assert.deepEqual(runtime.sideNavigationSections([]), []);
});

test("the parent of the current destination starts open, and only that one", () => {
  assert.deepEqual(runtime.sideNavigationCurrentParents(entries, "checkout"), ["projects"]);
  assert.deepEqual(runtime.sideNavigationCurrentParents(entries, "home"), []);
  assert.deepEqual(runtime.sideNavigationCurrentParents(entries, undefined), []);
  // A parent's own key is not a destination.
  assert.deepEqual(runtime.sideNavigationCurrentParents(entries, "projects"), []);
});

test("toggling a parent adds or removes it without touching the others", () => {
  assert.deepEqual(runtime.toggleSideParent(["a"], "b"), ["a", "b"]);
  assert.deepEqual(runtime.toggleSideParent(["a", "b"], "a"), ["b"]);
});

test("the current item is a fill and a weight, never an accent stripe", async () => {
  const css = await read("packages/tokens/src/extensions.css");
  const rules = css.split("}").filter(rule => rule.includes(".kjun-side-navigation"));
  const current = rules.find(rule => rule.trim().startsWith(".kjun-side-navigation-item[aria-current]{"));
  assert.match(current, /background:var\(--_kjun-color-selected-bg\)/);
  assert.match(current, /font-weight:var\(--_kjun-type-control-weight\)/);
  for (const rule of rules) {
    assert.doesNotMatch(rule, /border-(left|inline-start)|::before|::after/, rule.trim().slice(0, 60));
    assert.doesNotMatch(rule.split("{")[1] ?? "", /\d+px/, rule.trim().slice(0, 60));
  }
});

test("every platform takes its menu rules from the shared runtime", async () => {
  // Markup and geometry are covered by the browser specs; this only guards against a platform keeping its own copy of the rules.
  for (const platform of ["react", "vue3", "native"]) {
    const component = await read(`packages/${platform}/src/side-navigation.tsx`);
    for (const part of ["sideNavigationSections(", "sideNavigationWithCurrentParents(", "toggleSideParent(", "sideParentHoldsCurrent(", "sideParentHasBadge(", "sideNavigationOpensElsewhere(", "isPlainNavigationClick("])
      assert.ok(component.includes(part), platform + " " + part);
  }
});

test("moving to a page under a closed parent adds that parent, and nothing else changes the list", () => {
  const open = ["other"];
  assert.deepEqual(runtime.sideNavigationWithCurrentParents(open, entries, "checkout"), ["other", "projects"]);
  // Nothing to add: the same array, so a component knows there is no change to store or report.
  assert.equal(runtime.sideNavigationWithCurrentParents(open, entries, "home"), open);
  const already = ["projects"];
  assert.equal(runtime.sideNavigationWithCurrentParents(already, entries, "brand"), already);
  // Items that arrive later: nothing to open while the list is empty.
  assert.equal(runtime.sideNavigationWithCurrentParents(open, [], "checkout"), open);
});

test("a parent stands for its hidden children: the current page and their badges", () => {
  const parent = { key: "p", label: "p", children: [link("a"), link("b", { badge: 0 }), link("c", { badge: "", disabled: true })] };
  assert.equal(runtime.sideParentHoldsCurrent(parent, "a"), true);
  assert.equal(runtime.sideParentHoldsCurrent(parent, "p"), false);
  // 0 is a visible count; a disabled child's badge does not reach the parent.
  assert.equal(runtime.sideParentHasBadge(parent), true);
  assert.equal(runtime.sideParentHasBadge({ ...parent, children: [link("a", { badge: "" }), link("d", { badge: true, disabled: true })] }), false);
});

test("only plain clicks on this tab's links are routed by the app", () => {
  assert.equal(runtime.isPlainNavigationClick({ button: 0 }), true);
  // A touch on Native Web carries no button or keys.
  assert.equal(runtime.isPlainNavigationClick({}), true);
  assert.equal(runtime.isPlainNavigationClick(undefined), true);
  for (const key of ["metaKey", "ctrlKey", "shiftKey", "altKey"]) assert.equal(runtime.isPlainNavigationClick({ button: 0, [key]: true }), false, key);
  assert.equal(runtime.isPlainNavigationClick({ button: 1 }), false);
  assert.equal(runtime.isPlainNavigationClick({ button: 0, defaultPrevented: true }), false);
  assert.equal(runtime.sideNavigationOpensElsewhere({ target: "_blank" }), true);
  assert.equal(runtime.sideNavigationOpensElsewhere({ target: "_self" }), false);
  assert.equal(runtime.sideNavigationOpensElsewhere({}), false);
});

test("a row without an icon shows the first character of its label while only icons show", () => {
  assert.equal(runtime.sideNavigationInitial("  결제"), "결");
  assert.equal(runtime.sideNavigationInitial(""), "");
});

test("spacing between runs: loose items after a group keep a title's distance, and a leading title starts at the top", async () => {
  const css = await read("packages/tokens/src/extensions.css");
  assert.match(css, /\.kjun-side-navigation > \.kjun-side-navigation-section \+ ul\{margin-top:var\(--_kjun-extension-side-navigation-title-padding-top\)\}/);
  assert.match(css, /\.kjun-side-navigation > \.kjun-side-navigation-section:first-child > \.kjun-side-navigation-title\{padding-top:0\}/);
});
