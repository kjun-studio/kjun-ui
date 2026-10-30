import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { captureReview, captureReviewViewport } from './browser/review-captures.ts';

test('review captures default off and require explicit opt-in', async t => {
  const previous = process.env.KJUN_REVIEW_CAPTURES;
  t.after(() => previous === undefined ? delete process.env.KJUN_REVIEW_CAPTURES : process.env.KJUN_REVIEW_CAPTURES = previous);
  const options = { path: 'review.png', fullPage: true };
  const calls = [];
  const target = { screenshot: async value => calls.push(value) };
  for (const value of [undefined, '0', 'false']) {
    if (value === undefined) delete process.env.KJUN_REVIEW_CAPTURES;
    else process.env.KJUN_REVIEW_CAPTURES = value;
    await captureReview(target, options);
    await captureReviewViewport({ context() { throw Error('Must not create a CDP session'); } }, options.path);
  }
  assert.deepEqual(calls, []);
  process.env.KJUN_REVIEW_CAPTURES = '1';
  await captureReview(target, options);
  assert.deepEqual(calls, [options]);
});

test('forced failure capture saves the zoomed viewport and always detaches CDP', async t => {
  const directory = await mkdtemp(join(tmpdir(), 'kjun-review-capture-'));
  t.after(() => rm(directory, { recursive: true, force: true }));
  const calls = [];
  let fail = false;
  const page = { context: () => ({ newCDPSession: async () => ({
    async send(method, options) {
      calls.push({ method, options });
      if (fail) throw Error('capture failed');
      return { data: Buffer.from('png bytes').toString('base64') };
    },
    async detach() { calls.push('detached'); },
  }) }) };
  const path = join(directory, 'nested', 'zoom.png');
  await captureReviewViewport(page, path, { force: true });
  assert.equal(await readFile(path, 'utf8'), 'png bytes');
  assert.deepEqual(calls, [{ method: 'Page.captureScreenshot', options: { format: 'png', captureBeyondViewport: false } }, 'detached']);
  fail = true;
  await assert.rejects(captureReviewViewport(page, path, { force: true }), /capture failed/);
  assert.equal(calls.at(-1), 'detached');
});
