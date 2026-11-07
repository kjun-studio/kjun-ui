import { expect, test, type Locator } from '@playwright/test';
import { openFixture } from './packed-fixture';

const box = async (l: Locator) => (await l.boundingBox())!;

for (const platform of ['react', 'vue3', 'native']) {
  const web = platform !== 'native';
  test(`${platform}: a list group rounds its sections, keeps labels and footers outside and shows empty content`, async ({ page }) => {
    await openFixture(page, platform, '', 'list-section');
    // Heading actions sit on the title line rather than between the title and its description.
    const title = await box(page.getByText('최근 문서', { exact: true })), action = await box(page.getByRole('button', { name: '전체 보기' }));
    expect(Math.abs((action.y + action.height / 2) - (title.y + title.height / 2))).toBeLessThanOrEqual(1);
    // The button sits at the end, its label ending on the rows' end line, and the title keeps the rest of the width.
    const chevronEnd = await page.getByText('회의 메모', { exact: true }).evaluate(el => { const row = el.closest('button, [role=button]')!; const r = row.getBoundingClientRect(); return r.x + r.width; });
    const actionLabel = await box(page.getByRole('button', { name: '전체 보기' }).getByText('전체 보기'));
    expect(actionLabel.x + actionLabel.width).toBeCloseTo(chevronEnd - 16, 0);
    // A title with a description sits outside the card as well, right above the rows.
    const titled = await box(page.getByText('지난 7일 동안 수정한 문서', { exact: true })), firstRow = await box(page.getByText('회의 메모', { exact: true }));
    expect(firstRow.y - (titled.y + titled.height)).toBeLessThanOrEqual(8 + 18 + 1);
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
      // Sections are not landmarks; the list is named by the title instead.
      await expect(page.getByRole('region')).toHaveCount(0);
      await expect(page.getByRole('list', { name: '최근 문서' })).toBeVisible();
    } else {
      // Native Web headings carry the level too.
      await expect(page.getByRole('heading', { name: '최근 문서' })).toHaveAttribute('aria-level', /\d/);
    }
    // A section without rows shows the app's empty content in their place.
    const empty = page.getByText('아직 즐겨찾기한 문서가 없습니다', { exact: true });
    await expect(empty).toBeVisible();
    // It stays lighter than the rows: secondary body type.
    await expect(empty).toHaveCSS('font-size', '14px');
    await expect(empty).toHaveCSS('font-weight', '400');
    // The card clips its rows, so a row's keyboard focus ring draws inside and follows the card's corner.
    const rowButton = page.getByRole('button', { name: '회의 메모' });
    await page.getByRole('button', { name: '전체 보기' }).focus();
    await page.keyboard.press('Tab');
    await expect(rowButton).toBeFocused();
    await expect(rowButton).toHaveCSS('outline-offset', '-2px');
    await expect(rowButton).toHaveCSS('border-top-left-radius', '16px');
    // Sections in an inset group are 24px apart.
    const first = await box(page.getByText('회의 메모', { exact: true }));
    expect(label.y - (first.y + first.height)).toBeGreaterThan(24);
  });
}
