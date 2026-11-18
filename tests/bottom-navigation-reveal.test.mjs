import test from "node:test";
import assert from "node:assert/strict";
import { revealDelta } from "../shared/package-runtime/bottom-navigation.ts";

test("revealDelta keeps a visible item and brings a hidden one in by the shortest move", () => {
  assert.equal(revealDelta(10, 60, 0, 100), 0);
  assert.equal(revealDelta(120, 170, 0, 100), 70);
  assert.equal(revealDelta(-30, 20, 0, 100), -30);
  assert.equal(revealDelta(50, 250, 0, 100), 50, "an item wider than the view aligns its start");
});
