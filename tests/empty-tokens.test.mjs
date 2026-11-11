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
