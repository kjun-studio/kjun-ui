import { expect, test, type Page } from '@playwright/test';
import { openFixture } from './packed-fixture';
const composer = (page: Page) => page.getByTestId('composer');
const area = (page: Page) => composer(page).locator('textarea');
const height = async (page: Page) => Math.round((await area(page).boundingBox())!.height);
// The field surface: the wrapper that draws the background around the textarea and its bar.
const surface = (page: Page) => area(page).locator('..');

for (const platform of ['react', 'vue3', 'native']) {
  test(`${platform}: textarea grows from rows to maxRows, then scrolls`, async ({ page }) => {
    await openFixture(page, platform, '', 'input-design');
    // md: 24px rows, 12px top padding and a 4px gap above the bar.
    const two = 2 * 24 + 12 + 4, four = 4 * 24 + 12 + 4;
    expect(await height(page)).toBe(two);
    await area(page).fill('하나\n둘\n셋');
    await expect.poll(() => height(page)).toBe(3 * 24 + 12 + 4);
    await area(page).fill('하나\n둘\n셋\n넷\n다섯\n여섯');
    await expect.poll(() => height(page)).toBe(four);
    expect(await area(page).evaluate(el => el.scrollHeight > el.clientHeight)).toBe(true);
    await area(page).fill('하나');
    await expect.poll(() => height(page)).toBe(two);
  });

  test(`${platform}: count, limit and composer submit`, async ({ page }) => {
    await openFixture(page, platform, '', 'input-design');
    const count = composer(page).getByText(/^\d+\/20$/);
    await expect(count).toHaveText('0/20');
    const submit = composer(page).getByRole('button', { name: '보내기' });
    await expect(submit).toBeDisabled();
    await expect(composer(page).getByRole('button', { name: '첨부 추가' })).toBeVisible();
    await area(page).fill('회의 메모');
    await expect(count).toHaveText('5/20');
    await expect(submit).toBeEnabled();
    // The bar sits inside the field: the submit button is within the surface, under the text.
    const field = (await surface(page).boundingBox())!, button = (await submit.boundingBox())!, text = (await area(page).boundingBox())!;
    expect(button.y).toBeGreaterThanOrEqual(text.y + text.height - 1);
    expect(button.y + button.height).toBeLessThanOrEqual(field.y + field.height);
    expect(button.x + button.width).toBeLessThanOrEqual(field.x + field.width);
    await submit.click();
    await expect(page.getByTestId('sent')).toHaveText('회의 메모');
    await expect(area(page)).toHaveValue('');
    await expect(count).toHaveText('0/20');
    if (platform !== 'native') {
      await area(page).fill('단축키');
      await area(page).press('Control+Enter');
      await expect(page.getByTestId('sent')).toHaveText('단축키');
      // The attribute stops typing at the limit.
      await area(page).fill('');
      await area(page).pressSequentially('가나다라마바사아자차카타파하가나다라마바사아');
      await expect(count).toHaveText('20/20');
    }
    await page.evaluate(() => (window as any).configureInputDesign({ disabled: true }));
    await expect(submit).toBeDisabled();
  });

  test(`${platform}: sending blocks repeats, the count describes the field and is announced near the limit`, async ({ page }) => {
    await openFixture(page, platform, '', 'input-design');
    await expect(area(page)).toHaveAccessibleDescription(/0\/20/);
    await area(page).fill('보낼 메모');
    await page.evaluate(() => (window as any).configureInputDesign({ submitting: true }));
    const submit = composer(page).getByRole('button', { name: '보내기' });
    await submit.click({ force: true });
    await expect(page.getByTestId('sent')).toHaveText('');
    if (platform !== 'native') {
      await area(page).press('Control+Enter');
      await expect(page.getByTestId('sent')).toHaveText('');
      await expect(area(page)).toHaveAttribute('aria-busy', 'true');
      await area(page).fill('가나다라마바사아자차카타파하가나다라마');
      await expect(composer(page).locator('[aria-live="polite"]')).toHaveText('1자 남음');
    }
    await page.evaluate(() => (window as any).configureInputDesign({ submitting: false }));
    await submit.click();
    await expect(page.getByTestId('sent')).not.toHaveText('');
  });
}

for (const platform of ['react', 'vue3']) {
  test(`${platform}: Enter mode sends on Enter and keeps Shift+Enter for a new line; a draggable field stops growing`, async ({ page }) => {
    await openFixture(page, platform, '', 'input-design');
    await page.evaluate(() => (window as any).configureInputDesign({ submitOn: 'enter' }));
    await area(page).fill('첫 줄');
    await area(page).press('Shift+Enter');
    await expect(area(page)).toHaveValue('첫 줄\n');
    await area(page).press('Enter');
    await expect(page.getByTestId('sent')).toHaveText('첫 줄');
    await page.evaluate(() => (window as any).configureInputDesign({ resize: 'vertical' }));
    await expect(area(page)).not.toHaveAttribute('data-grow');
  });
}
