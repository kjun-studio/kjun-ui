import { test } from 'node:test';
import assert from 'node:assert/strict';
import postcss from 'postcss';
import { scopeDsRules, kjunMarkup } from '../scripts/ds-scope.mjs';

const run = css => postcss([scopeDsRules()]).process(css, { from: undefined }).css.replace(/\s+/g, ' ').replace(/,\s*/g, ', ').trim();
const K = kjunMarkup;

test('ds-* rules apply only on or inside kjun-owned markup, at unchanged specificity', () => {
  assert.equal(run('.kjun-scope .ds-field{a:1}'), `.kjun-scope ${K} .ds-field, .kjun-scope .ds-field${K}{a:1}`);
  assert.equal(run('.ds-choice{a:1}'), `${K} .ds-choice, .ds-choice${K}{a:1}`);
  assert.equal(run('.kjun-scope .ds-field::placeholder{a:1}'), `.kjun-scope ${K} .ds-field::placeholder, .kjun-scope .ds-field${K}::placeholder{a:1}`);
  assert.equal(run('.ds-a:hover .ds-b{a:1}'), `${K} .ds-a:hover .ds-b, .ds-a:hover${K} .ds-b{a:1}`);
});

test('a ds-* compound after a child combinator is only checked on itself', () => {
  assert.equal(run(':where(.flex, .ds-form-layout) > .ds-form-group{a:1}'), `:where(.flex, .ds-form-layout) > .ds-form-group${K}{a:1}`);
});

test('rules already tied to kjun markup, helpers and keyframes are left alone', () => {
  for (const css of ['.kjun-scope .ds-x[data-v-kjun-1]{a:1}', '.kjun-button .ds-x{a:1}', '.ds-form-layout{a:1}', '@keyframes ds-x{from{a:1}}', '.kjun-scope .kjun-x{a:1}'])
    assert.equal(run(css), postcss.parse(css).toString().replace(/\s+/g, ' ').trim());
});
