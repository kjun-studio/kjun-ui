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

    test('cards show selection, open from the title, sum each group and sort from the toolbar', async ({ page }) => {
      await openFixture(page, platform, '?layout=stacked', 'table-card-layouts');
      // The title is a button that opens the row, so screen readers find a way in.
      await expect(page.getByRole('button', { name: '브랜드 웹사이트', exact: true })).toHaveCount(1);
      // A group of two or more rows shows its subtotal on its header line; a one-row group does not repeat its row.
      await expect(page.getByText('8,000,000원', { exact: true })).toBeVisible();
      await expect(page.getByText('1,600,000원', { exact: true })).toHaveCount(1);
      if (platform !== 'native') {
        await page.getByRole('checkbox').first().check();
        await expect(page.locator('.kjun-table-card[data-selected]')).toHaveCount(1);
        await page.getByRole('button', { name: '선택 해제' }).click();
      }
      // No header row to sort by: the toolbar offers each sortable column in both orders, sorting inside each group.
      expect((await box(page, '브랜드 웹사이트')).y).toBeLessThan((await box(page, '고객센터 개편')).y);
      await page.getByRole('button', { name: '정렬' }).click();
      await page.getByRole(platform === 'native' ? 'radio' : 'option', { name: '예산 · 오름차순' }).click();
      await expect.poll(async () => (await box(page, '고객센터 개편')).y < (await box(page, '브랜드 웹사이트')).y).toBe(true);
    });

    test('list rows group under the same header lines', async ({ page }) => {
      await openFixture(page, platform, '?responsive=list', 'table-card-layouts');
      const group = await box(page, '디자인'), first = await box(page, '브랜드 웹사이트');
      expect(group.y).toBeLessThan(first.y);
      expect((await box(page, '개발')).y).toBeGreaterThan((await box(page, '고객센터 개편')).y);
      await expect(page.getByText('2개', { exact: true })).toBeVisible();
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

    test('tiles name their highlight for screen readers, warn about what they drop and fit more a row on wider screens', async ({ page }) => {
      const warnings: string[] = [];
      page.on('console', (message) => { if (message.type() === 'warning') warnings.push(message.text()); });
      await openFixture(page, platform, '?layout=tiles', 'table-card-layouts');
      if (platform === 'native') await expect(page.getByLabel('예산 4,800,000원')).toHaveCount(1);
      else await expect(page.locator('.kjun-table-card-highlight .kjun-sr-only')).toHaveText(['예산 ', '예산 ', '예산 ']);
      expect(warnings.some((text) => text.includes('cardLayout="tiles"') && text.includes('expandable'))).toBe(true);
      const narrow = await box(page, '브랜드 웹사이트');
      await page.setViewportSize({ width: 720, height: 900 });
      // Three or more tiles a row: a tile takes well under half the width.
      await expect.poll(async () => (await page.getByText('결제 화면 개선', { exact: true }).boundingBox())!.x).toBeLessThan(40);
      const first = await box(page, '브랜드 웹사이트'), second = await box(page, '고객센터 개편');
      expect(second.x - first.x).toBeLessThan(720 / 2 - 20);
      expect(narrow.x).toBeLessThan(40);
      // Web and Native share one rule: as many tiles as keep tileMinWidth, each an equal share of the row.
      const row = (await page.getByRole('group', { name: '합계' }).boundingBox())!.width;
      const perRow = Math.max(2, Math.floor((row + 12) / (160 + 12)));
      expect(Math.abs((second.x - first.x) - (row + 12) / perRow)).toBeLessThanOrEqual(2);
    });
  });
}
