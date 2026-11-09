import test from 'node:test';
import assert from 'node:assert/strict';
import { build } from 'esbuild';
import { formatColor, hsvToRgb, normalizeColor, parseColor, readableInk, rgbToHsv, sameColor } from '../shared/package-runtime/color.ts';

// color-picker.ts imports ./color without an extension, which Node cannot resolve directly, so the test bundles it.
const output = await build({ entryPoints: ['shared/package-runtime/color-picker.ts'], bundle: true, write: false, format: 'esm', platform: 'node' });
const { channelKey, colorAreaKey, colorSwatchColumns, colorSwatchSize, hexDraft, hexWithAlpha, initialFocus, invalidSwatchCount, normalizeSwatches, stateToValue, syncHsv } =
  await import('data:text/javascript;base64,' + Buffer.from(output.outputFiles[0].contents).toString('base64'));

test('swatches take eight fixed columns: 216px content with 8px gaps gives 20px squares', () => {
  assert.equal(colorSwatchColumns, 8);
  assert.equal(colorSwatchSize(216, 8), 20);
  assert.equal(colorSwatchSize(176, 8), 15);
});

test('parseColor reads short, long and alpha hex with or without #', () => {
  assert.deepEqual(parseColor('#3b8'), { r: 0x33, g: 0xbb, b: 0x88, a: 1 });
  assert.deepEqual(parseColor('3B82F6'), { r: 0x3b, g: 0x82, b: 0xf6, a: 1 });
  assert.equal(parseColor('3B82F6CC').a.toFixed(2), '0.80');
  assert.equal(parseColor('#F00A').a.toFixed(2), '0.67');
  assert.equal(parseColor('#12345'), null);
  assert.equal(parseColor('zzz'), null);
  assert.equal(parseColor(''), null);
});

test('formatColor and normalizeColor write uppercase hex with alpha only when asked', () => {
  assert.equal(formatColor(parseColor('#3b82f6'), false), '#3B82F6');
  assert.equal(formatColor(parseColor('#3b82f6'), true), '#3B82F6FF');
  assert.equal(formatColor(parseColor('#3b82f6cc'), true), '#3B82F6CC');
  assert.equal(normalizeColor('#3B82F680', false), '#3B82F6');
  assert.equal(normalizeColor('#3b82f6', true), '#3B82F6FF');
  assert.equal(normalizeColor(42, false), null);
  assert.equal(normalizeColor(null, false), null);
});

test('sameColor compares normalized values, alpha only when it is on', () => {
  assert.equal(sameColor('#3b82f6', '#3B82F6FF', false), true);
  assert.equal(sameColor('#3B82F680', '#3B82F6FF', true), false);
  assert.equal(sameColor(null, null, false), true);
  assert.equal(sameColor(null, '#000', false), false);
});

test('HSV round trip keeps every hex', () => {
  for (const hex of ['#000000', '#FFFFFF', '#3B82F6', '#EF4444', '#808080', '#22C55E'])
    assert.equal(formatColor(hsvToRgb(rgbToHsv(parseColor(hex))), false), hex);
});

test('syncHsv keeps hue through gray and through null', () => {
  const blue = { hsv: { h: 221, s: 0.76, v: 0.96 }, a: 1 };
  const gray = { hsv: { h: 221, s: 0, v: 0.5 }, a: 1 };
  assert.deepEqual(syncHsv(gray, stateToValue(gray, false), false), gray);
  assert.deepEqual(syncHsv(blue, null, false), blue);
  assert.equal(syncHsv(blue, '#FF0000', false).hsv.h, 0);
  assert.equal(syncHsv(blue, '#3B82F680', true).a.toFixed(2), '0.50');
  assert.equal(stateToValue({ hsv: { h: 0, s: 1, v: 1 }, a: 0.8 }, true), '#FF0000CC');
});

test('colorAreaKey moves saturation and brightness by 1% or 10%', () => {
  assert.deepEqual(colorAreaKey('ArrowRight', false, { h: 10, s: 0.5, v: 0.5 }), { h: 10, s: 0.51, v: 0.5 });
  assert.deepEqual(colorAreaKey('ArrowLeft', false, { h: 10, s: 0.5, v: 0.5 }), { h: 10, s: 0.49, v: 0.5 });
  assert.deepEqual(colorAreaKey('ArrowUp', true, { h: 10, s: 0.5, v: 0.95 }), { h: 10, s: 0.5, v: 1 });
  assert.deepEqual(colorAreaKey('ArrowDown', false, { h: 10, s: 0.5, v: 0 }), { h: 10, s: 0.5, v: 0 });
  assert.equal(colorAreaKey('Home', false, { h: 0, s: 0.4, v: 1 }).s, 0);
  assert.equal(colorAreaKey('End', false, { h: 0, s: 0.4, v: 1 }).s, 1);
  assert.equal(colorAreaKey('PageDown', false, { h: 0, s: 1, v: 0.5 }).v, 0.4);
  assert.equal(colorAreaKey('PageUp', false, { h: 0, s: 1, v: 0.5 }).v, 0.6);
  assert.equal(colorAreaKey('a', false, { h: 0, s: 1, v: 1 }), null);
});

test('channelKey steps a hue or alpha channel', () => {
  assert.equal(channelKey('ArrowLeft', true, 5, 360), 0);
  assert.equal(channelKey('ArrowRight', false, 5, 360), 6);
  assert.equal(channelKey('ArrowUp', true, 355, 360), 360);
  assert.equal(channelKey('End', false, 5, 100), 100);
  assert.equal(channelKey('Home', false, 5, 100), 0);
  assert.equal(channelKey('PageUp', false, 5, 100), 15);
  assert.equal(channelKey('x', false, 5, 100), null);
});

test('hexDraft emits live only for full hex and expands short forms on commit', () => {
  assert.deepEqual(hexDraft('3B8', false), { live: null, commit: '#33BB88' });
  assert.deepEqual(hexDraft('3b82f6', false), { live: '#3B82F6', commit: '#3B82F6' });
  assert.deepEqual(hexDraft('#3b82f6', false), { live: '#3B82F6', commit: '#3B82F6' });
  assert.deepEqual(hexDraft('3b82f6cc', true), { live: '#3B82F6CC', commit: '#3B82F6CC' });
  assert.deepEqual(hexDraft('3b82f6', true), { live: '#3B82F6FF', commit: '#3B82F6FF' });
  assert.deepEqual(hexDraft('xyz', false), { live: null, commit: 'revert' });
  assert.deepEqual(hexDraft('', false), { live: null, commit: null });
});

test('normalizeSwatches drops invalid entries and labels with hex', () => {
  const warn = console.warn, env = process.env.NODE_ENV; let warned = 0; console.warn = () => { warned++; };
  process.env.NODE_ENV = 'development';
  try {
    assert.deepEqual(normalizeSwatches(['#f00', { value: '#00ff00', label: 'Green' }, 'nope', 7], false),
      [{ value: '#FF0000', label: '#FF0000' }, { value: '#00FF00', label: 'Green' }]);
    // The component warns once from an effect; normalizing (every render) stays quiet.
    assert.equal(warned, 0);
    assert.equal(invalidSwatchCount(['#f00', 'nope', 7, { value: 'x' }]), 3);
    assert.deepEqual(normalizeSwatches(['#f00'], true), [{ value: '#FF0000FF', label: '#FF0000FF' }]);
  } finally { console.warn = warn; if (env === undefined) delete process.env.NODE_ENV; else process.env.NODE_ENV = env; }
});

test('initialFocus picks the selected swatch, then the area, then hex, then the first swatch', () => {
  assert.equal(initialFocus({ selectedSwatch: true, custom: true, input: true }), 'swatch');
  assert.equal(initialFocus({ selectedSwatch: false, custom: true, input: true }), 'area');
  assert.equal(initialFocus({ selectedSwatch: false, custom: false, input: true }), 'hex');
  assert.equal(initialFocus({ selectedSwatch: false, custom: false, input: false }), 'first-swatch');
});

test('colorPicker tokens and messages exist with the spec values', async () => {
  const bundle = async entry => { const r = await build({ entryPoints: [entry], bundle: true, write: false, format: 'esm', platform: 'node' }); return import('data:text/javascript;base64,' + Buffer.from(r.outputFiles[0].contents).toString('base64')); };
  const { tokens } = await bundle('packages/tokens/src/index.ts');
  const p = tokens.extensions.colorPicker;
  assert.equal(p.width, 240); assert.equal(p.padding, 12); assert.equal(p.areaHeight, 160);
  // Swatches take eight fixed columns (CSS repeat(8) / Native measured width), so there is no fixed swatch size; only the check icon is fixed.
  assert.equal(p.swatchSize, undefined); assert.equal(p.swatchIconSize, 14); assert.equal(p.swatchGap, 8); assert.equal(p.thumbSize, 20);
  assert.deepEqual(p.triggerSwatch, { sm: 16, md: 20, lg: 24 });
  const out = await build({ entryPoints: ['shared/package-runtime/messages/index.ts'], bundle: true, write: false, format: 'esm', platform: 'node' });
  const { kjunMessagesKo: ko, kjunMessagesEn: en } = await import('data:text/javascript;base64,' + Buffer.from(out.outputFiles[0].contents).toString('base64'));
  assert.equal(ko.colorAreaValue(60, 80), '채도 60%, 명도 80%');
  assert.equal(en.hueValue(210), '210 degrees');
  assert.equal(ko.colorValue('#3B82F6', 80), '#3B82F6, 투명도 80%');
  assert.equal(ko.colorValue('#3B82F6'), '#3B82F6');
  assert.equal(ko.colorNone, '색 없음');
});

test('readableInk picks dark ink on light colors and light ink on dark ones', () => {
  assert.equal(readableInk('#FFFFFF'), 'dark');
  assert.equal(readableInk('#EAB308'), 'dark');
  assert.equal(readableInk('#111111'), 'light');
  assert.equal(readableInk('#3B82F6'), 'light');
  assert.equal(readableInk('#11111120'), 'dark');
});

test('syncHsv keeps hue and saturation when only alpha changes', () => {
  const gray = { hsv: { h: 200, s: 0, v: 0.5 }, a: 1 };
  const next = syncHsv(gray, stateToValue(gray, false) + '80', true);
  assert.deepEqual(next.hsv, gray.hsv);
  assert.equal(next.a.toFixed(2), '0.50');
});

test('hexWithAlpha expands a short code and keeps the current opacity', () => {
  assert.equal(hexWithAlpha('3B8', true, '80'), '33BB8880');
  assert.equal(hexWithAlpha('#3b82f6', true, '80'), '3B82F680');
  assert.equal(hexWithAlpha('3B82F6CC', true, '80'), '3B82F6CC');
  assert.equal(hexWithAlpha('3B8', false, '80'), '3B8');
  assert.equal(hexWithAlpha('xyz', true, '80'), 'xyz');
});
