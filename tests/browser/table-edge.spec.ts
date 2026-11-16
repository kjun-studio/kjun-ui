import { expect, test, type Page } from '@playwright/test';
import { openFixture } from './packed-fixture';

// edgeInset="none" lines the table's outer text up with the text around it (a sheet's title), without negative margins.
const edges = (page: Page, texts: string[]) => page.evaluate(names => {
  const box = (text: string) => {
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    for (let node = walker.nextNode(); node; node = walker.nextNode()) if (node.textContent!.trim() === text) {
      const range = document.createRange(); range.selectNodeContents(node);
      const r = range.getBoundingClientRect();
      if (r.width) return { left: r.left, right: r.right };
    }
    return null;
  };
  const title = document.querySelector('[data-testid="title"]')!.getBoundingClientRect();
  return { left: title.left, right: title.right, cells: Object.fromEntries(names.map(name => [name, box(name)])) };
}, texts);
for (const platform of ['react', 'vue3', 'native']) {
  test(`${platform}: edgeInset="none" starts the first column and ends the last one at the container's edges`, async ({ page }) => {
    await openFixture(page, platform, '?mode=none', 'table-edge');
    const flush = await edges(page, ['월', '9월', '지출', '2,140,000', '수입']);
    for (const name of ['월', '9월']) expect(Math.abs(flush.cells[name]!.left - flush.left), name).toBeLessThan(1);
    for (const name of ['지출', '2,140,000']) expect(Math.abs(flush.cells[name]!.right - flush.right), name).toBeLessThan(1);
    // Columns in between keep their padding: the middle header does not reach the last column's text.
    expect(flush.cells['지출']!.left - flush.cells['수입']!.right).toBeGreaterThan(8);
    await openFixture(page, platform, '?mode=default', 'table-edge');
    const inset = await edges(page, ['9월', '2,140,000']);
    expect(inset.cells['9월']!.left - inset.left).toBeGreaterThan(4);
    expect(inset.right - inset.cells['2,140,000']!.right).toBeGreaterThan(4);
  });

  test(`${platform}: edgeInset="none" reaches the expanded row and leaves a column beside a utility column inset`, async ({ page }) => {
    await openFixture(page, platform, '?mode=expand', 'table-edge');
    await page.getByRole('button').first().click();
    const open = await edges(page, ['9월', '상세 9월', '2,140,000']);
    expect(Math.abs(open.cells['9월']!.left - open.left)).toBeLessThan(1);
    expect(Math.abs(open.cells['상세 9월']!.left - open.left)).toBeLessThan(1);
    // The expand column is the trailing edge, so the last data column keeps its end padding.
    expect(open.right - open.cells['2,140,000']!.right).toBeGreaterThan(4);
    await openFixture(page, platform, '?mode=select', 'table-edge');
    const select = await edges(page, ['9월', '2,140,000']);
    expect(select.cells['9월']!.left - select.left).toBeGreaterThan(4);
    expect(Math.abs(select.cells['2,140,000']!.right - select.right)).toBeLessThan(1);
  });
}
