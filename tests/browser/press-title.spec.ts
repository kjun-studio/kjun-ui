import { expect, test, type Locator, type Page } from '@playwright/test';
import { openFixture } from './packed-fixture';

// R-05: an unselected FilterGroup chip, pills tab and menu item take the active surface while pressed, as ListRow does;
// under the pointer alone they keep the hover surface. R-06: a ListRow title given as a node keeps the title's place,
// and its text names the row's move buttons. The demo palette's active surface is #E1E1E1.
const active = 'rgb(225, 225, 225)';
// The first painted background from the element under a point outwards, so the same probe reads web and Native Web.
const fillAt = (page: Page, x: number, y: number) => page.evaluate(([x, y]) => {
  for (let el = document.elementFromPoint(x, y); el; el = el.parentElement) {
    const color = getComputedStyle(el).backgroundColor;
    if (color && color !== 'rgba(0, 0, 0, 0)' && color !== 'transparent') return color;
  }
  return '';
}, [x, y]);
const centre = async (target: Locator) => { const b = (await target.boundingBox())!; return [b.x + b.width / 2, b.y + b.height / 2] as const; };
// Moves onto the target first (react-aria counts a hover only after a pointer move), then presses and reads the fill.
const pressFill = async (page: Page, target: Locator) => {
  const [x, y] = await centre(target);
  await page.mouse.move(x - 2, y - 2); await page.mouse.move(x, y);
  // Under the pointer: the hover surface on the web (Native Web chips have no hover fill), never the active one yet.
  await page.waitForTimeout(100);
  expect(await fillAt(page, x, y)).not.toBe(active);
  await page.mouse.down();
  const pressed = await expect.poll(() => fillAt(page, x, y)).toBe(active).then(() => true, () => false);
  await page.mouse.up();
  return pressed;
};

for (const platform of ['react', 'vue3', 'native']) {
  test.describe(platform, () => {
    test.beforeEach(async ({ page }) => {
      await page.setViewportSize({ width: 800, height: 900 });
      await openFixture(page, platform, '', 'press-title');
    });

    test('an unselected FilterGroup chip and pills tab take the active surface while pressed', async ({ page }) => {
      // A chip also keeps a hidden copy of its label to reserve the bold width; press the visible one.
      expect(await pressFill(page, page.getByTestId('chips').getByText('상승', { exact: true }).filter({ visible: true }).first())).toBe(true);
      const tab = page.getByTestId('pills').getByText('관심', { exact: true }).filter({ visible: true }).first();
      if (platform !== 'react') { expect(await pressFill(page, tab)).toBe(true); return; }
      // React (react-aria) selects a tab as the mouse goes down, so the pressed tab already shows the selected fill.
      const [x, y] = await centre(tab);
      await page.mouse.move(x, y); await page.mouse.down();
      await expect(page.getByTestId('pills').getByRole('tab', { name: '관심' })).toHaveAttribute('aria-selected', 'true');
      await page.mouse.up();
    });

    test('a menu item takes the active surface while pressed and the hover surface under the pointer', async ({ page }) => {
      await page.getByTestId('menu').getByRole('button', { name: '정렬' }).click();
      const item = page.getByRole('menuitem', { name: '이름순' });
      await expect(item).toBeVisible();
      expect(await pressFill(page, item)).toBe(true);
    });

    test('a node title keeps the title place and names the move buttons by its text', async ({ page }) => {
      const rows = page.getByTestId('titles');
      const name = rows.getByText('Ethereum', { exact: false }).first(), description = rows.getByText('메인넷').first();
      expect((await name.boundingBox())!.y).toBeLessThan((await description.boundingBox())!.y);
      await expect(rows.getByText('ETH', { exact: true })).toBeVisible();
      const down = rows.getByRole('button', { name: 'Ethereum ETH 아래로 이동', exact: true });
      await expect(down).toBeEnabled();
      await down.click();
      await expect(page.getByTestId('order')).toHaveText('sol,eth');
      await expect(rows.getByRole('button', { name: 'Solana SOL 아래로 이동', exact: true })).toBeEnabled();
    });
  });
}
