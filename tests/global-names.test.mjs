import test from "node:test";
import assert from "node:assert/strict";
import { auditGlobalNames } from "../scripts/global-names-audit.mjs";

test("every shared-namespace name KJUN ships is kjun-prefixed", async () => {
  const found = await auditGlobalNames({ root: process.cwd() });
  for (const [category, names] of Object.entries(found)) assert.deepEqual(names, [], `${category}: ${names.join(", ")}`);
});
