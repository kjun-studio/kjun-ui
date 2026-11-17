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

test("a group is known by its key, else its title, and the current page's group is added once", () => {
  const keyed = [link("home"), { title: "문서", key: "docs", icon: "file-text", items: entries[2].items }, { title: "관리", items: [link("settings", { badge: true })] }];
  assert.equal(runtime.sideGroupKey({ title: "관리" }), "관리");
  assert.equal(runtime.sideGroupKey({ title: "문서", key: "docs" }), "docs");
  assert.deepEqual(runtime.sideNavigationWithCurrentGroups([], keyed, "checkout"), ["docs"]);
  assert.deepEqual(runtime.sideNavigationWithCurrentGroups([], keyed, "settings"), ["관리"]);
  // Loose items belong to no group, and an unchanged list comes back as the same array.
  const open = ["관리"];
  assert.equal(runtime.sideNavigationWithCurrentGroups(open, keyed, "home"), open);
  assert.equal(runtime.sideNavigationWithCurrentGroups(open, keyed, "settings"), open);
  assert.equal(runtime.sideItemsHoldCurrent(keyed[1].items, "brand"), true);
  assert.equal(runtime.sideItemsHaveBadge(keyed[2].items), true);
  assert.equal(runtime.sideItemsHaveBadge([link("x", { badge: 3, disabled: true })]), false);
});

test("a rail of groups keeps loose items as rows and stands one row for each group", () => {
  const rail = runtime.sideNavigationGroupRail(entries);
  assert.deepEqual(rail.map(row => "group" in row ? "group:" + row.group.key : row.item.key), ["home", "tasks", "group:문서", "help", "group:관리"]);
  assert.deepEqual(rail[2].group.items.map(item => item.key), ["projects", "archive"]);
});

test("the current item is a fill and a weight, never an accent stripe", async () => {
  const css = await read("packages/tokens/src/extensions.css");
  const rules = css.split("}").filter(rule => rule.includes(".kjun-side-navigation"));
  const current = rules.find(rule => rule.trim().startsWith(".kjun-side-navigation-item[aria-current]{"));
  assert.match(current, /background:var\(--_kjun-color-selected-bg\)/);
  assert.match(current, /font-weight:var\(--_kjun-type-control-weight\)/);
  // The only pseudo-element is the collapsed menu's group boundary: a horizontal hairline in the divider colour on a group,
  // never a mark on an item.
  const boundary = (rule) => /^\s*\.kjun-side-navigation\[data-collapsed\] > \.kjun-side-navigation-list > \.kjun-side-navigation-section[^{]*::before\s*\{/.test(rule) && !rule.split("{")[0].includes("-item");
  const lines = rules.filter(boundary);
  assert.equal(lines.length, 1);
  assert.match(lines[0], /height:var\(--_kjun-border-default-width\);background:var\(--_kjun-color-divider\)/);
  for (const rule of rules) {
    assert.doesNotMatch(rule, /border-(left|inline-start)/, rule.trim().slice(0, 60));
    if (!boundary(rule)) assert.doesNotMatch(rule, /::before|::after/, rule.trim().slice(0, 60));
    assert.doesNotMatch(rule.split("{")[1] ?? "", /\d+px/, rule.trim().slice(0, 60));
  }
});

test("every platform takes its menu rules from the shared runtime", async () => {
  // Markup and geometry are covered by the browser specs; this only guards against a platform keeping its own copy of the rules.
  for (const platform of ["react", "vue3", "native"]) {
    const component = await read(`packages/${platform}/src/side-navigation.tsx`);
    for (const part of ["sideNavigationSections(", "sideNavigationWithCurrentParents(", "sideNavigationInitialGroups(", "toggleSideParent(", "sideParentState(", "sideGroupState(",
      "sideRailGroupState(", "sideSectionToggles(", "sideNavigationOpensElsewhere(", "isPlainNavigationClick(", "checkSideNavigation("])
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
  assert.match(css, /\.kjun-side-navigation-list > \.kjun-side-navigation-section \+ ul\{margin-top:var\(--_kjun-extension-side-navigation-title-padding-top\)\}/);
  assert.match(css, /\.kjun-side-navigation-list > \.kjun-side-navigation-section:first-child > \.kjun-side-navigation-heading > \.kjun-side-navigation-title\{padding-top:0\}/);
});

test("a group's own collapsible overrides the navigation's, and defaultOpen groups start open with the current page's", () => {
  const groups = [{ title: "A", items: [link("a1")] }, { title: "B", collapsible: false, items: [link("b1")] }, { title: "C", key: "c", collapsible: true, defaultOpen: true, action: { key: "new", icon: "plus", label: "New" }, items: [link("c1")] }, link("loose")];
  const sections = runtime.sideNavigationSections(groups);
  assert.deepEqual(sections.map(section => runtime.sideSectionToggles(section, true)), [true, false, true, false]);
  assert.deepEqual(sections.map(section => runtime.sideSectionToggles(section, false)), [false, false, true, false]);
  assert.deepEqual(sections[2].action, { key: "new", icon: "plus", label: "New" });
  assert.deepEqual(runtime.sideNavigationInitialGroups(groups, "a1"), ["c", "A"]);
  assert.deepEqual(runtime.sideNavigationInitialGroups(groups, "loose"), ["c"]);
});

test("row states: a closed parent or group stands for the current page and its badges; an open one does not", () => {
  const parent = { key: "p", label: "p", children: [link("a"), link("b", { badge: 2 })] };
  assert.deepEqual(runtime.sideParentState(parent, { open: [], collapsed: false, value: "a" }), { shown: false, within: true, dot: true });
  assert.deepEqual(runtime.sideParentState(parent, { open: ["p"], collapsed: false, value: "a" }), { shown: true, within: false, dot: false });
  // Icons only: never shown under the parent, so it keeps standing for them.
  assert.deepEqual(runtime.sideParentState(parent, { open: ["p"], collapsed: true, value: "a" }), { shown: false, within: true, dot: true });
  const [group] = runtime.sideNavigationSections([{ title: "G", key: "g", items: [parent, link("c")] }]);
  assert.deepEqual(runtime.sideGroupState(group, { openGroups: [], value: "a" }), { shown: false, within: true, dot: true, count: 2 });
  assert.deepEqual(runtime.sideGroupState(group, { openGroups: ["g"], value: "a" }), { shown: true, within: false, dot: false, count: 2 });
  assert.deepEqual(runtime.sideRailGroupState(group, "c"), { within: true, dot: true });
});

test("element ids come from keys, and different keys never share one", () => {
  assert.equal(runtime.sideNavigationIdPart("docs_main-1"), "docs_main-1");
  const parts = ["a b", "a_b", "a.b", "문서", "a/b"].map(runtime.sideNavigationIdPart);
  assert.equal(new Set(parts).size, parts.length);
  for (const part of parts) assert.match(part, /^[\w-]+$/);
});

test("repeated keys are found, including a title used twice without a key", () => {
  const repeated = runtime.sideNavigationDuplicateKeys([link("a"), { title: "T", items: [link("b")] }, { title: "T", items: [{ key: "p", label: "p", children: [link("a")] }] }]);
  assert.deepEqual(repeated, ["group \"T\"", "item \"a\""]);
  assert.deepEqual(runtime.sideNavigationDuplicateKeys(entries), []);
});

test("only the current page is filled: a row over it is marked by ink and weight, and by half the fill only while icons show", async () => {
  const css = await read("packages/tokens/src/extensions.css");
  const rule = selector => css.replace(/\/\*[\s\S]*?\*\//g, "").split("}").find(chunk => chunk.trim().startsWith(selector + "{"));
  const within = rule(".kjun-side-navigation-item[data-current-within]");
  assert.match(within, /color:var\(--_kjun-color-text\);font-weight:var\(--_kjun-type-control-weight\)/);
  assert.doesNotMatch(within, /background/);
  assert.doesNotMatch(css, /\[data-current-within\]\{[^}]*selected-bg\)/);
  assert.match(rule(".kjun-side-navigation[data-collapsed]:not([data-rail-labels]) .kjun-side-navigation-item[data-current-within]"), /background:var\(--_kjun-side-navigation-within\)/);
  assert.match(css, /--_kjun-side-navigation-within:color-mix\(in srgb, var\(--_kjun-color-selected-bg\) calc\(var\(--_kjun-state-opacity-selected-within\) \* 100%\), transparent\)/);
});

test("a group title's chevron follows its name and turns down when open; a parent's turns over at the row's end", async () => {
  const css = await read("packages/tokens/src/extensions.css");
  assert.match(css, /\.kjun-side-navigation-title\[data-toggle\]\[aria-expanded=true\] > \.kjun-side-navigation-chevron\{transform:rotate\(90deg\)\}/);
  assert.match(css, /\.kjun-side-navigation-item\[aria-expanded=true\] > \.kjun-side-navigation-chevron\{transform:rotate\(180deg\)\}/);
  for (const platform of ["react", "vue3", "native"]) {
    const component = await read(`packages/${platform}/src/side-navigation.tsx`);
    assert.ok(component.includes("groupChevronSize"), platform);
  }
});
