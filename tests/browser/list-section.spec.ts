import { expect, test, type Locator } from '@playwright/test';
import { openFixture } from './packed-fixture';

const box = async (l: Locator) => (await l.boundingBox())!;

for (const platform of ['react', 'vue3', 'native']) {
  const web = platform !== 'native';
  test(`${platform}: a list group rounds its sections, keeps labels and footers outside and shows empty content`, async ({ page }) => {
    await openFixture(page, platform, '', 'list-section');
    // Heading actions sit on the title line rather than between the title and its description.
    const title = await box(page.getByText('최근 문서', { exact: true })), action = await box(page.getByRole('button', { name: '전체 보기' }));
    expect(Math.abs((action.y + action.height / 2) - (title.y + title.height / 2))).toBeLessThanOrEqual(4);
    // The label sits above the rounded card and the footer below it: neither is inside the card.
    const label = await box(page.getByText('알림', { exact: true })), row = await box(page.getByText('푸시 알림', { exact: true }));
    const footer = await box(page.getByText('푸시 알림은 이 기기에서만 적용됩니다.', { exact: true }));
    expect(label.y).toBeLessThan(row.y); expect(footer.y).toBeGreaterThan(row.y + row.height);
    if (web) {
      const card = page.locator('.kjun-list-section', { hasText: '푸시 알림' }).locator('.kjun-list-panel');
      expect(await card.evaluate(el => getComputedStyle(el).borderTopLeftRadius)).toBe('16px');
      const panel = await box(card);
      expect(label.y + label.height).toBeLessThanOrEqual(panel.y);
      expect(footer.y).toBeGreaterThanOrEqual(panel.y + panel.height);
      await expect(page.getByRole('heading', { level: 2, name: '최근 문서' })).toBeVisible();
    }
    // A section without rows shows the app's empty content in their place.
    await expect(page.getByText('아직 즐겨찾기한 문서가 없습니다', { exact: true })).toBeVisible();
    // Sections in an inset group are 24px apart.
    const first = await box(page.getByText('회의 메모', { exact: true }));
    expect(label.y - (first.y + first.height)).toBeGreaterThan(24);
  });
}
