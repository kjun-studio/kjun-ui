import assert from "node:assert/strict";
import test from "node:test";
import { fromNestedControl } from "../shared/package-runtime/nested-controls.ts";

// A tiny element stand-in: closest() walks parents and matches by a `control` flag, contains() walks the other way.
const element = (control, parent = null) => ({
  parent, control,
  closest() { for (let node = this; node; node = node.parent) if (node.control) return node; return null; },
  contains(other) { for (let node = other; node; node = node.parent) if (node === this) return true; return false; },
});

test("a row leaves alone the clicks that start on a control inside it", () => {
  const row = element(true), cell = element(false, row), button = element(true, cell), label = element(false, button);
  assert.equal(fromNestedControl({ target: label, currentTarget: row }), true);
  assert.equal(fromNestedControl({ target: button, currentTarget: row }), true);
});

test("a click on the row itself or its plain content still opens the row", () => {
  const row = element(true), cell = element(false, row), text = element(false, cell);
  assert.equal(fromNestedControl({ target: text, currentTarget: row }), false);
  assert.equal(fromNestedControl({ target: row, currentTarget: row }), false);
  // A row that is not focusable itself: plain content has no control ancestor at all.
  const plain = element(false), inner = element(false, plain);
  assert.equal(fromNestedControl({ target: inner, currentTarget: plain }), false);
});

test("a click bubbling from a portal outside the row's DOM is left alone", () => {
  const row = element(true), portal = element(false), item = element(true, portal);
  assert.equal(fromNestedControl({ target: item, currentTarget: row }), true);
  assert.equal(fromNestedControl({ target: portal, currentTarget: row }), true);
});
