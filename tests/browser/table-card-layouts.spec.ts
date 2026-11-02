import { expect, test, type Page } from '@playwright/test';
import { openFixture } from './packed-fixture';

const box = async (page: Page, text: string) => (await page.getByText(text, { exact: true }).first().boundingBox())!;
const fontSize = (page: Page, text: string) => page.getByText(text, { exact: true }).first().evaluate((node) => parseFloat(getComputedStyle(node).fontSize));

for (const platform of ['react', 'vue3', 'native']) {
  test.describe(`${platform} card layouts`, () => {
    test.beforeEach(async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 900 });
      await page.emulateMedia({ reducedMotion: 'reduce' });
    });

    test('stacked: subtitle under the title, a large highlight, grouped cards and one footer row', async ({ page }) => {
      await openFixture(page, platform, '?layout=stacked', 'table-card-layouts');
      const title = await box(page, '브랜드 웹사이트'), owner = await box(page, '김서연');
      expect(owner.y).toBeGreaterThanOrEqual(title.y + title.height - 1);
      expect(Math.abs(owner.x - title.x)).toBeLessThanOrEqual(1);
      // The owner is the subtitle, so it is not repeated as a field.
      await expect(page.getByText('담당자', { exact: true })).toHaveCount(0);
      expect(await fontSize(page, '4,800,000원')).toBeGreaterThan(await fontSize(page, '72%'));
      // Card values start at their label whatever the column alignment.
      expect(Math.abs((await box(page, '72%')).x - (await box(page, '진행률')).x)).toBeLessThanOrEqual(1);
      await expect(page.getByText('디자인', { exact: true })).toBeVisible();
      await expect(page.getByText('2개', { exact: true })).toBeVisible();
      expect((await box(page, '디자인')).y).toBeLessThan(title.y);
      expect((await box(page, '개발')).y).toBeGreaterThan((await box(page, '고객센터 개편')).y);
      await page.getByRole('button', { name: /행 확장|상세 보기/ }).first().click();
      await expect(page.getByText('상세 브랜드 웹사이트', { exact: true })).toBeVisible();
      await expect(page.getByRole('group', { name: '합계' })).toContainText('9,600,000원');
    });

    test('rows: a label at the start and its value at the end of one line', async ({ page }) => {
      await openFixture(page, platform, '?layout=rows', 'table-card-layouts');
      const label = await box(page, '진행률'), value = await box(page, '72%'), title = await box(page, '브랜드 웹사이트');
      expect(Math.abs(value.y - label.y)).toBeLessThanOrEqual(4);
      expect(value.x).toBeGreaterThan(label.x + label.width + 100);
      expect(label.x).toBeLessThan(title.x);
    });

    test('tiles: two small cards a row with title, subtitle, badge and highlight only', async ({ page }) => {
      await openFixture(page, platform, '?layout=tiles', 'table-card-layouts');
      const first = await box(page, '브랜드 웹사이트'), second = await box(page, '고객센터 개편');
      expect(Math.abs(first.y - second.y)).toBeLessThanOrEqual(1);
      expect(second.x).toBeGreaterThan(first.x + 100);
      await expect(page.getByText('김서연', { exact: true })).toBeVisible();
      await expect(page.getByText('4,800,000원', { exact: true })).toBeVisible();
      await expect(page.getByText('진행 중', { exact: true })).toBeVisible();
      for (const hidden of ['진행률', '마감', '72%']) await expect(page.getByText(hidden, { exact: true })).toHaveCount(0);
      await expect(page.getByRole('button', { name: /행 확장|상세 보기/ })).toHaveCount(0);
      // The odd group's single tile keeps half the row; totals and group headers span it.
      const third = await box(page, '결제 화면 개선');
      expect(Math.abs(third.x - first.x)).toBeLessThanOrEqual(1);
      const totals = (await page.getByRole('group', { name: '합계' }).boundingBox())!;
      expect(totals.width).toBeGreaterThan(300);
    });
  });
}
