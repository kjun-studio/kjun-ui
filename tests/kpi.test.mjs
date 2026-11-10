import test from 'node:test';
import assert from 'node:assert/strict';
import { build } from 'esbuild';

// kpi.ts imports its sibling badge-tone module without an extension, which Node cannot resolve, so the test bundles it.
const output = await build({ entryPoints: ['shared/package-runtime/kpi.ts'], bundle: true, write: false, format: 'esm', platform: 'node' });
const {
  KPI_MISSING, kpiBadgeRoles, kpiDelta, kpiDeltaIcon, kpiDeltaValue, kpiDirection, kpiFormat, kpiHeroNeedsDomain, kpiKeyAction,
  kpiNumber, kpiPresent, kpiRowNeedsDomain, kpiShowDelta, kpiSpoken, kpiSummaryLayout, kpiTone,
} = await import('data:text/javascript;base64,' + Buffer.from(output.outputFiles[0].contents).toString('base64'));

test('direction and sign follow the drawn digits, so a value that rounds to zero is flat', () => {
  assert.equal(kpiDirection({ value: 0.3, decimals: 0 }), 0);
  assert.equal(kpiDirection({ value: 0.6, decimals: 0 }), 1);
  assert.equal(kpiDirection({ value: -0.004, decimals: 2 }), 0);
  // A formatted or string value keeps its raw sign: the drawn digits are unknown.
  assert.equal(kpiDirection({ value: 0.3, decimals: 0, formatter: String }), 1);
  assert.equal(kpiDirection({ value: '-3' }), -1);
  assert.equal(kpiTone({ value: 0.3, semantic: 'price' }), null);
  assert.equal(kpiTone({ value: -2, semantic: 'price' }), 'down');
  assert.equal(kpiTone({ value: 2 }), null);
  assert.equal(kpiFormat({ value: 0.3, semantic: 'price', showSign: true }, undefined, 'en-US'), '0');
  assert.equal(kpiFormat({ value: -0.3 }, undefined, 'en-US'), '0');
  assert.equal(kpiFormat({ value: -1234.5, semantic: 'price', decimals: 1 }, undefined, 'en-US'), '−1,234.5');
  assert.deepEqual(kpiDelta(0.04, 'percent'), { direction: 0, sign: '', number: kpiNumber(0, 1) });
  assert.equal(kpiDelta(0.04, 'percent', { percentDecimals: 2 }).direction, 1);
  assert.equal(kpiDelta(-0.3, 'absolute', { formatted: true }).direction, -1);
});

test('numbers use the provider locale', () => {
  assert.equal(kpiNumber(1234.5, 1, 'de-DE'), '1.234,5');
  assert.equal(kpiFormat({ value: 1234567 }, undefined, 'de-DE'), '1.234.567');
  assert.equal(kpiDelta(12.345, 'percent', { locale: 'de-DE', percentDecimals: 2 }).number, '12,35');
});

test('null and non-finite values are missing, never zero', () => {
  for (const value of [null, undefined, NaN, Infinity]) assert.equal(kpiPresent(value), false);
  assert.equal(kpiPresent(0), true);
  assert.equal(kpiFormat({ value: NaN }), KPI_MISSING);
  assert.equal(kpiFormat({ value: null, missingText: '집계 중' }), '집계 중');
  assert.equal(kpiDeltaValue(NaN), null);
  assert.equal(kpiDeltaValue(undefined), null);
  assert.equal(kpiShowDelta(null, null, '', false, {}), false);
  assert.equal(kpiShowDelta(null, null, '', true, { deltaPercent: null }), true);
});

test('the caret marks only the first directed delta number', () => {
  assert.equal(kpiDeltaIcon(true, 1, 'absolute', true), true);
  assert.equal(kpiDeltaIcon(true, 1, 'percent', true), false);
  assert.equal(kpiDeltaIcon(true, -1, 'percent', false), true);
  assert.equal(kpiDeltaIcon(true, 0, 'absolute', true), false);
  assert.equal(kpiDeltaIcon(false, 1, 'absolute', true), false);
});

test('domain colours are needed only for a painted price direction', () => {
  const base = { loading: false, masked: false, absolute: null, percent: null, secondary: [] };
  assert.equal(kpiHeroNeedsDomain({ ...base, percent: 0.04 }), false);
  assert.equal(kpiHeroNeedsDomain({ ...base, percent: 1.2 }), true);
  assert.equal(kpiHeroNeedsDomain({ ...base, percent: 1.2, masked: true }), false);
  assert.equal(kpiHeroNeedsDomain({ ...base, secondary: [{ value: 3, semantic: 'price' }] }), true);
  assert.equal(kpiRowNeedsDomain(false, false, [{ value: 2, semantic: 'price' }]), true);
  assert.equal(kpiRowNeedsDomain(false, true, [{ value: 2, semantic: 'price' }]), false);
  assert.equal(kpiRowNeedsDomain(false, true, [{ value: 2, badge: { variant: 'price-up' } }]), true);
});

test('summary layout, badge tone, keys and spoken text', () => {
  assert.deepEqual(kpiSummaryLayout([{}, {}, {}, { mobileSecondary: true }]), { secondary: [false, false, false, true], lastFull: 2 });
  assert.deepEqual(kpiSummaryLayout([{ mobileFull: true }, {}, {}]), { secondary: [false, false, false], lastFull: -1 });
  assert.deepEqual(kpiBadgeRoles('neutral'), { bg: 'secondary', text: 'text-secondary', dot: 'text-tertiary' });
  assert.equal(kpiBadgeRoles('warning').text, 'warning-dark');
  assert.equal(kpiKeyAction('keydown', 'Enter', false), 'activate');
  assert.equal(kpiKeyAction('keydown', 'Enter', true), 'prevent');
  assert.equal(kpiKeyAction('keydown', ' ', false), 'prevent');
  assert.equal(kpiKeyAction('keyup', ' ', false), 'activate');
  assert.equal(kpiKeyAction('keydown', 'Tab', false), null);
  assert.equal(kpiSpoken('평가 금액', false, '1,234원', null, ''), '평가 금액, 1,234원');
});
