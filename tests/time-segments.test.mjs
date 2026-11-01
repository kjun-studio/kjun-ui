import test from 'node:test';
import assert from 'node:assert/strict';
import { createTimeDomain } from '../packages/tokens/src/input-contract.ts';
import { build } from 'esbuild';

const output = await build({ entryPoints: ['shared/package-runtime/time-segments.ts'], bundle: true, write: false, format: 'esm', platform: 'node', external: ['@kjun-ui/tokens'] });
const { timeSegments, periodLeads } = await import('data:text/javascript;base64,' + Buffer.from(output.outputFiles[0].contents).toString('base64'));
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
