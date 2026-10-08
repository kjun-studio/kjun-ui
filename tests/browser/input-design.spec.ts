import { demoPalettes } from '../../shared/demo-colors';
const roleColor = (palette: string, role: 'inputBorderFocus' | 'danger') => {
  const hex = demoPalettes[palette as keyof typeof demoPalettes][role];
  return `rgb(${[1, 3, 5].map(offset => parseInt(hex.slice(offset, offset + 2), 16)).join(', ')})`;
};
import { expect, test, type Page } from '@playwright/test';
import { openFixture } from './packed-fixture';
const configure = (page: Page, next: object) => page.evaluate(next => (window as any).configureInputDesign(next), next);
const field = (page: Page, id: string) => page.getByTestId(id).locator('input, textarea, button, [role="button"], [role="combobox"]').first();
const geometry = (page: Page) => page.getByTestId('input').locator('input').evaluate(el => {
  const box = el.getBoundingClientRect(); return { x: box.x, y: box.y, width: box.width, height: box.height };
});
for (const platform of ['react', 'vue2', 'native']) {
  test(`${platform}: every field shares button geometry and textarea row sizing`, async ({ page }) => {
    await openFixture(page, platform, '', 'input-design');
    for (const [size, height, radius, textarea] of [['sm', 32, 10, 92], ['md', 40, 12, 100], ['lg', 48, 14, 108]] as const) {
      await configure(page, { size });
      for (const id of ['input', 'affix', 'select', 'combo', 'search', 'date', 'quantity', 'time', 'button']) {
        await expect(field(page, id), id).toHaveCSS('height', `${height}px`);
        if (id === 'quantity') {
          // The first segment keeps only the field's outer corners; its inner edge stays square.
          await expect(field(page, id), id).toHaveCSS('border-top-left-radius', `${radius}px`);
          await expect(field(page, id), id).toHaveCSS('border-bottom-left-radius', `${radius}px`);
          await expect(field(page, id), id).toHaveCSS('border-top-right-radius', '0px');
        } else await expect(field(page, id), id).toHaveCSS('border-radius', `${radius}px`);
      }
      await expect(page.getByTestId('quantity').locator('input')).toHaveCSS('height', `${height}px`);
      await expect(page.getByTestId('quantity').locator('input')).toHaveCSS('border-radius', '0px');
      await expect(page.getByTestId('quantity').locator(':scope > div').first()).toHaveCSS('border-radius', `${radius}px`);
      await expect(field(page, 'textarea')).toHaveCSS('height', `${textarea}px`);
      await expect(field(page, 'textarea')).toHaveCSS('border-radius', `${radius}px`);
      expect((await field(page, 'textarea').boundingBox())!.width).toBe((await field(page, 'input').boundingBox())!.width);
      await expect(field(page, 'input')).toHaveCSS('font-size', '16px');
      const clear = page.getByTestId('input').getByRole('button');
      await expect(platform === 'native' ? clear.locator(':scope > div').first() : clear).toHaveCSS('height', `${({ sm: 24, md: 28, lg: 32 })[size]}px`);
      if (platform === 'native') await expect(clear).toHaveCSS('height', '44px');
      const icon = await clear.locator('svg').boundingBox(), inputBox = await field(page, 'input').boundingBox();
      expect(Math.abs(icon!.y + icon!.height / 2 - inputBox!.y - inputBox!.height / 2)).toBeLessThanOrEqual(1);
      await expect(page.getByTestId('input').getByRole('button').locator('svg')).toHaveCSS('width', size === 'lg' ? '18px' : '16px');
    }
  });

  test(`${platform}: filled focus, errors and readonly preserve geometry and clear behavior`, async ({ page }) => {
    await openFixture(page, platform, '', 'input-design');
    const input = field(page, 'input');
    const background = await input.evaluate(el => getComputedStyle(el).backgroundColor);
    const before = await geometry(page);
    await input.focus();
    await expect(input).toHaveCSS('background-color', background);
    expect(await geometry(page)).toEqual(before);
    await configure(page, { error: true });
    await expect(input).toHaveAttribute('aria-invalid', 'true');
    await expect(input).toHaveCSS('border-top-color', 'rgb(197, 47, 59)');
    await expect(input).toHaveCSS('background-color', background);
    expect(await geometry(page)).toEqual(before);
    await configure(page, { error: false, readOnly: true });
    await expect(input).not.toBeEditable();
    await expect(page.getByTestId('input').getByRole('button')).toBeDisabled();
    await field(page, 'button').click();
    await input.hover();
    await expect(input).toHaveCSS('background-color', background);
    await configure(page, { readOnly: false });
    await page.getByTestId('input').getByRole('button').click();
    await expect(input).toHaveValue('');
    await expect(input).toBeFocused();
    await configure(page, { disabled: true, error: true, prefixIcon: 'search', suffixIcon: 'check' });
    await expect(input).not.toBeEditable();
    await expect(input).toHaveCSS('border-top-color', 'rgb(197, 47, 59)');
    for (const icon of await input.locator('..').locator('svg').all()) {
      const ink = await icon.evaluate(el => getComputedStyle(el).color === 'rgb(150, 150, 150)' || getComputedStyle(el).stroke === 'rgb(150, 150, 150)');
      expect(ink).toBe(true);
    }
  });

  test(`${platform}: textarea and selection retain error boundaries through focus and disabled states`, async ({ page }) => {
    await openFixture(page, platform, '', 'input-design');
    await page.emulateMedia({ reducedMotion: 'reduce' });
    for (const id of ['textarea']) {
      const control = page.getByTestId(id).locator('input, textarea');
      const background = await control.evaluate(el => getComputedStyle(el).backgroundColor);
      await control.focus();
      await expect(control).not.toHaveCSS('border-top-color', 'rgba(0, 0, 0, 0)');
      await expect(control).toHaveCSS('background-color', background);
      await expect(control).toHaveCSS('transition-duration', '0s');
      await configure(page, { error: true });
      await expect(control).toHaveCSS('border-top-color', 'rgb(197, 47, 59)');
      await configure(page, { disabled: true });
      await expect(control).toHaveCSS('border-top-color', 'rgb(197, 47, 59)');
      await configure(page, { disabled: false, error: false });
    }
    const select = field(page, 'select');
    await select.click();
    await expect(page.getByRole(platform === 'native' ? 'radio' : 'option').first()).toBeVisible();
    await expect(select).not.toHaveCSS('border-top-color', 'rgba(0, 0, 0, 0)');
    await page.keyboard.press('Escape');
    await expect(select).toHaveAttribute('aria-expanded', 'false');
  });

  test(`${platform}: selection popup and long affixes fit narrow layouts in every palette`, async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 900 });
    for (const width of [375, 1280]) for (const palette of ['default', 'violet', 'dark']) {
      await page.setViewportSize({ width, height: 1000 });
      await openFixture(page, platform, `?palette=${palette}`, 'input-design');
      const affix = field(page, 'affix');
      const bounds = await affix.evaluate(el => {
        const css = getComputedStyle(el); return { width: el.getBoundingClientRect().width, left: parseFloat(css.paddingLeft), right: parseFloat(css.paddingRight) };
      });
      expect(bounds.left).toBeGreaterThan(60);
      expect(bounds.right).toBeGreaterThan(60);
      expect(bounds.width - bounds.left - bounds.right).toBeGreaterThan(70);
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
      await page.screenshot({ path: `artifacts/input-design-${platform}-${palette}-${width}-default.png`, fullPage: true });
      await field(page, 'input').focus();
      await expect(field(page, 'input')).toHaveCSS('border-top-color', roleColor(palette, 'inputBorderFocus'));
      await page.screenshot({ path: `artifacts/input-design-${platform}-${palette}-${width}-focus.png`, fullPage: true });
      await field(page, 'select').click();
      const options = page.getByRole(platform === 'native' ? 'radio' : 'option');
      await expect(options.first()).toBeVisible();
      await expect(options.first()).toHaveCSS('border-radius', '8px');
      expect((await options.first().boundingBox())!.height).toBeGreaterThanOrEqual(44);
      await expect(field(page, 'select')).toHaveCSS('border-top-color', roleColor(palette, 'inputBorderFocus'));
      await page.screenshot({ path: `artifacts/input-design-${platform}-${palette}-${width}-open.png`, fullPage: true });
      await options.filter({ hasText: '나만 보기' }).click();
      await expect(field(page, 'select')).toContainText('나만 보기');
      await configure(page, { error: true });
      await expect(field(page, 'input')).toHaveCSS('border-top-color', roleColor(palette, 'danger'));
      await page.screenshot({ path: `artifacts/input-design-${platform}-${palette}-${width}-error.png`, fullPage: true });
    }
  });
}

test('Native Web: spare touch area activates small inputs and selectors', async ({ browser }) => {
  const context = await browser.newContext({ viewport: { width: 375, height: 900 }, hasTouch: true });
  const page = await context.newPage();
  await openFixture(page, 'native', '', 'input-design');
  await configure(page, { size: 'sm' });
  for (const id of ['input', 'quantity', 'select', 'date']) {
    const control = id === 'quantity' ? page.getByTestId(id).locator('input') : field(page, id);
    const target = control.locator('..');
    await control.scrollIntoViewIfNeeded();
    expect((await target.boundingBox())!.height).toBeGreaterThanOrEqual(44);
    const box = (await control.boundingBox())!;
    await page.touchscreen.tap(box.x + box.width / 2, box.y - 3);
    if (id === 'input' || id === 'quantity') await expect(control).toBeFocused();
    else {
      await expect(control).toHaveAttribute('aria-expanded', 'true');
      await page.keyboard.press('Escape');
      await expect(control).toHaveAttribute('aria-expanded', 'false');
      // Hidden from accessibility before the exiting layer stops intercepting input.
      await expect(page.locator('[role="dialog"]')).toHaveCount(0);
    }
  }
  await configure(page, { disabled: true });
  const select = field(page, 'select'), box = (await select.boundingBox())!;
  await page.touchscreen.tap(box.x + box.width / 2, box.y - 3);
  await expect(select).toHaveAttribute('aria-expanded', 'false');
  await context.close();
});
