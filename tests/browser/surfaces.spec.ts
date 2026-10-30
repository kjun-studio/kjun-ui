import { expect, test, type Page } from '@playwright/test';
import { openFixture } from './packed-fixture';
import { tokens } from '../../packages/tokens/src/index';

// 0.17.0: ButtonGroup label fit and bar surfaces, three platforms.
const section = (page: Page, id: string) => page.getByTestId(id);
for (const platform of ['react', 'vue3', 'native']) {
  test.describe(platform, () => {
    test.beforeEach(async ({ page }) => {
      await page.setViewportSize({ width: 1280, height: 2000 });
      await openFixture(page, platform, '', 'surfaces');
    });

    test('group labels stay on one line when the weights use different faces', async ({ page }) => {
      test.skip(platform !== 'native', 'Native per-weight faces');
      const area = section(page, 'group-fonts');
      // Every shown label (not the invisible width reservations) keeps a single line.
      const heights = await area.getByText(/^(Wishlist 3|Achieved 1)$/).evaluateAll(all => all
        .filter(n => getComputedStyle(n).opacity !== '0')
        .map(n => ({ height: n.getBoundingClientRect().height, line: parseFloat(getComputedStyle(n).lineHeight) })));
      expect(heights.length).toBeGreaterThanOrEqual(4);
      for (const { height, line } of heights) expect(height).toBeLessThan(line * 1.5);
    });

    test('group labels stay inside a cell narrower than the label', async ({ page }) => {
      test.skip(platform !== 'native', 'Native reserved-width labels');
      const boxes = await section(page, 'group-narrow').getByText(/^(Received the code|Waiting for approval)$/).evaluateAll(all => all
        .filter(n => getComputedStyle(n).opacity !== '0')
        .map(n => { const cell = n.closest('[role]')!.getBoundingClientRect(), r = n.getBoundingClientRect(); return { left: r.left - cell.left, right: cell.right - r.right }; }));
      expect(boxes.length).toBeGreaterThanOrEqual(4);
      for (const box of boxes) { expect(box.left).toBeGreaterThanOrEqual(-0.5); expect(box.right).toBeGreaterThanOrEqual(-0.5); }
    });

    // The first painted background behind a text: the bar's own, or the page's when the bar is transparent.
    const paintBehind = (page: Page, text: string) => section(page, 'bars').getByText(text, { exact: true }).first().evaluate(el => {
      for (let n: Element | null = el; n; n = n.parentElement) { const c = getComputedStyle(n).backgroundColor; if (c !== 'rgba(0, 0, 0, 0)') return c; }
      return '';
    });

    test('bars without a surface show the page background, and the default bar keeps its surface', async ({ page }) => {
      for (const text of ['Plain header', 'Plain home', 'Plain actions']) expect(await paintBehind(page, text)).toBe('rgb(240, 240, 240)');
      expect(await paintBehind(page, 'Card header')).not.toBe('rgb(240, 240, 240)');
    });

    test('group labels keep their own width instead of being squeezed to the reserved cell', async ({ page }) => {
      test.skip(platform !== 'native', 'Native label overlay');
      const area = section(page, 'group-fonts');
      // A shown label is as wide as its text, so a 1px measuring difference on a device can neither wrap nor clip it.
      const fits = await area.getByText(/^(Wishlist 3|Achieved 1)$/).evaluateAll(all => all
        .filter(n => getComputedStyle(n).opacity !== '0')
        .map(n => { const range = document.createRange(); range.selectNodeContents(n); return Math.abs(n.getBoundingClientRect().width - range.getBoundingClientRect().width); }));
      expect(fits.length).toBeGreaterThanOrEqual(4);
      for (const gap of fits) expect(gap).toBeLessThan(1);
    });

    // The avatar's own box: the nearest rounded ancestor of the initial.
    const avatarOf = (page: Page, initial: string) => section(page, 'avatars').getByText(initial, { exact: true }).evaluate(el => {
      let box: Element | null = el;
      while (box && getComputedStyle(box).borderTopLeftRadius === '0px') box = box.parentElement;
      return { size: Math.round(box!.getBoundingClientRect().width), font: parseFloat(getComputedStyle(el).fontSize) };
    });

    test('avatars offer xs 24 and xl 72 with matching initials', async ({ page }) => {
      expect(await avatarOf(page, 'X')).toEqual({ size: tokens.extensions.avatar.xs, font: tokens.typography.controlSmall.fontSizePx });
      expect(await avatarOf(page, 'L')).toEqual({ size: tokens.extensions.avatar.xl, font: tokens.typography.pageTitle.fontSizePx });
      // The fallback icon scales with the xl step.
      const icon = await section(page, 'avatars').locator('svg').last().evaluate(el => Math.round(el.getBoundingClientRect().width));
      expect(icon).toBe(tokens.extensions.avatar.fallbackIconSizes.xl);
    });
  });
}

// Native bottom sheet entry: the backdrop waits for the measured panel and covers the whole screen.
test.describe('native bottom sheet', () => {
  test.beforeEach(async ({ page }) => {
    // Android lays out a new modal root a navigation bar shorter than the screen for its first frames.
    await page.addInitScript(() => Object.defineProperty(screen, 'height', { get: () => innerHeight + 48 }));
    await page.setViewportSize({ width: 1280, height: 900 });
    await openFixture(page, 'native', '', 'surfaces');
  });
  const backdrop = (page: Page) => page.locator('[role=dialog][aria-label="Edit record"]').locator('xpath=preceding-sibling::*[1]');

  test('the backdrop stays clear until the panel can rise with it', async ({ page }) => {
    await page.evaluate(() => {
      const frames: { panel: number; backdrop: number }[] = [];
      (window as any).sheetFrames = frames;
      const sample = () => {
        const panel = document.querySelector('[role=dialog][aria-label="Edit record"]') as HTMLElement | null;
        const shade = panel?.previousElementSibling as HTMLElement | null;
        if (panel && shade) frames.push({ panel: Number(getComputedStyle(panel).opacity), backdrop: Number(getComputedStyle(shade).opacity) });
        if (frames.length < 40) requestAnimationFrame(sample);
      };
      requestAnimationFrame(sample);
    });
    // A slow device: the panel's layout arrives frames after the window opens.
    const cdp = await page.context().newCDPSession(page);
    await cdp.send('Emulation.setCPUThrottlingRate', { rate: 20 });
    await section(page, 'sheet').getByRole('button', { name: 'Open sheet' }).click();
    await expect(page.locator('[role=dialog][aria-label="Edit record"]')).toBeVisible();
    await expect.poll(() => page.evaluate(() => (window as any).sheetFrames.length)).toBe(40);
    const frames: { panel: number; backdrop: number }[] = await page.evaluate(() => (window as any).sheetFrames);
    await cdp.send('Emulation.setCPUThrottlingRate', { rate: 1 });
    expect(frames.some(frame => frame.panel === 0)).toBe(true);
    for (const frame of frames) if (frame.panel === 0) expect(frame.backdrop).toBe(0);
    await expect.poll(async () => Number(await backdrop(page).evaluate(el => getComputedStyle(el).opacity))).toBe(1);
  });

  for (const [button, name] of [['Open sheet', 'Edit record'], ['Open dialog', 'Confirm record']])
    test(`the backdrop covers the screen below a short modal root: ${name}`, async ({ page }) => {
      await section(page, 'sheet').getByRole('button', { name: button }).click();
      const panel = page.locator(`[role=dialog][aria-label="${name}"]`);
      await expect(panel).toBeVisible();
      const box = await panel.locator('xpath=preceding-sibling::*[1]').evaluate(el => { const r = el.getBoundingClientRect(); return { top: r.top, bottom: r.bottom, screen: screen.height }; });
      expect(box.top).toBeLessThanOrEqual(0);
      expect(box.bottom).toBeGreaterThanOrEqual(box.screen);
    });
});
