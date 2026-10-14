import { test } from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { assertCurrentConsumer } from "../scripts/package-state.mjs";

// An app may already register a component under one of KJUN's names; KJUN must say so instead of
// silently replacing it, and skipExisting keeps the app's component.
test("Vue install warns about an existing registration and skipExisting keeps the app's component", async () => {
  const { directory } = await assertCurrentConsumer();
  const ui = createRequire(directory + "/package.json")("@kjun-ui/vue2");
  const appButton = {};
  const fakeVue = registry => ({ options: { components: { ...registry } }, component(name, component) { this.options.components[name] = component; } });
  const warnings = [];
  const warn = console.warn;
  console.warn = message => warnings.push(String(message));
  try {
    const replaced = fakeVue({ KjunButton: appButton });
    ui.default.install(replaced);
    assert.equal(replaced.options.components.KjunButton, ui.KjunButton);
    assert.equal(warnings.length, 1);
    assert.match(warnings[0], /KjunButton/);

    const kept = fakeVue({ KjunButton: appButton });
    ui.default.install(kept, { skipExisting: true });
    assert.equal(kept.options.components.KjunButton, appButton);
    assert.equal(kept.options.components.KjunInput, ui.KjunInput);

    warnings.length = 0;
    const again = fakeVue({});
    ui.default.install(again);
    ui.default.install(again);
    assert.deepEqual(warnings, [], "installing twice re-registers KJUN's own components silently");
  } finally {
    console.warn = warn;
  }
});
