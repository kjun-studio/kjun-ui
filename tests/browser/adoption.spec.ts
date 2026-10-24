import { expect, test, type Page } from '@playwright/test';
import { openFixture } from './packed-fixture';

// 0.14.0 adoption additions: one block per feature, three platforms.
const section = (page: Page, id: string) => page.getByTestId(id);
for (const platform of ['react', 'vue3', 'native']) {
  test.describe(platform, () => {
    test.beforeEach(async ({ page }) => {
      await openFixture(page, platform, '', 'adoption');
      await expect(section(page, 'external-feedback')).toBeVisible();
    });

    test('a confirm and a toast opened from a plain function show in the provider', async ({ page }) => {
      await section(page, 'external-feedback').getByRole('button', { name: 'open from function' }).click();
      await expect(page.getByRole('dialog').filter({ hasText: 'Opened from a function' }).last()).toBeVisible();
      await expect(page.getByText('Toast from a function', { exact: true })).toBeVisible();
    });

    test('pressable cards are buttons; plain and disabled cards do not press', async ({ page }) => {
      const cards = section(page, 'cards');
      const card = cards.getByRole('button', { name: 'Question card' });
      await card.click();
      await expect(cards.getByText('presses 1', { exact: true })).toBeVisible();
      if (platform !== 'native') {
        await card.focus(); await page.keyboard.press('Enter');
        await expect(cards.getByText('presses 2', { exact: true })).toBeVisible();
        // A card that only passes onClick through keeps its plain markup.
        await expect(cards.getByRole('button', { name: 'Plain card' })).toHaveCount(0);
        await expect(cards.getByText('Plain card', { exact: true })).toBeVisible();
      }
      const disabled = cards.getByRole('button', { name: 'Disabled card' });
      await expect(disabled).toHaveAttribute('aria-disabled', 'true');
      await disabled.click({ force: true });
      await expect(cards.getByText(platform === 'native' ? 'presses 1' : 'presses 2', { exact: true })).toBeVisible();
    });
  });
}
