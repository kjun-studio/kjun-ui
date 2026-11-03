import test from 'node:test';
import assert from 'node:assert/strict';
import { build } from 'esbuild';

const output = await build({ entryPoints: ['shared/package-runtime/slider-view.ts'], bundle: true, write: false, format: 'esm', platform: 'node' });
const view = await import('data:text/javascript;base64,' + Buffer.from(output.outputFiles[0].contents).toString('base64'));

test('slider pages move a tenth of the range on the step grid, and arrows swap right to left', () => {
  assert.equal(view.sliderPageSize(0, 1000000, 100), 100000);
  assert.equal(view.sliderPageSize(0, 1, 0.3), 0.3);
  assert.equal(view.sliderKeyValue('PageDown', 50, 0, 100, 1), 40);
  assert.equal(view.sliderKeyValue('ArrowRight', 50, 0, 100, 1, true), 49);
  assert.equal(view.sliderKeyValue('ArrowUp', 50, 0, 100, 1, true), 51);
  assert.equal(view.sliderKeyValue('Tab', 50, 0, 100, 1), null);
});

test('slider numbers keep the step decimals, read equal values once and use formatRange', () => {
  const format = view.sliderFormatter(undefined, 'en', 0, 0.5);
  assert.equal(format(1), '1.0');
  assert.equal(view.sliderFormatter(undefined, 'en', 0, 0.5), format, 'cached per locale and precision');
  assert.equal(view.sliderValueText([500000, 500000], view.sliderFormatter(undefined, 'ko', 0, 100)), '500,000');
  assert.equal(view.sliderValueText([2, 8], String, (s, e) => `${s}~${e}`), '2~8');
});

test('slider marks light up on the fill from min, skip dots at the rail ends and align end labels to the visual side', () => {
  const marks = view.sliderMarks([{ value: 0, label: 'a' }, { value: 50 }, { value: 100, label: 'b' }], 0, 100, 1, [60]);
  assert.deepEqual(marks.map(mark => [mark.active, mark.dot, mark.edge]), [[true, false, 'start'], [true, true, undefined], [false, false, 'end']]);
  const rtl = view.sliderMarks([{ value: 0 }, { value: 100 }], 0, 100, 1, [60], { rtl: true });
  assert.deepEqual(rtl.map(mark => [mark.position, mark.edge]), [[1, 'end'], [0, 'start']]);
  assert.deepEqual(view.sliderMarks(true, 0, 100, 1, [10]), [], 'more than 24 steps draws no dots');
});

test('slider fills grow from min in every direction and invalid values stay clamped on the rail', () => {
  assert.deepEqual(view.sliderFillBox([0.4]), { lead: null, trail: 60 });
  assert.deepEqual(view.sliderFillBox([0.4], { rtl: true }), { lead: 60, trail: null });
  assert.deepEqual(view.sliderFillBox([0.4], { vertical: true }), { lead: 60, trail: null });
  assert.deepEqual(view.sliderFillBox([0.2, 0.8]), { lead: 20, trail: 20 });
  assert.deepEqual(view.sliderFractions([40, 140], 0, 100), [0.4, 1]);
  assert.deepEqual(view.sliderFractions([40], 50, 10), [0]);
  assert.equal(view.sliderValueAt(30, 100, 0, 100, { vertical: true }), 70);
  assert.equal(view.localeIsRtl('ar-EG'), true);
  assert.equal(view.localeIsRtl('ko-KR'), false);
});

test('a slider session picks the overlapping thumb by the first move, clamps against the other thumb and commits once', () => {
  const emitted = [], committed = [];
  const session = view.createSliderSession([50, 50], {
    min: () => 0, max: () => 100, step: () => 1, snap: value => Math.round(value), blocked: () => false,
    emit: values => emitted.push(values), commit: values => committed.push(values),
  });
  session.press(50);
  session.move(50.2);
  assert.deepEqual(emitted, []);
  session.move(30);
  session.move(80);
  session.release();
  assert.deepEqual(emitted.at(-1), [50, 50], 'the start thumb cannot pass the end thumb');
  assert.deepEqual(committed, [[50, 50]], 'one commit per gesture');
  assert.equal(session.key(1, 'End'), true);
  assert.deepEqual(emitted.at(-1), [50, 100]);
});
