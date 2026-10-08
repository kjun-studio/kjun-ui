import test from 'node:test';
import assert from 'node:assert/strict';
import { createNumberMotion } from '../shared/package-runtime/number-motion.ts';

function clock(t) {
  let now = 0, sequence = 0;
  const pending = new Map();
  const oldRequest = globalThis.requestAnimationFrame, oldCancel = globalThis.cancelAnimationFrame;
  t.mock.method(performance, 'now', () => now);
  globalThis.requestAnimationFrame = callback => { pending.set(++sequence, callback); return sequence; };
  globalThis.cancelAnimationFrame = id => pending.delete(id);
  t.after(() => { globalThis.requestAnimationFrame = oldRequest; globalThis.cancelAnimationFrame = oldCancel; });
  return { pending, step(ms) { now += ms; const frames = [...pending.values()]; pending.clear(); frames.forEach(callback => callback(now)); } };
}
test('number updates retarget from the displayed raw value and finish exactly', t => {
  const time = clock(t), values = [], motion = createNumberMotion(value => values.push(value));
  motion.update(100, true, true, false); motion.update(1000, true, true, false); time.step(90);
  const displayed = values.at(-1);
  assert.ok(displayed > 100 && displayed < 1000);
  motion.update(120, true, true, false); assert.equal(values.at(-1), displayed);
  time.step(30); assert.ok(values.at(-1) < displayed && values.at(-1) > 120);
  time.step(600); assert.equal(values.at(-1), 120); assert.equal(time.pending.size, 0);
});
test('strings, disabling, reduced motion and disposal cancel stale callbacks', t => {
  const time = clock(t), values = [], motion = createNumberMotion(value => values.push(value));
  motion.update(100, true, true, false); motion.update(1000, true, true, false); time.step(60);
  const stale = [...time.pending.values()][0];
  motion.update('확인 중', true, true, false); stale(600);
  assert.equal(values.at(-1), '확인 중'); assert.equal(time.pending.size, 0);
  motion.update(-25.5, true, true, false); assert.equal(values.at(-1), -25.5);
  motion.update(50, true, true, false); time.step(60); motion.update(50, false, true, false);
  assert.equal(values.at(-1), 50); assert.equal(time.pending.size, 0);
  motion.update(100, true, true, false); time.step(60); motion.update(100, true, true, true);
  assert.equal(values.at(-1), 100); motion.update(100, true, true, false); assert.equal(time.pending.size, 0);
  motion.update(200, true, true, false); motion.cancel(); assert.equal(time.pending.size, 0);
});
test('fromPrevious false retains the explicit zero-origin contract', t => {
  const time = clock(t), values = [], motion = createNumberMotion(value => values.push(value));
  motion.update(100, true, false, false); assert.equal(values.at(-1), 0); time.step(600);
  motion.update(200, true, false, false); assert.equal(values.at(-1), 0); time.step(600); assert.equal(values.at(-1), 200);
});
