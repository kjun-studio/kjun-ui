import test from 'node:test';
import assert from 'node:assert/strict';
import { build } from 'esbuild';
import { createFeedbackController } from '../packages/tokens/dist/index.js';

// toast-presentation.ts is shared TypeScript, so the test bundles it.
const output = await build({ entryPoints: ['shared/package-runtime/toast-presentation.ts'], bundle: true, write: false, format: 'esm', platform: 'node' });
const { toastPresentation, orderToasts, toastSwipeOpacity, toastSwipeDistance } =
  await import('data:text/javascript;base64,' + Buffer.from(output.outputFiles[0].contents).toString('base64'));
const toast = (options) => ({ id: 1, message: 'm', remaining: 0, startedAt: 0, paused: false, duration: 3000, type: 'info', ...options });

test('a toast that never closes itself keeps a close button, whatever closable says', () => {
  assert.equal(toastPresentation(toast({ type: 'danger', duration: 0, closable: false })).closable, true);
  assert.equal(toastPresentation(toast({ closable: false })).closable, false);
  assert.equal(toastPresentation(toast({ compact: true })).closable, false);
  assert.equal(toastPresentation(toast({ compact: true, duration: 0 })).closable, true);
  // A heading turns compact off and moves the action under the message.
  const titled = toastPresentation(toast({ compact: true, title: 't', action: { label: 'a', onClick() {} } }));
  assert.deepEqual([titled.compact, titled.sideAction, titled.closable], [false, false, true]);
});

test('only danger interrupts; loading swaps the icon; the spoken text joins heading and message', () => {
  assert.deepEqual([toastPresentation(toast({ type: 'error' })).role, toastPresentation(toast({ type: 'error' })).live], ['alert', 'assertive']);
  assert.deepEqual([toastPresentation(toast({})).role, toastPresentation(toast({})).live], ['status', 'polite']);
  assert.equal(toastPresentation(toast({ loading: true })).icon, 'loader-2');
  assert.equal(toastPresentation(toast({ title: '저장', message: '완료' })).spoken, '저장. 완료');
});

test('the newest toast sits nearest the edge it enters from, and a swipe fades toward its closing distance', () => {
  assert.deepEqual(orderToasts([1, 2, 3]), [3, 2, 1]);
  assert.deepEqual(orderToasts([1, 2, 3], 'bottom'), [1, 2, 3]);
  assert.equal(toastSwipeOpacity(0), 1);
  assert.equal(toastSwipeOpacity(-toastSwipeDistance()), 0.5);
});

test('a key replaces the shown toast in place, restarting its time without a dismissal', () => {
  const c = createFeedbackController(), reasons = [];
  const first = c.api.toast.error('offline', { key: 'net', onDismiss: reason => reasons.push(reason) });
  const again = c.api.toast.warning('still offline', { key: 'net' });
  assert.equal(again, first);
  assert.deepEqual(c.getSnapshot().toasts.map(t => [t.message, t.type, t.duration]), [['still offline', 'warning', 4000]]);
  assert.deepEqual(reasons, []);
  c.dispose();
  assert.deepEqual(reasons, ['api']);
});

test('onDismiss hears why a toast left', async () => {
  const c = createFeedbackController(), reasons = [];
  const on = reason => reasons.push(reason);
  c.api.toast.info('timed', { duration: 1, onDismiss: on });
  const closed = c.api.toast.info('closed', { duration: 0, onDismiss: on });
  const acted = c.api.toast.info('acted', { duration: 0, onDismiss: on });
  await new Promise(resolve => setTimeout(resolve, 20));
  c.closeToast(closed, 'close');
  c.closeToast(acted, 'action');
  c.api.toast.info('api', { duration: 0, onDismiss: on });
  c.api.toast.clearAll();
  c.closeToast(closed, 'close');
  assert.deepEqual(reasons, ['timeout', 'close', 'action', 'api']);
  c.dispose();
});

test('clearAll and a missing id notify listeners at most once', () => {
  const c = createFeedbackController();
  for (let i = 0; i < 3; i++) c.api.toast.info(String(i), { duration: 0 });
  let calls = 0;
  c.subscribe(() => calls++);
  c.api.toast.dismiss(999);
  c.api.toast.clearAll();
  c.api.toast.clearAll();
  assert.equal(calls, 1);
  c.dispose();
});

test('update changes a toast in place; a new type without a duration takes that type default', () => {
  const c = createFeedbackController();
  const id = c.api.toast.info('uploading', { duration: 0 });
  c.api.toast.update(id, { type: 'success', message: 'uploaded' });
  assert.deepEqual(c.getSnapshot().toasts.map(t => [t.message, t.type, t.duration, t.remaining]), [['uploaded', 'success', 3000, 3000]]);
  c.api.toast.update(id, { message: 'kept' });
  assert.equal(c.getSnapshot().toasts[0].duration, 3000);
  c.api.toast.update(12345, { message: 'ignored' });
  assert.equal(c.getSnapshot().toasts.length, 1);
  c.dispose();
});

test('promise shows a loading toast and turns it into success or error, returning the same result', async () => {
  const c = createFeedbackController();
  const ok = c.api.toast.promise(Promise.resolve(7), { loading: 'saving', success: value => `saved ${value}`, error: 'failed' });
  const shown = c.getSnapshot().toasts[0];
  assert.deepEqual([shown.message, shown.loading, shown.duration], ['saving', true, 0]);
  assert.equal(await ok, 7);
  await Promise.resolve();
  assert.deepEqual(c.getSnapshot().toasts.map(t => [t.message, t.type, t.loading]), [['saved 7', 'success', false]]);
  await assert.rejects(c.api.toast.promise(() => Promise.reject(Error('x')), { loading: 'l', success: 's', error: error => `failed: ${error.message}` }), /x/);
  await Promise.resolve();
  const failed = c.getSnapshot().toasts.at(-1);
  assert.deepEqual([failed.message, failed.type, failed.duration], ['failed: x', 'danger', 0]);
  c.dispose();
});

test('the toast limit follows the Provider, closing the oldest self-closing toast first', () => {
  const c = createFeedbackController();
  c.api.toast.error('lasting');
  for (let i = 0; i < 3; i++) c.api.toast.info(String(i));
  c.setToastLimit(2);
  assert.deepEqual(c.getSnapshot().toasts.map(t => t.message), ['lasting', '2']);
  c.setToastLimit(5);
  for (let i = 3; i < 7; i++) c.api.toast.info(String(i));
  assert.equal(c.getSnapshot().toasts.length, 5);
  c.dispose();
});
