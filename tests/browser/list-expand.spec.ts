import { expect, test } from '@playwright/test';
import { openFixture } from './packed-fixture';

// An expandable KjunListRow: the head is a button, its content opens under it inside the same row.
for (const platform of ['react', 'vue3', 'native']) {
  test(`${platform}: an expandable ListRow opens its content under the head and keeps it out of the button`, async ({ page }) => {
    await openFixture(page, platform, '', 'list-expand');
    const head = page.getByRole('button', { name: /현재 잔액/ });
    await expect(head).toHaveAttribute('aria-expanded', 'false');
    await expect(page.getByTestId('breakdown')).toHaveCount(0);
    await head.click();
    await expect(head).toHaveAttribute('aria-expanded', 'true');
    const content = page.getByTestId('breakdown');
    await expect(content).toBeVisible();
    // The content starts on the line the title starts on, under the head, above the next row.
    const title = await page.getByText('현재 잔액', { exact: true }).boundingBox(), body = await content.boundingBox();
    const headBox = await head.boundingBox(), next = await page.getByText('이번 달 수입', { exact: true }).boundingBox();
    await expect.poll(async () => Math.abs((await content.boundingBox())!.x - title!.x)).toBeLessThan(1);
    expect(body!.y).toBeGreaterThanOrEqual(headBox!.y + headBox!.height - 1);
    await expect.poll(async () => (await page.getByText('이번 달 수입', { exact: true }).boundingBox())!.y).toBeGreaterThan(body!.y + body!.height - 1);
    expect(next).not.toBeNull();
    // A button inside the content works on its own and does not toggle the row.
    await page.getByRole('button', { name: '계산 방식 보기' }).click();
    await expect(page.getByTestId('presses')).toHaveText('1');
    await expect(head).toHaveAttribute('aria-expanded', 'true');
    // Keyboard: the head toggles with Enter and Space.
    await head.focus();
    await page.keyboard.press('Enter');
    await expect(head).toHaveAttribute('aria-expanded', 'false');
    await expect(page.getByTestId('breakdown')).toHaveCount(0);
    await page.keyboard.press('Space');
    await expect(head).toHaveAttribute('aria-expanded', 'true');
  });

  test(`${platform}: an expandable ListRow without an icon starts its content at the row inset, and a disabled one stays shut`, async ({ page }) => {
    await openFixture(page, platform, '', 'list-expand');
    const title = await page.getByText('아이콘 없는 행', { exact: true }).boundingBox(), plain = await page.getByTestId('plain').boundingBox();
    expect(Math.abs(plain!.x - title!.x)).toBeLessThan(1);
    const locked = page.getByRole('button', { name: /잠긴 행/ });
    await expect(locked).toBeDisabled();
    await locked.click({ force: true });
    await expect(locked).toHaveAttribute('aria-expanded', 'false');
    await expect(page.getByText('잠긴 내용')).toHaveCount(0);
  });
}
for (const platform of ['react', 'vue3']) {
  test(`${platform}: an expandable ListRow fills only its head on hover and points its chevron down`, async ({ page }) => {
    await openFixture(page, platform, '', 'list-expand');
    const head = page.getByRole('button', { name: /아이콘 없는 행/ }), row = head.locator('xpath=..');
    await expect(row).toHaveAttribute('data-expandable', '');
    await expect(head).toHaveAttribute('aria-controls', /-expanded$/);
    await head.hover();
    const clear = 'rgba(0, 0, 0, 0)';
    await expect.poll(() => head.evaluate(el => getComputedStyle(el).backgroundColor)).not.toBe(clear);
    expect(await row.evaluate(el => getComputedStyle(el).backgroundColor)).toBe(clear);
    // Down when shut, turned over when open; a right chevron would read as navigation.
    const icon = head.locator('.kjun-list-expand-icon');
    await expect(icon).toHaveCSS('transform', 'matrix(-1, 0, 0, -1, 0, 0)');
    await head.click();
    await expect(icon).toHaveCSS('transform', 'none');
    await expect(head.locator('.kjun-list-chevron')).toHaveCount(1);
  });
}
