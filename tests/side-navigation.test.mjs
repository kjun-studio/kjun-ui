import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import ts from "typescript";

const read = path => readFile(new URL("../" + path, import.meta.url), "utf8");
// The runtime is plain data handling; it is transpiled here so the test needs no build.
const source = ts.transpileModule(await read("shared/package-runtime/side-navigation.ts"), { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } }).outputText;
const runtime = await import("data:text/javascript;base64," + Buffer.from(source).toString("base64"));
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

test("React and Vue 3 build the same menu from the shared runtime", async () => {
  for (const platform of ["react", "vue3"]) {
    const component = await read(`packages/${platform}/src/side-navigation.tsx`);
    for (const part of ["sideNavigationSections(", "sideNavigationCurrentParents(", "toggleSideParent(", 'name="chevron-down"', "kjun-side-navigation-children", "data-current-within"]) assert.ok(component.includes(part), platform + " " + part);
    assert.match(component, /aria-current=\{selected \? "page" : undefined\}/, platform);
  }
});
