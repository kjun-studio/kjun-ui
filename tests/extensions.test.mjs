import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createNumberDomain, createSliderDomain, createTimeDomain, scaledDecimal, sliderKey } from "../packages/tokens/src/input-contract.ts";
const json = file => JSON.parse(readFileSync(new URL("../" + file, import.meta.url), "utf8"));
test("twelve KJUN contracts extend the public catalog without duplicate recipe exports", () => {
  const catalog = json("shared/component-catalog.json"),
    names = ["Avatar", "BottomActionBar", "BottomNavigation", "Chip", "Image", "ListRow", "ListSection", "QuantityStepper", "RangeSlider", "Slider", "TimePicker", "TopNavigation"].map(n => "Ds" + n),
    additions = catalog.filter(entry => names.includes(entry.name));
  assert.equal(catalog.filter(entry => entry.kind !== "internal").length, 77);
  assert.deepEqual(additions.map(e => e.name).sort(), [...names].sort());
  assert.equal(new Set(catalog.map(e => e.name)).size, catalog.length);
  for (const item of additions) for (const platform of ["vue2", "react", "native"]) assert.ok(readFileSync(item.sources[platform], "utf8").length);
  for (const name of ["DsBottomSheet", "DsThumbnail", "DsTag", "DsSegmentedControl"]) assert.ok(!catalog.some(e => e.name === name));
});
test("decimal commitment rounds ties away from zero before clamping", () => {
  const domain = createNumberDomain({ min: -10, max: 10, step: .1, precision: 2 });
  assert.ok(domain.valid);
  for (const [input, output] of [["1.005", 1.01], ["-1.005", -1.01], [".125", .13], ["-.125", -.13], ["-0.001", 0], ["10.995", 10], ["-10.995", -10], [" 1.23 ", 1.23]]) assert.equal(domain.fromDraft(input), output, input);
  for (const input of ["", " ", "-", ".", "1e2", "1,25", "한글", "NaN", "Infinity", "1.2.3"]) assert.equal(domain.fromDraft(input), null, input);
  let value = 0;
  for (let i = 0; i < 100; i++) value = domain.move(value, 1);
  assert.equal(value, 10);
  for (let i = 0; i < 100; i++) value = domain.move(value, -1);
  assert.equal(value, 0);
  assert.equal(domain.move(1.25, 1), 1.35);
  assert.equal(domain.fromDraft("1.23"), 1.23, "direct text is not snapped to step");
  const unbounded = createNumberDomain({ min: -10 });
  assert.ok(unbounded.valid);
  assert.equal(unbounded.move(-1, 1), 0);
  assert.ok(createSliderDomain(.1, .3, .1).valid);
});
test("invalid numeric domains fail closed without unsafe integer arithmetic", () => {
  for (const options of [{ step: 0 }, { step: -1 }, { min: 5, max: 4 }, { precision: 7 }, { precision: -1 }, { precision: 1000 }, { step: .1, precision: 0 }, { min: Infinity }, { max: NaN }, { max: Number.MAX_SAFE_INTEGER, precision: 6 }]) assert.equal(createNumberDomain(options).valid, false, JSON.stringify(options));
  assert.equal(scaledDecimal("9007199254740992", 0), null);
  assert.equal(scaledDecimal("9007199254.740992", 6), null);
  assert.equal(scaledDecimal("0.0000005", 6), 1);
  assert.equal(createSliderDomain(1, 1, 1).valid, false);
  assert.equal(createSliderDomain(0, 1, .0000001).valid, false);
});
test("sliders snap relative to min and keep the last reachable max", () => {
  const domain = createSliderDomain(-.2, 1, .3);
  assert.equal(domain.snap(.12), .1);
  assert.equal(domain.snap(100), 1);
  assert.equal(createSliderDomain(0, 1, .3).snap(1), .9);
  assert.equal(sliderKey("PageUp", 20, 0, 100, 2), 40);
  assert.equal(sliderKey("Home", 20, 0, 100, 2), 0);
  assert.equal(sliderKey("End", 20, 0, 100, 2), 100);
  assert.equal(sliderKey("Tab", 20, 0, 100, 2), null);
});
test("time domains complete empty segments and preserve only valid combinations", () => {
  const domain = createTimeDomain({ precision: "second", min: "09:30:15", max: "10:15:45", minuteStep: 15, secondStep: 15 });
  assert.ok(domain.valid);
  assert.deepEqual(domain.options(null, 0), [9, 10]);
  assert.equal(domain.select(null, 0, 9), "09:30:15");
  assert.equal(domain.select("09:30:15", 0, 10), "10:00:00");
  assert.deepEqual(domain.options("10:00:00", 1), [0, 15]);
  assert.equal(domain.select("10:15:00", 2, 45), "10:15:45");
  assert.equal(domain.select("10:15:45", 2, 59), "10:15:45");
  assert.equal(domain.accepts("10:15:46"), false);
  assert.equal(domain.accepts("09:30"), false);
  assert.equal(domain.accepts(null), true);
  for (const options of [{ min: "23:00", max: "01:00" }, { min: "24:00" }, { minuteStep: 0 }, { secondStep: 60 }, { precision: "day" }]) assert.equal(createTimeDomain(options).valid, false);
  assert.equal(createTimeDomain().select(null, 1, 30), "00:30");
});
