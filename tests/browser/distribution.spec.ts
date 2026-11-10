import { expect, test, type Page } from '@playwright/test';
import { openFixture } from './packed-fixture';

// KjunZoneGauge (a value's place on a fixed axis) and KjunStackedBar (the parts of a whole): geometry, the states
// zero / empty / missing, and the one sentence screen readers hear. Colours are the fixture's own.
const blue = 'rgb(36, 89, 166)', orange = 'rgb(224, 122, 47)', red = 'rgb(197, 47, 59)';
// Boxes of the elements painted in a colour, relative to the case's start edge, widest first.
const painted = (page: Page, id: string, color: string) => page.getByTestId(id).evaluate((root, color) => {
  const left = root.getBoundingClientRect().left;
  return [...root.querySelectorAll('*')].filter(el => getComputedStyle(el).backgroundColor === color).map(el => {
    const box = el.getBoundingClientRect();
    return { x: box.left - left, width: box.width, height: box.height };
  }).sort((a, b) => b.width - a.width);
}, color);
// The gauge marker is the only absolutely placed part.
const marker = (page: Page, id: string) => page.getByTestId(id).evaluate(root => {
  const left = root.getBoundingClientRect().left;
  return [...root.querySelectorAll('*')].filter(el => getComputedStyle(el).position === 'absolute').map(el => {
    const box = el.getBoundingClientRect();
    return { x: box.left - left, width: box.width, height: box.height };
  });
});
const image = (page: Page, id: string) => page.getByTestId(id).getByRole('img');

for (const platform of ['react', 'vue3', 'native']) {
  test.describe(platform, () => {
    test.beforeEach(async ({ page }) => {
      await page.setViewportSize({ width: 1280, height: 1200 });
      await openFixture(page, platform, '', 'distribution');
    });

    test('the gauge sizes zones by their span, places the marker at the value and reads one sentence', async ({ page }) => {
      await expect(image(page, 'gauge')).toHaveAttribute('aria-label', 'PER 백분위, 72, 고평가');
      await expect(page.getByTestId('gauge').getByText('72 · 고평가', { exact: true })).toBeVisible();
      for (const name of ['저평가', '중립', '고평가']) await expect(page.getByTestId('gauge').getByText(name, { exact: true })).toBeVisible();
      // 600 wide with two 2px gaps leaves 596 for the zones: 30%, 40%, 30%.
      const [low] = await painted(page, 'gauge', blue), [high] = await painted(page, 'gauge', orange);
      expect(low.width).toBeCloseTo(596 * 0.3, 0);
      expect(high.width).toBeCloseTo(596 * 0.3, 0);
      expect(low.x).toBeCloseTo(0, 0);
      expect(low.height).toBe(10);
      // A 6px marker travels 594px: its start edge is at 72% of that, and it overhangs the 10px track by 6 on each side.
      const [pin] = await marker(page, 'gauge');
      expect(pin.width).toBe(6);
      expect(pin.height).toBe(22);
      expect(pin.x).toBeCloseTo(594 * 0.72, 0);
    });

    test('a value of zero keeps its marker at the start, and missing data draws no axis', async ({ page }) => {
      const [pin] = await marker(page, 'gauge-zero');
      expect(pin.x).toBeCloseTo(0, 0);
      await expect(image(page, 'gauge-zero')).toHaveAttribute('aria-label', 'PER 백분위, 0, 저평가');
      expect(await marker(page, 'gauge-missing')).toHaveLength(0);
      expect(await painted(page, 'gauge-missing', blue)).toHaveLength(0);
      await expect(page.getByTestId('gauge-missing').getByText('—', { exact: true })).toBeVisible();
      await expect(page.getByTestId('gauge-missing').getByText('저평가', { exact: true })).toHaveCount(0);
      await expect(image(page, 'gauge-missing')).toHaveAttribute('aria-label', 'PER 백분위, 데이터가 없습니다');
    });

    test('a gauge takes its own axis, format and name, and can hide its value and zone names', async ({ page }) => {
      // 15 on a 10–20 axis sits on the boundary, which belongs to the upper zone.
      await expect(image(page, 'gauge-custom')).toHaveAttribute('aria-label', '밸류, 15배, 높음');
      await expect(page.getByTestId('gauge-custom').getByText('높음')).toHaveCount(0);
      const [pin] = await marker(page, 'gauge-custom');
      expect(pin.x).toBeCloseTo(594 * 0.5, 0);
      // sm: an 8px track, so the marker is 20 tall.
      expect(pin.height).toBe(20);
    });

    test('the stacked bar draws each part as long as its share and lists every part', async ({ page }) => {
      await expect(image(page, 'stacked')).toHaveAttribute('aria-label', '애널리스트 의견: 강세 12 (60%), 중립 6 (30%), 약세 2 (10%)');
      const [bull, bullSwatch] = await painted(page, 'stacked', red), [bear] = await painted(page, 'stacked', blue);
      expect(bull.width).toBeCloseTo(596 * 0.6, 0);
      expect(bear.width).toBeCloseTo(596 * 0.1, 0);
      expect(bull.height).toBe(10);
      expect(bullSwatch.width).toBe(10);
      for (const text of ['강세 12 · 60%', '중립 6 · 30%', '약세 2 · 10%']) await expect(page.getByTestId('stacked').getByText(text, { exact: true })).toBeVisible();
    });

    test('a tiny part keeps a visible length, and a part of zero is listed but not drawn', async ({ page }) => {
      // 5 of 1000 would be under 3px; it is drawn at least 4px wide (the swatch is the other blue element).
      const [bear, swatch] = await painted(page, 'stacked-small', blue);
      expect(Math.min(bear.width, swatch.width)).toBeGreaterThanOrEqual(4);
      expect(await painted(page, 'stacked-small', blue)).toHaveLength(2);
      await expect(page.getByTestId('stacked-small').getByText('약세 5 · <1%', { exact: true })).toBeVisible();
      // Fractions fill the whole bar: 0.3 and 0.1 of 0.4 leave no empty rail.
      const [most] = await painted(page, 'stacked-fractions', red), [rest] = await painted(page, 'stacked-fractions', blue);
      expect(most.width + rest.width).toBeCloseTo(600 - 2, 0);
      expect(most.width).toBeCloseTo(598 * 0.75, 0);
      // A zero part: only its legend swatch is blue.
      expect(await painted(page, 'stacked-zero-item', blue)).toHaveLength(1);
      await expect(page.getByTestId('stacked-zero-item').getByText('약세 0 · 0%', { exact: true })).toBeVisible();
      await expect(image(page, 'stacked-zero-item')).toHaveAttribute('aria-label', '애널리스트 의견: 강세 7 (70%), 중립 3 (30%), 약세 0 (0%)');
    });

    test('an all-zero total keeps the empty rail and the legend, and missing data draws neither', async ({ page }) => {
      // Empty: no red segment (only the swatch), the legend still lists the parts.
      expect(await painted(page, 'stacked-empty', red)).toHaveLength(1);
      await expect(page.getByTestId('stacked-empty').getByText('강세 0 · 0%', { exact: true })).toBeVisible();
      await expect(image(page, 'stacked-empty')).toHaveAttribute('aria-label', '애널리스트 의견: 강세 0 (0%), 중립 0 (0%), 약세 0 (0%)');
      // Missing: no segment, no legend, the missing mark and a different sentence.
      expect(await painted(page, 'stacked-missing', red)).toHaveLength(0);
      await expect(page.getByTestId('stacked-missing').getByText('강세', { exact: false })).toHaveCount(0);
      await expect(page.getByTestId('stacked-missing').getByText('—', { exact: true })).toBeVisible();
      await expect(image(page, 'stacked-missing')).toHaveAttribute('aria-label', '애널리스트 의견, 데이터가 없습니다');
      // A part without a value is named as missing and the rest still add up to 100.
      await expect(image(page, 'stacked-part-missing')).toHaveAttribute('aria-label', '의견: 강세 3 (75%), 중립 —, 약세 1 (25%)');
      const [bull] = await painted(page, 'stacked-part-missing', red);
      expect(bull.height).toBe(8);
      await expect(page.getByTestId('stacked-part-missing').getByText('강세', { exact: false })).toHaveCount(0);
    });
  });
}
