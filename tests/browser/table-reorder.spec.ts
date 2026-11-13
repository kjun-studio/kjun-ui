import { expect, test, type Page } from '@playwright/test';
import { openFixture } from './packed-fixture';

// A reorderable KjunTable: rows the order lists get up and down buttons; the app owns the order and the data order.
const up = (page: Page, id: string, name: string) => page.getByTestId(id).getByRole('button', { name: name + ' 위로 이동', exact: true });
const down = (page: Page, id: string, name: string) => page.getByTestId(id).getByRole('button', { name: name + ' 아래로 이동', exact: true });
const names = (page: Page, id: string) => page.getByTestId(id).getByText(/^(알파|브라보|찰리)$/).allTextContents();

for (const platform of ['react', 'vue3', 'native']) {
  test.describe(platform, () => {
    const web = platform !== 'native';

    test('a move button reports the next order, the rows follow it and focus stays on the moved row', async ({ page }) => {
      await page.setViewportSize({ width: 1280, height: 1200 });
      await openFixture(page, platform, '', 'table-reorder');
      await expect(up(page, 'grid', '알파')).toBeDisabled();
      await expect(down(page, 'grid', '찰리')).toBeDisabled();
      await down(page, 'grid', '알파').click();
      await expect(page.getByTestId('order')).toHaveText('r2,r1,r3');
      await expect(page.getByTestId('moves')).toHaveText('r1:0>1');
      expect(await names(page, 'grid')).toEqual(['브라보', '알파', '찰리']);
      if (web) {
        await expect(down(page, 'grid', '알파')).toBeFocused();
        await expect(page.getByTestId('grid').getByRole('status')).toHaveText('알파, 3개 중 2번째로 이동');
        // The move buttons do not open or select the row.
        await expect(page.getByTestId('grid').locator('thead th')).toHaveCount(3);
      }
    });

    test('a table sorted by a column turns the move buttons off and says why', async ({ page }) => {
      await page.setViewportSize({ width: 1280, height: 1200 });
      await openFixture(page, platform, '', 'table-reorder');
      for (const name of ['알파', '브라보', '찰리']) {
        await expect(up(page, 'sorted', name)).toBeDisabled();
        await expect(down(page, 'sorted', name)).toBeDisabled();
      }
      await expect(page.getByTestId('sorted').getByText('정렬하거나 묶은 동안에는 순서를 바꿀 수 없습니다.', { exact: true })).toBeVisible();
      if (web) await expect(down(page, 'sorted', '알파')).toHaveAccessibleDescription('정렬하거나 묶은 동안에는 순서를 바꿀 수 없습니다.');
    });

    test('narrow cards carry the move buttons at the end of the title line', async ({ page }) => {
      await page.setViewportSize({ width: 390, height: 1400 });
      await openFixture(page, platform, '', 'table-reorder');
      await up(page, 'cards', '찰리').click();
      await expect(page.getByTestId('card-order')).toHaveText('r1,r3,r2');
      expect(await names(page, 'cards')).toEqual(['알파', '찰리', '브라보']);
    });
  });
}
