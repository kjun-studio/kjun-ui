import { expect, test } from '@playwright/test';
import { openFixture } from './packed-fixture';

for (const platform of ['react', 'vue3', 'native']) {
  test(`${platform}: groups collapse, each one closes with a subtotal and the table with a total`, async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await openFixture(page, platform, '', 'table-groups');
    // Groups follow the first appearance of each status and carry the app's label and a count.
    await expect(page.getByText('상태: 진행 중', { exact: true })).toBeVisible();
    await expect(page.getByText('2개', { exact: true })).toBeVisible();
    const order = await Promise.all(['상태: 진행 중', '상태: 검토 대기', '상태: 완료'].map(async t => (await page.getByText(t, { exact: true }).boundingBox())!.y));
    expect(order).toEqual([...order].sort((a, b) => a - b));
    // Subtotals use the column's format; the total sums every row.
    await expect(page.getByText('7,200,000원', { exact: true })).toBeVisible();
    await expect(page.getByText('12,000,000원', { exact: true })).toBeVisible();
    // One-row groups skip their subtotal, which would only repeat the row.
    await expect(page.getByText('소계', { exact: true })).toHaveCount(1);
    await expect(page.getByText('합계', { exact: true })).toHaveCount(1);
    // Collapsing a group hides its rows but keeps its header and subtotal.
    const toggle = page.getByRole('button', { name: '진행 중 묶음 접기' });
    await toggle.click();
    await expect(page.getByText('브랜드 웹사이트', { exact: true })).toHaveCount(0);
    await expect(page.getByText('7,200,000원', { exact: true })).toBeVisible();
    await page.getByRole('button', { name: '진행 중 묶음 펼치기' }).click();
    await expect(page.getByText('브랜드 웹사이트', { exact: true })).toBeVisible();
    if (platform !== 'native') {
      await expect(page.getByRole('button', { name: '진행 중 묶음 접기' })).toHaveAttribute('aria-expanded', 'true');
      // Each group is a row group headed by a rowgroup header; the total sits in the table foot.
      await expect(page.locator('table > tbody')).toHaveCount(3);
      await expect(page.locator('th[scope="rowgroup"]')).toHaveCount(3);
      await expect(page.locator('tfoot')).toContainText('12,000,000원');
    }
  });
}
