import { test, expect, type Page } from '@playwright/test';
import { tokens } from '../../packages/tokens/dist/index.js';
import { openFixture } from './packed-fixture';
const markerSelector = '.kjun-button-group-indicator, [data-testid="kjun-button-group-indicator"]';
const configure = (page: Page, next: object) => page.evaluate(next => (window as any).configureGroup(next), next);
const frame = (page: Page) => page.getByTestId('frame');
const options = [
  { value: 'line', label: '선 차트', icon: 'chart-line', iconOnly: true },
  { value: 'bar', label: '막대 차트', icon: 'chart-bar', iconOnly: true },
  { value: 'table', label: '표', icon: 'table' },
];
async function alignedTo(page: Page, name: string) {
  await expect.poll(async () => {
    const a = await page.locator(markerSelector).boundingBox(), b = await frame(page).getByRole('button', { name, exact: true }).boundingBox();
    return !!a && !!b && (['x', 'y', 'width', 'height'] as const).every(key => Math.abs(a[key] - b[key]) <= 1);
  }).toBe(true);
}
for (const platform of ['react', 'vue3', 'native']) {
  test(`${platform}: iconOnly options are square segments named by their label, with a tooltip`, async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await openFixture(page, platform, '', 'button-group');
    await configure(page, { options, value: 'line', size: 'md', fullWidth: false });
    const line = frame(page).getByRole('button', { name: '선 차트', exact: true });
    await expect(line).toHaveAttribute('aria-pressed', 'true');
    // No visible label text: the label is the accessible name only.
    await expect(frame(page).getByText('선 차트', { exact: true })).toHaveCount(0);
    for (const [size, height, padding] of [['xs', 24, 2], ['md', 40, 4], ['xl', 56, 4]] as const) {
      await configure(page, { size });
      const box = (await line.boundingBox())!, side = height - 2 * padding;
      expect(Math.abs(box.width - side)).toBeLessThanOrEqual(1);
      expect(Math.abs(box.height - side)).toBeLessThanOrEqual(1);
      // Segment icons follow the button icon scale for the size, labelled segments included.
      for (const name of ['선 차트', '표'])
        await expect(frame(page).getByRole('button', { name, exact: true }).locator('svg').first()).toHaveAttribute('width', String(tokens.button.iconSizes[size]));
      await alignedTo(page, '선 차트');
    }
    await configure(page, { size: 'md' });
    await frame(page).getByRole('button', { name: '막대 차트', exact: true }).click();
    await expect(page.getByTestId('value')).toHaveText('bar');
    await alignedTo(page, '막대 차트');
    await frame(page).getByRole('button', { name: '표', exact: true }).click();
    await alignedTo(page, '표');
    await line.hover();
    await expect(page.getByRole('tooltip')).toContainText('선 차트');
    await page.mouse.move(900, 700);
    // A disabled group shows no hint.
    await configure(page, { disabled: true });
    await line.hover({ force: true });
    await expect(page.getByRole('tooltip')).toHaveCount(0);
  });

  test(`${platform}: full-width iconOnly segments share the track equally`, async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await openFixture(page, platform, '', 'button-group');
    await configure(page, { options, value: 'line', size: 'md', fullWidth: true, width: 480 });
    const widths = await Promise.all(options.map(async o => (await frame(page).getByRole('button', { name: o.label, exact: true }).boundingBox())!.width));
    for (const width of widths) expect(Math.abs(width - widths[0])).toBeLessThanOrEqual(1);
    expect(widths[0]).toBeGreaterThan(100);
    await alignedTo(page, '선 차트');
  });
}
