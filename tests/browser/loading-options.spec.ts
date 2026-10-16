import { expect, test, type Locator, type Page } from '@playwright/test';
import { openFixture } from './packed-fixture';
import { loadingDelay, texts } from '../fixtures/loading-options-values';
// A hidden-but-present loading display keeps its box: visibility:hidden on Web, opacity 0 on Native Web.
const concealed = (locator: Locator) => locator.evaluate(el => {
  for (let node: Element | null = el; node; node = node.parentElement) {
    const style = getComputedStyle(node);
    if (style.visibility === 'hidden' || style.opacity === '0') return true;
  }
  return false;
});
const setLoading = (page: Page, value: boolean) => page.evaluate(next => (window as any).setLoading(next), value);
// The installed clock still runs on its own; pausing it before the fixture loads lets only runFor() move timers.
async function pausedClock(page: Page) {
  await page.clock.install({ time: new Date('2026-01-01T00:00:00') });
  await page.clock.pauseAt(new Date('2026-01-01T00:00:01'));
}
for (const platform of ['react', 'vue3', 'native']) {
  test(`${platform}: skeleton={false} shows the spinner and message instead of skeletons`, async ({ page }) => {
    await openFixture(page, platform, '', 'loading-options');
    for (const text of [texts.table, texts.marketTable, texts.marketCards, texts.marketList])
      await expect(page.getByText(text, { exact: true }), text).toBeVisible();
    // The default keeps the skeleton, so its message is only the status name, not visible text.
    await expect(page.getByText(texts.skeletonTable, { exact: true })).toHaveCount(0);
  });

  test(`${platform}: loadingDelay keeps the loading box but shows its content only after the delay`, async ({ page }) => {
    await pausedClock(page);
    await openFixture(page, platform, '', 'loading-options');
    const region = page.getByTestId('delayed'), message = page.getByText(texts.delayed, { exact: true });
    await expect(message).toHaveCount(1);
    expect(await concealed(message)).toBe(true);
    const reserved = (await region.boundingBox())!.height;
    expect(reserved).toBeGreaterThan(0);
    await page.clock.runFor(loadingDelay - 10);
    expect(await concealed(message)).toBe(true);
    await page.clock.runFor(20);
    await expect.poll(() => concealed(message)).toBe(false);
    expect((await region.boundingBox())!.height).toBe(reserved);
  });

  test(`${platform}: a result that arrives within loadingDelay never shows the loading display`, async ({ page }) => {
    await pausedClock(page);
    await openFixture(page, platform, '', 'loading-options');
    await page.clock.runFor(loadingDelay / 3);
    expect(await concealed(page.getByText(texts.delayed, { exact: true }))).toBe(true);
    await setLoading(page, false);
    await expect(page.getByText(texts.delayed, { exact: true })).toHaveCount(0);
    await page.clock.runFor(loadingDelay * 2);
    await expect(page.getByText(texts.delayed, { exact: true })).toHaveCount(0);
    await expect(page.getByTestId('delayed').getByText('결과', { exact: true })).toBeVisible();
  });

  test(`${platform}: surface="none" drops the KPI card background, padding and radius`, async ({ page }) => {
    await openFixture(page, platform, '', 'loading-options');
    for (const id of ['kpi-hero-flat', 'kpi-row-flat']) {
      const root = page.getByTestId(id).locator(':scope > *').first();
      await expect(root, id).toHaveCSS('background-color', 'rgba(0, 0, 0, 0)');
      for (const side of ['top', 'right', 'bottom', 'left']) await expect(root, id).toHaveCSS(`padding-${side}`, '0px');
      await expect(root, id).toHaveCSS('border-top-left-radius', '0px');
    }
  });
}
