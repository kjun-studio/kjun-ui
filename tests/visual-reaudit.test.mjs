import test from 'node:test';
import assert from 'node:assert/strict';
import { metricFormat } from '../previews/catalog/example-tools.ts';
import { usageTools } from '../scripts/usage-tools.mjs';
import { presetConfig } from '../shared/example-registry.ts';

// The copied snippets are self-contained; exercise them as well as the gallery's formatter.
test('market examples preserve price units, signed percentages, zero and missing values in every copied platform', async () => {
  const cases = [[1234567, 'price', '1,234,567원'], [98400, 'price', '98,400원'],
    [2.35, 'percent', '+2.35%'], [-1.25, 'percent', '-1.25%'], [0, 'percent', '0.00%'],
    [null, 'price', '—'], [undefined, 'percent', '—'], ['', 'price', '—'],
    [NaN, 'price', '—'], [Infinity, 'percent', '—'], ['invalid', 'percent', '—'], ['HBT', 'text', 'HBT']];
  for (const [value, format, expected] of cases) assert.equal(metricFormat(value, format), expected);
  for (const name of ['DsMarketTable', 'DsMarketCards']) for (const platform of ['react', 'vue2', 'native']) {
    const { code } = await usageTools.usageExample({ name, platform, ...presetConfig(name) });
    const source = code.match(/function formatMetric\(value, format\) \{[\s\S]*?\n\}/)?.[0];
    assert.ok(source, `${name} ${platform} includes its formatter`);
    const formatter = new Function(source + ';return formatMetric;')();
    for (const [value, format, expected] of cases) assert.equal(formatter(value, format), expected, `${name} ${platform} ${format}`);
    assert.doesNotMatch(code, /"정렬 " \+ key/);
  }
});
