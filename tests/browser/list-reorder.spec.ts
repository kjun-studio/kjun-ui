import { expect, test, type Page } from '@playwright/test';
import { openFixture } from './packed-fixture';

// A reorderable KjunListSection: rows the order lists get up and down buttons; the app owns the order.
const titles = (page: Page, id: string) => page.getByTestId(id).getByText(/^(Opus|Sonnet|Haiku|Fable)$/).allTextContents();
const up = (page: Page, id: string, name: string) => page.getByTestId(id).getByRole('button', { name: name + ' 위로 이동', exact: true });
const down = (page: Page, id: string, name: string) => page.getByTestId(id).getByRole('button', { name: name + ' 아래로 이동', exact: true });

for (const platform of ['react', 'vue3', 'native']) {
  test.describe(platform, () => {
    const web = platform !== 'native';
    test.beforeEach(async ({ page }) => {
      await page.setViewportSize({ width: 1280, height: 1600 });
      await openFixture(page, platform, '', 'list-reorder');
    });

    test('a move button reports the new order, announces it and keeps focus on the moved row', async ({ page }) => {
      await expect(up(page, 'basic', 'Opus')).toBeDisabled();
      await expect(down(page, 'basic', 'Opus')).toBeEnabled();
      await expect(down(page, 'basic', 'Fable')).toBeDisabled();
      await down(page, 'basic', 'Sonnet').click();
      await expect(page.getByTestId('order')).toHaveText('opus,haiku,sonnet,fable');
      await expect(page.getByTestId('moves')).toHaveText('sonnet:1>2');
      expect(await titles(page, 'basic')).toEqual(['Opus', 'Haiku', 'Sonnet', 'Fable']);
      await expect(page.getByTestId('basic').getByRole('status')).toHaveText('Sonnet, 4개 중 3번째로 이동');
      if (web) await expect(down(page, 'basic', 'Sonnet')).toBeFocused();
      // At the end the pressed button turns off, so focus moves to the other one.
      await down(page, 'basic', 'Sonnet').click();
      await expect(page.getByTestId('order')).toHaveText('opus,haiku,fable,sonnet');
      await expect(down(page, 'basic', 'Sonnet')).toBeDisabled();
      if (web) await expect(up(page, 'basic', 'Sonnet')).toBeFocused();
      await expect(page.getByTestId('basic').getByRole('status')).toHaveText('Sonnet, 4개 중 4번째로 이동');
    });

    test('the buttons work from the keyboard and follow an order the app changes itself', async ({ page }) => {
      await up(page, 'basic', 'Fable').focus();
      await page.keyboard.press('Enter');
      await page.keyboard.press('Enter');
      await expect(page.getByTestId('order')).toHaveText('opus,fable,sonnet,haiku');
      await expect(page.getByTestId('moves')).toHaveText('fable:3>2 fable:2>1');
      await page.getByRole('button', { name: 'Reverse' }).click();
      expect(await titles(page, 'basic')).toEqual(['Fable', 'Haiku', 'Sonnet', 'Opus']);
      await expect(up(page, 'basic', 'Fable')).toBeDisabled();
      await expect(down(page, 'basic', 'Opus')).toBeDisabled();
      await expect(up(page, 'basic', 'Opus')).toBeEnabled();
    });

    test('order and the chosen row are separate: moving keeps the choice, choosing keeps the order', async ({ page }) => {
      await up(page, 'choice', 'Haiku').click();
      await expect(page.getByTestId('picked')).toHaveText('opus,haiku,sonnet,fable');
      await expect(page.getByTestId('chosen')).toHaveText('sonnet');
      await page.getByTestId('choice').getByRole('radio', { name: 'Fable' }).click();
      await expect(page.getByTestId('chosen')).toHaveText('fable');
      await expect(page.getByTestId('picked')).toHaveText('opus,haiku,sonnet,fable');
      if (web) {
        // Arrow keys on a radio still move the choice, not the row.
        await page.keyboard.press('ArrowUp');
        await expect(page.getByTestId('chosen')).toHaveText('sonnet');
        await expect(page.getByTestId('picked')).toHaveText('opus,haiku,sonnet,fable');
      }
    });

    test('a section sorted by a rule turns every move button off and says why', async ({ page }) => {
      for (const name of ['Opus', 'Sonnet', 'Haiku', 'Fable']) {
        await expect(up(page, 'sorted', name)).toBeDisabled();
        await expect(down(page, 'sorted', name)).toBeDisabled();
      }
      await expect(page.getByTestId('sorted').getByText('가격순으로 정렬 중이라 순서를 바꿀 수 없습니다.', { exact: true })).toBeVisible();
      if (web) await expect(down(page, 'sorted', 'Opus')).toHaveAccessibleDescription('가격순으로 정렬 중이라 순서를 바꿀 수 없습니다.');
    });

    test('an order the app does not apply leaves the rows where they are', async ({ page }) => {
      await down(page, 'rejected', 'Opus').click();
      expect(await titles(page, 'rejected')).toEqual(['Opus', 'Sonnet', 'Haiku', 'Fable']);
      await expect(down(page, 'rejected', 'Opus')).toBeEnabled();
      await expect(up(page, 'rejected', 'Opus')).toBeDisabled();
      // A move that did not happen is not announced.
      await expect(page.getByTestId('rejected').getByRole('status')).toHaveText('');
    });

    const grip = (page: Page, id: string, name: string) => page.getByTestId(id).getByRole('button', { name: name + ' 순서 바꾸기', exact: true });

    test('the handle is grabbed with the keyboard, moved with the arrows and dropped or cancelled', async ({ page }) => {
      test.skip(!web, 'Native keeps the up and down buttons; it draws no handle.');
      await expect(page.getByTestId('handle').getByRole('button', { name: /위로 이동|아래로 이동/ })).toHaveCount(0);
      const handle = grip(page, 'handle', 'Sonnet');
      await handle.focus();
      // Arrows do nothing until the row is grabbed.
      await page.keyboard.press('ArrowDown');
      await expect(page.getByTestId('held')).toHaveText('opus,sonnet,haiku,fable');
      await page.keyboard.press('Enter');
      await expect(handle).toHaveAttribute('aria-pressed', 'true');
      await expect(page.getByTestId('handle').getByRole('status')).toContainText('Sonnet 잡음');
      await page.keyboard.press('ArrowDown');
      await expect(page.getByTestId('held')).toHaveText('opus,haiku,sonnet,fable');
      await expect(handle).toBeFocused();
      await page.keyboard.press('ArrowDown');
      await expect(page.getByTestId('held')).toHaveText('opus,haiku,fable,sonnet');
      await expect(handle).toBeFocused();
      // Steps report the order; the finished move is reported once, at the drop.
      await expect(page.getByTestId('drops')).toHaveText('');
      await page.keyboard.press('Enter');
      await expect(handle).toHaveAttribute('aria-pressed', 'false');
      await expect(page.getByTestId('drops')).toHaveText('sonnet:1>3');
      await expect(page.getByTestId('handle').getByRole('status')).toHaveText('Sonnet, 4개 중 4번째에 놓음');
      // Escape puts the row back where the grab started and reports no move.
      await page.keyboard.press(' ');
      await page.keyboard.press('ArrowUp');
      await page.keyboard.press('ArrowUp');
      await expect(page.getByTestId('held')).toHaveText('opus,sonnet,haiku,fable');
      await page.keyboard.press('Escape');
      await expect(page.getByTestId('held')).toHaveText('opus,haiku,fable,sonnet');
      await expect(page.getByTestId('drops')).toHaveText('sonnet:1>3');
      await expect(handle).toBeFocused();
      await expect(page.getByTestId('handle').getByRole('status')).toHaveText('Sonnet 이동 취소');
    });

    test('dragging the handle steps the row past its neighbours and reports one move at the drop', async ({ page }) => {
      test.skip(!web, 'Native keeps the up and down buttons; it draws no handle.');
      // The section is below the fold; mouse positions are viewport positions.
      await page.getByTestId('both').scrollIntoViewIfNeeded();
      const box = async (name: string) => (await grip(page, 'handle', name).boundingBox())!;
      const start = await box('Opus'), target = await box('Haiku');
      await page.mouse.move(start.x + start.width / 2, start.y + start.height / 2);
      await page.mouse.down();
      await expect(page.getByTestId('handle').locator('[data-reordering]')).toHaveCount(1);
      // Down to just past the middle of the third row: Opus steps below Sonnet and Haiku.
      await page.mouse.move(start.x + start.width / 2, target.y + target.height / 2 + 4, { steps: 12 });
      await expect(page.getByTestId('held')).toHaveText('sonnet,haiku,opus,fable');
      await expect(page.getByTestId('drops')).toHaveText('');
      await page.mouse.up();
      await expect(page.getByTestId('drops')).toHaveText('opus:0>2');
      await expect(page.getByTestId('handle').locator('[data-reordering]')).toHaveCount(0);
      await expect(page.getByTestId('handle').getByRole('status')).toHaveText('Opus, 4개 중 3번째에 놓음');
      // Escape during a drag puts the row back and reports nothing more.
      const again = await box('Fable'), top = await box('Sonnet');
      await page.mouse.move(again.x + again.width / 2, again.y + again.height / 2);
      await page.mouse.down();
      await page.mouse.move(again.x + again.width / 2, top.y - 20, { steps: 12 });
      await expect(page.getByTestId('held')).toHaveText('fable,sonnet,haiku,opus');
      await page.keyboard.press('Escape');
      await expect(page.getByTestId('held')).toHaveText('sonnet,haiku,opus,fable');
      await page.mouse.up();
      await expect(page.getByTestId('drops')).toHaveText('opus:0>2');
      // A press without a pointer or key (a screen reader's) grabs and drops too.
      const pressed = grip(page, 'handle', 'Haiku');
      await pressed.evaluate(node => (node as HTMLElement).click());
      await expect(pressed).toHaveAttribute('aria-pressed', 'true');
      await pressed.evaluate(node => (node as HTMLElement).click());
      await expect(pressed).toHaveAttribute('aria-pressed', 'false');
      // "both" draws the handle beside the buttons.
      await expect(grip(page, 'both', 'Opus')).toBeVisible();
      await expect(up(page, 'both', 'Opus')).toBeVisible();
    });

    test('only rows the order lists can move, and a plain section draws no move buttons', async ({ page }) => {
      await expect(down(page, 'partial', 'Opus')).toBeEnabled();
      await expect(up(page, 'partial', 'Sonnet')).toBeEnabled();
      await expect(down(page, 'partial', 'Sonnet')).toBeDisabled();
      await expect(page.getByTestId('partial').getByRole('button', { name: /Pinned|Unlisted/ })).toHaveCount(0);
      await expect(page.getByTestId('plain').getByRole('button')).toHaveCount(0);
    });

    test('a row without a title names its move buttons after its ariaLabel', async ({ page }) => {
      await expect(down(page, 'untitled', 'Ethereum')).toBeEnabled();
      await expect(up(page, 'untitled', 'Solana')).toBeEnabled();
      await expect(page.getByTestId('untitled').getByRole('button', { name: /^(위로|아래로) 이동$|^ 위로/ })).toHaveCount(0);
    });
  });
}
