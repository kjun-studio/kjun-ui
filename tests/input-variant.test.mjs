import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = path => readFile(new URL("../" + path, import.meta.url), "utf8");
const web = await read("packages/tokens/src/web.css"), controls = await read("packages/tokens/src/controls.css");

test("a plain field clears its surface in every state", () => {
  const rule = web.match(/\.kjun-input\[data-variant="plain"\],\n\.kjun-input\[data-variant="plain"\]:is\(([^)]+)\) \{([^}]+)\}/);
  assert.ok(rule, "one plain rule for the input");
  for (const state of [":hover", ":focus", ":disabled", '[aria-invalid="true"]', '[aria-expanded="true"]']) assert.ok(rule[1].includes(state), state);
  for (const declaration of ["border-color: transparent", "border-inline-width: 0", "background: transparent"]) assert.ok(rule[2].includes(declaration), declaration);
  // The hover rule outranks the plain rule by its :not() chain, so it has to step aside itself.
  assert.match(web, /\.kjun-input:hover[^{]*:not\(\[data-variant="plain"\]\) \{/);
  assert.match(controls, /\.kjun-textarea-field:hover[^{]*:not\(\[data-variant="plain"\]\) \{/);
});

test("a plain field keeps its keyboard focus ring, set off from the text", () => {
  assert.match(web, /\.kjun-input\[data-variant="plain"\]:focus-visible:not\(:disabled\) \{ outline-offset: var\(--_kjun-state-focus-offset\); \}/);
  assert.doesNotMatch(web + controls, /\[data-variant="plain"\][^{]*\{[^}]*outline:\s*(none|0)/);
});

test("every platform takes the side inset from the shared helper", async () => {
  const helper = await read("shared/package-runtime/input-variant.ts");
  assert.match(helper, /variant === "plain" \? \{ padding: 0, border: 0 \}/);
  for (const platform of ["react", "vue3", "native"]) {
    assert.match(await read(`packages/${platform}/src/input.tsx`), /inputEdge\(/, platform + " input");
    assert.match(await read(`packages/${platform}/src/textarea.tsx`), /textareaPadding\([^)]*plain\)/, platform + " textarea");
  }
});
