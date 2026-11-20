import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { build } from "esbuild";

const output = await build({
  stdin: { contents: "export * from './shared/package-runtime/field-group.ts';", resolveDir: process.cwd(), loader: "ts" },
  bundle: true, write: false, format: "esm", platform: "node",
});
const { claimGroupField, releaseGroupField, groupFieldOwner, firstEnabledIndex } =
  await import("data:text/javascript;base64," + Buffer.from(output.outputFiles[0].contents).toString("base64"));
const read = path => readFile(new URL("../" + path, import.meta.url), "utf8");

test("the first enabled claim owns the group id, in claim order", () => {
  let claims = [];
  claims = claimGroupField(claims, "mon", false);
  claims = claimGroupField(claims, "tue", false);
  assert.equal(groupFieldOwner(claims), "mon");
  claims = claimGroupField(claims, "mon", true);
  assert.deepEqual(claims.map(claim => claim.key), ["mon", "tue"], "an update keeps the claim's position");
  assert.equal(groupFieldOwner(claims), "tue");
  claims = claimGroupField(claims, "mon", false);
  assert.equal(groupFieldOwner(claims), "mon");
  claims = releaseGroupField(claims, "mon");
  assert.equal(groupFieldOwner(claims), "tue");
});

test("an unchanged claim or a missing release returns the same list", () => {
  const claims = claimGroupField([], "a", false);
  assert.equal(claimGroupField(claims, "a", false), claims);
  assert.equal(releaseGroupField(claims, "b"), claims);
});

test("all disabled: the first claim still holds the id; none: no owner", () => {
  assert.equal(groupFieldOwner([{ key: "a", disabled: true }, { key: "b", disabled: true }]), "a");
  assert.equal(groupFieldOwner([]), undefined);
});

test("ButtonGroup and FilterGroup put the id on their first enabled option", () => {
  assert.equal(firstEnabledIndex([{ disabled: true }, {}, {}]), 1);
  assert.equal(firstEnabledIndex([{ disabled: true }, { disabled: true }]), 0);
  assert.equal(firstEnabledIndex([{}, {}], true), 0);
  assert.equal(firstEnabledIndex([]), -1);
});

test("a fieldset group drops the browser frame and spaces its legend like the label", async () => {
  const web = await read("packages/tokens/src/web.css");
  assert.match(web, /fieldset\.kjun-form-group\s*\{[^}]*border:\s*0[^}]*min-inline-size:\s*0/);
  assert.match(web, /\.kjun-form-group > legend\.kjun-form-label\s*\{[^}]*padding:\s*0/);
});

test("React and Vue render a fieldset with a legend; Native names a group view", async () => {
  const react = await read("packages/react/src/input.tsx"), vue = await read("packages/vue3/src/input.tsx"), native = await read("packages/native/src/input.tsx");
  for (const source of [react, vue]) {
    assert.match(source, /<legend/);
    assert.match(source, /grouped \? "fieldset" : "div"/);
    assert.match(source, /claimGroupField/);
  }
  assert.match(native, /role=\{group \? "group" : undefined\}/);
});
