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
