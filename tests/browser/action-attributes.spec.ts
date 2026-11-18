import { expect, test } from '@playwright/test';
import { openFixture } from './packed-fixture';

test('react: IconToggle takes aria-label, aria-labelledby and button attributes like Vue', async ({ page }) => {
  const warnings: string[] = [];
  page.on('console', message => { if (message.type() === 'warning' && message.text().includes('IconToggle needs')) warnings.push(message.text()); });
  await openFixture(page, 'react', '', 'action-attributes', 'development');
  const attribute = page.getByTestId('attribute'), reference = page.getByTestId('reference');
  await expect(attribute).toHaveAccessibleName('Favorite');
  await expect(attribute).toHaveClass(/kjun-icon-toggle/);
  await expect(attribute).toHaveClass(/consumer-toggle/);
  await expect(attribute).toHaveCSS('margin-top', '2px');
  await expect(reference).toHaveAccessibleName('Watch item');
  await reference.focus();
  await expect(page.getByRole('tooltip')).toHaveText('Watch item');
  await page.keyboard.press('Escape');
  await page.evaluate(() => (window as any).setReferenced('Unwatch item'));
  await expect(reference).toHaveAccessibleName('Unwatch item');
  await attribute.click();
  // Toggle before the app's click, in Vue's merged-handler order, each once.
  await expect(page.getByTestId('events')).toHaveText('[["toggle"],["click"]]');
  await page.mouse.move(900, 600);
  await reference.hover();
  await expect(page.getByRole('tooltip')).toHaveText('Unwatch item');
  expect(warnings).toEqual([]);
});

test('react: CopyButton passes button attributes and a prevented click skips the copy', async ({ page }) => {
  await openFixture(page, 'react', '', 'action-attributes');
  const copy = page.getByTestId('copy');
  await expect(copy).toHaveClass(/kjun-copy-button/);
  await expect(copy).toHaveClass(/consumer-copy/);
  await copy.click();
  await expect(page.getByTestId('events')).toHaveText('[["copy-click"],["copy"]]');
  await page.getByTestId('blocked').click();
  await expect(page.getByTestId('events')).toHaveText('[["copy-click"],["copy"]]');
});
