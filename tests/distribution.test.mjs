import test from 'node:test';
import assert from 'node:assert/strict';
import {
  distributionNumber, gaugeNeighbours, gaugePosition, gaugeSliver, gaugeSegments, gaugeSpoken, gaugeZoneIndex, stackedLegend, stackedShares, stackedSpoken, stackedState, stackedWeights,
} from '../shared/package-runtime/distribution.ts';

const zones = [{ to: 30, label: '저평가' }, { to: 70, label: '중립' }, { to: 100, label: '고평가' }];

test('the marker sits at the value as a percentage of the axis, kept on the axis', () => {
  assert.equal(gaugePosition(72, 0, 100), 72);
  assert.equal(gaugePosition(0, 0, 100), 0);
  assert.equal(gaugePosition(100, 0, 100), 100);
  assert.equal(gaugePosition(15, 10, 20), 50);
  assert.equal(gaugePosition(-5, 0, 100), 0);
  assert.equal(gaugePosition(140, 0, 100), 100);
  // An axis with no length has no position to give.
  assert.equal(gaugePosition(5, 10, 10), 0);
  assert.equal(gaugePosition(5, 10, 0), 0);
  // An endless axis has no position either.
  assert.equal(gaugePosition(5, 0, Infinity), 0);
  assert.equal(gaugePosition(5, -Infinity, 10), 0);
});

test('zones become segments sized by their span, in order, clipped to the axis', () => {
  assert.deepEqual(gaugeSegments(zones, 0, 100).map(zone => [zone.from, zone.to, zone.share]), [[0, 30, 30], [30, 70, 40], [70, 100, 30]]);
  // Unsorted zones are ordered; one past the axis is clipped and one behind it is dropped.
  assert.deepEqual(gaugeSegments([{ to: 150 }, { to: 20 }, { to: -5 }], 0, 100).map(zone => [zone.from, zone.to, zone.share]), [[0, 20, 20], [20, 100, 80]]);
  // Zones that stop short leave the rest of the axis as an unnamed neutral segment.
  assert.deepEqual(gaugeSegments([{ to: 40, label: 'A' }], 0, 100).map(zone => [zone.to, zone.share, zone.label]), [[40, 40, 'A'], [100, 60, undefined]]);
  assert.deepEqual(gaugeSegments([], 0, 100).map(zone => [zone.from, zone.to, zone.share]), [[0, 100, 100]]);
  assert.deepEqual(gaugeSegments(zones, 5, 5), []);
  assert.deepEqual(gaugeSegments(zones, 0, Infinity), []);
  assert.deepEqual(gaugeSegments(zones, -Infinity, 100), []);
  // A non-finite end is ignored.
  assert.equal(gaugeSegments([{ to: Number.NaN }, { to: 50 }], 0, 100).length, 2);
});

test('a value on a boundary belongs to the upper zone, and the ends belong to the first and last', () => {
  const segments = gaugeSegments(zones, 0, 100);
  assert.equal(gaugeZoneIndex(0, segments), 0);
  assert.equal(gaugeZoneIndex(29.9, segments), 0);
  assert.equal(gaugeZoneIndex(30, segments), 1);
  assert.equal(gaugeZoneIndex(70, segments), 2);
  assert.equal(gaugeZoneIndex(100, segments), 2);
  assert.equal(gaugeZoneIndex(-10, segments), 0);
  assert.equal(gaugeZoneIndex(500, segments), 2);
  assert.equal(gaugeZoneIndex(5, []), -1);
});

test('the gauge reads its name, value and zone in one sentence', () => {
  assert.equal(gaugeSpoken('PER 백분위', '72', '고평가'), 'PER 백분위, 72, 고평가');
  assert.equal(gaugeSpoken(undefined, '72', undefined), '72');
  assert.equal(gaugeSpoken('PER 백분위', '데이터 없음'), 'PER 백분위, 데이터 없음');
});

test('missing data, an all-zero total and real values are three different states', () => {
  assert.equal(stackedState(undefined), 'missing');
  assert.equal(stackedState([]), 'missing');
  assert.equal(stackedState([{ label: 'A', value: null }, { label: 'B', value: Number.NaN }]), 'missing');
  assert.equal(stackedState([{ label: 'A', value: 0 }, { label: 'B', value: 0 }]), 'empty');
  assert.equal(stackedState([{ label: 'A', value: 0 }, { label: 'B', value: null }]), 'empty');
  assert.equal(stackedState([{ label: 'A', value: 3 }, { label: 'B', value: null }]), 'ready');
  // A negative count is not a share of anything.
  assert.equal(stackedState([{ label: 'A', value: -3 }]), 'empty');
});

test('shares are whole percents that always add up to 100', () => {
  const shares = values => stackedShares(values.map((value, index) => ({ label: String(index), value })));
  assert.deepEqual(shares([12, 6, 2]), [60, 30, 10]);
  // Largest remainders take the leftover points; ties go to the earlier item.
  assert.deepEqual(shares([1, 1, 1]), [34, 33, 33]);
  assert.deepEqual(shares([1, 2]), [33, 67]);
  assert.deepEqual(shares([999, 1]), [100, 0]);
  assert.deepEqual(shares([5, null, 5]), [50, 0, 50]);
  assert.deepEqual(shares([0, 0]), [0, 0]);
  assert.deepEqual(shares([4, -2]), [100, 0]);
  for (const values of [[1, 1, 1, 1, 1, 1, 1], [3, 7, 11, 13], [0.1, 0.2, 0.3]]) assert.equal(shares(values).reduce((sum, share) => sum + share, 0), 100);
  // Counts too large to add up still share out by their size.
  assert.deepEqual(shares([1e308, 1e308]), [50, 50]);
  assert.deepEqual(shares([1e308, 1.5e308]), [40, 60]);
});

test('segment lengths are exact percentages of the bar, whatever the size of the numbers', () => {
  const weights = values => stackedWeights(values.map((value, index) => ({ label: String(index), value })));
  assert.deepEqual(weights([12, 6, 2]), [60, 30, 10]);
  // Fractions fill the whole bar: raw values under 1 would leave a flex row partly empty.
  assert.deepEqual(weights([0.2, 0.3]), [40, 60]);
  assert.deepEqual(weights([0.0001, 0.0003]), [25, 75]);
  assert.deepEqual(weights([1e308, 1e308]), [50, 50]);
  assert.deepEqual(weights([5, null, -2, 0, 15]), [25, 0, 0, 0, 75]);
  assert.deepEqual(weights([0, 0]), [0, 0]);
  assert.deepEqual(weights([]), []);
});

test('the legend keeps every item, and the spoken text follows the locale', () => {
  const items = [{ label: '강세', value: 1200 }, { label: '중립', value: 0 }, { label: '약세', value: null }];
  assert.deepEqual(stackedLegend(items, undefined, 'en-US', '—'), [
    { label: '강세', value: '1,200', percent: '100%', present: true, drawn: true },
    { label: '중립', value: '0', percent: '0%', present: true, drawn: false },
    { label: '약세', value: '—', percent: '', present: false, drawn: false },
  ]);
  assert.equal(stackedLegend(items, value => value + '명', 'en-US', '—')[0].value, '1200명');
  assert.equal(stackedSpoken('의견', stackedLegend(items, undefined, 'de-DE', '없음')), '의견: 강세 1.200 (100%), 중립 0 (0%), 약세 없음');
  assert.equal(stackedSpoken(undefined, stackedLegend(items.slice(0, 1), undefined, 'en-US', '—')), '강세 1,200 (100%)');
  // A part that is drawn never reads as 0%.
  const tiny = stackedLegend([{ label: 'A', value: 995 }, { label: 'B', value: 4 }, { label: 'C', value: 1 }], undefined, 'en-US', '—');
  assert.deepEqual(tiny.map(entry => entry.percent), ['100%', '<1%', '<1%']);
  assert.equal(distributionNumber(1234.5, 'de-DE'), '1.234,5');
  assert.equal(distributionNumber(-0, 'en-US'), '0');
});

test('a zone sliver thinner than the minimum between a boundary and the marker ring is covered', () => {
  const segments = gaugeSegments(zones, 0, 100), geometry = { segmentGap: 2, markerWidth: 6, markerRing: 2, minSliver: 4 };
  // The boundaries on each side of 72: 70 behind it (after one gap) and none ahead.
  assert.deepEqual(gaugeNeighbours(72, segments), { before: { cut: 0.7, gaps: 1 }, after: undefined });
  assert.deepEqual(gaugeNeighbours(10, segments), { before: undefined, after: { cut: 0.3, gaps: 0 } });
  // 600 wide: the zone starts at 596 * 0.7 + 4 = 421.2. At 72 the ring starts at 594 * 0.72 - 2 = 425.68, 4.48 away: left alone.
  assert.equal(gaugeSliver(600, 72, 3, { cut: 0.7, gaps: 1 }, 'before', geometry), null);
  // At 71.5 it starts at 422.71, 1.51 away: covered from the boundary to the ring.
  const near = gaugeSliver(600, 71.5, 3, { cut: 0.7, gaps: 1 }, 'before', geometry);
  assert.ok(Math.abs(near.start - 421.2) < 1e-6 && Math.abs(near.size - 1.51) < 1e-6);
  // Far from a boundary, under the marker, or unmeasured: nothing to cover.
  assert.equal(gaugeSliver(600, 90, 3, { cut: 0.7, gaps: 1 }, 'before', geometry), null);
  assert.equal(gaugeSliver(600, 70, 3, { cut: 0.7, gaps: 1 }, 'before', geometry), null);
  assert.equal(gaugeSliver(0, 71.5, 3, { cut: 0.7, gaps: 1 }, 'before', geometry), null);
  const ahead = gaugeSliver(600, 28.5, 3, { cut: 0.3, gaps: 0 }, 'after', geometry);
  assert.ok(ahead && ahead.size > 0 && ahead.size < 4);
});
