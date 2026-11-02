import { test, expect } from '@playwright/test';
import { openFixture } from './packed-fixture';
import { toasts } from './toast-locators';

for (const reducedMotion of ['no-preference', 'reduce'] as const) {
  test(`Native Web Toast reflow interpolates positions and honors ${reducedMotion}`, async ({ page }) => {
    await page.emulateMedia({ reducedMotion });
    await openFixture(page, 'native', '?scenario=feedback', 'motion');
    const ids = await page.evaluate(() => ['First', 'Middle', 'Last'].map(message => (window as any).feedback.toast.info(message, { duration: 0 })));
    await expect(page.getByText('Last', { exact: true })).toBeVisible();
    // The newest toast is on top, so the oldest one sits below the dismissed toast and moves up.
    const frames = await page.getByText('First', { exact: true }).evaluate(async (element, id) => {
      for (let i = 0; i < 24; i++) await new Promise(requestAnimationFrame);
      const result = [element.getBoundingClientRect().y];
      (window as any).feedback.toast.dismiss(id);
      for (let i = 0; i < 36; i++) { await new Promise(requestAnimationFrame); result.push(element.getBoundingClientRect().y); }
      return result;
    }, ids[1]);
    const from = frames[0], to = frames.at(-1)!;
    expect(from - to).toBeGreaterThan(20);
    expect(frames.some(y => y < from - 1 && y > to + 1)).toBe(reducedMotion === 'no-preference');
    await expect(page.getByText('Middle', { exact: true })).toHaveCount(0);
    if (reducedMotion === 'no-preference') {
      // Turning reduction on while the remaining toast is moving must settle at its final position.
      await page.evaluate(id => (window as any).feedback.toast.dismiss(id), ids[2]);
      await page.emulateMedia({ reducedMotion: 'reduce' });
      await expect.poll(() => page.getByText('First', { exact: true }).evaluate(element =>
        element.closest('[data-toast-id]')!.getAnimations().filter(animation => animation.playState === 'running').length)).toBe(0);
      await expect(page.getByText('Last', { exact: true })).toHaveCount(0);
    }
    await page.evaluate(() => (window as any).feedback.toast.clearAll());
    await expect(toasts(page)).toHaveCount(0);
  });
}
