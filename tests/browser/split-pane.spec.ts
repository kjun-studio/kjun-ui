import { expect, test, type Page } from '@playwright/test';
import { openFixture } from './packed-fixture';

// KjunSplitPane: the handle between two panes resizes the first pane by drag and keys, inside both panes' limits.
for (const platform of ['react', 'vue3', 'native']) {
  test.describe(platform, () => {
    const web = platform !== 'native';
    const handle = (page: Page, id: string, name: string) => page.getByTestId(id).getByRole(web ? 'separator' : 'slider', { name, exact: true });
    // The first pane's length: from the container's start edge to the handle's.
    const firstSize = async (page: Page, id: string, name: string, vertical = false) => {
      const root = (await page.getByTestId(id).boundingBox())!, bar = (await handle(page, id, name).boundingBox())!;
      return Math.round(vertical ? bar.y - root.y : bar.x - root.x);
    };
    const drag = async (page: Page, id: string, name: string, dx: number, dy = 0, release = true) => {
      const bar = (await handle(page, id, name).boundingBox())!;
      const x = bar.x + bar.width / 2, y = bar.y + bar.height / 2;
      await page.mouse.move(x, y);
      await page.mouse.down();
      await page.mouse.move(x + dx / 2, y + dy / 2, { steps: 4 });
      await page.mouse.move(x + dx, y + dy, { steps: 4 });
      if (release) await page.mouse.up();
    };
    const numbers = async (page: Page, id: string) => JSON.parse((await page.getByTestId(id).textContent())!) as number[];
    test.beforeEach(async ({ page }) => {
      await page.setViewportSize({ width: 1280, height: 1400 });
      await openFixture(page, platform, '', 'split-pane');
    });

    test('the first pane takes its share of the room beside the handle and reports it as a percentage', async ({ page }) => {
      // 700 wide with a 20 handle leaves 680: 60% is 408, and the limits are 200 and 440.
      await expect.poll(() => firstSize(page, 'basic', 'Basic')).toBe(408);
      const bar = handle(page, 'basic', 'Basic');
      expect((await bar.boundingBox())!.width).toBe(20);
      await expect(bar).toHaveAttribute('aria-valuenow', '60');
      await expect(bar).toHaveAttribute('aria-valuemin', '29');
      await expect(bar).toHaveAttribute('aria-valuemax', '65');
      await expect(bar).toHaveAttribute('aria-orientation', 'vertical');
      await expect.poll(() => firstSize(page, 'capped', 'Capped')).toBe(300);
    });

    test('dragging the handle resizes the first pane, stops at each minimum and commits once per drag', async ({ page }) => {
      await drag(page, 'basic', 'Basic', -100);
      await expect.poll(() => firstSize(page, 'basic', 'Basic')).toBe(308);
      expect((await numbers(page, 'sizes')).at(-1)).toBeCloseTo(308 / 680, 3);
      expect(await numbers(page, 'commits')).toHaveLength(1);
      expect((await numbers(page, 'commits'))[0]).toBeCloseTo(308 / 680, 3);
      await drag(page, 'basic', 'Basic', -400);
      await expect.poll(() => firstSize(page, 'basic', 'Basic')).toBe(200);
      await drag(page, 'basic', 'Basic', 600);
      await expect.poll(() => firstSize(page, 'basic', 'Basic')).toBe(440);
      expect(await numbers(page, 'commits')).toHaveLength(3);
      // A press and release without a move changes nothing and commits nothing.
      await drag(page, 'basic', 'Basic', 0);
      expect(await numbers(page, 'commits')).toHaveLength(3);
    });

    test('arrow keys step the handle, Home and End reach the limits and Enter restores the default', async ({ page }) => {
      const bar = handle(page, 'basic', 'Basic');
      await bar.focus();
      await page.keyboard.press('ArrowRight');
      await expect.poll(() => firstSize(page, 'basic', 'Basic')).toBe(424);
      await page.keyboard.press('ArrowLeft');
      await page.keyboard.press('ArrowLeft');
      await expect.poll(() => firstSize(page, 'basic', 'Basic')).toBe(392);
      await page.keyboard.press('ArrowUp');
      await expect.poll(() => firstSize(page, 'basic', 'Basic')).toBe(392);
      await page.keyboard.press('Home');
      await expect.poll(() => firstSize(page, 'basic', 'Basic')).toBe(200);
      await expect(bar).toHaveAttribute('aria-valuenow', '29');
      await page.keyboard.press('End');
      await expect.poll(() => firstSize(page, 'basic', 'Basic')).toBe(440);
      await page.keyboard.press('Enter');
      await expect.poll(() => firstSize(page, 'basic', 'Basic')).toBe(408);
      // Each key that moved the handle committed: right, left, left, Home, End, Enter.
      expect(await numbers(page, 'commits')).toHaveLength(6);
    });

    test('keys held with a modifier are left to the browser, and a press on the handle edge does not jump', async ({ page }) => {
      const bar = handle(page, 'basic', 'Basic');
      await bar.focus();
      await page.keyboard.press('Alt+ArrowRight');
      // Ctrl+Home keeps its browser meaning; the page is already at the top, so nothing scrolls under the next press.
      await page.keyboard.press('Control+Home');
      expect(await firstSize(page, 'basic', 'Basic')).toBe(408);
      expect(await numbers(page, 'commits')).toHaveLength(0);
      // Pressing 2px inside the handle's end edge and moving back 50 moves the pane exactly 50.
      const box = (await bar.boundingBox())!, edge = box.x + box.width - 2;
      await page.mouse.move(edge, box.y + box.height / 2);
      await page.mouse.down();
      expect(await firstSize(page, 'basic', 'Basic')).toBe(408);
      await page.mouse.move(edge - 25, box.y + box.height / 2, { steps: 3 });
      await page.mouse.move(edge - 50, box.y + box.height / 2, { steps: 3 });
      await page.mouse.up();
      await expect.poll(() => firstSize(page, 'basic', 'Basic')).toBe(358);
      expect(await numbers(page, 'commits')).toHaveLength(1);
      if (web) {
        // The separator points at the pane it resizes.
        const controls = await bar.getAttribute('aria-controls');
        await expect(page.locator('[id="' + controls + '"]')).toHaveText('First');
      }
    });

    test('a vertical split stacks the panes and follows the up and down keys', async ({ page }) => {
      // 300 tall with a 20 handle leaves 280: half is 140.
      await expect.poll(() => firstSize(page, 'vertical', 'Vertical', true)).toBe(140);
      const bar = handle(page, 'vertical', 'Vertical');
      await expect(bar).toHaveAttribute('aria-orientation', 'horizontal');
      expect((await bar.boundingBox())!.height).toBe(20);
      await bar.focus();
      await page.keyboard.press('ArrowDown');
      await expect.poll(() => firstSize(page, 'vertical', 'Vertical', true)).toBe(156);
      await page.keyboard.press('ArrowRight');
      await expect.poll(() => firstSize(page, 'vertical', 'Vertical', true)).toBe(156);
      await drag(page, 'vertical', 'Vertical', 0, -200);
      await expect.poll(() => firstSize(page, 'vertical', 'Vertical', true)).toBe(80);
    });

    test('a controlled size follows its value and reports drags', async ({ page }) => {
      await expect.poll(() => firstSize(page, 'controlled', 'Controlled')).toBe(340);
      await page.getByRole('button', { name: 'Set 30' }).click();
      await expect.poll(() => firstSize(page, 'controlled', 'Controlled')).toBe(204);
      await drag(page, 'controlled', 'Controlled', 68);
      await expect.poll(() => firstSize(page, 'controlled', 'Controlled')).toBe(272);
      await expect(page.getByTestId('controlled-size')).toHaveText('0.4');
    });

    test('a disabled handle takes no focus, key or drag', async ({ page }) => {
      const bar = handle(page, 'disabled', 'Disabled');
      await expect(bar).toHaveAttribute('aria-disabled', 'true');
      await drag(page, 'disabled', 'Disabled', -100);
      expect(await firstSize(page, 'disabled', 'Disabled')).toBe(340);
      if (web) await expect(bar).not.toHaveAttribute('tabindex', /.*/);
    });

    test('a container narrower than both minimums keeps the first minimum without overlap', async ({ page }) => {
      await expect.poll(() => firstSize(page, 'narrow', 'Narrow')).toBe(200);
      const root = (await page.getByTestId('narrow').boundingBox())!, bar = (await handle(page, 'narrow', 'Narrow').boundingBox())!;
      expect(bar.x + bar.width).toBeLessThanOrEqual(root.x + root.width);
      await drag(page, 'narrow', 'Narrow', 100);
      expect(await firstSize(page, 'narrow', 'Narrow')).toBe(200);
    });

    test('resizing the container re-applies the limits and keeps the asked share', async ({ page }) => {
      await expect.poll(() => firstSize(page, 'resizable', 'Resizable')).toBe(408);
      await page.getByRole('button', { name: 'Shrink' }).click();
      // 420 leaves 400: 60% is 240, but the second pane's 240 minimum leaves 160, so the first minimum wins.
      await expect.poll(() => firstSize(page, 'resizable', 'Resizable')).toBe(200);
      await page.getByRole('button', { name: 'Grow' }).click();
      await expect.poll(() => firstSize(page, 'resizable', 'Resizable')).toBe(408);
    });

    if (web) test('a cancelled pointer ends the drag where it is and commits once', async ({ page }) => {
      await drag(page, 'basic', 'Basic', -100, 0, false);
      await expect.poll(() => firstSize(page, 'basic', 'Basic')).toBe(308);
      await expect(handle(page, 'basic', 'Basic')).toHaveAttribute('data-dragging', 'true');
      await handle(page, 'basic', 'Basic').dispatchEvent('pointercancel', { pointerId: 1, bubbles: true });
      await expect(handle(page, 'basic', 'Basic')).not.toHaveAttribute('data-dragging', /.*/);
      expect(await numbers(page, 'commits')).toHaveLength(1);
      // Later moves of the still-pressed mouse do not resize.
      await page.mouse.move(100, 100);
      expect(await firstSize(page, 'basic', 'Basic')).toBe(308);
      await page.mouse.up();
      expect(await numbers(page, 'commits')).toHaveLength(1);
    });
  });
}
