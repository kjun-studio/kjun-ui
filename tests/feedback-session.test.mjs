import test from 'node:test';
import assert from 'node:assert/strict';
import { createFeedbackSession, graphemeCount, promptValidateDelay, sameText } from '../shared/package-runtime/feedback-prompt.ts';
import { kjunMessagesKo } from '../shared/package-runtime/messages/ko.ts';

function harness(kind, options) {
  let state = { value: options.initialValue ?? '', error: '', busy: false };
  const settled = [];
  const controller = { getSnapshot: () => ({ current: settled.length ? null : { id: 1 } }), settle: (value, reason) => settled.push([value, reason]) };
  const session = createFeedbackSession({ kind, id: 1, options, controller, messages: kjunMessagesKo, get: () => state, set: patch => { state = { ...state, ...patch }; } });
  return { session, settled, state: () => state };
}

test('required values ignore spacing and Hangul composition; empty prompts wait for text', () => {
  assert.equal(sameText(' 주말 장보기 ', '주말 장보기'), true);
  assert.equal(sameText('한글'.normalize('NFD'), '한글'), true);
  const { session, state } = harness('prompt', {});
  assert.equal(session.ready(state()), false);
  session.edit('  ');
  assert.equal(session.ready(state()), false);
  session.edit('이름');
  assert.equal(session.ready(state()), true);
  assert.equal(harness('prompt', { allowEmpty: true }).session.ready({ value: '', error: '', busy: false }), true);
});

test('a failed onConfirm stays in the dialog and can be retried', async () => {
  let attempts = 0;
  const { session, settled, state } = harness('confirm', { onConfirm: async () => { if (++attempts === 1) throw new Error('끊김'); } });
  await session.submit();
  assert.equal(state().error, '끊김');
  assert.equal(state().busy, false);
  assert.deepEqual(settled, []);
  await session.submit();
  assert.deepEqual(settled, [[true, undefined]]);
});

test('async validators check on submit, and live checks ignore stale results', async () => {
  const { session, settled, state } = harness('prompt', { validateOn: 'change', validator: async value => value.length > 1 || '두 글자 이상' });
  session.edit('a');
  session.edit('ab');
  await new Promise(resolve => setTimeout(resolve, promptValidateDelay + 50));
  assert.equal(state().error, '');
  session.edit('a');
  await new Promise(resolve => setTimeout(resolve, promptValidateDelay + 50));
  assert.equal(state().error, '두 글자 이상');
  assert.equal(session.ready(state()), false);
  session.edit('abc');
  await session.submit();
  assert.deepEqual(settled, [['abc', undefined]]);
});

test('character counts follow what the user sees', () => {
  assert.equal(graphemeCount('한글'), 2);
  assert.equal(graphemeCount('👍🏽'), 1);
});
