import test from 'node:test';
import assert from 'node:assert/strict';
import { tilesCellWidth, tilesColumns, tilesGapStep, tilesProps } from '../shared/package-runtime/tiles.ts';

test('auto gap is compact below the breakpoint and regular from it; fixed gaps ignore the width', () => {
  assert.equal(tilesGapStep('auto', 767, 768), 'compact');
  assert.equal(tilesGapStep('auto', 768, 768), 'regular');
  assert.equal(tilesGapStep('compact', 2000, 768), 'compact');
  assert.equal(tilesGapStep('regular', 300, 768), 'regular');
});

test('a container narrower than one item, empty or unmeasured still gets one column', () => {
  assert.equal(tilesColumns(200, 240, 16, 4), 1);
  assert.equal(tilesColumns(0, 240, 16, 4), 1);
  assert.equal(tilesColumns(Number.NaN, 240, 16, 4), 1);
});

test('a column is added only when the next item and its gap fit whole', () => {
  assert.equal(tilesColumns(496, 240, 16, 4), 2);
  assert.equal(tilesColumns(495, 240, 16, 4), 1);
});

test('maxColumns caps the count in a wide container', () => {
  assert.equal(tilesColumns(1100, 160, 24, 4), 4);
  assert.equal(tilesColumns(1100, 160, 24, 3), 3);
});

test('a cell takes an equal share of the width after the gaps; no width before measuring', () => {
  assert.equal(tilesCellWidth(800, 3, 24), (800 - 48) / 3);
  assert.equal(tilesCellWidth(0, 1, 24), undefined);
});

test('defaults are auto, md and four columns; an out-of-range maxColumns falls back to four', () => {
  assert.deepEqual(tilesProps(), { gap: 'auto', minItem: 'md', maxColumns: 4 });
  assert.equal(tilesProps(undefined, undefined, 5).maxColumns, 4);
  assert.equal(tilesProps(undefined, undefined, 1).maxColumns, 4);
  assert.equal(tilesProps(undefined, undefined, 2.5).maxColumns, 4);
  assert.deepEqual(tilesProps('compact', 'lg', 2), { gap: 'compact', minItem: 'lg', maxColumns: 2 });
  assert.equal(tilesProps(undefined, undefined, '3').maxColumns, 3, 'a Vue template passes max-columns="3" as a string');
});

import { readFileSync } from 'node:fs';
const json = (path) => JSON.parse(readFileSync(new URL('../' + path, import.meta.url), 'utf8'));

test('minItem steps are 160·240·320, sm shared with the table card tile, and auto switches at the medium breakpoint', () => {
  const tokens = json('packages/tokens/src/tokens.json');
  assert.deepEqual(tokens.extensions.tiles.minItem, { sm: 160, md: 240, lg: 320 });
  assert.equal(tokens.responsive.tilesGap, 768);
  const sizing = json('packages/tokens/src/definitions/sizing.json');
  assert.deepEqual(sizing.extensions.tiles.minItem.sm, { $ref: 'extensions.tableCard.tileMinWidth' });
  assert.deepEqual(json('packages/tokens/src/definitions/responsive-motion.json').responsive.tilesGap, { $ref: 'breakpoints.medium' });
});
