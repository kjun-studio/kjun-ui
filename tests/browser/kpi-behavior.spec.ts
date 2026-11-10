import { expect, test, type Locator } from '@playwright/test';
import { openFixture } from './packed-fixture';
// KPI behavior on every platform: provider locale digits, deltas that round to zero stay neutral, missing values,
// app description colours, masking, percent precision, the app's own delta and secondary text, value segments,
// link and button cells, keyboard activation without auto-repeat, and what Native screen readers hear for a cell.
const color = (node: Locator) => node.evaluate(el => getComputedStyle(el).color);
const clicks = (page: import('@playwright/test').Page) => page.evaluate(() => window.kpiClicks);

for (const platform of ['react', 'vue3', 'native']) {
  test(`${platform}: KPI numbers follow the provider locale, round before choosing a direction and show missing values`, async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 1200 });
    await openFixture(page, platform, '', 'kpi-behavior');
    const hero = page.getByTestId('hero');
    await expect(hero.getByText(/^1\.234\.567,5/)).toBeVisible();
    // 0.04 at one decimal draws zero for the amount and the rate, so both take the neutral colour with no sign or caret.
    const neutral = await color(hero.getByText('전일 대비', { exact: true })), zeros = hero.getByText(/^0,0(원|%)?$/);
    await expect(zeros).toHaveCount(2);
    for (const zero of await zeros.all()) expect(await color(zero)).toBe(neutral);
    await expect(hero.locator('svg')).toHaveCount(0);
    // NaN is missing, and the app's description colour wins.
    await expect(hero.getByText('—', { exact: true })).toBeVisible();
    expect(await color(hero.getByText('앱 색', { exact: true }))).toBe('rgb(1, 2, 3)');
    await expect(page.getByTestId('missing').getByText('집계 중', { exact: true })).toBeVisible();
    // Two percent decimals show the small move, and it now has a direction.
    await expect(page.getByTestId('precise').getByText(/^\+0,04%?$/)).toBeVisible();
    // The app's own delta text and secondary render replace the built-in ones.
    const formatted = page.getByTestId('formatted');
    await expect(formatted.getByText('2pt', { exact: true })).toBeVisible();
    await expect(formatted.getByText('보조 맞춤', { exact: true })).toBeVisible();
    // Value segments draw their texts in order.
    const row = page.getByTestId('row');
    await expect(row.getByText('/', { exact: true })).toBeVisible();
    await expect(row.getByText('5', { exact: true })).toBeVisible();
  });

  test(`${platform}: masked KPIs hide every amount and name it for screen readers`, async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 1200 });
    await openFixture(page, platform, '', 'kpi-behavior');
    for (const id of ['masked', 'row-masked']) {
      const root = page.getByTestId(id);
      await expect(root.getByText('••••', { exact: true }).first()).toBeVisible();
      await expect(root.getByText(/1\.000|77|50|2,0/)).toHaveCount(0);
      // The de-DE provider takes the English pack, so the hidden word is "Hidden".
      if (platform === 'native') await expect(root.getByLabel('Hidden', { exact: true }).first()).toBeAttached();
      else await expect(root.locator('.kjun-sr-only', { hasText: 'Hidden' }).first()).toBeAttached();
    }
    // A masked hero paints no direction: both delta masks keep the description's neutral colour.
    const masked = page.getByTestId('masked'), masks = masked.getByText('••••', { exact: true });
    const neutral = await color(masked.getByText('기준', { exact: true }));
    expect(await masks.count()).toBe(4);
    for (const index of [1, 2]) expect(await color(masks.nth(index))).toBe(neutral);
    // Text values stay readable.
    await expect(page.getByTestId('row-masked').getByText('정상', { exact: true })).toBeVisible();
  });

  test(`${platform}: link and button cells report clicks once, and Native cells speak their value`, async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 1200 });
    await openFixture(page, platform, '', 'kpi-behavior');
    const row = page.getByTestId('row');
    const link = row.getByRole('link');
    await expect(link).toHaveAttribute('href', '#kpi-link');
    await link.click();
    expect(await clicks(page)).toEqual(['링크']);
    if (platform === 'native') {
      // A clickable cell is one control, so its name carries the value, not just the label.
      await expect(row.getByRole('button', { name: '버튼, 3', exact: true })).toBeVisible();
      return;
    }
    const button = row.getByRole('button');
    await button.focus();
    // Holding Enter fires once; auto-repeat key downs are ignored.
    await page.keyboard.down('Enter');
    await page.keyboard.down('Enter');
    await page.keyboard.up('Enter');
    expect(await clicks(page)).toEqual(['링크', '버튼']);
    // Space acts on key up, like a native button.
    await page.keyboard.down(' ');
    expect(await clicks(page)).toEqual(['링크', '버튼']);
    await page.keyboard.up(' ');
    expect(await clicks(page)).toEqual(['링크', '버튼', '버튼']);
  });
}
