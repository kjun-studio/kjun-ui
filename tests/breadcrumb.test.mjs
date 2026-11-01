import test from 'node:test';
import assert from 'node:assert/strict';
import { breadcrumbCurrent, collapseBreadcrumb } from '../shared/package-runtime/breadcrumb.ts';

test('the current page is a last step without a link unless an item says otherwise', () => {
  assert.equal(breadcrumbCurrent({ label: 'a' }, 2, 3), true);
  assert.equal(breadcrumbCurrent({ label: 'a', to: '/a' }, 2, 3), false);
  assert.equal(breadcrumbCurrent({ label: 'a', to: '/a', current: true }, 2, 3), true);
  assert.equal(breadcrumbCurrent({ label: 'a', current: false }, 2, 3), false);
});

test('a long trail keeps the first and last steps and folds the rest', () => {
  const steps = ['홈', '문서', '2026', '11월', '보고서'];
  const { shown, hidden, at } = collapseBreadcrumb(steps, 3);
  assert.deepEqual(shown.map(s => s.item), ['홈', '11월', '보고서']);
  assert.deepEqual(hidden.map(s => s.item), ['문서', '2026']);
  assert.equal(at, 1);
  assert.equal(collapseBreadcrumb(steps, 5).hidden.length, 0);
  assert.equal(collapseBreadcrumb(steps).hidden.length, 0);
  assert.equal(collapseBreadcrumb(steps, 1).hidden.length, 0);
});
