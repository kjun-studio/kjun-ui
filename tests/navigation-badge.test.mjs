import test from 'node:test';
import assert from 'node:assert/strict';
import { badgeCount, badgeSpoken, navigationBadge, navigationLabel } from '../shared/package-runtime/navigation-badge.ts';

test('empty text and NaN draw no badge, while 0 stays visible', () => {
  assert.deepEqual(navigationBadge(0), { dot: false, text: '0' });
  for (const badge of ['', NaN, null, undefined, false]) {
    assert.equal(navigationBadge(badge), null);
    assert.equal(navigationLabel('받은함', badge, '새 소식'), '받은함');
  }
});

test('counts cap at the maximum while the name keeps the real value', () => {
  assert.deepEqual(navigationBadge(120), { dot: false, text: '99+' });
  assert.deepEqual(navigationBadge(5), { dot: false, text: '5' });
  assert.deepEqual(navigationBadge(true), { dot: true, text: '' });
  assert.deepEqual(navigationBadge('N'), { dot: false, text: 'N' });
  assert.equal(navigationLabel('받은함', 120, '새 소식', n => `새 항목 ${n}개`), '받은함, 새 항목 120개');
  assert.equal(navigationLabel('받은함', true, '새 소식'), '받은함, 새 소식');
  assert.equal(navigationLabel('받은함', 7, '새 소식'), '받은함, 7');
});

test('badgeSpoken reads a dot as new and a count in full', () => {
  assert.equal(badgeSpoken(true, '새 소식'), '새 소식');
  assert.equal(badgeSpoken(3, '새 소식', n => `새 항목 ${n}개`), '새 항목 3개');
  assert.equal(badgeSpoken('', '새 소식'), '');
});

test('badgeCount follows its own maximum', () => {
  assert.equal(badgeCount(1000, 999), '999+');
  assert.equal(badgeCount(0), null);
  assert.equal(badgeCount(undefined), null);
});
