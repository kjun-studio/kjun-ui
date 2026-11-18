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
  const css = await read("packages/tokens/src/side-navigation.css");
  const rules = css.split("}").filter(rule => rule.includes(".kjun-side-navigation"));
  const current = rules.find(rule => rule.trim().startsWith(".kjun-side-navigation-item[aria-current]{"));
  assert.match(current, /background:var\(--_kjun-color-selected-bg\)/);
  assert.match(current, /font-weight:var\(--_kjun-extension-side-navigation-selected-weight\)/);
  // The only pseudo-element is the collapsed menu's group boundary (railDividers): a horizontal hairline in the divider
  // colour on a group, never a mark on an item.
  const boundary = (rule) => /^\s*\.kjun-side-navigation\[data-collapsed\]\[data-rail-dividers\] > \.kjun-side-navigation-list > \.kjun-side-navigation-section[^{]*::before\s*\{/.test(rule) && !rule.split("{")[0].includes("-item");
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
    // Native splits its row builders into side-navigation-parts.tsx.
    // React and Native keep the menu's lists in the shared useSideNavigationState; Vue 3 keeps its own form of it.
    const component = await read(`packages/${platform}/src/side-navigation.tsx`) + (platform === "native" ? await read("packages/native/src/side-navigation-parts.tsx") : "")
      + (platform === "vue3" ? "" : await read("shared/package-runtime/use-side-navigation-state.ts"));
    if (platform !== "vue3") assert.ok(component.includes("useSideNavigationState("), platform + " useSideNavigationState(");
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
  const css = await read("packages/tokens/src/side-navigation.css");
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
  assert.deepEqual(runtime.sideParentState(parent, { open: [], collapsed: false, value: "a" }), { shown: false, within: true, dot: true, tone: "alert" });
  assert.deepEqual(runtime.sideParentState(parent, { open: ["p"], collapsed: false, value: "a" }), { shown: true, within: false, dot: false, tone: null });
  // Icons only: never shown under the parent, so it keeps standing for them.
  assert.deepEqual(runtime.sideParentState(parent, { open: ["p"], collapsed: true, value: "a" }), { shown: false, within: true, dot: true, tone: "alert" });
  const [group] = runtime.sideNavigationSections([{ title: "G", key: "g", items: [parent, link("c")] }]);
  assert.deepEqual(runtime.sideGroupState(group, { openGroups: [], value: "a" }), { shown: false, within: true, dot: true, tone: "alert", count: 2 });
  assert.deepEqual(runtime.sideGroupState(group, { openGroups: ["g"], value: "a" }), { shown: true, within: false, dot: false, tone: null, count: 2 });
  assert.deepEqual(runtime.sideRailGroupState(group, "c"), { within: true, dot: true, tone: "alert" });
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
  const css = await read("packages/tokens/src/side-navigation.css");
  const rule = selector => css.replace(/\/\*[\s\S]*?\*\//g, "").split("}").find(chunk => chunk.trim().startsWith(selector + "{"));
  const within = rule(".kjun-side-navigation-item[data-current-within]");
  assert.match(within, /color:var\(--_kjun-color-text\);font-weight:var\(--_kjun-extension-side-navigation-selected-weight\)/);
  assert.doesNotMatch(within, /background/);
  assert.doesNotMatch(css, /\[data-current-within\]\{[^}]*selected-bg\)/);
  assert.match(rule(".kjun-side-navigation[data-collapsed]:not([data-rail-labels]) .kjun-side-navigation-item[data-current-within]"), /background:var\(--_kjun-side-navigation-within\)/);
  assert.match(css, /--_kjun-side-navigation-within:color-mix\(in srgb, var\(--_kjun-color-selected-bg\) calc\(var\(--_kjun-state-opacity-selected-within\) \* 100%\), transparent\)/);
});

test("a group title's small chevron sits at the end and turns over like a parent's", async () => {
  const css = await read("packages/tokens/src/side-navigation.css");
  assert.match(css, /\.kjun-side-navigation-title\[data-toggle\]\[aria-expanded=true\] > \.kjun-side-navigation-chevron\{transform:rotate\(180deg\)\}/);
  assert.doesNotMatch(css, /rotate\(90deg\)|scaleX\(-1\)\}\n\.kjun-side-navigation-count/);
  assert.match(css, /\.kjun-side-navigation-item\[aria-expanded=true\] > \.kjun-side-navigation-chevron\{transform:rotate\(180deg\)\}/);
  for (const platform of ["react", "vue3", "native"]) {
    const component = await read(`packages/${platform}/src/side-navigation.tsx`);
    assert.ok(component.includes("groupChevronSize"), platform);
  }
});

test("a hidden badge's dot takes the loudest tone behind it: alert over neutral, nothing when only disabled rows have one", () => {
  const quiet = link("q", { badge: 4, badgeTone: "neutral" }), loud = link("l", { badge: 1 }), off = link("o", { badge: 2, disabled: true });
  assert.equal(runtime.sideItemsBadgeTone([quiet]), "neutral");
  assert.equal(runtime.sideItemsBadgeTone([quiet, loud]), "alert");
  assert.equal(runtime.sideItemsBadgeTone([off, link("x")]), null);
  // Under a second-level parent too.
  assert.equal(runtime.sideItemsBadgeTone([{ key: "p", label: "p", children: [{ key: "s", label: "s", children: [quiet] }] }]), "neutral");
});

test("a second level: the current page opens both parents, and both stand for it while closed", () => {
  const nested = [{ key: "settings", label: "설정", children: [link("general"), { key: "billing", label: "결제", children: [link("invoices"), link("methods", { badge: true })] }] }];
  assert.deepEqual(runtime.sideNavigationCurrentParents(nested, "invoices"), ["settings", "billing"]);
  assert.deepEqual(runtime.sideNavigationCurrentParents(nested, "general"), ["settings"]);
  assert.deepEqual(runtime.sideNavigationWithCurrentParents(["settings"], nested, "invoices"), ["settings", "billing"]);
  assert.equal(runtime.sideParentHoldsCurrent(nested[0], "invoices"), true);
  assert.deepEqual(runtime.sideParentState(nested[0].children[1], { open: [], collapsed: false, value: "invoices" }), { shown: false, within: true, dot: true, tone: "alert" });
  assert.deepEqual(runtime.sideNavigationDuplicateKeys([...nested, link("invoices")]), ["item \"invoices\""]);
  assert.deepEqual(runtime.sideNavigationTooDeep(nested), []);
  assert.deepEqual(runtime.sideNavigationTooDeep([{ key: "a", label: "a", children: [{ key: "b", label: "b", children: [{ key: "c", label: "c", children: [] }] }] }]), ["c"]);
});

test("a group's limit shows its first rows and the current page's row, and all of them once shown", () => {
  const items = ["a", "b", "c", "d", "e", "f"].map(key => link(key));
  const [group] = runtime.sideNavigationSections([{ title: "Projects", key: "projects", limit: 3, items }]);
  const keys = rows => rows.items.map(item => item.key);
  assert.deepEqual(keys(runtime.sideSectionRows(group, { value: "a", showAll: [] })), ["a", "b", "c"]);
  const limited = runtime.sideSectionRows(group, { value: "e", showAll: [] });
  assert.deepEqual([keys(limited), limited.hidden, limited.expandable, limited.expanded], [["a", "b", "c", "e"], 2, true, false]);
  const all = runtime.sideSectionRows(group, { value: "e", showAll: ["projects"] });
  assert.deepEqual([all.items.length, all.hidden, all.expanded], [6, 0, true]);
  // Only the current page's row was past the limit: nothing left to fold.
  const [two] = runtime.sideNavigationSections([{ title: "T", key: "t", limit: 1, items: items.slice(0, 2) }]);
  assert.deepEqual(runtime.sideSectionRows(two, { value: "b", showAll: [] }), { items: two.items, hidden: 0, expandable: false, expanded: false });
  // No limit, a list that fits, or loose items: nothing to fold.
  const [fits] = runtime.sideNavigationSections([{ title: "T", limit: 6, items }]);
  assert.equal(runtime.sideSectionRows(fits, { value: null, showAll: [] }).expandable, false);
  const [loose] = runtime.sideNavigationSections(items);
  assert.equal(runtime.sideSectionRows(loose, { value: null, showAll: [] }).items.length, 6);
});

test("arrow keys: right goes in and left goes out, swapped right to left", () => {
  assert.equal(runtime.sideNavigationArrow("ArrowRight", false), "in");
  assert.equal(runtime.sideNavigationArrow("ArrowLeft", false), "out");
  assert.equal(runtime.sideNavigationArrow("ArrowRight", true), "out");
  assert.equal(runtime.sideNavigationArrow("ArrowLeft", true), "in");
  assert.equal(runtime.sideNavigationArrow("ArrowDown", false), null);
});

test("a labelled rail shows the short name and keeps the full one as the accessible name", () => {
  const m = { newContent: "새 소식", newCount: count => "새 항목 " + count + "개", newWindow: " (새 창)" };
  const inbox = link("inbox", { label: "받은 편지함", shortLabel: "편지함" });
  assert.equal(runtime.sideNavigationShownLabel(inbox, true), "편지함");
  assert.equal(runtime.sideNavigationShownLabel(inbox, false), "받은 편지함");
  assert.equal(runtime.sideNavigationLinkLabel(inbox, m, true), "받은 편지함");
  assert.equal(runtime.sideNavigationLinkLabel(inbox, m, false), undefined);
  assert.equal(runtime.sideNavigationLinkLabel({ ...inbox, badge: 3 }, m, false), "받은 편지함, 새 항목 3개");
  assert.equal(runtime.sideNavigationLinkLabel({ ...inbox, target: "_blank" }, m, false), "받은 편지함 (새 창)");
  assert.equal(runtime.sideNavigationShownTitle({ title: "워크스페이스", shortTitle: "공간" }, true), "공간");
  assert.equal(runtime.sideNavigationToggleName("프로젝트", true, m), "프로젝트, 새 소식");
  // A parent and a group with one key open different flyouts.
  assert.notEqual(runtime.sideFlyoutKey("parent", "x"), runtime.sideFlyoutKey("group", "x"));
});

test("the side navigation's styles live in their own file, loaded after extensions.css", async () => {
  const sources = JSON.parse(await read("shared/web-style-sources.json"));
  assert.equal(sources.indexOf("side-navigation.css"), sources.indexOf("extensions.css") + 1);
  assert.doesNotMatch(await read("packages/tokens/src/extensions.css"), /\.kjun-side-navigation/);
});

test("an empty group shows its empty line in place of rows, and only while it has none", () => {
  const sections = runtime.sideNavigationSections([{ title: "프로젝트", items: [], empty: "아직 프로젝트가 없습니다" }, { title: "채널", items: [link("general")], empty: "없음" }, { title: "보관", items: [] }]);
  assert.equal(sections[0].empty, "아직 프로젝트가 없습니다");
  assert.deepEqual(sections.map(runtime.sideSectionEmpty), ["아직 프로젝트가 없습니다", undefined, undefined]);
});

test("railBreakpoint asks for the rail below it and the full column above it, only when the width crosses it", () => {
  const ask = runtime.sideNavigationRailRequest;
  // The first reading: below asks for the rail, above leaves the app's value alone.
  assert.equal(ask(null, true, false), true);
  assert.equal(ask(null, false, true), null);
  assert.equal(ask(null, true, true), null);
  // Crossing asks once, and not when the column already is that way.
  assert.equal(ask(false, true, false), true);
  assert.equal(ask(true, false, true), false);
  assert.equal(ask(true, false, false), null);
  // No crossing: the person's own toggle stands.
  assert.equal(ask(true, true, false), null);
  assert.equal(ask(false, false, true), null);
});

test("arrow keys and flyouts share one web module; the layout closes its drawer when the column comes back", async () => {
  for (const platform of ["react", "vue3"]) {
    const component = await read(`packages/${platform}/src/side-navigation.tsx`);
    for (const part of ["sideNavigationArrowKey(", "sideNavigationOpensFlyout(", "closeSideNavigationFlyout("]) assert.ok(component.includes(part), platform + " " + part);
    assert.ok(!component.includes('event.key === "ArrowRight"'), platform + " reads the arrow through sideNavigationArrow, so right to left swaps it");
  }
  for (const platform of ["react", "vue3", "native"]) {
    const layout = await read(`packages/${platform}/src/side-navigation-layout.tsx`);
    for (const part of ["sideNavigationRailRequest(", "closeDrawer", "railBreakpoint"]) assert.ok(layout.includes(part), platform + " " + part);
  }
  const css = await read("packages/tokens/src/side-navigation.css");
  assert.match(css, /\.kjun-side-navigation-layout-nav\{position:sticky;top:var\(--_kjun-side-navigation-layout-top,0vh\)/);
  assert.match(css, /\.kjun-side-navigation-empty\{/);
});

test("a side placement lines up the top edges with -start and the bottom edges with -end, and centres otherwise", async () => {
  const tokens = moduleUrl(`export const tokens = { extensions: { floating: { anchorGap: 4, viewportInset: 8 }, tooltip: { arrowSize: 6 } } };`);
  const floating = await import(moduleUrl((await transpile("shared/package-runtime/floating-position.ts")).replace('"@kjun-ui/tokens"', JSON.stringify(tokens))));
  globalThis.window = { innerWidth: 1000, innerHeight: 800 };
  const trigger = { top: 300, bottom: 340, left: 20, right: 64, width: 44, height: 40 }, panel = { width: 240, height: 140 };
  assert.equal(floating.computeFloatingPosition(trigger, panel, { placement: "right-start" }).top, 300);
  assert.equal(floating.computeFloatingPosition(trigger, panel, { placement: "right-end" }).top, 200);
  assert.equal(floating.computeFloatingPosition(trigger, panel, { placement: "right" }).top, 250);
  assert.equal(floating.computeFloatingPosition(trigger, panel, { placement: "right-start" }).left, 68);
  delete globalThis.window;
});

test("every platform's flyout opens level with its icon, and the collapsed rail draws dividers only with railDividers", async () => {
  for (const platform of ["react", "vue3", "native"]) {
    const source = await read(`packages/${platform}/src/side-navigation.tsx`) + (platform === "native" ? await read("packages/native/src/side-navigation-parts.tsx") : "");
    assert.ok(source.includes('placement="right-start"'), platform);
    assert.ok(source.includes("railDividers"), platform);
  }
  const css = await read("packages/tokens/src/side-navigation.css");
  assert.match(css, /\.kjun-popover-dialog:has\(\.kjun-side-navigation-flyout\) > \.kjun-popover-header\{padding-inline-start:/);
});
