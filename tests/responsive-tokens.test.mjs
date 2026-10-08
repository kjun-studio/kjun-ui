import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import { readTokenDefinitions, compileTokens } from '../scripts/token-model.mjs';
import { responsiveCss } from '../scripts/responsive-css.mjs';
import { createVueStyleTheme } from '../packages/vue2/style-theme.mjs';
const source = await readTokenDefinitions(new URL('..', import.meta.url).pathname);

test('responsive aliases compile media, container and Vue utility thresholds from one source', () => {
  const changed = structuredClone(source);
  changed.breakpoints.compact = 700;
  changed.breakpoints.medium = 820;
  changed.breakpoints.actionContent = 500;
  const tokens = compileTokens(changed);
  const css = responsiveCss('@media (width <= token(responsive.modal)) { .modal {} } @media (width < token(responsive.market)), (pointer: coarse) { .market {} } @container actions (width >= token(responsive.bottomAction)) { .actions {} }', tokens);
  assert.match(css, /width <= 700px/);
  assert.match(css, /width < 820px/);
  assert.match(css, /width >= 500px/);
  assert.doesNotMatch(css, /token\(/);
  assert.equal(tokens.table.mobileBreakpoint, 820);
  assert.equal(createVueStyleTheme(tokens, {}).screens.pagination, '700px');
  assert.throws(() => responsiveCss('@media (width < token(responsive.missing)) {}', tokens), /Invalid responsive/);
  assert.throws(() => responsiveCss('@media (width < token(motion.fast)) {}', tokens), /Invalid responsive/);
});

test('responsive and motion distances reject invalid values and time references', () => {
  for (const mutate of [
    t => { t.responsive.modal = 0; }, t => { t.breakpoints.medium = -1; },
    t => { t.motionDistance.popup = -4; },
    t => { t.motionDistance.modalEnter = { $ref: 'motion.fast' }; },
    t => { t.responsive.modal = { $ref: 'motion.fast' }; },
  ]) { const changed = structuredClone(source); mutate(changed); assert.throws(() => compileTokens(changed)); }
});

test('authored package queries do not repeat fixed width thresholds', async () => {
  for (const pkg of ['tokens', 'vue2']) {
    const root = `packages/${pkg}/src`;
    for (const name of await readdir(root, { recursive: true })) {
      if (!/\.(css|vue)$/.test(name)) continue;
      const text = await readFile(`${root}/${name}`, 'utf8');
      assert.doesNotMatch(text, /@(?:media|container)[^{]*(?:width\s*[<>]=?|(?:min|max)-width\s*:)\s*\d+(?:px|rem)/, name);
    }
  }
});
