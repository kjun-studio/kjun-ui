import { expect, test, type Page } from '@playwright/test';
import { tokens } from '../../packages/tokens/dist/index.js';
import { openFixture } from './packed-fixture';

const configure = async (page: Page, next: object) => {
  await page.evaluate(next => (window as any).configureMenu(next), next);
  await expect.poll(async () => JSON.parse((await page.getByTestId('config').textContent())!)).toMatchObject(next);
};
const trigger = (page: Page) => page.getByTestId('menu').getByRole('button');
const reference = (page: Page) => page.getByTestId('reference').getByRole('button');
const shape = (page: Page, id: string) => page.getByTestId(id).getByRole('button').evaluate(el => {
  const s = getComputedStyle(el), box = el.getBoundingClientRect();
  return { width: box.width, height: box.height, radius: s.borderRadius, padding: s.padding, gap: s.gap };
});
const icon = (page: Page) => trigger(page).locator('svg');
const iconPath = (page: Page) => icon(page).evaluate(el => el.innerHTML);
const menu = (page: Page, platform: string) => platform === 'native'
  ? page.locator('[aria-label="메뉴"]') : page.getByRole('menu');

for (const platform of ['react', 'vue2', 'native']) {
  test(`${platform}: menu sizes, compact mode and loading reuse Button geometry`, async ({ page }) => {
    await openFixture(page, platform, '', 'menu-button');
    await expect(trigger(page)).toHaveCSS('height', '40px');
    await expect(trigger(page)).toHaveCSS('border-top-width', '0px');
    for (const [size, height, iconSize] of [['xs', 24, 14], ['sm', 32, 16], ['md', 40, 16], ['lg', 48, 18], ['xl', 56, 20]] as const) {
      for (const compact of [false, true]) {
        await configure(page, { size, compact, loading: false });
        await expect(trigger(page)).toBeEnabled();
        await expect(trigger(page)).toHaveCSS('height', `${height}px`);
        await expect(icon(page)).toHaveAttribute('width', String(iconSize));
        await expect.poll(() => shape(page, 'menu')).toEqual(await shape(page, 'reference'));
        await expect(trigger(page)).toHaveAccessibleName('작업 메뉴');
        if (compact) {
          await expect(trigger(page)).toHaveText('');
          await expect(trigger(page)).toHaveCSS('width', `${height}px`);
        } else {
          const gap = await trigger(page).evaluate(el => {
            const label = el.querySelector('.kjun-button-label,[dir="auto"]')!;
            const svg = el.querySelector('svg')!;
            return svg.getBoundingClientRect().left - label.getBoundingClientRect().right;
          });
          expect(gap).toBeCloseTo(tokens.button.contentGaps[size], 1);
        }
        const before = await shape(page, 'menu');
        await configure(page, { loading: true });
        await expect(trigger(page)).toBeDisabled();
        await expect(trigger(page)).toHaveAttribute('aria-busy', 'true');
        await expect(trigger(page)).toHaveCSS('opacity', '1');
        expect(await shape(page, 'menu')).toEqual(before);
        if (!compact) {
          await expect(trigger(page)).toHaveText('작업 메뉴');
          await expect(trigger(page).locator('.kjun-button-label,[dir="auto"]').first()).toHaveCSS('opacity', '1');
        }
      }
    }
    await configure(page, { loading: false, compact: false, label: '' });
    await expect(trigger(page)).toBeEnabled();
    await expect(trigger(page)).toHaveAccessibleName('메뉴');
    await expect(trigger(page)).toHaveCSS('width', '56px');
  });

  test(`${platform}: open feedback, tooltip suppression and close callbacks stay in sync`, async ({ page }) => {
    await openFixture(page, platform, '', 'menu-button');
    await configure(page, { tooltip: '메뉴 도움말' });
    await page.mouse.move(800, 600);
    await trigger(page).hover();
    await expect(page.getByRole('tooltip')).toBeVisible();
    const closedIcon = await iconPath(page);
    await trigger(page).click();
    await page.mouse.move(800, 600);
    await expect(menu(page, platform)).toBeVisible();
    await expect(trigger(page)).toHaveAttribute('aria-expanded', 'true');
    await expect(trigger(page)).toHaveCSS('background-color', 'rgb(212, 212, 212)');
    await expect.poll(() => iconPath(page)).not.toBe(closedIcon);
    await expect(page.getByRole('tooltip')).toBeHidden();
    await page.getByRole('menuitem', { name: '수정하기' }).click();
    await expect(menu(page, platform)).toBeHidden();
    await expect(trigger(page)).toHaveAttribute('aria-expanded', 'false');
    await expect.poll(() => iconPath(page)).toBe(closedIcon);
    await expect(page.getByTestId('events')).toHaveText('open,action,close');
    await trigger(page).focus();
    await page.keyboard.press('Enter');
    await expect(menu(page, platform)).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(menu(page, platform)).toBeHidden();
    await expect(trigger(page)).toHaveAttribute('aria-expanded', 'false');
    await expect(page.getByTestId('events')).toHaveText('open,action,close,open,close');
  });

  test(`${platform}: loading closes the menu and cannot reopen during the minimum interval`, async ({ page }) => {
    await page.clock.install({ time: new Date('2026-09-26T00:00:00Z') });
    await page.clock.pauseAt(new Date('2026-09-26T00:00:01Z'));
    await openFixture(page, platform, '', 'menu-button');
    await trigger(page).click();
    await expect(trigger(page)).toHaveAttribute('aria-expanded', 'true');
    await configure(page, { loading: true });
    await expect(trigger(page)).toHaveAttribute('aria-expanded', 'false');
    await expect(trigger(page)).toBeDisabled();
    await expect(trigger(page)).toHaveCSS('opacity', '1');
    await configure(page, { loading: false });
    await page.clock.runFor(390);
    await expect(trigger(page)).toBeDisabled();
    // Dispatch directly to exercise the dropdown's capture and keyboard paths too.
    await trigger(page).evaluate(el => {
      el.dispatchEvent(new MouseEvent('click', { bubbles: true }));
      el.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
    });
    await expect(trigger(page)).toHaveAttribute('aria-expanded', 'false');
    await expect(page.getByTestId('events')).toHaveText('open,close');
    await page.clock.runFor(20);
    await expect(trigger(page)).toBeEnabled();
    await trigger(page).click();
    await expect(trigger(page)).toHaveAttribute('aria-expanded', 'true');
    await configure(page, { disabled: true, loading: true });
    await expect(trigger(page)).toHaveCSS('opacity', '1');
    await expect(trigger(page)).toHaveAttribute('aria-expanded', 'false');
    await expect(page.getByTestId('events')).toHaveText('open,close,open,close');
  });

  test(`${platform}: explicit variants retain their open paint and compact accessible name`, async ({ page }) => {
    await openFixture(page, platform, '', 'menu-button');
    for (const [variant, color] of [['secondary', 'rgb(212, 212, 212)'], ['ghost', 'rgb(225, 225, 225)'], ['primary', 'rgb(26, 26, 26)']]) {
      await configure(page, { variant, compact: true });
      await trigger(page).click();
      await page.mouse.move(800, 600);
      await expect(trigger(page)).toHaveCSS('background-color', color);
      await expect(trigger(page)).toHaveAccessibleName('작업 메뉴');
      await expect(trigger(page)).toHaveText('');
      await page.keyboard.press('Escape');
      await expect(trigger(page)).toHaveAttribute('aria-expanded', 'false');
      await expect(menu(page, platform)).toBeHidden();
    }
    await page.getByTestId('menu').screenshot({ path: `artifacts/menu-button-review/${platform}-fixed-compact.png` });
  });
}

test('vue2: custom label slots keep their visible accessible name', async ({ page }) => {
  await openFixture(page, 'vue2', '', 'menu-button');
  await configure(page, { label: '', slotLabel: '필터 작업' });
  await expect(trigger(page)).toHaveText('필터 작업');
  await expect(trigger(page)).toHaveAccessibleName('필터 작업');
  await expect(icon(page)).toHaveAttribute('width', '16');
});
