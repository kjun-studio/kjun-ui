import assert from "node:assert/strict";
import { mock, test } from "node:test";
import { createPressRepeat } from "../shared/package-runtime/press-repeat.ts";

test("a held step button repeats after the delay, stops at the end of the range and swallows the closing click", () => {
  mock.timers.enable({ apis: ["setTimeout", "setInterval"] });
  try {
    let value = 0;
    const repeat = createPressRepeat(() => { if (value >= 5) return false; value++; return true; }, 400, 100);
    repeat.start();
    mock.timers.tick(399);
    assert.equal(value, 0, "nothing before the delay; the click gives the first step");
    mock.timers.tick(1);
    assert.equal(value, 1);
    mock.timers.tick(300);
    assert.equal(value, 4);
    mock.timers.tick(1000);
    assert.equal(value, 5, "stops once the step cannot move");
    repeat.release();
    assert.equal(repeat.takeRepeated(), true, "the click that ends a repeating hold does not step again");
    assert.equal(repeat.takeRepeated(), false);
  } finally { mock.timers.reset(); }
});

test("a short press does not repeat, and a release clears the mark for a later keyboard click", () => {
  mock.timers.enable({ apis: ["setTimeout", "setInterval"] });
  try {
    let steps = 0;
    const repeat = createPressRepeat(() => { steps++; return true; }, 400, 100);
    repeat.start();
    mock.timers.tick(200);
    repeat.release();
    mock.timers.tick(1000);
    assert.equal(steps, 0);
    assert.equal(repeat.takeRepeated(), false, "a plain click still steps");
    repeat.start();
    mock.timers.tick(500);
    repeat.release();
    mock.timers.tick(1);
    assert.equal(repeat.takeRepeated(), false, "the mark does not outlive the release's own click");
  } finally { mock.timers.reset(); }
});

test("release from anywhere in the window ends the hold", () => {
  mock.timers.enable({ apis: ["setTimeout", "setInterval"] });
  try {
    const listeners = new Map();
    const view = { addEventListener: (type, fn) => listeners.set(type, fn), removeEventListener: type => listeners.delete(type) };
    let steps = 0;
    const repeat = createPressRepeat(() => { steps++; return true; }, 400, 100);
    repeat.start(view);
    mock.timers.tick(400);
    mock.timers.tick(200);
    assert.equal(steps, 3);
    listeners.get("pointerup")();
    mock.timers.tick(1000);
    assert.equal(steps, 3);
    assert.equal(listeners.size, 0, "window listeners are removed");
  } finally { mock.timers.reset(); }
});
