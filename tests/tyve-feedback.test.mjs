import test from 'node:test';
import assert from 'node:assert/strict';
import { mergeIds } from '../shared/package-runtime/aria-ids.ts';

test('mergeIds joins id lists once each and drops empties', () => {
  assert.equal(mergeIds('a b', 'b', undefined, ' c '), 'a b c');
  assert.equal(mergeIds(undefined, '', null), undefined);
});

test('resolveIcon warns once per unregistered name outside production', async () => {
  const { resolveIcon } = await import('../shared/package-runtime/icon-registry.ts');
  const warnings = [], warn = console.warn, env = process.env.NODE_ENV;
  console.warn = message => warnings.push(String(message));
  try {
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
