import assert from "node:assert/strict";
import test from "node:test";
import { alertLiveRegion, alertRole } from "../shared/package-runtime/alert-live.ts";

test("an alert's live region follows its announcement role", () => {
  for (const [tone, live, role, region] of [
    ["danger", undefined, "alert", "assertive"],
    ["info", undefined, "status", "polite"],
    ["warning", "assertive", "alert", "assertive"],
    ["danger", "polite", "status", "polite"],
    ["danger", "off", undefined, undefined],
  ]) {
    assert.equal(alertRole(tone, live), role);
    assert.equal(alertLiveRegion(tone, live), region);
  }
});
