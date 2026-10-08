import { expect, test, type Page } from '@playwright/test';
import { openFixture } from './packed-fixture';
const ids = ['text', 'prefix', 'suffix', 'both', 'icon', 'suffix-icon'];
const configure = async (page: Page, next: object) => {
  await page.evaluate(next => (window as any).configureButton(next), next);
  await expect.poll(async () => JSON.parse((await page.getByTestId('config').textContent())!)).toMatchObject(next);
};
const button = (page: Page, id = 'text') => page.getByTestId(id).getByRole('button').first();
const boxes = (page: Page) => page.locator('[data-testid] button, [data-testid] [role="button"]').evaluateAll(nodes => nodes.map(n => {
  const r = n.getBoundingClientRect(); return { x: r.x, y: r.y, width: r.width, height: r.height };
}));
// Disabled and busy repaint through the background transition, so read the paint once it stops changing.
const settledPaint = async (page: Page) => {
  let previous = '';
  await expect.poll(async () => {
    const current = await button(page).evaluate(el => getComputedStyle(el).backgroundColor);
    const settled = current === previous;
    previous = current;
    return settled;
  }, { intervals: [250] }).toBe(true);
  return previous;
};
const ink = (page: Page) => button(page).evaluate(el => getComputedStyle(el.querySelector('span, [dir="auto"]') || el).color);
for (const platform of ['react', 'vue2', 'native']) {
  test(`${platform}: button geometry and neighboring actions stay stable through loading`, async ({ page }) => {
    await openFixture(page, platform, '', 'button-design');
    for (const [size, height, font, radius] of [['xs', 24, 12, 8], ['sm', 32, 14, 10], ['md', 40, 14, 12], ['lg', 48, 16, 14], ['xl', 56, 16, 16]] as const) {
      await configure(page, { size });
      await expect(button(page)).toHaveCSS('height', `${height}px`);
      for (const id of ids) {
        await expect(button(page, id)).toHaveCSS('border-radius', `${radius}px`);
        const content = button(page, id).locator('span, [dir="auto"]').first();
        if (!id.includes('icon')) await expect(content).toHaveCSS('font-size', `${font}px`);
        else expect((await button(page, id).boundingBox())!.width).toBe(height);
      }
      const before = await boxes(page);
      await configure(page, { loading: true });
      await expect(button(page)).toHaveAttribute('aria-busy', 'true');
      for (const id of ids) {
        await expect(button(page, id)).toBeDisabled();
        await expect(button(page, id)).toHaveAccessibleName(id === 'text' ? '변경 사항 저장' : id === 'prefix' || id === 'icon' ? '항목 추가' : id === 'suffix' ? 'Save changes' : id === 'both' ? '추가하고 이동' : '다음');
      }
      expect(await boxes(page)).toEqual(before);
      await configure(page, { loading: false });
      await expect(button(page)).toBeEnabled();
      expect(await boxes(page)).toEqual(before);
    }
    await page.setViewportSize({ width: 375, height: 750 });
    await configure(page, { size: 'lg', block: true });
    await expect(button(page)).toHaveCSS('width', '300px');
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  });

  test(`${platform}: all button variants suppress hover and press while disabled or busy`, async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await openFixture(page, platform, '', 'button-design');
    for (const variant of ['primary', 'secondary', 'ghost', 'danger', 'danger-ghost', 'success', 'warning']) {
      await configure(page, { variant, disabled: false, loading: false });
      await expect(button(page)).toBeEnabled();
      await page.mouse.move(0, 0);
      await expect(button(page)).toHaveCSS('box-shadow', 'none');
      if (variant === 'danger-ghost') {
        await expect(button(page)).toHaveCSS('border-top-width', '0px');
        await expect.poll(() => ink(page)).toBe('rgb(207, 63, 102)');
      }
      for (const state of [{ disabled: true, loading: false }, { disabled: false, loading: true }]) {
        await configure(page, state);
        await expect(button(page)).toBeDisabled();
        const bg = await settledPaint(page);
        await button(page).hover({ force: true });
        await page.mouse.down();
        await expect(button(page)).toHaveCSS('background-color', bg);
        await expect(button(page)).toHaveCSS('transform', platform === 'native' ? 'matrix(1, 0, 0, 1, 0, 0)' : 'none');
        await page.mouse.up();
        await expect(page.getByTestId('events')).toHaveText('0');
      }
    }
  });

  test(`${platform}: secondary and status variants use their own press roles and one neutral disabled paint`, async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await openFixture(page, platform, '', 'button-design');
    const paint = (color: string) => expect(button(page)).toHaveCSS('background-color', color);
    for (const [variant, rest, hover, active] of [
      ['secondary', 'rgb(216, 224, 232)', 'rgb(200, 208, 216)', 'rgb(184, 192, 200)'],
      ['danger', 'rgb(207, 63, 102)', 'rgb(175, 31, 70)', 'rgb(143, 15, 54)'],
    ]) {
      await configure(page, { variant, disabled: false, loading: false });
      await page.mouse.move(0, 0);
      await paint(rest);
      await button(page).hover();
      await paint(hover);
      await page.mouse.down();
      await paint(active);
      await page.mouse.up();
      await page.mouse.move(0, 0);
    }
    for (const variant of ['primary', 'secondary', 'danger', 'success', 'warning', 'ghost', 'danger-ghost']) {
      await configure(page, { variant, disabled: true, loading: false });
      await expect(button(page)).toHaveCSS('opacity', '1');
      await paint(variant.includes('ghost') ? 'rgba(0, 0, 0, 0)' : 'rgb(216, 224, 232)');
      await expect.poll(() => ink(page)).toBe('rgb(136, 153, 170)');
    }
  });

  test(`${platform}: keyboard execution, focus and repeated short loading preserve the action contract`, async ({ page }) => {
    await page.clock.install({ time: new Date('2026-09-26T00:00:00Z') });
    await page.clock.pauseAt(new Date('2026-09-26T00:00:01Z'));
    await openFixture(page, platform, '', 'button-design');
    await page.keyboard.press('Tab');
    await expect(button(page)).toBeFocused();
    await expect(button(page)).toHaveCSS('outline-width', '2px');
    await page.keyboard.press('Enter');
    await page.keyboard.press('Space');
    await expect(page.getByTestId('events')).toHaveText('2');
    await configure(page, { loading: true });
    await expect(button(page)).toBeDisabled();
    await configure(page, { loading: false });
    await expect(button(page)).toBeDisabled();
    await configure(page, { loading: true });
    await page.clock.runFor(450);
    await expect(button(page)).toBeDisabled();
    await configure(page, { loading: false });
    await page.clock.runFor(10);
    await expect(button(page)).toBeEnabled();
    await button(page, 'icon').click();
    await expect(page.getByTestId('events')).toHaveText('3');
  });

  test(`${platform}: initially loading buttons keep their accessible name and release after completion`, async ({ page }) => {
    await openFixture(page, platform, '?loading', 'button-design');
    await expect(button(page)).toBeDisabled();
    const before = await boxes(page);
    await configure(page, { loading: false });
    await expect(button(page)).toBeEnabled();
    expect(await boxes(page)).toEqual(before);
    await expect(button(page)).toHaveAccessibleName('변경 사항 저장');
  });
}
