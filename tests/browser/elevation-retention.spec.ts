import { test, expect, type Page } from '@playwright/test';
import { openFixture } from './packed-fixture';

async function settle(page: Page) {
  await page.clock.runFor(350);
  // Vue uses WAAPI; the browser clock controls RN Web's animation frames/timers.
  await page.evaluate(() => document.getAnimations().forEach(animation => animation.finish()));
  await page.clock.runFor(32);
}

for (const platform of ['react', 'vue2', 'native']) for (const kind of ['modal', 'drawer']) for (const interleaved of [false, true]) {
  test(`${platform}: ${kind} retains child state through ${interleaved ? 'A-B-A across Providers' : 'an interrupted exit'}`, async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await page.clock.install({ time: new Date('2026-09-23T00:00:00Z') });
    await openFixture(page, platform, `?kind=${kind}${interleaved ? '&interleaved' : ''}`, 'elevation-retention');
    await page.getByRole('button', { name: 'Open first', exact: true }).click();
    const draft = page.getByRole('textbox', { name: 'Draft', exact: true });
    await draft.fill('Keep this draft');
    await page.getByRole('button', { name: 'Edit count 0', exact: true }).click();
    await page.clock.pauseAt(new Date('2026-09-23T01:00:00Z'));
    await page.evaluate(async () => {
      await (window as any).retention.reopen();
      // Keep the exit pending while the test advances the 20/60ms transition steps.
      document.getAnimations().forEach(animation => animation.pause());
    });
    if (interleaved) {
      await page.clock.runFor(30);
      await expect(page.getByRole('button', { name: 'Second action', exact: true })).toBeVisible();
      await page.clock.runFor(50);
    } else await page.clock.runFor(40);
    await settle(page);
    await expect(draft).toHaveValue('Keep this draft');
    await expect(page.getByTestId('draft-context')).toHaveText('Project context');
    await expect.poll(() => draft.evaluate(el => !!el.closest('[inert], [aria-hidden="true"]'))).toBe(false);
    const edit = page.getByRole('button', { name: 'Edit count 1', exact: true });
    await edit.click();
    for (let i = 0; i < 7; i++) {
      await page.keyboard.press('Tab');
      expect(await draft.evaluate(el => !!el.closest('[role="dialog"], [aria-modal="true"]')?.contains(document.activeElement))).toBe(true);
    }
    await page.evaluate(() => (window as any).retention.toast());
    await page.getByRole('button', { name: 'Toast action', exact: true }).click();
    await expect(page.getByTestId('actions')).toHaveText('1');
    await page.keyboard.press('Escape');
    await settle(page);
    await expect(draft).toHaveCount(0);
    if (interleaved) {
      await page.getByRole('button', { name: 'Second action', exact: true }).click();
      await page.keyboard.press('Escape');
      await settle(page);
      await expect(page.getByRole('button', { name: 'Second action', exact: true })).toHaveCount(0);
    }
    await page.getByRole('button', { name: 'Open first', exact: true }).click();
    await settle(page);
    await expect(draft).toHaveValue('Original');
    await expect(page.getByRole('button', { name: 'Edit count 0', exact: true })).toBeVisible();
    await page.evaluate(() => (window as any).retention.unmount());
    await page.getByRole('button', { name: 'Page action', exact: true }).click();
    await expect(page.getByTestId('actions')).toHaveText(interleaved ? '3' : '2');
    expect(await page.evaluate(() => document.body.style.overflow)).not.toBe('hidden');
    expect(errors).toEqual([]);
  });
}
