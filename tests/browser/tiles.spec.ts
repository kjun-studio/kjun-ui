import { expect, test, type Page } from '@playwright/test';
import { openFixture } from './packed-fixture';
import { tilesColumns } from '../../shared/package-runtime/tiles';

// KjunTiles: columns and gap follow the container's width, cells in a row share one height, the last row keeps
// the cell width, and screen readers hear a list. Expected columns come from the shared runtime, so Web CSS and
// the function Native uses are checked against each other here.
type Box = { x: number; y: number; width: number; height: number; childHeight: number };
const cells = (page: Page, id: string) => page.getByTestId(id).evaluate(root => {
  const origin = root.getBoundingClientRect();
  return [...root.querySelectorAll('[role="listitem"]')].map(cell => {
    const box = cell.getBoundingClientRect(), child = cell.firstElementChild?.getBoundingClientRect();
    return { x: box.left - origin.left, y: box.top - origin.top, width: box.width, height: box.height, childHeight: child?.height ?? 0 };
  });
}) as Promise<Box[]>;
const rows = (list: Box[]) => {
  const map = new Map<number, Box[]>();
  for (const cell of list) {
    const key = [...map.keys()].find(y => Math.abs(y - cell.y) < 1) ?? cell.y;
    map.set(key, [...(map.get(key) ?? []), cell]);
  }
  return [...map.values()];
};
const columns = async (page: Page, id: string) => rows(await cells(page, id))[0]?.length ?? 0;
const gaps = async (page: Page, id: string) => {
  const [first, second] = rows(await cells(page, id));
  return { column: first.length > 1 ? first[1].x - (first[0].x + first[0].width) : undefined,
    row: second ? second[0].y - (first[0].y + Math.max(...first.map(cell => cell.height))) : undefined };
};

for (const platform of ['react', 'vue3', 'native']) {
  test.describe(platform, () => {
    const errors: string[] = [];
    test.beforeEach(async ({ page }) => {
      errors.length = 0;
      page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
      await page.setViewportSize({ width: 1280, height: 1200 });
      await openFixture(page, platform, '', 'tiles');
    });

    test('columns follow the container width, between one and four', async ({ page }) => {
      for (const [id, width] of [['w320', 320], ['w560', 560], ['w800', 800], ['w1100', 1100]] as const) {
        expect(await columns(page, id), id).toBe(tilesColumns(width, 240, width < 768 ? 16 : 24, 4));
      }
      expect(await columns(page, 'sm3')).toBe(3);
    });

    test('the last row keeps the cell width and a lone card is one cell wide', async ({ page }) => {
      for (const id of ['w800', 'w1100', 'sm3']) {
        const list = rows(await cells(page, id));
        expect(list.at(-1)![0].width, id).toBeCloseTo(list[0][0].width, 0);
      }
      const [one] = await cells(page, 'one'), [first] = await cells(page, 'w800');
      expect(one.width).toBeCloseTo(first.width, 0);
    });

    test('cells in a row share the tallest height and a card fills its cell', async ({ page }) => {
      for (const id of ['w800', 'pressable']) {
        const [row] = rows(await cells(page, id));
        const tallest = Math.max(...row.map(cell => cell.height));
        for (const cell of row) {
          expect(cell.height, id).toBeCloseTo(tallest, 0);
          expect(cell.childHeight, id + ' card').toBeCloseTo(tallest, 0);
        }
      }
    });

    test(platform === 'native' ? 'an app element keeps its own height on Native' : 'an app element fills its cell on Web', async ({ page }) => {
      const [row] = rows(await cells(page, 'app-child'));
      expect(row.map(cell => cell.height)).toEqual([120, 120, 120]);
      expect(row.map(cell => cell.childHeight)).toEqual(platform === 'native' ? [40, 120, 40] : [120, 120, 120]);
    });

    test('auto gap is 16 in a narrow container and 24 in a wide one; fixed gaps hold', async ({ page }) => {
      expect((await gaps(page, 'panel')).row).toBeCloseTo(16, 0);
      expect((await gaps(page, 'wide-auto')).column).toBeCloseTo(24, 0);
      expect((await gaps(page, 'fixed-compact')).column).toBeCloseTo(16, 0);
      const w800 = await gaps(page, 'w800');
      expect(w800.column).toBeCloseTo(24, 0);
      expect(w800.row).toBeCloseTo(24, 0);
    });

    test('a narrow container has one column and no sideways overflow', async ({ page }) => {
      const box = page.getByTestId('w320');
      expect(await columns(page, 'w320')).toBe(1);
      const [width, scroll] = await box.evaluate(el => [el.clientWidth, el.scrollWidth]);
      expect(scroll).toBeLessThanOrEqual(width);
    });

    test('a list inside a horizontal flex item keeps its width', async ({ page }) => {
      const width = await page.getByTestId('in-flex').getByRole('list').evaluate(el => el.getBoundingClientRect().width);
      expect(width).toBeGreaterThan(700);
      expect(await columns(page, 'in-flex')).toBe(3);
    });

    test('screen readers hear a list of its items; empty values add no item', async ({ page }) => {
      await expect(page.getByTestId('empty').getByRole('list')).toHaveCount(1);
      await expect(page.getByTestId('empty').getByRole('listitem')).toHaveCount(0);
      await expect(page.getByTestId('conditional').getByRole('listitem')).toHaveCount(4);
      await expect(page.getByTestId('labelled').getByRole('list', { name: '프로젝트' })).toHaveCount(1);
      if (platform !== 'native') {
        const root = page.getByTestId('labelled').getByRole('list');
        await expect(root).toHaveAttribute('id', 'tiles-id');
        await expect(root).toHaveClass('app-tiles');
        expect(await page.getByTestId('labelled').locator('[class*="kjun-"]:not(.kjun-card *):not(.kjun-card)').count()).toBe(0);
      }
    });

    test('columns follow a container that changes width, and the list stays visible', async ({ page }) => {
      expect(await columns(page, 'resize')).toBe(4);
      await page.getByTestId('resize-button').click();
      await expect.poll(() => columns(page, 'resize')).toBe(1);
      const opacity = await page.getByTestId('resize').getByRole('list').evaluate(el => getComputedStyle(el).opacity);
      expect(opacity).toBe('1');
    });

    test('a list fills a centred column and, on Web, the rest of a flex row', async ({ page }) => {
      const width = (id: string) => page.getByTestId(id).getByRole('list').first().evaluate(el => el.getBoundingClientRect().width);
      expect(await width('center-column')).toBeCloseTo(800, 0);
      expect(await columns(page, 'center-column')).toBe(3);
      if (platform !== 'native') {
        expect(await width('flex-row')).toBeCloseTo(680, 0);
        expect(await columns(page, 'flex-row')).toBe(tilesColumns(680, 240, 16, 4));
      }
    });

    test('padding on the list keeps every cell inside it', async ({ page }) => {
      const root = await page.getByTestId('padded').getByRole('list').evaluate(el => el.getBoundingClientRect());
      const list = await cells(page, 'padded'), origin = await page.getByTestId('padded').evaluate(el => el.getBoundingClientRect().left);
      expect(list.length).toBe(3);
      expect(rows(list)[0].length).toBe(3);
      for (const cell of list) expect(origin + cell.x + cell.width).toBeLessThanOrEqual(root.right - 16 + 0.5);
    });

    test('an element and a string after an empty value are two cells without a key clash', async ({ page }) => {
      await expect(page.getByTestId('mixed').getByRole('listitem')).toHaveCount(2);
      expect(errors.filter(text => /same key|duplicate key/i.test(text))).toEqual([]);
    });

    test('cards inside a tile card keep their own widths', async ({ page }) => {
      const widths = await page.getByTestId('nested').evaluate(root => {
        const tile = root.querySelector('[role="listitem"]')!;
        const titles = ['짧음', '조금 더 긴 카드 제목'];
        return titles.map(title => {
          const label = [...tile.querySelectorAll('*')].find(el => el.textContent === title && el.children.length === 0)!;
          let card = label as HTMLElement;
          while (card.parentElement && card.parentElement.children.length === 1) card = card.parentElement;
          return card.getBoundingClientRect().width;
        });
      });
      expect(Math.abs(widths[0] - widths[1])).toBeGreaterThan(20);
    });

    test('maxColumns given as a template string still caps the columns', async ({ page }) => {
      expect(await columns(page, 'string-max')).toBe(3);
    });
  });
}
