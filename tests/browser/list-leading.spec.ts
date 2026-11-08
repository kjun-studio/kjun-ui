import { expect, test, type Locator, type Page } from '@playwright/test';
import { openFixture } from './packed-fixture';

const sizes = { xs: [24, 16], sm: [32, 20], md: [40, 24], lg: [56, 28] } as const;
const row = (page: Page, title: string) => page.getByRole('listitem').filter({ has: page.getByText(title, { exact: true }) });
const box = async (locator: Locator) => (await locator.boundingBox())!;
const main = (row: Locator, native: boolean) => native ? row.locator(':scope > div').first() : row.locator('.kjun-list-main');
const leading = (row: Locator, native: boolean) => native ? main(row, native).locator(':scope > div').first() : row.locator('.kjun-list-leading');
const stroke = (icon: Locator) => icon.evaluate(el => getComputedStyle(el).stroke);

async function checkGeometry(page: Page, title: string, native: boolean, width: number, iconSize: number, background = true) {
  const target = row(page, title), front = leading(target, native), svg = target.locator('svg').first();
  const [rowBox, frontBox, iconBox, titleBox] = await Promise.all([box(main(target, native)), box(front), box(svg), box(page.getByText(title, { exact: true }))]);
  expect(frontBox.width).toBe(width);
  expect(iconBox.width).toBe(iconSize); expect(iconBox.height).toBe(iconSize);
  expect(titleBox.x - frontBox.x - frontBox.width).toBeCloseTo(12);
  expect(iconBox.x + iconBox.width / 2).toBeCloseTo(frontBox.x + width / 2);
  const tile = front.locator(':scope > *').first();
  if (background) {
    const tileBox = await box(tile);
    expect(tileBox.width).toBe(width); expect(tileBox.height).toBe(width);
    expect(iconBox.y + iconBox.height / 2).toBeCloseTo(tileBox.y + width / 2);
    expect(await tile.evaluate(el => getComputedStyle(el).backgroundColor)).toBe('rgb(224, 234, 250)');
    expect(await tile.evaluate(el => parseFloat(getComputedStyle(el).borderTopLeftRadius))).toBeGreaterThanOrEqual(width / 2);
    expect(rowBox.height).toBeGreaterThanOrEqual(width + 32);
  } else {
    expect(await tile.evaluate(el => getComputedStyle(el).backgroundColor)).toBe('rgba(0, 0, 0, 0)');
  }
  const inset = await target.evaluate((el, native) => {
    if (!native) return parseFloat(getComputedStyle(el, '::after').left);
    const divider = Array.from(el.children).find(child => getComputedStyle(child).position === 'absolute')!;
    return divider.getBoundingClientRect().left - el.getBoundingClientRect().left;
  }, native);
  expect(inset).toBeCloseTo(16 + width + 12);
}

for (const platform of ['react', 'vue3', 'native']) {
  const native = platform === 'native';
  for (const width of [1024, 320]) test(`${platform} ${width}: leading sizes, circular backgrounds and divider alignment`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await openFixture(page, platform, '', 'list-leading');
    await checkGeometry(page, 'Legacy icon', native, 24, 20, false);
    await checkGeometry(page, 'Color only', native, 24, 20, false);
    await checkGeometry(page, 'Background default', native, 32, 20);
    for (const [size, [diameter, icon]] of Object.entries(sizes)) {
      await checkGeometry(page, `Circle ${size}`, native, diameter, icon);
      expect(await stroke(row(page, `Circle ${size}`).locator('svg'))).toBe('rgb(36, 86, 168)');
    }
    await checkGeometry(page, 'Sized plain', native, 56, 28, false);
    expect(await stroke(row(page, 'Color only').locator('svg'))).toBe('rgb(36, 86, 168)');
    const danger = await page.getByText('Danger default', { exact: true }).evaluate(el => getComputedStyle(el).color);
    expect(await stroke(row(page, 'Danger default').locator('svg'))).toBe(danger);
    expect(await stroke(row(page, 'Danger override').locator('svg'))).toBe('rgb(36, 86, 168)');
    expect(await page.getByText('Danger override', { exact: true }).evaluate(el => getComputedStyle(el).color)).toBe(danger);
    for (const [title, width, childWidth] of [['Custom default', 40, 32], ['Custom xs', 24, 24], ['Custom lg', 56, 32]] as const) {
      const target = row(page, title), front = leading(target, native);
      expect((await box(front)).width).toBe(width);
      expect((await box(front.locator(':scope > *').first())).width).toBe(childWidth);
      await expect(target.locator('svg')).toHaveCount(0);
      expect(await front.evaluate(el => getComputedStyle(el).backgroundColor)).toBe('rgba(0, 0, 0, 0)');
    }
    const noLeading = row(page, 'No leading');
    await expect(noLeading.locator('svg')).toHaveCount(0);
    expect((await box(page.getByText('No leading', { exact: true }))).x - (await box(main(noLeading, native))).x).toBeCloseTo(16);
    const long = row(page, 'Long description'), frontBox = await box(leading(long, native));
    expect(frontBox.height).toBe(56);
    expect(frontBox.y).toBeCloseTo((await box(page.getByText('Long description', { exact: true }))).y);
    const longBox = await box(main(long, native));
    expect(longBox.height).toBeGreaterThan(88);
    expect(frontBox.y + frontBox.height).toBeLessThanOrEqual(longBox.y + longBox.height - 16);
    const nested = page.getByRole('list', { name: 'Nested rows', exact: true }).getByRole('listitem');
    expect((await box(main(nested, native))).height).toBe(56);
    expect((await box(leading(nested, native))).width).toBe(24);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.screenshot({ path: `test-results/list-leading-${platform}-${width}.png`, fullPage: true });
  });

  test(`${platform}: leading props update and decorated rows retain click, keyboard and disabled behavior`, async ({ page }) => {
    await openFixture(page, platform, '', 'list-leading');
    await checkGeometry(page, 'Dynamic icon', native, 56, 28);
    await page.getByRole('button', { name: 'Change icon options' }).click();
    await checkGeometry(page, 'Dynamic icon', native, 24, 20, false);
    expect(await stroke(row(page, 'Dynamic icon').locator('svg'))).toBe(await stroke(row(page, 'Legacy icon').locator('svg')));
    await page.getByRole('button', { name: 'Change icon options' }).click();
    await checkGeometry(page, 'Dynamic icon', native, 56, 28);
    const action = page.getByRole('button', { name: 'Circle action', exact: true });
    await action.locator('svg').first().click();
    await expect(page.getByTestId('leading-state')).toContainText('"clicks":1');
    await action.focus(); await action.press('Enter');
    await expect(page.getByTestId('leading-state')).toContainText('"clicks":2');
    await expect(page.getByRole('button', { name: 'Disabled circle', exact: true })).toBeDisabled();
    await row(page, 'Disabled circle').scrollIntoViewIfNeeded();
    const disabled = await box(row(page, 'Disabled circle').locator('svg'));
    await page.mouse.click(disabled.x + disabled.width / 2, disabled.y + disabled.height / 2);
    await expect(page.getByTestId('leading-state')).toContainText('"clicks":2');
    const toggle = page.getByRole('switch', { name: 'Circle switch', exact: true });
    await expect(toggle).toHaveAttribute('aria-checked', 'false');
    await toggle.locator('svg').click();
    await expect(toggle).toHaveAttribute('aria-checked', 'true');
    await toggle.focus(); await toggle.press('Space');
    await expect(toggle).toHaveAttribute('aria-checked', 'false');
    await expect(action.locator('button, a, [tabindex]')).toHaveCount(0);
  });
}
