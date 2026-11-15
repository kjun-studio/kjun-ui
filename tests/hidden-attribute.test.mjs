import assert from "node:assert/strict";
import { readdir, readFile } from "node:fs/promises";
import test from "node:test";

const directory = new URL("../packages/tokens/src/", import.meta.url);

test("the reset's hidden rule outranks component display rules", async () => {
  const reset = await readFile(new URL("reset.css", directory), "utf8");
  const rules = reset.split("}").filter(rule => rule.includes("[hidden]"));
  assert.equal(rules.length, 1, "one hidden rule in the reset");
  assert.match(rules[0], /display:\s*none\s*!important/);
  // until-found content is revealed by the browser's find-in-page, so it stays out of the rule.
  assert.equal(rules[0].match(/:where\(\[hidden\]:not\(\[hidden="until-found"\]\)\)/g)?.length, 3);
});

test("component styles leave hidden to the reset", async () => {
  for (const file of (await readdir(directory)).filter(name => name.endsWith(".css") && name !== "reset.css")) {
    const css = await readFile(new URL(file, directory), "utf8");
    assert.doesNotMatch(css, /\[hidden[\]=]/, file + " declares its own hidden rule");
  }
});
