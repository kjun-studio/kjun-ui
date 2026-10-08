import { test, expect } from '@playwright/test';
import { openFixture } from './packed-fixture';

for (const platform of ['react', 'vue2', 'native']) {
  test(`${platform}: Card headings stay readable and actions fit narrow cards`, async ({ page }) => {
    await page.setViewportSize({ width: 680, height: 1000 });
    await openFixture(page, platform, '', 'card-layout');
    const errors: string[] = [];
    page.on('pageerror', error => errors.push(error.message));
    for (const width of [240, 320, 560, 240]) {
      await page.locator('main').evaluate((node, value) => { node.style.width = value + 'px'; }, width);
      for (const id of ['long-action', 'two-actions', 'actions-only']) {
        const box = page.locator(`[data-case="${id}"]`);
        await expect.poll(() => box.evaluate(node => node.scrollWidth <= node.clientWidth + 1)).toBe(true);
        const card = (await box.boundingBox())!;
        for (const button of await box.getByRole('button').all()) {
          const rect = (await button.boundingBox())!;
          expect(rect.x).toBeGreaterThanOrEqual(card.x + 15);
          expect(rect.x + rect.width).toBeLessThanOrEqual(card.x + card.width - 15);
          expect(await button.evaluate(node => node.scrollWidth <= node.clientWidth + 1)).toBe(true);
        }
      }
      const pair = page.locator('[data-case="two-actions"]');
      const heading = (await pair.getByText('프로젝트 현황', { exact: true }).boundingBox())!;
      expect(heading.height).toBeLessThanOrEqual(28);
      if (width === 240) expect((await pair.getByRole('button').first().boundingBox())!.y).toBeGreaterThanOrEqual(heading.y + heading.height);
      const short = page.locator('[data-case="short-header"]');
      const badge = (await short.getByText('검토 완료', { exact: true }).boundingBox())!;
      const action = (await short.getByRole('button').boundingBox())!;
      expect(Math.abs(badge.y + badge.height / 2 - action.y - action.height / 2)).toBeLessThanOrEqual(1);
    }
    await page.locator('[data-case="long-action"]').getByRole('button').click();
    await page.locator('[data-case="two-actions"]').getByRole('button').last().press('Enter');
    await expect(page.getByTestId('actions')).toHaveText('2');
    await page.locator('main').screenshot({ path: `artifacts/card-visual-audit/${platform}-layout-fixed.png` });
    await page.locator('[data-case="two-actions"]').screenshot({ path: `artifacts/card-visual-audit/${platform}-header-fixed.png` });
    await page.locator('[data-case="long-action"]').screenshot({ path: `artifacts/card-visual-audit/${platform}-long-action-fixed.png` });
    expect(errors).toEqual([]);
  });

  test(`${platform}: absent Card sections add no space and media keeps its bottom corners`, async ({ page }) => {
    await openFixture(page, platform, '', 'card-layout');
    const card = (id: string) => page.locator(`[data-case="${id}"] > *`);
    await expect(card('title-only')).toHaveJSProperty('offsetHeight', 56);
    await expect(card('empty-fragment')).toHaveJSProperty('offsetHeight', 56);
    await expect(card('media-only')).toHaveJSProperty('offsetHeight', 96);
    await expect(card('media-only').locator(':scope > *').first()).toHaveCSS('border-bottom-left-radius', '16px');
    await expect(card('footer-only')).toHaveJSProperty('offsetHeight', 72);
    await expect(card('header-footer')).toHaveJSProperty('offsetHeight', 129);
    await expect(card('zero')).toContainText('0');
    expect((await card('zero').boundingBox())!.height).toBeGreaterThan(32);
    const before = (await card('body-toggle').boundingBox())!.height;
    await page.getByRole('button', { name: '본문 전환', exact: true }).click();
    await expect(card('body-toggle')).toContainText('카드 본문');
    expect((await card('body-toggle').boundingBox())!.height).toBeGreaterThan(before);
    await page.getByRole('button', { name: '본문 전환', exact: true }).click();
    await expect(card('body-toggle')).not.toContainText('카드 본문');
    expect((await card('body-toggle').boundingBox())!.height).toBe(before);
  });
}
