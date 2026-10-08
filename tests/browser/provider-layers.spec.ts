import { test, expect } from '@playwright/test';
import { openFixture } from './packed-fixture';

for (const platform of ['react', 'vue2', 'native']) {
  test(`${platform}: nested Providers keep Escape, Tab and focus in the active window`, async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await openFixture(page, platform, '', 'provider-layers');
    await page.getByRole('button', { name: 'Open outer', exact: true }).click();
    const trigger = page.getByRole('button', { name: 'Open inner', exact: true });
    await trigger.click();
    const action = page.getByRole('button', { name: 'Inner action', exact: true });
    await expect(action).toBeVisible();
    await action.click();
    for (let i = 0; i < 7; i++) {
      await page.keyboard.press('Tab');
      expect(await page.evaluate(() => document.activeElement?.closest('[role="dialog"], [aria-modal="true"]')?.textContent)).toContain('Inner action');
    }
    await page.keyboard.press('Escape');
    await expect(action).toHaveCount(0);
    await expect(trigger).toBeFocused();
    await expect(page.getByTestId('events')).toHaveText('inner');
    await page.keyboard.press('Escape');
    await expect(page.getByTestId('events')).toHaveText('inner,outer');
    await expect(page.getByRole('button', { name: 'Open outer', exact: true })).toBeFocused();
  });

  test(`${platform}: nested Provider popups and drawers escape clipping and release input on unmount`, async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await openFixture(page, platform, '', 'provider-layers');
    await page.getByRole('button', { name: 'Open outer', exact: true }).click();
    await page.getByRole('button', { name: 'Open popup', exact: true }).click();
    await page.getByRole('button', { name: 'Popup action', exact: true }).click();
    await page.keyboard.press('Escape');
    await expect(page.getByRole('button', { name: 'Open popup', exact: true })).toBeFocused();
    await page.getByRole('button', { name: 'Open drawer', exact: true }).click();
    await page.getByRole('button', { name: 'Drawer action', exact: true }).click();
    await page.mouse.click(5, 5);
    await expect(page.getByRole('button', { name: 'Drawer action', exact: true })).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Open drawer', exact: true })).toBeFocused();
    await page.getByRole('button', { name: 'Open inner', exact: true }).click();
    await page.getByRole('button', { name: 'Open inner popup', exact: true }).click();
    await page.getByRole('button', { name: 'Inner popup action', exact: true }).click();
    await page.keyboard.press('Escape');
    await expect(page.getByRole('button', { name: 'Open inner popup', exact: true })).toBeFocused();
    await page.evaluate(() => (window as any).providerLayers.unmount());
    await page.getByRole('button', { name: 'Outer action', exact: true }).click();
    await page.keyboard.press('Escape');
    await page.getByRole('button', { name: 'Open outer', exact: true }).click();
    await expect(page.getByRole('button', { name: 'Outer action', exact: true })).toBeVisible();
  });

  test(`${platform}: nested windows retain project-owned colors and live updates`, async ({ page }) => {
    await openFixture(page, platform, '', 'provider-layers');
    await page.getByRole('button', { name: 'Open outer', exact: true }).click();
    await page.getByRole('button', { name: 'Open inner', exact: true }).click();
    const surface = page.locator(platform === 'react' ? '.kjun-modal' : platform === 'vue2' ? '.ds-modal-container' : '[aria-label="Inner dialog"]').filter({ hasText: 'Inner action' }).last();
    await expect(surface).toHaveCSS('background-color', 'rgb(255, 244, 221)');
    if (platform !== 'native') await expect(surface).toHaveCSS('font-family', 'monospace');
    await page.evaluate(() => (window as any).providerLayers.changeStyle());
    await expect(surface).toHaveCSS('background-color', 'rgb(221, 238, 255)');
  });
}
