import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = path => readFile(new URL("../" + path, import.meta.url), "utf8");
const runtime = await read("shared/package-runtime/list-row.ts"), css = await read("packages/tokens/src/list.css");

test("a row is expandable only when it has no other role", () => {
  const body = runtime.match(/export const listRowExpandable = \([^)]*\)[^=]*=>\s*([^;]+);/)[1];
  const listRowExpandable = new Function("{ expanded, checked, selected, href }", "return " + body);
  assert.equal(listRowExpandable({ expanded: false }), true);
  assert.equal(listRowExpandable({ expanded: true }), true);
  assert.equal(listRowExpandable({}), false);
  assert.equal(listRowExpandable({ expanded: true, checked: false }), false);
  assert.equal(listRowExpandable({ expanded: true, selected: false }), false);
  assert.equal(listRowExpandable({ expanded: true, href: "/a" }), false);
  assert.match(runtime, /warnOnce\("expand", expanded !== undefined && \(checked !== undefined \|\| selected !== undefined \|\| !!href \|\| chevron\)/);
});

test("the content opens inside the row from the title's line, with no band of its own", () => {
  assert.match(css, /\.kjun-list-row\[data-expandable\]\{flex-wrap:wrap;row-gap:0\}/);
  assert.match(css, /\.kjun-list-expanded\{flex:0 0 100%;min-width:0\}/);
  const body = css.match(/\.kjun-list-expanded-body\{([^}]+)\}/)[1];
  // The same inset the dividers use, so content, title and rule start on one line.
  assert.match(body, /padding-inline:var\(--_kjun-list-divider-inset,var\(--_kjun-list-padding-x\)\) var\(--_kjun-list-padding-x\)/);
  assert.doesNotMatch(body, /background|border/);
});

test("hover and press fill the head, not the whole row, and the chevron turns over when open", () => {
  assert.match(css, /\.kjun-list-row\[data-expandable\]:has\(> \.kjun-list-main[^)]*\)[^{]*:is\(:hover,:active\)\)\{background:transparent\}/);
  assert.match(css, /\.kjun-list-row\[data-expandable\] > \.kjun-list-main:not\(:disabled,\[aria-busy=true\]\):hover\{background:var\(--_kjun-color-hover\)\}/);
  assert.match(css, /\.kjun-list-row\[data-expandable\] > \.kjun-list-main:not\(:disabled,\[aria-busy=true\]\):active\{background:var\(--_kjun-color-active\)\}/);
  assert.match(css, /\.kjun-list-main\[aria-expanded=true\] \.kjun-list-expand-icon\{transform:rotate\(180deg\)\}/);
});

test("every platform draws a down chevron, never the navigation one, on an expandable row", async () => {
  for (const platform of ["react", "vue3", "native"]) {
    const source = await read(`packages/${platform}/src/list.tsx`);
    assert.match(source, /listRowExpandable\(/, platform);
    assert.match(source, /name="chevron-down"/, platform);
    assert.match(source, /Collapse open=\{!!(props\.)?expanded\}/, platform);
  }
});
