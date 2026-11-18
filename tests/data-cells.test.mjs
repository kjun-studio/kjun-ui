import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { heatCell, priceFlashClass, priceFlashDirection, priceFlashKind, progressCellState } from '../shared/package-runtime/data-cells.ts';

const read = path => readFile(new URL('../' + path, import.meta.url), 'utf8');
const close = (a, b) => assert.ok(Math.abs(a - b) < 1e-9, `${a} ≈ ${b}`);

test('a heatmap cell without a finite value is missing', () => {
  for (const value of [null, undefined, NaN, Infinity]) assert.equal(heatCell(value, -1, 1, 'diverging', 'brand').missing, true);
  assert.equal(heatCell(0, -1, 1, 'diverging', 'brand').missing, false);
});

test('the default centre is the middle of the range, as before', () => {
  for (const value of [-5, -1, 0, 2.5, 4, 10]) {
    const ratio = (value + 5) / 15, cell = heatCell(value, -5, 10, 'diverging', 'brand');
    close(cell.magnitude, Math.abs(ratio - 0.5) * 2);
    assert.equal(cell.role, ratio >= 0.5 ? 'success' : 'danger');
  }
  assert.equal(heatCell(3, 3, 3, 'diverging', 'brand').magnitude, 0);
});

test('a centre splits the sides on one scale, the longer side', () => {
  const at = value => heatCell(value, -5, 10, 'price', 'brand', 0);
  assert.equal(at(0).magnitude, 0);
  assert.equal(at(2).role, 'price-up');
  assert.equal(at(-1).role, 'price-down');
  close(at(-4).magnitude, 0.4);
  close(at(6).magnitude, 0.6);
  close(at(10).magnitude, 1);
  close(at(-20).magnitude, 1);
  close(at(6).opacity, 0.08 + 0.32 * 0.6);
});

test('sequential cells ignore the centre and take the chosen colour', () => {
  const cell = heatCell(0.25, 0, 1, 'sequential', 'warning', 0.9);
  assert.equal(cell.role, 'warning');
  close(cell.magnitude, 0.25);
});

test('a progress cell clamps its percent and picks a colour', () => {
  assert.deepEqual(progressCellState(12, 20, 'auto'), { percent: 60, rounded: 60, role: 'warning', custom: undefined });
  assert.equal(progressCellState(150, 100, 'auto').percent, 100);
  assert.equal(progressCellState(5, 0, 'auto').percent, 0);
  assert.equal(progressCellState(5, 10, 'brand', '#123').custom, undefined);
  assert.equal(progressCellState(5, 10, 'custom', '#123').custom, '#123');
  assert.equal(progressCellState(5, 10, 'auto', '#123').custom, '#123');
  const fallback = progressCellState(80, 100, 'custom');
  assert.equal(fallback.custom, undefined);
  assert.equal(fallback.role, 'success');
});

test('a price flashes the way it moved', () => {
  assert.equal(priceFlashDirection(100, 101), 'up');
  assert.equal(priceFlashDirection(100, 99), 'down');
  for (const [a, b] of [[100, 100], [null, 100], [100, null], [undefined, 1], [NaN, 1]]) assert.equal(priceFlashDirection(a, b), null);
  assert.equal(priceFlashKind(true), 'text');
  assert.equal(priceFlashKind('text'), 'text');
  assert.equal(priceFlashKind('background'), 'background');
  assert.equal(priceFlashKind(false), null);
  assert.equal(priceFlashKind(undefined), null);
  assert.equal(priceFlashClass('text', 'up'), 'kjun-price-flash-up');
  assert.equal(priceFlashClass('background', 'down'), 'kjun-price-flash-down-bg');
});

test('the flash classes exist in the shipped price motion styles', async () => {
  const css = await read('packages/tokens/src/price-motion.css');
  for (const name of ['kjun-price-flash-up', 'kjun-price-flash-down', 'kjun-price-flash-up-bg', 'kjun-price-flash-down-bg']) assert.match(css, new RegExp(`\\.${name} \\{|\\.${name} \\{`));
});

test('all three platforms take the shared cell state and the new props', async () => {
  for (const platform of ['react', 'vue3', 'native']) {
    const display = await read(`packages/${platform}/src/financial-display.tsx`), numbers = await read(`packages/${platform}/src/number-display.tsx`);
    assert.match(display, /heatCell\(/);
    assert.match(display, /progressCellState\(/);
    assert.match(display, /valueText/);
    assert.match(display, /ariaLabel/);
    assert.match(numbers, /flash/);
  }
});
