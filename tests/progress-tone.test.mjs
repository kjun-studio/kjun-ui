import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = path => readFile(new URL("../" + path, import.meta.url), "utf8");
const helper = await read("shared/package-runtime/progress-tone.ts");
// The helpers are plain branches, so their bodies run here without a TypeScript build.
const body = name => helper.match(new RegExp(`export function ${name}\\([^)]*\\)[^{]*\\{([\\s\\S]*?)\\n\\}`))[1];
const progressColorKey = new Function("variant", body("progressColorKey"));
const roleBody = new Function("variant", "progressColorKey", body("progressColorRole"));
const role = variant => roleBody(variant, progressColorKey);

test("neutral fills with the tertiary text colour, primary with the brand colour, tones with their own", () => {
  assert.equal(progressColorKey("neutral"), "textTertiary");
  assert.equal(progressColorKey("primary"), "brand");
  for (const tone of ["success", "warning", "danger", "info"]) assert.equal(progressColorKey(tone), tone);
  assert.equal(role("neutral"), "text-tertiary");
  assert.equal(role("primary"), "brand");
  assert.equal(role("danger"), "danger");
});

test("the web role and the Native colour key exist", async () => {
  const roles = await read("packages/tokens/src/color-roles.ts");
  assert.match(roles, /"textTertiary"/);
  const css = await read("packages/tokens/src/web.css");
  assert.match(css, /var\(--_kjun-color-text-tertiary\)/);
});

test("React, Vue 3 and Native take the neutral variant through the shared helper", async () => {
  for (const [file, call] of [
    ["packages/react/src/display.tsx", "progressColorRole(variant)"],
    ["packages/vue3/src/display.tsx", "progressColorRole(props.variant)"],
    ["packages/native/src/progress.tsx", "progressColorKey(variant)"],
  ]) {
    const source = await read(file);
    assert.match(source, /export type KjunProgressVariant = SemanticTone \| "neutral";/, file);
    assert.ok(source.includes(call), file);
  }
  const values = await read("packages/vue3/src/prop-values.ts");
  assert.match(values, /KjunProgress: Object\.freeze\(\{[\s\S]*?variant: Object\.freeze\(\["danger","info","neutral","primary","success","warning"\] as const\)/);
});
