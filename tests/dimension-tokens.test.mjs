import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { readTokenDefinitions, compileTokens, extensionGeometryCss } from '../scripts/token-model.mjs';
import { createVueStyleTheme } from '../packages/vue2/style-theme.mjs';

const root = new URL('..', import.meta.url).pathname;
const source = await readTokenDefinitions(root);

test('dimension is the single shared length scale without spacing aliases', async () => {
  const compiled = compileTokens(source);
  const { tokens } = await import('../packages/tokens/dist/index.js');
  assert.deepEqual(tokens.dimension, compiled.dimension);
  assert.equal('spacing' in tokens, false);
  assert.equal('spacing' in source, false);
  for (const [name, value] of Object.entries(tokens.dimension)) assert.equal(name, 'value' + value);
  const bindings = await readFile(root + '/packages/tokens/src/bindings.css', 'utf8');
  assert.match(bindings, /--_kjun-geometry-dimension-value48: 48px;/);
  assert.doesNotMatch(bindings, /--_kjun-geometry-spacing-/);
  const theme = createVueStyleTheme(tokens, {});
  assert.equal(theme.extend.spacing['4'], '16px');
  assert.equal(theme.extend.spacing['12'], '48px');
});

test('changing an Accordion dimension selection preserves other roles and the scale', () => {
  const changed = structuredClone(source);
  changed.extensions.accordion.minimumHeight = { $ref: 'dimension.value56' };
  const original = compileTokens(source), compiled = compileTokens(changed);
  assert.equal(compiled.extensions.accordion.minimumHeight, 56);
  assert.equal(original.extensions.accordion.minimumHeight, 48);
  assert.equal(compiled.button.heights.lg, 48);
  assert.equal(compiled.extensions.state.padding.md, 48);
  assert.deepEqual(compiled.dimension, original.dimension);
  assert.match(extensionGeometryCss(compiled, changed), /--extension-accordion-minimum-height: 56px;/);
});

test('numeric dimension names cannot drift or alias a mutable role', () => {
  for (const invalid of [56, -48, Infinity, '48px', { $ref: 'button.heights.lg' }]) {
    const changed = structuredClone(source);
    changed.dimension.value48 = invalid;
    assert.throws(() => compileTokens(changed), /Invalid dimension scale/);
  }
  for (const name of ['large', 'space48', 'value048']) {
    const changed = structuredClone(source);
    changed.dimension[name] = 48;
    assert.throws(() => compileTokens(changed), /Invalid dimension scale/);
  }
});

test('retired spacing definitions and references fail generation', () => {
  const alias = structuredClone(source);
  alias.spacing = { space48: { $ref: 'dimension.value48' } };
  assert.throws(() => compileTokens(alias), /Retired spacing scale/);
  const reference = structuredClone(source);
  reference.extensions.accordion.minimumHeight = { $ref: 'spacing.space48' };
  assert.throws(() => compileTokens(reference), /Unknown token reference: spacing.space48/);
});
