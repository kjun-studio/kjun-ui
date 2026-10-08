import test from 'node:test';
import assert from 'node:assert/strict';
import { access, readdir } from 'node:fs/promises';
import { createServer } from 'node:http';
import { assertDocsPortFree, planDocsTests, relatedGroups, fullScopes, smokeFiles } from '../scripts/docs-test-profiles.mjs';

test('the existing default still selects the complete docs suite', () => {
  assert.deepEqual(planDocsTests([]).args, ['test', '-c', 'playwright.docs.config.ts']);
  assert.equal(planDocsTests([]).profile, 'full');
});

test('smoke selects existing shell and three-platform preview specs', async () => {
  const plan = planDocsTests(['--profile', 'smoke', '--list']);
  assert.equal(plan.profile, 'smoke');
  assert.equal(plan.listOnly, true);
  assert.deepEqual(plan.args.slice(3, -1), smokeFiles);
  await Promise.all(smokeFiles.map(path => access(path)));
});

test('related scopes keep entire spec files and deduplicate overlaps', async () => {
  for (const paths of Object.values(relatedGroups)) await Promise.all(paths.map(path => access(path)));
  const plan = planDocsTests(['--profile', 'related', 'alert,data-state', '--reporter=list']);
  const expected = [...new Set([...relatedGroups.alert, ...relatedGroups['data-state']])];
  assert.deepEqual(plan.args.slice(3, -1), expected);
  assert.equal(plan.args.at(-1), '--reporter=list');
});

test('common changes expand to full coverage instead of silently omitting consumers', () => {
  for (const scope of fullScopes) {
    const plan = planDocsTests(['--profile', 'related', 'alert,' + scope]);
    assert.equal(plan.profile, 'full');
    assert.deepEqual(plan.args, ['test', '-c', 'playwright.docs.config.ts']);
  }
});

test('missing or unknown related scopes fail before starting a build', () => {
  for (const args of [[], ['typo'], ['alert,typo']]) {
    assert.throws(() => planDocsTests(['--profile', 'related', ...args]), /관련 검사 범위/);
  }
  assert.throws(() => planDocsTests(['--profile', 'typo']), /알 수 없는 검사 모드/);
  assert.throws(() => planDocsTests(['--config=playwright.config.ts']), /설정은 고정/);
});

test('existing filename and grep arguments remain available on the full command', () => {
  const args = ['docs-kjun.spec.ts', '--grep', 'mobile', '--list'];
  assert.deepEqual(planDocsTests(args).args.slice(3), args);
});

test('every docs spec belongs to a related group so related runs cannot skip it silently', async () => {
  const grouped = new Set(Object.values(relatedGroups).flat());
  const specs = (await readdir('tests/browser/docs')).filter(name => name.endsWith('.spec.ts'));
  assert.deepEqual(specs.map(name => `tests/browser/docs/${name}`).filter(path => !grouped.has(path)), []);
});

test('related scopes tolerate spaces and reject inherited object keys', () => {
  assert.deepEqual(planDocsTests(['--profile', 'related', 'select, input']).args,
    planDocsTests(['--profile', 'related', 'select,input']).args);
  for (const scope of ['toString', 'constructor', '__proto__']) {
    assert.throws(() => planDocsTests(['--profile', 'related', scope]), /관련 검사 범위/);
  }
});

test('docs checks refuse a port that another server already answers', async () => {
  const server = createServer((request, response) => response.end('stale'));
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const url = `http://127.0.0.1:${server.address().port}`;
  try {
    await assert.rejects(assertDocsPortFree(url), /이미 응답하는 서버/);
  } finally {
    await new Promise(resolve => server.close(resolve));
  }
  await assertDocsPortFree(url);
});
