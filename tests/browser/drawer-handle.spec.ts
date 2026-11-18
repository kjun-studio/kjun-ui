import { expect, test, type Locator, type Page } from '@playwright/test';
import { openFixture } from './packed-fixture';

test.use({ viewport: { width: 375, height: 720 } });
const platforms = ['react', 'vue3', 'native'] as const;

async function drag(page: Page, from: Locator, dy: number, pause = 0) {
  const box = (await from.boundingBox())!;
  const x = box.x + box.width / 2, y = box.y + box.height / 2;
  await page.mouse.move(x, y);
  await page.mouse.down();
  await page.mouse.move(x, y + dy, { steps: 12 });
  if (pause) await page.waitForTimeout(pause);
  await page.mouse.up();
}
// Native Web's modal root is a dialog too; the drawer panel is the one with the name.
const open = async (page: Page, name = '필터') => {
  await page.getByRole('button', { name: '열기' }).click();
  const dialog = page.getByRole('dialog', { name });
  await expect(dialog).toBeVisible();
  await page.waitForTimeout(400);
  return dialog;
};

for (const platform of platforms) {
  test(`${platform}: header actions sit before the close button and the footer buttons share a phone row`, async ({ page }) => {
    await openFixture(page, platform, '', 'drawer-handle');
    const dialog = await open(page);
    await expect(dialog).toHaveAttribute('aria-describedby', 'drawer-desc');
    const reset = (await dialog.getByRole('button', { name: '초기화' }).boundingBox())!;
    const close = (await dialog.getByRole('button', { name: '닫기' }).boundingBox())!;
    expect(Math.abs(reset.y + reset.height / 2 - (close.y + close.height / 2))).toBeLessThan(1);
    expect(close.x - (reset.x + reset.width)).toBeCloseTo(4, 0);
    await dialog.getByRole('button', { name: '초기화' }).click();
    await expect(page.getByTestId('resets')).toHaveText('1');
    const cancel = (await dialog.getByRole('button', { name: '취소' }).boundingBox())!;
    const apply = (await dialog.getByRole('button', { name: '적용' }).boundingBox())!;
    expect(Math.abs(cancel.y - apply.y)).toBeLessThan(1);
    expect(Math.abs(cancel.width - apply.width)).toBeLessThan(2);
    expect(apply.x - (cancel.x + cancel.width)).toBeCloseTo(12, 0);
  });

  test(`${platform}: a short slow drag springs back, a long drag closes`, async ({ page }) => {
    await openFixture(page, platform, '', 'drawer-handle');
    const dialog = await open(page);
    const title = dialog.getByText('필터', { exact: true });
    const rest = (await title.boundingBox())!.y;
    await drag(page, title, 30, 250);
    await page.waitForTimeout(500);
    await expect(page.getByTestId('state')).toHaveText('open');
    expect(Math.abs((await title.boundingBox())!.y - rest)).toBeLessThan(1);
    await drag(page, title, 140);
    await expect(page.getByTestId('state')).toHaveText('closed');
    await expect(page.getByRole('dialog', { name: '필터' })).toHaveCount(0);
  });
}

for (const platform of ['react', 'vue3'] as const) {
  test(`${platform}: the drawer is named by its title or header and returns focus where asked`, async ({ page }) => {
    await openFixture(page, platform, '', 'drawer-handle');
    let dialog = await open(page);
    await expect(dialog).toHaveAccessibleName('필터');
    await expect(dialog.locator('.kjun-drawer-handle')).toHaveAttribute('aria-hidden', 'true');
    await dialog.getByRole('button', { name: '닫기' }).click();
    await expect(page.getByRole('dialog')).toHaveCount(0);
    await expect(page.locator('#after-close')).toBeFocused();
    await openFixture(page, platform, '?custom', 'drawer-handle');
    dialog = await open(page, '맞춤 제목');
    // The close button keeps its 32px square next to the header actions.
    const close = (await dialog.getByRole('button', { name: '닫기' }).boundingBox())!;
    expect([Math.round(close.width), Math.round(close.height)]).toEqual([32, 32]);
  });
}
