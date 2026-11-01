import { expect, test } from '@playwright/test';
import { openFixture } from './packed-fixture';

for (const platform of ['react', 'vue3', 'native']) {
  test(`${platform}: a narrow list shows title over meta with the value and badge at the end`, async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 720 });
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await openFixture(page, platform, '', 'table-list');
    const title = (await page.getByText('브랜드 웹사이트', { exact: true }).boundingBox())!;
    const meta = (await page.getByText('김서연', { exact: true }).boundingBox())!;
    const value = (await page.getByText('4,800,000원', { exact: true }).boundingBox())!;
    const badge = (await page.getByText('진행 중', { exact: true }).boundingBox())!;
    // No header row: column labels are not drawn.
    await expect(page.getByText('담당자', { exact: true })).toHaveCount(0);
    expect(meta.y).toBeGreaterThan(title.y);
    expect(Math.abs(meta.x - title.x)).toBeLessThanOrEqual(1);
    expect(value.x).toBeGreaterThan(title.x + title.width);
    expect(badge.y).toBeGreaterThan(value.y);
    expect(Math.abs((badge.x + badge.width) - (value.x + value.width))).toBeLessThanOrEqual(2);
    // Expansion opens beneath its row.
    await page.getByRole('button', { name: /행 확장|상세 보기/ }).first().click();
    await expect(page.getByText('상세 브랜드 웹사이트', { exact: true })).toBeVisible();
    // The summary closes the list as one block with each summarized column's total.
    await expect(page.getByRole('group', { name: '합계' })).toContainText('8,000,000원');
  });
}
