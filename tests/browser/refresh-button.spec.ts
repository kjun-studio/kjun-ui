import { icons } from '@kjun-ui/icons/defaults';
import { expect, test, type Page } from '@playwright/test';
import { tokens } from '../../packages/tokens/dist/index.js';
import { openFixture } from './packed-fixture';

const button = (page: Page, id = 'icon') => page.getByTestId(id).getByRole('button');
const configure = async (page: Page, next: object) => {
  await page.evaluate(next => (window as any).configureRefresh(next), next);
  await expect.poll(async () => JSON.parse((await page.getByTestId('config').textContent())!)).toMatchObject(next);
};
const shape = (page: Page, id: string) => button(page, id).evaluate(el => {
  const r = el.getBoundingClientRect(), s = getComputedStyle(el);
  return { width: r.width, height: r.height, radius: s.borderRadius, padding: s.padding, gap: s.gap };
});
const icon = (page: Page) => button(page).locator('svg');
const paths = (page: Page) => icon(page).evaluate(el => el.innerHTML);
const rotation = (page: Page) => button(page).evaluate(el => {
  const svg = el.querySelector('svg')!;
  return getComputedStyle(svg.classList.contains('kjun-icon') ? svg : svg.parentElement!).transform;
});

for (const platform of ['react', 'vue2', 'native']) {
  test(`${platform}: refresh sizes and visible labels preserve Button geometry while loading`, async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await openFixture(page, platform, '', 'refresh-button');
    await expect(button(page)).toHaveCSS('width', '32px');
    for (const [size, height] of [['xs', 24], ['sm', 32], ['md', 40], ['lg', 48], ['xl', 56]] as const) {
      await configure(page, { size, loading: false, tooltip: '' });
      await expect(button(page)).toBeEnabled();
      await expect(button(page)).toHaveCSS('width', `${height}px`);
      await expect(button(page)).toHaveCSS('height', `${height}px`);
      await expect.poll(() => shape(page, 'text')).toEqual(await shape(page, 'reference'));
      // The icon side takes the tighter inset; labelled buttons keep the size's minimum width.
      const reference = button(page, 'reference');
      await expect(reference).toHaveCSS('padding-left', `${tokens.button.iconSidePaddingX[size]}px`);
      await expect(reference).toHaveCSS('padding-right', `${tokens.button.paddingX[size]}px`);
      await expect(reference).toHaveCSS('gap', `${tokens.button.contentGaps[size]}px`);
      await expect(reference).toHaveCSS('min-width', `${tokens.button.minWidths[size]}px`);
      const before = await shape(page, 'text');
      await configure(page, { loading: true });
      await expect(button(page, 'text')).toHaveText('새로고침');
      await expect(button(page, 'text').locator('.kjun-button-label,[dir="auto"]').first()).toHaveCSS('opacity', '1');
      await expect(button(page, 'text')).toHaveCSS('opacity', '1');
      await expect(button(page)).toHaveAttribute('aria-busy', 'true');
      expect(await shape(page, 'text')).toEqual(before);
      await expect(button(page)).toBeDisabled();
    }
    await configure(page, { size: 'md', block: true, loading: false });
    await page.setViewportSize({ width: 375, height: 700 });
    for (const id of ['icon', 'text', 'reference']) await expect(button(page, id)).toHaveCSS('width', '300px');
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.screenshot({ path: `artifacts/refresh-${platform}-geometry.png` });
  });

  test(`${platform}: shared icon direction and live reduced-motion changes keep loading recognizable`, async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await openFixture(page, platform, '', 'refresh-button');
    await configure(page, { tooltip: '' });
    await expect(icon(page).locator('g')).toHaveCount(0);
    await expect(icon(page).locator('path').first()).toHaveAttribute('d', icons.refresh[0][1].d);
    const idle = await paths(page);
    await configure(page, { loading: true });
    await expect.poll(() => paths(page)).toBe(idle);
    const start = await rotation(page);
    await expect.poll(() => rotation(page)).not.toBe(start);
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await expect.poll(() => paths(page)).not.toBe(idle);
    const reduced = await paths(page);
    await expect.poll(() => rotation(page)).toMatch(/^(none|matrix\(1, 0, 0, 1, 0, 0\))$/);
    await expect(button(page, 'text')).toHaveText('새로고침');
    await page.screenshot({ path: `artifacts/refresh-${platform}-reduced-motion.png` });
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await expect.poll(() => paths(page)).toBe(idle);
    await configure(page, { spinOnLoading: false });
    await expect.poll(() => paths(page)).toBe(reduced);
    await configure(page, { loading: false });
    await expect(button(page)).toBeEnabled();
    await expect.poll(() => paths(page)).toBe(idle);
  });

  test(`${platform}: shared tooltips support hover, focus, overrides and suppression`, async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await openFixture(page, platform, '', 'refresh-button');
    await expect(button(page)).not.toHaveAttribute('title');
    // Establish pointer input before entering the trigger, as a real approach does.
    await page.mouse.move(800, 600);
    await button(page).hover();
    await expect(page.getByRole('tooltip')).toHaveText('목록 새로고침');
    await page.mouse.move(800, 600);
    await expect(page.getByRole('tooltip')).toBeHidden();
    await button(page).focus();
    await page.keyboard.press('Tab');
    await page.keyboard.press('Shift+Tab');
    await expect(page.getByRole('tooltip')).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page.getByRole('tooltip')).toBeHidden();
    await page.getByTestId('outside').focus();
    await button(page, 'text').hover();
    await expect(page.getByRole('tooltip')).toBeHidden();
    await configure(page, { tooltip: '최신 목록 가져오기', tooltipPlacement: 'bottom' });
    await page.mouse.move(800, 600);
    await button(page).hover();
    await expect(page.getByRole('tooltip')).toHaveText('최신 목록 가져오기');
    await configure(page, { loading: true });
    await expect(page.getByRole('tooltip')).toBeHidden();
    await configure(page, { loading: false, tooltip: '' });
    await expect(button(page)).toBeEnabled();
    await page.mouse.move(800, 600);
    await button(page).hover();
    await expect(page.getByRole('tooltip')).toBeHidden();
    await configure(page, { disabled: true, tooltip: '최신 목록 가져오기' });
    await button(page).hover({ force: true });
    await expect(page.getByRole('tooltip')).toBeHidden();
  });

  test(`${platform}: keyboard refresh and minimum loading prevent repeated actions`, async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.clock.install({ time: new Date('2026-09-26T00:00:00Z') });
    await page.clock.pauseAt(new Date('2026-09-26T00:00:01Z'));
    await openFixture(page, platform, '?loading&dark', 'refresh-button');
    await configure(page, { tooltip: '' });
    await expect(button(page)).toBeDisabled();
    await expect(icon(page)).toHaveCSS('stroke', 'rgb(212, 212, 212)');
    await expect(button(page)).toHaveAccessibleName('목록 새로고침');
    await configure(page, { loading: false });
    await expect(button(page)).toBeDisabled();
    await page.clock.runFor(450);
    await expect(button(page)).toBeEnabled();
    await button(page).press('Enter');
    await button(page).press('Space');
    await expect(page.getByTestId('events')).toHaveText('2');
    await configure(page, { loading: true });
    await button(page).dispatchEvent('click');
    await expect(page.getByTestId('events')).toHaveText('2');
    await page.clock.runFor(40);
    await configure(page, { loading: false });
    await expect(button(page)).toBeDisabled();
    await page.clock.runFor(400);
    await expect(button(page)).toBeEnabled();
    await button(page, 'text').press('Enter');
    await expect(page.getByTestId('events')).toHaveText('3');
    await page.screenshot({ path: `artifacts/refresh-${platform}-dark.png` });
  });
}
