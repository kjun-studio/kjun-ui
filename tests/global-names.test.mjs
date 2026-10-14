import test from "node:test";
import assert from "node:assert/strict";
import { auditGlobalNames } from "../scripts/global-names-audit.mjs";

// Categories still being migrated are null; each one is driven to zero and then enforced.
const BASELINE = { classes: null, properties: null, keyframes: null, ids: null, vueComponents: null, provideKeys: null, vueMembers: null, exports: null };

test("every shared-namespace name KJUN ships is kjun-prefixed", async () => {
  const found = await auditGlobalNames({ root: process.cwd() });
  for (const [category, expected] of Object.entries(BASELINE)) {
    if (expected === null) continue;
    assert.deepEqual(found[category], [], `${category}: ${found[category].join(", ")}`);
  }
});
