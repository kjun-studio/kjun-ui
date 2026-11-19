import test from 'node:test';
import assert from 'node:assert/strict';
import { createTimeDomain } from '../packages/tokens/src/input-contract.ts';
import { build } from 'esbuild';

const output = await build({ entryPoints: ['shared/package-runtime/time-wheel.ts'], bundle: true, write: false, format: 'esm', platform: 'node', external: ['@kjun-ui/tokens'] });
const { timeWheel, wheelPick, wheelStart, timeText, wheelKey, resolveTimeLayout, resolveTimeTrigger, wheelRow, wheelHome, wheelItemAt, wheelCopies } =
  await import('data:text/javascript;base64,' + Buffer.from(output.outputFiles[0].contents).toString('base64'));
const messages = { hour: '시', minute: '분', second: '초', period: '오전/오후', am: '오전', pm: '오후' };

test('a wheel shows every hour and every minute step, fading the times outside min and max', () => {
  const domain = createTimeDomain({ min: '09:00', max: '18:00', minuteStep: 30 });
  const [hour, minute] = timeWheel(domain, '18:00', { precision: 'minute', minuteStep: 30, messages });
  assert.equal(hour.items.length, 24);
  assert.deepEqual(hour.items.filter(item => !item.disabled).map(item => item.value), [9, 10, 11, 12, 13, 14, 15, 16, 17, 18]);
  assert.equal(hour.items[hour.index].value, 18);
  assert.deepEqual(minute.items.map(item => [item.value, item.disabled]), [[0, false], [30, true]]);
  assert.ok(hour.loop && minute.loop);
});

test('a 12-hour wheel adds a stopping AM/PM column, shows 12 first and keeps HH:mm values', () => {
  const domain = createTimeDomain();
  const [period, hour, minute] = timeWheel(domain, '13:15', { precision: 'minute', hourCycle: 12, messages });
  assert.equal(period.key, 'period'); assert.equal(period.loop, false); assert.equal(period.items[period.index].label, '오후');
  assert.deepEqual(hour.items.slice(0, 3).map(item => item.value), [12, 1, 2]);
  assert.equal(hour.items[hour.index].value, 1);
  assert.equal(minute.items[minute.index].value, 15);
  assert.equal(wheelPick(domain, '13:15', 'period', 0, { precision: 'minute', hourCycle: 12 }), '01:15');
  assert.equal(wheelPick(domain, '13:15', 'hour', 12, { precision: 'minute', hourCycle: 12 }), '12:15');
  assert.equal(wheelPick(domain, '01:15', 'hour', 12, { precision: 'minute', hourCycle: 12 }), '00:15');
  const after = timeWheel(domain, '13:15', { precision: 'minute', hourCycle: 12, messages, periodFirst: false });
  assert.deepEqual(after.map(column => column.key), ['hour', 'minute', 'period']);
});

test('a column that stops outside the bounds turns back to the closest allowed time', () => {
  const domain = createTimeDomain({ min: '09:00', max: '18:00', minuteStep: 30 });
  assert.equal(wheelPick(domain, '17:30', 'hour', 18, { precision: 'minute' }), '18:00');
  assert.equal(wheelPick(domain, '09:30', 'hour', 7, { precision: 'minute' }), '09:00');
  assert.equal(wheelPick(domain, '10:00', 'minute', 30, { precision: 'minute' }), '10:30');
  const seconds = createTimeDomain({ precision: 'second', secondStep: 15 });
  assert.equal(wheelPick(seconds, '09:30:15', 'second', 45, { precision: 'second' }), '09:30:45');
  assert.equal(timeWheel(seconds, '09:30:15', { precision: 'second', secondStep: 15, messages })[2].items.length, 4);
});

test('the wheel starts on the value, the closest allowed time, or now rounded to the step', () => {
  const domain = createTimeDomain({ min: '09:00', max: '18:00', minuteStep: 15 });
  assert.equal(wheelStart(domain, '10:15'), '10:15');
  assert.equal(wheelStart(domain, '10:07'), '10:00');
  assert.equal(wheelStart(domain, '20:00'), '18:00');
  assert.equal(wheelStart(domain, null, new Date(2026, 10, 19, 14, 8)), '14:15');
  assert.equal(wheelStart(domain, null, new Date(2026, 10, 19, 6, 0)), '09:00');
});

test('the button reads the time on the clock it uses', () => {
  const domain = createTimeDomain();
  assert.equal(timeText(domain, '09:30', { precision: 'minute', messages }), '09:30');
  assert.equal(timeText(domain, '21:05', { precision: 'minute', hourCycle: 12, messages }), '오후 9:05');
  assert.equal(timeText(domain, '00:05', { precision: 'minute', hourCycle: 12, messages: { ...messages, am: 'AM' }, periodFirst: false }), '12:05 AM');
  assert.equal(timeText(domain, null, { precision: 'minute', messages }), '');
});

test('keys step a column over faded items, go round a looping column and stop at the ends of AM/PM', () => {
  const domain = createTimeDomain({ min: '09:00', max: '18:00' });
  const [hour] = timeWheel(domain, '18:00', { precision: 'minute', messages });
  assert.equal(wheelKey(hour, 'ArrowUp'), 9, 'goes round past the faded night hours');
  assert.equal(wheelKey(hour, 'ArrowDown'), 17);
  assert.equal(wheelKey(hour, 'PageDown'), 13);
  assert.equal(wheelKey(hour, 'Home'), 9);
  assert.equal(wheelKey(hour, 'End'), null);
  const [period] = timeWheel(createTimeDomain(), '13:00', { precision: 'minute', hourCycle: 12, messages });
  assert.equal(wheelKey(period, 'ArrowUp'), null);
  assert.equal(wheelKey(period, 'ArrowDown'), 0);
});

test('a looping column draws three copies, moves the short way round and settles in the middle copy', () => {
  const [, minute] = timeWheel(createTimeDomain({ minuteStep: 5 }), '09:55', { precision: 'minute', minuteStep: 5, messages });
  assert.equal(wheelCopies(minute), 3);
  assert.equal(wheelRow(minute, 11, null), 23);
  assert.equal(wheelRow(minute, 0, 23), 24, '55 → 00 goes down one row instead of up eleven');
  assert.equal(wheelHome(minute, 24), 12);
  assert.equal(wheelItemAt(minute, 35).value, 55);
  const [period] = timeWheel(createTimeDomain(), '13:00', { precision: 'minute', hourCycle: 12, messages });
  assert.equal(wheelCopies(period), 1);
  assert.equal(wheelItemAt(period, 5).value, 1);
});

test('auto takes the sheet on touch screens, and the trigger follows the layout unless given', () => {
  assert.equal(resolveTimeLayout('auto', false), 'popover');
  assert.equal(resolveTimeLayout('auto', true), 'sheet');
  assert.equal(resolveTimeLayout('inline', true), 'inline');
  assert.equal(resolveTimeTrigger(undefined, 'popover'), 'segments');
  assert.equal(resolveTimeTrigger(undefined, 'sheet'), 'button');
  assert.equal(resolveTimeTrigger('segments', 'sheet'), 'segments');
});
