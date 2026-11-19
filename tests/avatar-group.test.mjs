import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { avatarGroupModel } from '../shared/package-runtime/avatar-group.ts';
import { kjunMessagesKo as ko } from '../shared/package-runtime/messages/ko.ts';
import { kjunMessagesEn as en } from '../shared/package-runtime/messages/en.ts';

test('max caps the avatars drawn; the overflow chip is not counted in it', () => {
  assert.deepEqual(avatarGroupModel({ count: 5, max: 4 }), { visible: 4, overflow: 1, overflowText: '+1', totalCount: 5 });
  assert.deepEqual(avatarGroupModel({ count: 3, max: 4 }), { visible: 3, overflow: 0, overflowText: '', totalCount: 3 });
  assert.equal(avatarGroupModel({ count: 7 }).visible, 4);
});

test('total is the whole headcount from the server; below the item count it is ignored', () => {
  assert.deepEqual(avatarGroupModel({ count: 3, max: 3, total: 12 }), { visible: 3, overflow: 9, overflowText: '+9', totalCount: 12 });
  assert.equal(avatarGroupModel({ count: 5, max: 4, total: 2 }).totalCount, 5);
});

test('past 99 only the chip text stops at +99; the real overflow stays', () => {
  const m = avatarGroupModel({ count: 3, max: 3, total: 128 });
  assert.equal(m.overflowText, '+99');
  assert.equal(m.overflow, 125);
  assert.equal(avatarGroupModel({ count: 3, max: 3, total: 102 }).overflowText, '+99');
  assert.equal(avatarGroupModel({ count: 3, max: 3, total: 101 }).overflowText, '+98');
});

test('at xs and sm a two-digit count drops its "+" to fit the circle; md and larger keep it', () => {
  assert.equal(avatarGroupModel({ count: 3, max: 3, total: 128, size: 'xs' }).overflowText, '99');
  assert.equal(avatarGroupModel({ count: 3, max: 3, total: 128, size: 'sm' }).overflowText, '99');
  assert.equal(avatarGroupModel({ count: 3, max: 3, total: 128, size: 'md' }).overflowText, '+99');
  assert.equal(avatarGroupModel({ count: 3, max: 3, total: 12, size: 'xs' }).overflowText, '+9');
  assert.equal(avatarGroupModel({ count: 3, max: 3, total: 50, size: 'sm' }).overflowText, '47');
  assert.equal(avatarGroupModel({ count: 3, max: 3, total: 128, size: 'xs' }).overflow, 125);
});

test('max becomes a whole number of at least 1', () => {
  assert.equal(avatarGroupModel({ count: 5, max: 0 }).visible, 1);
  assert.equal(avatarGroupModel({ count: 5, max: -3 }).visible, 1);
  assert.equal(avatarGroupModel({ count: 5, max: 2.7 }).visible, 2);
  assert.equal(avatarGroupModel({ count: 5, max: Number.NaN }).visible, 4);
});

test('an empty group draws no avatars and may still show a total', () => {
  assert.deepEqual(avatarGroupModel({ count: 0 }), { visible: 0, overflow: 0, overflowText: '', totalCount: 0 });
  assert.deepEqual(avatarGroupModel({ count: 0, total: 4 }), { visible: 0, overflow: 4, overflowText: '+4', totalCount: 4 });
});

test('the group name counts people', () => {
  assert.equal(ko.avatarGroupCount(128), '128명');
  assert.equal(en.avatarGroupCount(3), '3 people');
  assert.equal(en.avatarGroupCount(1), '1 person');
});

const tokens = JSON.parse(readFileSync(new URL('../packages/tokens/src/tokens.json', import.meta.url), 'utf8'));

test('circles overlap by about a quarter of their side; squares sit a tenth apart', () => {
  assert.deepEqual(tokens.extensions.avatarGroup.overlap, { xs: 6, sm: 8, md: 12, lg: 16, xl: 20 });
  assert.deepEqual(tokens.extensions.avatarGroup.squareGap, { xs: 2, sm: 4, md: 4, lg: 6, xl: 8 });
});
