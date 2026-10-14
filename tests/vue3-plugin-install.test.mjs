import { test } from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { assertCurrentConsumer } from "../scripts/package-state.mjs";

// An app may already register a component under one of KJUN's names, in either case style. KJUN warns
// instead of silently replacing it, and skipExisting keeps the app's component.
test("Vue 3 install warns about PascalCase and kebab-case registrations and skipExisting keeps them", async () => {
  const { vue3Directory } = await assertCurrentConsumer();
  const require = createRequire(vue3Directory + "/package.json");
  const { createApp } = require("vue");
  const ui = require("@kjun-ui/vue3");
  const appButton = { render: () => null };
  const warnings = [];
  const warn = console.warn;
  // Vue's development build adds its own re-registration warning; count KJUN's.
  console.warn = (...args) => { if (String(args[0]).startsWith('[kjun]')) warnings.push(String(args[0])); };
  try {
    for (const name of ["KjunButton", "kjun-button"]) {
      warnings.length = 0;
      const replaced = createApp({});
      replaced.component(name, appButton);
      replaced.use(ui.default);
      assert.equal(replaced.component("KjunButton"), ui.KjunButton, name);
      assert.equal(warnings.length, 1, name);
      assert.match(warnings[0], /KjunButton/);

      const kept = createApp({});
      kept.component(name, appButton);
      kept.use(ui.default, { skipExisting: true });
      assert.equal(kept.component("KjunButton") ?? kept.component("kjun-button"), appButton, name);
      assert.equal(kept.component("KjunIcon"), ui.KjunIcon);
    }
    warnings.length = 0;
    const fresh = createApp({});
    fresh.use(ui.default);
    assert.deepEqual(warnings, []);
    assert.deepEqual(Object.keys(fresh._context.components).sort(),
      Object.keys(ui).filter(name => /^Kjun[A-Z]/.test(name) && typeof ui[name] === "object").sort());
  } finally {
    console.warn = warn;
  }
});
