import test from 'node:test';
import assert from 'node:assert/strict';
import { build } from 'esbuild';
import { resolve } from 'node:path';
import { readFile } from 'node:fs/promises';

// input-field.ts reads textarea.ts, which reads the token package, so the test bundles it against the package source.
const output = await build({ entryPoints: ['shared/package-runtime/input-field.ts'], bundle: true, write: false, format: 'esm', platform: 'node',
  alias: { '@kjun-ui/tokens': resolve('packages/tokens/src/index.ts') } });
const { inputHasValue, inputShowsClear, inputReveal, inputCount, searchLoadDelay } =
  await import('data:text/javascript;base64,' + Buffer.from(output.outputFiles[0].contents).toString('base64'));

test('the number 0 is a value and shows the clear button', () => {
  assert.equal(inputHasValue(0), true);
  assert.equal(inputHasValue(''), false);
  assert.equal(inputHasValue(null), false);
  assert.equal(inputShowsClear({ clearable: true, value: 0 }), true);
  assert.equal(inputShowsClear({ clearable: false, value: 'a' }), false);
});

test('a read-only or disabled field shows no clear button', () => {
  assert.equal(inputShowsClear({ clearable: true, value: 'a', readOnly: true }), false);
  assert.equal(inputShowsClear({ clearable: true, value: 'a', disabled: true }), false);
});

test('only a revealable password field turns into text while revealed', () => {
  assert.deepEqual(inputReveal('password', true, false), { active: true, type: 'password' });
  assert.deepEqual(inputReveal('password', true, true), { active: true, type: 'text' });
  assert.deepEqual(inputReveal('password', false, true), { active: false, type: 'password' });
  assert.deepEqual(inputReveal('email', true, true), { active: false, type: 'email' });
});

test("Input's count follows Textarea's rule and announces the last tenth", () => {
  assert.equal(inputCount('장기 보유', 20).text, '5/20');
  assert.equal(inputCount(12345).text, '5');
  assert.equal(inputCount('a'.repeat(21), 20).over, true);
  assert.equal(inputCount('a'.repeat(5), 20).remaining, null);
  assert.equal(inputCount('a'.repeat(12), 20).remaining, 8);
});

test('both search runtimes wait the shared delay before asking loadOptions', async () => {
  assert.equal(searchLoadDelay, 300);
  for (const file of ['shared/package-runtime/search-input.ts', 'packages/vue3/src/runtime/selection.ts']) {
    const source = await readFile(file, 'utf8');
    assert.match(source, /searchLoadDelay\)/, file);
    // A new loadOptions function alone must not restart the search.
    assert.doesNotMatch(source, /\[query(\.value)?, (props\(\)\.)?loadOptions,/, file);
  }
});
