import test from 'node:test';
import assert from 'node:assert/strict';
import { tokens } from '@kjun-ui/tokens';
import { badgeGeometry } from '../shared/package-runtime/badge-tone.ts';

test('count badges are pills at least as wide as they are tall, like the navigation count badges', () => {
  for (const size of ['xs', 'sm', 'md', 'lg', 'xl']) {
    const g = badgeGeometry(size);
    assert.equal(g.count.radius, tokens.extensions.navigationBadge.radius, size);
    assert.equal(g.count.minWidth, g.padding.y * 2 + g.type.lineHeightPx, size);
    // One digit (about 0.6 em wide) plus its padding still fits the height, so it draws a circle.
    assert.ok(g.count.paddingX * 2 + g.type.fontSizePx * 0.6 <= g.count.minWidth, size);
  }
});

test('a dot-only badge draws the navigation dot size', () => {
  for (const size of ['xs', 'md', 'xl']) assert.equal(badgeGeometry(size).standaloneDotSize, tokens.extensions.navigationBadge.dotSize);
});
