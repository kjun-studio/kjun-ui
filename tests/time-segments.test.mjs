import test from 'node:test';
import assert from 'node:assert/strict';
import { createTimeDomain } from '../packages/tokens/src/input-contract.ts';
import { build } from 'esbuild';

const output = await build({ entryPoints: ['shared/package-runtime/time-segments.ts'], bundle: true, write: false, format: 'esm', platform: 'node', external: ['@kjun-ui/tokens'] });
const { timeSegments, periodLeads, typeSegmentDigit, typeSegmentPeriod, createSegmentTyping } = await import('data:text/javascript;base64,' + Buffer.from(output.outputFiles[0].contents).toString('base64'));
const messages = { hour: '시', minute: '분', second: '초', period: '오전/오후', am: '오전', pm: '오후' };

test('a 24-hour clock draws hour and minute segments', () => {
  const domain = createTimeDomain({ minuteStep: 30 });
  const [hour, minute] = timeSegments(domain, '09:30', { precision: 'minute', messages });
  assert.equal(hour.key, 'hour'); assert.equal(hour.value, 9); assert.equal(hour.options.length, 24);
  assert.deepEqual(minute.options.map(o => o.value), [0, 30]);
  assert.equal(minute.pick(0), '09:00');
});

test('a 12-hour clock adds AM/PM, shows 12 for noon and midnight, and keeps HH:mm values', () => {
  const domain = createTimeDomain();
  const [period, hour] = timeSegments(domain, '13:15', { precision: 'minute', hourCycle: 12, messages });
  assert.equal(period.key, 'period'); assert.equal(period.value, 1);
  assert.deepEqual(period.options.map(o => o.label), ['오전', '오후']);
  assert.equal(hour.value, 1);
  assert.deepEqual(hour.options.map(o => o.value), [12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]);
  assert.equal(hour.pick(12), '12:15');
  assert.equal(period.pick(0), '01:15');
  assert.equal(timeSegments(domain, '00:05', { precision: 'minute', hourCycle: 12, messages })[1].value, 12);
});

test('AM/PM only offers the periods the bounds allow, and switching lands inside them', () => {
  const domain = createTimeDomain({ min: '09:00', max: '14:00' });
  const [period] = timeSegments(domain, '10:00', { precision: 'minute', hourCycle: 12, messages });
  assert.equal(period.pick(1), '12:00');
  const english = timeSegments(domain, null, { precision: 'minute', hourCycle: 12, messages, periodFirst: false });
  assert.equal(english.at(-1).key, 'period');
  assert.equal(periodLeads('ko'), true); assert.equal(periodLeads('en'), false);
});

test('a value off the minute step keeps its segments usable', () => {
  const domain = createTimeDomain({ minuteStep: 5 });
  assert.equal(domain.accepts('09:07'), false);
  const [, minute] = timeSegments(domain, '09:07', { precision: 'minute', messages });
  assert.equal(minute.value, 7);
  assert.equal(minute.pick(5), '09:05');
});

test('second precision accepts bounds without seconds and stays fast', () => {
  const domain = createTimeDomain({ precision: 'second', min: '09:00', max: '09:01' });
  assert.ok(domain.valid);
  assert.equal(domain.accepts('09:01:59'), true);
  assert.equal(domain.accepts('09:02:00'), false);
  const full = createTimeDomain({ precision: 'second' }), started = performance.now();
  for (let i = 0; i < 200; i++) { full.options('12:30:00', 2); full.select('12:30:00', 2, i % 60); full.accepts('12:30:15'); }
  assert.ok(performance.now() - started < 500, 'segment lists are cached');
});

test('typing digits picks a segment option and moves on once no longer number can follow', () => {
  const hours = Array.from({ length: 24 }, (_, i) => i);
  assert.deepEqual(typeSegmentDigit(hours, '', '0'), { typed: '0', value: 0, advance: false });
  assert.deepEqual(typeSegmentDigit(hours, '0', '9'), { typed: '', value: 9, advance: true });
  assert.deepEqual(typeSegmentDigit(hours, '', '1'), { typed: '1', value: 1, advance: false });
  assert.deepEqual(typeSegmentDigit(hours, '1', '7'), { typed: '', value: 17, advance: true });
  assert.deepEqual(typeSegmentDigit(hours, '', '3'), { typed: '', value: 3, advance: true });
  // 2 then 5 is no hour: the 5 starts over and picks 05.
  assert.deepEqual(typeSegmentDigit(hours, '2', '5'), { typed: '', value: 5, advance: true });
  const quarters = [0, 15, 30, 45];
  assert.deepEqual(typeSegmentDigit(quarters, '', '1'), { typed: '1', value: null, advance: false });
  assert.deepEqual(typeSegmentDigit(quarters, '1', '5'), { typed: '', value: 15, advance: true });
  assert.deepEqual(typeSegmentDigit(quarters, '', '0'), { typed: '', value: 0, advance: true });
  assert.deepEqual(typeSegmentDigit(quarters, '', '7'), { typed: '', value: null, advance: false });
  const twelve = [12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
  assert.deepEqual(typeSegmentDigit(twelve, '', '1'), { typed: '1', value: 1, advance: false });
  assert.deepEqual(typeSegmentDigit(twelve, '1', '2'), { typed: '', value: 12, advance: true });
});

test('a period segment answers a/p, or its own first letters when they differ', () => {
  const ko = [{ value: 0, label: '오전' }, { value: 1, label: '오후' }], en = [{ value: 0, label: 'AM' }, { value: 1, label: 'PM' }];
  assert.equal(typeSegmentPeriod(ko, 'p'), 1);
  assert.equal(typeSegmentPeriod(ko, 'a'), 0);
  assert.equal(typeSegmentPeriod(en, 'P'), 1);
  assert.equal(typeSegmentPeriod([{ value: 1, label: 'PM' }], 'a'), null);
  assert.equal(typeSegmentPeriod(en, 'x'), null);
});

test('segment typing forgets a waiting digit after a second or on another segment', () => {
  const domain = createTimeDomain();
  const [hour, minute] = timeSegments(domain, null, { precision: 'minute', messages });
  const typing = createSegmentTyping();
  assert.deepEqual(typing.key(hour, 0, '1', 0), { value: 1, advance: false });
  assert.deepEqual(typing.key(hour, 0, '4', 500), { value: 14, advance: true });
  typing.key(hour, 0, '1', 1000);
  assert.deepEqual(typing.key(hour, 0, '4', 2500), { value: 4, advance: true });
  typing.key(hour, 0, '1', 3000);
  assert.deepEqual(typing.key(minute, 1, '4', 3100), { value: 4, advance: false });
  assert.equal(typing.key(hour, 0, 'x', 3200), null);
});
