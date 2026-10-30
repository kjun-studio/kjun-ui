import { captureReview } from './review-captures';
import { test, expect } from '@playwright/test';
import { openFixture } from './packed-fixture';
import { output, configure, visit, state, option } from './visual-contract-helpers';

for (const platform of ['react', 'vue3', 'native']) {
  test(`${platform}: a Table column with a non-function format renders the raw value and warns once`,async({page})=>{
    const warnings:string[]=[];
    page.on('console',message=>{ if(message.type()==='warning') warnings.push(message.text()); });
    await openFixture(page,platform,'','visual-contract');
    await expect(page.getByTestId('table-format').getByText('0.25',{exact:true}).first()).toBeVisible();
    expect(warnings.filter(text=>text.includes('KJUN Table: rate'))).toHaveLength(1);
  });

  test(`${platform}: the table selection bar is a labelled group, not a toolbar`,async({page})=>{
    await openFixture(page,platform,'','visual-contract');
    await page.getByTestId('table-select').getByRole('checkbox',{name:'행 선택'}).first().click();
    await expect(page.getByRole('group',{name:'선택 작업'})).toBeVisible();
    await expect(page.getByRole('toolbar')).toHaveCount(0);
  });

  test(`${platform}: pagination size selector resets the page and compact controls fit`, async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 650 });
    await visit(page, platform, 'KjunPagination');
    await configure(page, 'KjunPagination', {}, { page: 4, pageSize: 20 });
    const size = page.getByRole('button', { name: '페이지당 항목 수', exact: true });
    await size.click();
    await option(page, platform, '50개씩').click();
    await expect.poll(async () => (await state(page)).pageSize).toBe(50);
    await expect.poll(async () => (await state(page)).page).toBe(1);
    const previous = page.getByRole('button', { name: '이전 페이지', exact: true }).filter({ visible: true });
    const next = page.getByRole('button', { name: '다음 페이지', exact: true }).filter({ visible: true });
    await expect(previous).toBeDisabled();
    await next.click();
    await expect.poll(async () => (await state(page)).page).toBe(2);
    for (const width of [320, 390, 1280]) {
      await page.setViewportSize({ width, height: 650 });
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
      // Native Web updates its responsive controls after the viewport resize event.
      // Wait for that layout explicitly; review screenshot timing must not synchronize it.
      await expect.poll(async () => {
        const [prevBox, nextBox] = await Promise.all([previous.boundingBox(), next.boundingBox()]);
        return prevBox && nextBox ? Math.abs(prevBox.y - nextBox.y) : Infinity;
      }, { message: `pagination controls align at ${width}px` }).toBeLessThan(1);
      await captureReview(page, { path: `${output}/${platform}-pagination-${width}.png` });
    }
  });
}
