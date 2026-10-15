import { expect, test, type Locator, type Page } from '@playwright/test';
import { openFixture } from './packed-fixture';
// Tab and Shift+Tab stay inside an open dialog, including a popover dialog, and skip
// controls that cannot take focus, such as the close button of a Toast that is still leaving.
const tabTo = async (page: Page, target: Locator) => {
  for (let i = 0; i < 45 && !(await target.evaluate(el => el === document.activeElement)); i++) await page.keyboard.press('Tab');
  await expect(target).toBeFocused();
};
const staysInside = async (page: Page, dialog: Locator) => {
  await expect.poll(() => dialog.evaluate(el => el.contains(document.activeElement))).toBe(true);
  const count = await dialog.locator('button,input,[tabindex="0"]').count();
  for (let i = 0; i < count + 2; i++) {
    await page.keyboard.press('Tab');
    expect(await dialog.evaluate(el => el.contains(document.activeElement)), 'Tab ' + i).toBe(true);
  }
  await page.keyboard.press('Shift+Tab');
  expect(await dialog.evaluate(el => el.contains(document.activeElement)), 'Shift+Tab').toBe(true);
};
for (const platform of ['react', 'vue3']) {
  test(`${platform}: Tab stays inside an open popover dialog`, async ({ page }) => {
    await openFixture(page, platform, '?component=KjunPopover', 'catalog', 'production', true);
    await tabTo(page, page.getByRole('button', { name: '추가 정보', exact: true }).first());
    await page.keyboard.press('Enter');
    await staysInside(page, page.getByRole('dialog').last());
  });

  test(`${platform}: Tab in Confirm skips controls inside an inert subtree`, async ({ page }) => {
    await openFixture(page, platform, '?component=KjunFeedbackProvider', 'catalog', 'production', true);
    await tabTo(page, page.getByRole('button', { name: 'Confirm 요청', exact: true }));
    await page.keyboard.press('Enter');
    const dialog = page.getByRole('dialog').last();
    await expect(dialog).toBeVisible();
    // Stands in for a Toast that is still leaving the dialog's feedback outlet: present, but inert.
    await dialog.evaluate(el => { const leaving = document.createElement('div'); leaving.inert = true; leaving.innerHTML = '<button type="button">알림 닫기</button>'; el.append(leaving); });
    await staysInside(page, dialog);
  });
}
