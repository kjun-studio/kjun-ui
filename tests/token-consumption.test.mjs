import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { auditTokenConsumption, tokenReads, connectedCss } from '../scripts/token-consumption.mjs';
import { readbackAliases, validateReadbackAliases } from '../scripts/token-aliases.mjs';
import { readTokenDefinitions, compileTokens } from '../scripts/token-model.mjs';
const root = new URL('..', import.meta.url).pathname;

test('every current component role has a source connection or an explicit platform contract', async () => {
  const report = await auditTokenConsumption(root);
  for (const [platform, result] of Object.entries(report.platforms)) assert.deepEqual(result.missing, [], platform);
  assert.ok(report.componentRoles > 300);
});

test('token inventory follows scoped aliases, dynamic sizes, destructuring and imported geometry', () => {
  const reads = tokenReads(`
    import { tokens } from '@kjun/tokens';
    import { marketGeometry } from './market';
    const spec = tokens.input[size];
    const { x, y } = tokens.extensions.badge.padding[size];
    function first() { const spec = tokens.extensions.empty; return spec.iconSize; }
    function second() { const spec = tokens.extensions.tooltip; return spec.paddingX; }
    const style = { width: marketGeometry.columnWidth, fontSize: spec.fontSize, paddingLeft: x, paddingTop: y };
  `, 'consumer.tsx', { marketGeometry: 'extensions.marketTable' });
  for (const path of ['input.*.fontSize', 'extensions.badge.padding.*.x', 'extensions.badge.padding.*.y',
    'extensions.empty.iconSize', 'extensions.tooltip.paddingX', 'extensions.marketTable.columnWidth']) assert.ok(reads.includes(path), path);
  assert.ok(!reads.includes('extensions.empty'), 'assigning an object is not a leaf consumption');
});

test('readback aliases reject independent edits and follow their canonical geometry', async () => {
  const source = await readTokenDefinitions(root);
  for (const path of Object.keys(readbackAliases)) {
    const changed = structuredClone(source), keys = path.split('.');
    keys.slice(0, -1).reduce((v, key) => v[key], changed)[keys.at(-1)] = 123;
    assert.throws(() => validateReadbackAliases(changed), /Readback token/);
  }
  source.input.md.fontSize = { $ref: 'typography.body.fontSizePx' };
  source.input.md.height = 46;
  source.extensions.topNavigation.gap = { $ref: 'dimension.value24' };
  const resolved = compileTokens(source);
  assert.equal(resolved.input.md.placeholderSize, resolved.input.md.fontSize);
  assert.equal(resolved.extensions.compound.md, 46);
  assert.equal(resolved.extensions.navigation.gap, 24);
});

test('field interaction durations reference the semantic control role', async () => {
  for (const file of ['packages/native/src/field-surface.ts', 'packages/vue2/src/styles/forms.css']) {
    const source = await readFile(root + file, 'utf8');
    assert.doesNotMatch(source, /tokens\.motion\.fast|var\(--motion-fast\)/);
    assert.match(source, /tokens\.motion\.control|var\(--motion-control\)/);
  }
});

test('shared CSS only establishes a connection for a platform that uses its selector', () => {
  const css = '.kjun-scope .kjun-pagination button { width:var(--extension-pagination-item-size) }';
  assert.equal(connectedCss(css, '<div class="kjun-scope ds-pagination"></div>'), '');
  assert.match(connectedCss(css, '<div class="kjun-pagination"></div>'), /pagination-item-size/);
});
