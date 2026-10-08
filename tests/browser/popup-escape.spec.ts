import { test, expect } from '@playwright/test';
import { openFixture } from './packed-fixture';

for (const kind of ['select', 'menu']) test(`React ${kind}: opening Escape closes once and preserves the parent dialog`, async ({ page }) => {
  await openFixture(page, 'react', '', 'popup-escape');
  await page.getByRole('button', { name: 'Open dialog', exact: true }).click();
  const parent = page.getByRole('dialog', { name: 'Parent dialog', exact: true });
  const trigger = parent.getByRole('button', { name: kind === 'select' ? 'Choose item' : 'Open menu', exact: true });
  await trigger.press('Enter');
  const popup = page.getByRole(kind === 'select' ? 'listbox' : 'menu');
  await popup.waitFor();
  await page.keyboard.press('Escape');
  await expect(popup).not.toBeVisible();
  await expect(parent).toBeVisible();
  await expect(trigger).toBeFocused();
  await expect(page.getByTestId('events')).toHaveText(kind === 'select' ? '["select-open","select-close"]' : '["menu-close"]');
  await page.keyboard.press('Escape');
  await expect(parent).not.toBeVisible();
  await expect(page.getByRole('button', { name: 'Open dialog', exact: true })).toBeFocused();
});

test('React popup fallback ignores composition and leaves a higher modal in charge of Escape', async ({ page }) => {
  await openFixture(page, 'react', '', 'popup-escape');
  await page.getByRole('button', { name: 'Open dialog', exact: true }).click();
  const trigger = page.getByRole('button', { name: 'Choose item', exact: true });
  await trigger.press('Enter');
  const popup = page.getByRole('listbox', { name: 'Choose item' });
  await popup.waitFor();
  await page.evaluate(() => document.body.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', isComposing: true, bubbles: true })));
  await expect(trigger).toHaveAttribute('aria-expanded', 'true');
  await page.getByRole('button', { name: 'Open child', exact: true }).click();
  const child = page.getByRole('dialog', { name: 'Child dialog', exact: true });
  await expect(child).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(child).not.toBeVisible();
  await expect(popup).not.toBeVisible();
  await expect(trigger).toHaveAttribute('aria-expanded', 'false');
  await expect(trigger).toBeFocused();
  await expect(page.getByTestId('events')).toHaveText('["select-open","select-close"]');
  await expect(page.getByRole('dialog', { name: 'Parent dialog', exact: true })).toBeVisible();
});
