import test from 'node:test';
import assert from 'node:assert/strict';
import { mergeIds, joinHints } from '../shared/package-runtime/aria-ids.ts';

test('mergeIds joins id lists once each and drops empties', () => {
  assert.equal(mergeIds('a b', 'b', undefined, ' c '), 'a b c');
  assert.equal(mergeIds(undefined, '', null), undefined);
});

test('resolveIcon warns once per unregistered name outside production', async () => {
  const { resolveIcon } = await import('../shared/package-runtime/icon-registry.ts');
  const warnings = [], warn = console.warn, env = process.env.NODE_ENV;
  console.warn = message => warnings.push(String(message));
  try {
    process.env.NODE_ENV = 'development';
    const registry = { star: { outline: [] } };
    resolveIcon(registry, 'tyve-missing-a'); resolveIcon(registry, 'tyve-missing-a');
    resolveIcon(registry, 'star');
    assert.equal(warnings.filter(w => w.includes('tyve-missing-a')).length, 1);
    assert.equal(warnings.filter(w => w.includes('star')).length, 0);
    process.env.NODE_ENV = 'production';
    resolveIcon(registry, 'tyve-missing-b');
    assert.equal(warnings.filter(w => w.includes('tyve-missing-b')).length, 0);
  } finally {
    console.warn = warn;
    if (env === undefined) delete process.env.NODE_ENV; else process.env.NODE_ENV = env;
  }
});

test('resolveIcon stays silent where the bundle supplies no process object', async () => {
  const { resolveIcon } = await import('../shared/package-runtime/icon-registry.ts');
  const { readFileSync } = await import('node:fs');
  // Bundlers only replace the literal expression, so the source must spell it out.
  assert.match(readFileSync(new URL('../shared/package-runtime/icon-registry.ts', import.meta.url), 'utf8'), /process\.env\.NODE_ENV/);
  const warnings = [], warn = console.warn, saved = globalThis.process;
  console.warn = message => warnings.push(String(message));
  try {
    globalThis.process = undefined;
    resolveIcon({}, 'tyve-missing-browser');
  } finally {
    globalThis.process = saved;
    console.warn = warn;
  }
  assert.equal(warnings.filter(w => w.includes('tyve-missing-browser')).length, 0);
});

test('joinHints keeps the hint with the error for device announcements', () => {
  assert.equal(joinHints('형식 안내', '오류 문구'), '형식 안내. 오류 문구');
  assert.equal(joinHints(undefined, '오류 문구'), '오류 문구');
  assert.equal(joinHints('', null), undefined);
});
