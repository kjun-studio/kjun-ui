import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const tokens = JSON.parse(readFileSync(new URL('../packages/tokens/src/tokens.json', import.meta.url), 'utf8'));
const empty = tokens.extensions.empty, body = tokens.typography.body;

test('KjunEmpty reads its description in body type and groups title with description', () => {
  assert.equal(empty.descriptionSize, body.fontSizePx);
  assert.equal(empty.descriptionLineHeight, body.lineHeightPx);
  assert.deepEqual([empty.iconGap, empty.descriptionGap, empty.actionGap], [16, 4, 20]);
});

test('KjunEmpty draws a quiet 1.5px icon, side padding and spaced actions', () => {
  assert.deepEqual([empty.iconStroke, empty.paddingX, empty.paddingY], [1.5, 16, 32]);
  assert.deepEqual([empty.actionsGap, empty.actionsMaxWidth], [8, 280]);
  assert.equal(tokens.responsive.empty, tokens.breakpoints.compact);
});

test('KjunEmpty sm fits inside cards and list areas', () => {
  assert.deepEqual(
    [empty.smPaddingY, empty.smIconSize, empty.smIconGap, empty.smActionGap],
    [24, 24, 12, 16],
  );
  assert.equal(empty.smTitleSize, body.fontSizePx);
  assert.equal(empty.smTitleLineHeight, body.lineHeightPx);
});

test('emptyGeometry picks one set of sizes per size and a constant painted icon stroke', async () => {
  const { build } = await import('esbuild');
  const output = await build({ entryPoints: ['shared/package-runtime/empty-geometry.ts'], bundle: true, write: false, format: 'esm', platform: 'node',
    alias: { '@kjun-ui/tokens': './packages/tokens/src/index.ts' } });
  const { emptyGeometry, emptyPaddingY } = await import('data:text/javascript;base64,' + Buffer.from(output.outputFiles[0].contents).toString('base64'));
  const md = emptyGeometry('md'), sm = emptyGeometry('sm');
  assert.deepEqual([md.iconSize, md.iconGap, md.titleSize, md.titleLineHeight, md.paddingY, md.actionGap], [32, 16, 16, 24, 32, 20]);
  assert.deepEqual([sm.iconSize, sm.iconGap, sm.titleSize, sm.titleLineHeight, sm.paddingY, sm.actionGap], [24, 12, 14, 20, 24, 16]);
  // The viewBox stroke shrinks as the icon grows, so both sizes paint 1.5px.
  assert.equal(md.iconStroke * md.iconSize / 24, 1.5);
  assert.equal(sm.iconStroke * sm.iconSize / 24, 1.5);
  // A list owns the empty row's padding, then a data state; only a free-standing empty uses its size.
  assert.equal(emptyPaddingY('sm', { list: 'compact', state: true }), 0);
  assert.equal(emptyPaddingY('sm', { list: 'default', state: false }), tokens.extensions.list.compactPaddingY);
  assert.equal(emptyPaddingY('md', { list: false, state: true }), 0);
  assert.equal(emptyPaddingY('sm', { list: false, state: false }), 24);
});
