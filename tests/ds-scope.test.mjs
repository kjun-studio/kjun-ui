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

test('a kjun- class offered only as an alternative inside :is() does not tie the rule to kjun markup', () => {
  assert.equal(run('.kjun-scope :is(.kjun-kpi-hero__value, .ds-kpi-hero__value){a:1}'),
    `.kjun-scope ${K} :is(.kjun-kpi-hero__value, .ds-kpi-hero__value), .kjun-scope :is(.kjun-kpi-hero__value, .ds-kpi-hero__value)${K}{a:1}`);
  assert.equal(run(':is(.kjun-button-group, .ds-button-group)[data-overflow="end"]{a:1}'),
    `${K} :is(.kjun-button-group, .ds-button-group)[data-overflow="end"], :is(.kjun-button-group, .ds-button-group)[data-overflow="end"]${K}{a:1}`);
});

test('a required kjun- ancestor or subject ties the rule even when ds-* appears in :is()', () => {
  for (const css of ['.kjun-tabs :is(.kjun-tabs-track, .ds-tabs-scroller){a:1}', '.kjun-scope .ds-kpi-hero__sec-value .kjun-number-affix{a:1}',
    ':where(.flex, .ds-form-layout) > .kjun-form-group{a:1}'])
    assert.equal(run(css), postcss.parse(css).toString().replace(/\s+/g, ' ').replace(/,\s*/g, ', ').trim());
});

test('rules already tied to kjun markup, helpers and keyframes are left alone', () => {
  for (const css of ['.kjun-scope .ds-x[data-v-kjun-1]{a:1}', '.kjun-button .ds-x{a:1}', '.ds-form-layout{a:1}', '@keyframes ds-x{from{a:1}}', '.kjun-scope .kjun-x{a:1}'])
    assert.equal(run(css), postcss.parse(css).toString().replace(/\s+/g, ' ').replace(/,\s*/g, ', ').trim());
});
