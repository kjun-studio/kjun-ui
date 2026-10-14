import test from "node:test";
import assert from "node:assert/strict";
import { auditGlobalNames } from "../scripts/global-names-audit.mjs";

// Categories still being migrated are null; each one is driven to zero and then enforced.
const BASELINE = { classes: 0, properties: 0, keyframes: 0, ids: 0, vueComponents: 0, provideKeys: 0, vueMembers: 0, exports: 0 };

test("every shared-namespace name KJUN ships is kjun-prefixed", async () => {
  const found = await auditGlobalNames({ root: process.cwd() });
  for (const [category, expected] of Object.entries(BASELINE)) {
    if (expected === null) continue;
    assert.deepEqual(found[category], [], `${category}: ${found[category].join(", ")}`);
  }
});
