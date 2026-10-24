import test from 'node:test';
import assert from 'node:assert/strict';
import { build } from 'esbuild';

// KJUN copy and formats follow KjunProvider locale/messages; without a locale nothing changes.
async function load() {
  const output = await build({ entryPoints: ['shared/package-runtime/messages/index.ts'], bundle: true, write: false, format: 'esm', platform: 'node',
    define: { 'process.env.NODE_ENV': '"production"' } });
  return import('data:text/javascript;base64,' + Buffer.from(output.outputFiles[0].contents).toString('base64'));
}
const hangul = /[가-힣]/;

test('ko and en packs have the same keys and en has no Hangul', async () => {
  const { kjunMessagesKo, kjunMessagesEn } = await load();
  assert.deepEqual(Object.keys(kjunMessagesEn).sort(), Object.keys(kjunMessagesKo).sort());
  for (const [key, value] of Object.entries(kjunMessagesEn)) {
    const sample = typeof value === 'function' ? value(3, 'items') : value;
    assert.equal(typeof sample, 'string', key);
    assert.doesNotMatch(sample, hangul, key);
  }
});

test('resolution order: messages over pack, ko/en by language, others fall back to English, no locale is Korean', async () => {
  const { resolveMessageScope, kjunMessagesKo, kjunMessagesEn } = await load();
  assert.equal(resolveMessageScope(undefined).messages.cancel, kjunMessagesKo.cancel);
  assert.equal(resolveMessageScope(undefined, 'ko-KR').messages.cancel, kjunMessagesKo.cancel);
  assert.equal(resolveMessageScope(undefined, 'en-GB').messages.cancel, kjunMessagesEn.cancel);
  const ja = resolveMessageScope(undefined, 'ja-JP', { cancel: 'キャンセル' });
  assert.equal(ja.messages.cancel, 'キャンセル');
  assert.equal(ja.messages.confirm, kjunMessagesEn.confirm);
  assert.equal(resolveMessageScope(undefined, undefined, { cancel: '그만' }).messages.cancel, '그만');
});

test('nested provider merges same-language messages and drops outer messages on language change', async () => {
  const { resolveMessageScope, kjunMessagesEn } = await load();
  const outer = resolveMessageScope(undefined, 'ja-JP', { cancel: 'キャンセル', confirm: 'OK' });
  const same = resolveMessageScope(outer, undefined, { confirm: '確認' });
  assert.equal(same.messages.cancel, 'キャンセル');
  assert.equal(same.messages.confirm, '確認');
  assert.equal(same.intl, 'ja-JP');
  const switched = resolveMessageScope(outer, 'en-US');
  assert.equal(switched.messages.cancel, kjunMessagesEn.cancel);
  assert.equal(switched.intl, 'en-US');
});

test('a nested Korean locale keeps outer messages given without a locale, since both use the Korean pack', async () => {
  const { resolveMessageScope } = await load();
  const outer = resolveMessageScope(undefined, undefined, { cancel: '그만' });
  assert.equal(resolveMessageScope(outer, 'ko-KR').messages.cancel, '그만');
  assert.equal(resolveMessageScope(outer, 'en-US').messages.cancel, 'Cancel');
});

test('invalid locales do not throw', async () => {
  const { normalizeLocale, resolveMessageScope, kjunMessagesEn } = await load();
  assert.equal(normalizeLocale('en_US').intl, 'en-US');
  assert.equal(normalizeLocale('xx_!!').intl, undefined);
  const scope = resolveMessageScope(undefined, 'xx_!!');
  assert.equal(scope.intl, undefined);
  assert.equal(scope.messages.cancel, kjunMessagesEn.cancel);
});

test('no locale keeps current Korean formats', async () => {
  const { formatRelativeTime, formatDateValue, calendarLabels } = await load();
  const now = Date.UTC(2026, 9, 23, 12);
  assert.equal(formatRelativeTime(now - 180000, now), '3분 전');
  assert.equal(formatDateValue('2026-10-23'), '2026. 10. 23.');
  assert.deepEqual(calendarLabels(2026, 9), { title: '2026년 10월', weekdays: ['일', '월', '화', '수', '목', '금', '토'] });
});

test('en-US formats', async () => {
  const { formatRelativeTime, formatDateValue, calendarLabels, resolveMessageScope } = await load();
  const en = resolveMessageScope(undefined, 'en-US');
  const now = Date.UTC(2026, 9, 23, 12);
  assert.equal(formatRelativeTime(now - 180000, now, en), '3 minutes ago');
  assert.equal(formatDateValue('2026-10-23', en), new Intl.DateTimeFormat('en-US', { year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date(2026, 9, 23)));
  const labels = calendarLabels(2026, 9, en);
  assert.equal(labels.title, new Intl.DateTimeFormat('en-US', { year: 'numeric', month: 'long' }).format(new Date(2026, 9, 1)));
  assert.equal(labels.weekdays[0], 'Sun');
});
