import { expect, test, type Locator } from '@playwright/test';
import { openFixture } from './packed-fixture';
import { tokens } from '../../packages/tokens/dist/index.js';
// KPI behavior on every platform: provider locale digits, deltas that round to zero stay neutral, missing values,
// app description colours, masking, percent precision, the app's own delta and secondary text, value segments,
// link and button cells, keyboard activation without auto-repeat, and what Native screen readers hear for a cell.
const color = (node: Locator) => node.evaluate(el => getComputedStyle(el).color);
const box = async (node: Locator) => (await node.boundingBox())!;
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
    // A text value stands on the number line's baseline, so it reads level with the masked number beside it.
    const baseline = (node: Locator) => node.evaluate(el => {
      const probe = document.createElement('span'); probe.style.cssText = 'display:inline-block;width:0;height:0';
      el.appendChild(probe); const y = probe.getBoundingClientRect().top; probe.remove(); return y;
    });
    const rowMasked = page.getByTestId('row-masked');
    expect(Math.abs(await baseline(rowMasked.getByText('정상', { exact: true })) - await baseline(rowMasked.getByText('••••', { exact: true }).first()))).toBeLessThanOrEqual(0.5);
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

  test(`${platform}: narrow cells keep numbers whole, label asides keep their own clicks, and the phone grid closes lone cells`, async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 1600 });
    await openFixture(page, platform, '', 'kpi-behavior');
    // Three cells in a 480px column step their numbers down by their own width, so each number stays on one line.
    const narrow = page.getByTestId('narrow');
    for (const text of [/^12\.480/, /^4\.820\.000/]) {
      const number = narrow.getByText(text).first();
      const { height, size } = await number.evaluate(el => ({ height: el.getBoundingClientRect().height, size: parseFloat(getComputedStyle(el).fontSize) }));
      expect(size).toBe(tokens.typography.numberLg.fontSizePx);
      expect(height).toBeLessThanOrEqual(tokens.typography.numberLg.lineHeightPx + 1);
    }
    // A label aside sits on the label line and keeps its clicks: the hero button and the cell button report themselves only.
    const heroLabel = await box(page.getByTestId('aside-hero').getByText('총 평가 금액', { exact: true }));
    const heroAside = await box(page.getByTestId('aside-hero').getByText('가리기', { exact: true }));
    expect(Math.abs((heroAside.y + heroAside.height / 2) - (heroLabel.y + heroLabel.height / 2))).toBeLessThanOrEqual(2);
    expect(heroAside.x).toBeGreaterThan(heroLabel.x + heroLabel.width);
    await page.getByTestId('aside-hero').getByText('가리기', { exact: true }).click();
    await page.getByTestId('aside-row').getByText('설명', { exact: true }).click();
    expect(await clicks(page)).toEqual(['가리기', '설명']);
    await page.getByTestId('aside-row').getByText('방문', { exact: true }).click();
    expect(await clicks(page)).toEqual(['가리기', '설명', '방문']);
    // Phone grid outside the summary: a full first cell, two side by side, and the last cell alone takes the whole line.
    await page.setViewportSize({ width: 375, height: 1600 });
    const grid = page.getByTestId('grid');
    const [head, left, right, alone] = await Promise.all(['헤드', '왼쪽', '오른쪽', '혼자'].map(text => box(grid.getByText(text, { exact: true }))));
    expect(Math.abs(left.y - right.y)).toBeLessThanOrEqual(1);
    expect(right.x).toBeGreaterThan(left.x + left.width);
    expect(alone.y).toBeGreaterThan(left.y + left.height);
    expect(Math.abs(alone.x - left.x)).toBeLessThanOrEqual(1);
    expect(head.y).toBeLessThan(left.y);
  });
}
