import test from 'node:test';
import assert from 'node:assert/strict';
import { carouselKey, carouselTarget, clampSlide, nearestSlide } from '../shared/package-runtime/carousel.ts';

test('clampSlide keeps an index inside the slides', () => {
  assert.equal(clampSlide(-2, 4), 0);
  assert.equal(clampSlide(9, 4), 3);
  assert.equal(clampSlide(1.6, 4), 2);
  assert.equal(clampSlide(Number.NaN, 4), 0);
  assert.equal(clampSlide(3, 0), 0);
});

test('nearestSlide settles on the slide whose start is closest', () => {
  assert.equal(nearestSlide([0, 300, 600], 0), 0);
  assert.equal(nearestSlide([0, 300, 600], 140), 0);
  assert.equal(nearestSlide([0, 300, 600], 160), 1);
  assert.equal(nearestSlide([], 50), 0);
});

test('nearestSlide treats the end of the scroll range as the last slide', () => {
  // Narrow cards: the last two can never reach the start edge, so the end of the range stands for the last one.
  assert.equal(nearestSlide([0, 200, 400, 600], 380, 380), 3);
  assert.equal(nearestSlide([0, 200, 400, 600], 379.5, 380), 3);
  assert.equal(nearestSlide([0, 200, 400, 600], 200, 380), 1);
  // Everything fits: there is no scroll range, so the first slide stays current.
  assert.equal(nearestSlide([0, 100], 0, 0), 0);
});

test('carousel keys move one slide or to either end', () => {
  assert.equal(carouselKey('ArrowLeft'), 'previous');
  assert.equal(carouselKey('ArrowRight'), 'next');
  assert.equal(carouselKey('Home'), 'first');
  assert.equal(carouselKey('End'), 'last');
  assert.equal(carouselKey('ArrowDown'), undefined);
  assert.equal(carouselTarget('next', 3, 4), 3);
  assert.equal(carouselTarget('previous', 0, 4), 0);
  assert.equal(carouselTarget('last', 0, 4), 3);
  assert.equal(carouselTarget('first', 2, 4), 0);
});

test('reachableOffsets stops every slide at the end of the scroll range', async () => {
  const { reachableOffsets } = await import('../shared/package-runtime/carousel.ts');
  // peek: four 300px slides with a 12px gap in a 336px view can scroll 912px at most.
  assert.deepEqual(reachableOffsets([0, 312, 624, 936], 912), [0, 312, 624, 912]);
  // auto: narrow cards whose last two starts lie past the end collapse onto it.
  assert.deepEqual(reachableOffsets([0, 200, 400, 600], 380), [0, 200, 380, 380]);
  assert.deepEqual(reachableOffsets([0, 100], 0), [0, 0]);
});

test('dragTarget moves one slide once a drag passes a fifth of the view, and settles otherwise', async () => {
  const { dragTarget } = await import('../shared/package-runtime/carousel.ts');
  assert.equal(dragTarget({ start: 1, nearest: 1, distance: -70, width: 300, count: 4 }), 2);
  assert.equal(dragTarget({ start: 1, nearest: 1, distance: 70, width: 300, count: 4 }), 0);
  assert.equal(dragTarget({ start: 1, nearest: 1, distance: -40, width: 300, count: 4 }), 1);
  // A long drag lands wherever the position is nearest.
  assert.equal(dragTarget({ start: 0, nearest: 2, distance: -650, width: 300, count: 4 }), 2);
  assert.equal(dragTarget({ start: 3, nearest: 3, distance: -90, width: 300, count: 4 }), 3);
});

test('settleSlide keeps the current slide when it already sits at the settled position', async () => {
  const { settleSlide } = await import('../shared/package-runtime/carousel.ts');
  // Narrow cards: slides 2 and 3 both stop at the end of the range.
  assert.equal(settleSlide([0, 212, 268, 268], 268, 268, 2), 2);
  assert.equal(settleSlide([0, 212, 268, 268], 268, 268, 0), 3);
  assert.equal(settleSlide([0, 212, 268, 268], 212, 268, 3), 1);
});

test('slideStops numbers the distinct places the slides can stop', async () => {
  const { slideStops } = await import('../shared/package-runtime/carousel.ts');
  assert.deepEqual(slideStops([0, 212, 268, 268]), [0, 1, 2, 2]);
  assert.deepEqual(slideStops([0, 312, 624, 912]), [0, 1, 2, 3]);
  assert.deepEqual(slideStops([0, 0.5, 300]), [0, 0, 1]);
});

test('stepFocus keeps focus in the carousel when a button reaches an end', async () => {
  const { stepFocus } = await import('../shared/package-runtime/carousel.ts');
  assert.equal(stepFocus(3, 4, false), 'viewport');
  assert.equal(stepFocus(0, 4, false), 'viewport');
  assert.equal(stepFocus(3, 4, true), 'previous');
  assert.equal(stepFocus(0, 4, true), 'next');
  assert.equal(stepFocus(2, 4, true), undefined);
});
