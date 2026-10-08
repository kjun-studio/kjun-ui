import { test, expect, type Page } from '@playwright/test';
import { openFixture } from './packed-fixture';

async function start(page: Page, kind: string, nested = false) {
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.clock.install({ time: new Date('2026-09-22T00:00:00Z') });
  await openFixture(page, 'react', `?kind=${kind}${nested ? '&nested' : ''}`, 'elevation-reopen');
  await page.getByRole('button', { name: 'Open first', exact: true }).click();
  await page.getByRole('textbox', { name: 'Draft' }).fill('Keep this draft');
  await page.getByRole('button', { name: 'Edit count 0', exact: true }).click();
  await page.clock.pauseAt(new Date('2026-09-22T01:00:00Z'));
}

async function reopen(page: Page) {
  await page.evaluate(() => (window as any).elevationReopen.reopen());
  await page.clock.runFor(30);
  await expect(page.getByRole('dialog', { name: 'Second window', exact: true })).toBeVisible();
  await page.clock.runFor(50);
}

for (const kind of ['modal', 'drawer']) {
  for (const nested of [false, true]) {
    test(`react: ${kind} reopened above a newer window preserves input, Tab and toast ownership${nested ? ' across Providers' : ''}`, async ({ page }) => {
      await start(page, kind, nested);
      await page.evaluate(() => (window as any).elevationReopen.toast());
      await reopen(page);
      const first = page.getByRole('dialog', { name: 'First window', exact: true });
      const second = page.getByRole('dialog', { name: 'Second window', exact: true });
      await expect(first).toBeVisible();
      await expect.poll(() => first.evaluate(el => !!el.closest('[inert], [aria-hidden="true"]')), { timeout: 5000 }).toBe(false);
      expect(await second.evaluate(el => !!el.closest('[inert], [aria-hidden="true"]'))).toBe(true);
      await expect.poll(() => first.evaluate(el => el.contains(document.activeElement)), { timeout: 5000 }).toBe(true);
      await expect(first.getByRole('textbox')).toHaveValue('Keep this draft');
      await first.getByRole('button', { name: 'Edit count 1', exact: true }).click();
      await expect(first.getByRole('button', { name: 'Edit count 2', exact: true })).toBeVisible();
      await expect(first.getByRole('alert')).toHaveCount(1);
      for (let i = 0; i < 8; i++) {
        await page.keyboard.press('Tab');
        expect(await first.evaluate(el => el.contains(document.activeElement))).toBe(true);
      }
      await first.getByRole('button', { name: 'Toast action', exact: true }).focus();
      await page.keyboard.press('Enter');
      await expect(page.getByTestId('actions')).toHaveText('1');
      await page.clock.runFor(300);
      await expect(page.getByRole('alert')).toHaveCount(0);

      // Reactivate the retained lower window, then release page input after both close.
      await page.evaluate(() => (window as any).elevationReopen.toast());
      await page.keyboard.press('Escape');
      await page.clock.runFor(300);
      await expect(first).toHaveCount(0);
      await expect(second).toBeVisible();
      await expect(second.getByRole('alert')).toHaveCount(1);
      await second.getByRole('button', { name: 'Second action', exact: true }).click();
      await page.keyboard.press('Tab');
      expect(await second.evaluate(el => el.contains(document.activeElement))).toBe(true);
      await page.keyboard.press('Escape');
      await page.clock.runFor(300);
      await page.getByRole('button', { name: 'Page action', exact: true }).click();
      await expect(page.getByTestId('actions')).toHaveText('3');
      await expect(page.getByRole('alert')).toHaveCount(1);
      expect(await page.evaluate(() => document.body.style.overflow)).not.toBe('hidden');
    });
  }

  test(`react: ${kind} reordered during exit keeps the toast's remaining lifetime`, async ({ page }) => {
    await start(page, kind);
    await page.mouse.move(1, 1);
    await page.evaluate(() => (window as any).elevationReopen.toast(1600));
    await page.clock.runFor(700);
    await reopen(page);
    const first = page.getByRole('dialog', { name: 'First window', exact: true });
    await expect(first.getByRole('alert')).toHaveCount(1);
    await page.clock.runFor(650);
    await expect(first.getByRole('alert')).toHaveCount(1);
    await page.clock.runFor(600);
    await expect(page.getByRole('alert')).toHaveCount(0);
  });
}
