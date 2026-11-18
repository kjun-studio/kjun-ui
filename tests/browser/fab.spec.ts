import { expect, test, type Page } from '@playwright/test';
import { tokens } from '../../packages/tokens/dist/index.js';
import { openFixture } from './packed-fixture';

const configure = async (page: Page, next: object) => {
  await page.evaluate(next => (window as any).configureFab(next), next);
  await expect.poll(async () => JSON.parse((await page.getByTestId('config').textContent())!)).toMatchObject(next);
};
const fab = (page: Page) => page.getByTestId('frame').getByRole('button');
const width = (page: Page) => fab(page).evaluate(el => el.getBoundingClientRect().width);
const size = tokens.extensions.fab.size;

for (const platform of ['react', 'vue3', 'native']) {
  test(`${platform}: a collapsed labelled FAB folds into its circle, keeps its name and still presses`, async ({ page }) => {
    await openFixture(page, platform, '', 'fab');
    await expect(fab(page)).toHaveAccessibleName('일정 추가');
    await expect.poll(() => width(page)).toBeGreaterThan(size + 24);
    const open = await width(page);
    await configure(page, { collapsed: true });
    await expect.poll(() => width(page)).toBe(size);
    await expect(fab(page)).toHaveAccessibleName('일정 추가');
    await expect(fab(page)).toHaveCSS('height', size + 'px');
    await fab(page).click();
    await expect(page.getByTestId('presses')).toHaveText('1');
    await configure(page, { collapsed: false });
    await expect.poll(() => width(page)).toBe(open);
    // Without a label there is nothing to fold: the circle stays a circle.
    await configure(page, { label: '', ariaLabel: '일정 추가', collapsed: true });
    await expect.poll(() => width(page)).toBe(size);
    await expect(fab(page)).toHaveAccessibleName('일정 추가');
  });
}
