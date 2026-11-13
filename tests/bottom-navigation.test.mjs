import test from 'node:test';
import assert from 'node:assert/strict';
import { bottomNavigationLayout, navigationIconFilled } from '../shared/package-runtime/bottom-navigation.ts';

test('auto fills only the selected icon; filled and outline keep one style', () => {
  assert.deepEqual([true, false].map(selected => navigationIconFilled('auto', selected)), [true, false]);
  assert.deepEqual([true, false].map(selected => navigationIconFilled('filled', selected)), [true, true]);
  assert.deepEqual([true, false].map(selected => navigationIconFilled('outline', selected)), [false, false]);
});

test('a labelled bar keeps an icon box for every destination so labels share one line', () => {
  const layout = bottomNavigationLayout([{ icon: 'home' }, {}], true);
  assert.deepEqual([layout.hasIcons, layout.iconOnly], [true, false]);
  assert.deepEqual(layout.parts({ icon: 'home' }), { showLabel: true, iconBox: true, badgeOnIcon: true });
  assert.deepEqual(layout.parts({}), { showLabel: true, iconBox: true, badgeOnIcon: true });
});

test('an icon-only bar still labels a destination without an icon', () => {
  const layout = bottomNavigationLayout([{ icon: 'home' }, {}], false);
  assert.deepEqual([layout.hasIcons, layout.iconOnly], [true, true]);
  assert.deepEqual(layout.parts({ icon: 'home' }), { showLabel: false, iconBox: true, badgeOnIcon: true });
  // No icon to draw: the label stays, with the badge after it.
  assert.deepEqual(layout.parts({}), { showLabel: true, iconBox: false, badgeOnIcon: false });
});

test('a text-only bar always shows its labels and never becomes the lower icon bar', () => {
  for (const showLabels of [true, false]) {
    const layout = bottomNavigationLayout([{}, {}], showLabels);
    assert.deepEqual([layout.hasIcons, layout.iconOnly], [false, false]);
    assert.deepEqual(layout.parts({}), { showLabel: true, iconBox: false, badgeOnIcon: false });
  }
});
