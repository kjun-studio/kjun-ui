import test from 'node:test';
import assert from 'node:assert/strict';
import { build } from 'esbuild';
import { resolve } from 'node:path';

// textarea.ts reads the token package, so the test bundles it against the package source.
const output = await build({ entryPoints: ['shared/package-runtime/textarea.ts'], bundle: true, write: false, format: 'esm', platform: 'node',
  alias: { '@kjun-ui/tokens': resolve('packages/tokens/src/index.ts') } });
const { textareaBounds, textareaCanSubmit, textareaCount, textareaGrows, textareaPadding, textareaRemaining, textareaSubmitKey } =
  await import('data:text/javascript;base64,' + Buffer.from(output.outputFiles[0].contents).toString('base64'));

test('a field grows between rows and maxRows unless the user may drag it taller', () => {
  const [min, max] = textareaBounds('md', 3, 6);
  assert.ok(max > min);
  assert.equal(textareaGrows(min, max), true);
  assert.equal(textareaGrows(min, max, 'horizontal'), true);
  assert.equal(textareaGrows(min, max, 'vertical'), false);
  assert.equal(textareaGrows(min, max, 'both'), false);
  const [fixed, same] = textareaBounds('md', 4, 3);
  assert.equal(fixed, same);
});

test('the count follows maxLength and the composer sends only valid, enabled, idle text', () => {
  assert.deepEqual(textareaCount('abc', 2), { length: 3, text: '3/2', over: true });
  assert.equal(textareaCanSubmit({ value: '  ' }), false);
  assert.equal(textareaCanSubmit({ value: 'hi' }), true);
  assert.equal(textareaCanSubmit({ value: 'hi', submitting: true }), false);
  assert.equal(textareaCanSubmit({ value: 'hi', readOnly: true }), false);
  assert.equal(textareaCanSubmit({ value: 'hello', maxLength: 3 }), false);
  assert.equal(textareaCanSubmit({ value: undefined }), false);
});

test('Enter sends only in enter mode, never while an IME is composing', () => {
  assert.equal(textareaSubmitKey({ key: 'Enter', metaKey: true }), true);
  assert.equal(textareaSubmitKey({ key: 'Enter' }), false);
  assert.equal(textareaSubmitKey({ key: 'Enter' }, 'enter'), true);
  assert.equal(textareaSubmitKey({ key: 'Enter', shiftKey: true }, 'enter'), false);
  assert.equal(textareaSubmitKey({ key: 'Enter', isComposing: true }, 'enter'), false);
  assert.equal(textareaSubmitKey({ key: 'Enter', keyCode: 229 }, 'enter'), false);
  assert.equal(textareaSubmitKey({ key: 'a', ctrlKey: true }), false);
});

test('the text inset and the remaining characters near the limit', () => {
  assert.equal(textareaPadding('md', true).bottom < textareaPadding('md', false).bottom, true);
  assert.equal(textareaRemaining('abc'), null);
  assert.equal(textareaRemaining('a'.repeat(50), 100), null);
  assert.equal(textareaRemaining('a'.repeat(95), 100), 5);
  assert.equal(textareaRemaining('a'.repeat(120), 100), 0);
});
