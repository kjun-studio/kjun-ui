import test from 'node:test';
import assert from 'node:assert/strict';
import { access, readdir } from 'node:fs/promises';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { planBrowserTests, relatedGroups, fullScopes, smokeFiles } from '../scripts/browser-test-profiles.mjs';

test('package default and common changes preserve the complete suite', () => {
  const args = ['test', '-c', 'playwright.config.ts'];
  assert.deepEqual(planBrowserTests([]).args, args);
  for (const scope of fullScopes) {
    const plan = planBrowserTests(['--profile', 'related', `select,${scope}`]);
    assert.equal(plan.profile, 'full');
    assert.deepEqual(plan.args, args);
  }
});

test('every mapped package spec exists and every package spec belongs to a related group', async () => {
  const paths = [...new Set([...smokeFiles, ...Object.values(relatedGroups).flat()])];
  await Promise.all(paths.map(path => access(path)));
  assert.ok(paths.every(path => !path.includes('/docs/')));
  const specs = (await readdir('tests/browser', { recursive: true }))
    .filter(name => name.endsWith('.spec.ts') && !name.startsWith('docs/'));
  for (const name of specs) assert.ok(paths.includes(`tests/browser/${name}`), `Add ${name} to its component group`);
});

test('related groups deduplicate files and preserve explicit Playwright arguments', () => {
  const expected = [...new Set([...relatedGroups.select, ...relatedGroups.combobox])];
  const plan = planBrowserTests(['--profile', 'related', 'select, combobox', '--', '--list']);
  assert.equal(plan.profile, 'related');
  assert.deepEqual(plan.args, ['test', '-c', 'playwright.config.ts', ...expected, '--list']);
  assert.deepEqual(planBrowserTests(['--profile', 'smoke']).args.slice(3), smokeFiles);
  assert.deepEqual(planBrowserTests(['table-contracts.spec.ts', '-g', 'sort']).args.slice(3), ['table-contracts.spec.ts', '-g', 'sort']);
});

test('invalid scopes and config overrides fail instead of claiming partial coverage', () => {
  for (const scope of ['', 'typo', 'table,typo', 'constructor', 'toString']) {
    assert.throws(() => planBrowserTests(['--profile', 'related', scope]), /관련 검사 범위/);
  }
  assert.throws(() => planBrowserTests(['--profile', 'typo']), /알 수 없는 검사 모드/);
  for (const arg of ['-c', '-cother', '-c=other', '--config', '--config=other']) {
    assert.throws(() => planBrowserTests(['--profile', 'smoke', arg]), /설정은 고정/);
  }
});

const execute = promisify(execFile);
async function inventory(args) {
  const { stdout } = await execute(process.execPath, ['node_modules/@playwright/test/cli.js', ...args, '--list', '--reporter=json'], {
    timeout: 60000, maxBuffer: 8 * 1024 * 1024,
  });
  const report = JSON.parse(stdout);
  assert.deepEqual(report.errors, []);
  const collect = suites => suites.flatMap(suite => [
    ...suite.specs.map(spec => `${spec.file}:${spec.title}`),
    ...collect(suite.suites || []),
  ]);
  return collect(report.suites).sort();
}

test('Playwright itself lists exactly the selected package files without starting browsers', async () => {
  const complete = await inventory(['test', '-c', 'playwright.config.ts']);
  assert.ok(complete.length > 0);
  assert.ok(complete.every(entry => !entry.startsWith('docs/')));
  for (const argv of [['--profile', 'smoke'], ['--profile', 'related', 'alert']]) {
    const plan = planBrowserTests(argv);
    const selected = plan.args.slice(3).map(path => path.replace('tests/browser/', ''));
    const expected = complete.filter(entry => selected.some(file => entry.startsWith(file + ':')));
    assert.ok(expected.length > 0 && expected.length < complete.length);
    assert.deepEqual(await inventory(plan.args), expected);
  }
});
