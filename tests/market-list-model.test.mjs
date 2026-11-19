import test from 'node:test';
import assert from 'node:assert/strict';
import { build } from 'esbuild';

async function load(entry) {
  const output = await build({ entryPoints: [entry], bundle: true, write: false, format: 'esm', platform: 'node' });
  return import('data:text/javascript;base64,' + Buffer.from(output.outputFiles[0].contents).toString('base64'));
}

test('the market footer counts the app total, then the paged total, then the rows shown', async () => {
  const { marketTotal } = await load('shared/package-runtime/market-query.ts');
  assert.equal(marketTotal(120, { total: 300 }, 20), 120);
  assert.equal(marketTotal(0, { total: 300 }, 20), 0, 'an explicit 0 is the app\'s count');
  assert.equal(marketTotal(undefined, { total: 300 }, 20), 300);
  assert.equal(marketTotal(undefined, null, 3), 3);
  assert.equal(marketTotal(null, undefined, 3), 3);
});

test('activeKey marks only the row with that key, and none when it is null or undefined', async () => {
  const { isSelectedMarketRow } = await load('shared/package-runtime/market-query.ts');
  assert.equal(isSelectedMarketRow('a', 'a'), true);
  assert.equal(isSelectedMarketRow(1, 1), true);
  assert.equal(isSelectedMarketRow('1', 1), false);
  assert.equal(isSelectedMarketRow(undefined, undefined), false);
  assert.equal(isSelectedMarketRow(null, null), false);
});
