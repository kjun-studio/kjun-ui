import { expect, type Page } from '@playwright/test';

export async function openExampleSettings(page: Page) {
  const trigger = page.locator('.playground').getByRole('button', { name: '예제 설정', exact: true });
  if (await trigger.count()) {
    if (await trigger.getAttribute('aria-expanded') !== 'true') await trigger.click();
    await expect(trigger).toHaveAttribute('aria-expanded', 'true');
  }
}
