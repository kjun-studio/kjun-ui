import { expect, test, type Page } from '@playwright/test';
import { openFixture } from './packed-fixture';

const props = ['display', 'box-sizing', 'margin-top', 'margin-bottom', 'padding-top', 'padding-left',
  'list-style-type', 'color', 'text-decoration-line', 'font-size', 'font-weight', 'background-color',
  'border-top-width', 'border-top-style', 'border-top-color', 'animation-duration', 'transition-duration', 'border-top-left-radius', 'border-collapse', 'box-shadow'];

async function probes(page: Page, testId: string) {
  return page.locator(`[data-testid="${testId}"]`).evaluate((root, names) =>
    [...root.querySelectorAll('[data-probe]')].map(el => {
      const style = getComputedStyle(el);
      return [el.getAttribute('data-probe'), Object.fromEntries(names.map(name => [name, style.getPropertyValue(name)]))];
    }), props);
}

async function kjunElements(page: Page) {
  // Modal content is portaled; read every kjun element on the page, in document order.
  await expect(page.getByRole('dialog')).toBeVisible();
  return page.evaluate(names => [...document.querySelectorAll('[data-testid="kjun"] *, [role="dialog"], [role="dialog"] *')]
    .map(el => { const style = getComputedStyle(el); return names.map(name => style.getPropertyValue(name)).join('|'); }), props);
}

for (const platform of ['react', 'vue3']) {
  test(`${platform}: app markup inside KjunProvider keeps the app's own styles`, async ({ page }) => {
    await page.setViewportSize({ width: 1024, height: 900 });
    await openFixture(page, platform, '', 'style-boundary');
    expect(await probes(page, 'inside')).toEqual(await probes(page, 'outside'));
  });

  test(`${platform}: app CSS does not change kjun component styles`, async ({ page }) => {
    await page.setViewportSize({ width: 1024, height: 900 });
    await openFixture(page, platform, '?noapp', 'style-boundary');
    const without = await kjunElements(page);
    await openFixture(page, platform, '', 'style-boundary');
    expect(await kjunElements(page)).toEqual(without);
  });
}

for (const platform of ['react', 'vue3']) {
  test(`${platform}: data-kjun-content keeps app fields inside KJUN containers on the app's own styles`, async ({ page }) => {
    await openFixture(page, platform, '', 'style-boundary');
    const area = page.getByTestId('content-optout');
    const border = (label: string) => area.getByRole('textbox', { name: label, exact: true }).evaluate(el => getComputedStyle(el).borderTopWidth);
    expect(await border('예외 앱 입력')).toBe('2px');
    expect(await border('리셋 앱 입력')).toBe('0px');
    // A KJUN component inside the opted-out area still gets its own baseline.
    const kjunInside = await border('예외 안 KJUN 입력');
    const kjunOutside = await page.getByTestId('kjun').getByRole('textbox', { name: '입력', exact: true }).evaluate(el => getComputedStyle(el).borderTopWidth);
    expect(kjunInside).toBe(kjunOutside);
  });
}

for (const platform of ['react', 'vue3']) {
  test(`${platform}: the form layout attribute spaces form groups and leaves the app wrapper's own text alone`, async ({ page }) => {
    await page.setViewportSize({ width: 1024, height: 900 });
    await openFixture(page, platform, '', 'style-boundary');
    // The wrapper's app heading and paragraph look exactly like the same app markup elsewhere in the Provider.
    const layout = Object.fromEntries(await probes(page, 'form-layout'));
    const inside = Object.fromEntries(await probes(page, 'inside'));
    expect({ heading: layout.heading, paragraph: layout.paragraph }).toEqual({ heading: inside.heading, paragraph: inside.paragraph });
    await expect(page.getByTestId('form-layout')).toHaveCSS('font-size', await page.getByTestId('inside').evaluate(el => getComputedStyle(el).fontSize));
    for (const group of await page.getByTestId('form-layout').locator('.kjun-form-group').all())
      await expect(group).toHaveCSS('margin-bottom', '0px');
  });
}

for (const platform of ['react', 'vue3']) {
  test(`${platform}: reduced motion slows kjun animations only, not app animations inside the Provider`, async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.setViewportSize({ width: 1024, height: 900 });
    await openFixture(page, platform, '', 'style-boundary');
    expect(await probes(page, 'inside')).toEqual(await probes(page, 'outside'));
    await expect(page.getByTestId('inside').locator('[data-probe="app-spin"]')).toHaveCSS('animation-duration', '1s');
  });
}

for (const platform of ['react', 'vue3']) {
  test(`${platform}: a kjun component whose root is a button still takes the scope font`, async ({ page }) => {
    await openFixture(page, platform, '?noapp', 'style-boundary');
    const button = page.getByTestId('kjun').getByRole('button', { name: '저장' });
    const font = await page.locator('.kjun-scope').first().evaluate(el => getComputedStyle(el).getPropertyValue('--kjun-font').trim());
    await expect(button).toHaveCSS('font-family', font);
  });
}

for (const platform of ['react', 'vue3']) {
  test(`${platform}: an icon placed in app text keeps the app's colour and font size`, async ({ page }) => {
    await openFixture(page, platform, '?noapp', 'style-boundary');
    const icon = page.getByTestId('icon-host').locator('svg');
    await expect(icon).toHaveCSS('color', 'rgb(1, 2, 3)');
    await expect(icon).toHaveCSS('font-size', '30px');
  });
}

for (const platform of ['react', 'vue3']) {
  test(`${platform}: app markup inside KjunFeedbackProvider keeps the app's own styles`, async ({ page }) => {
    await page.setViewportSize({ width: 1024, height: 900 });
    await openFixture(page, platform, '', 'style-boundary');
    expect(await probes(page, 'inside-feedback')).toEqual(await probes(page, 'outside'));
  });
}

for (const platform of ['react', 'vue3']) test(`${platform}: a modal used without a Provider still takes the kjun font and text colour`, async ({ page }) => {
  await openFixture(page, platform, '?standalone', 'style-boundary');
  const body = page.getByTestId('standalone-body');
  const vars = await page.evaluate(() => { const s = getComputedStyle(document.documentElement); return [s.getPropertyValue('--kjun-font').trim(), s.getPropertyValue('--kjun-text').trim()]; });
  await expect(body).toHaveCSS('font-family', vars[0]);
  const color = await page.evaluate(value => { const probe = document.createElement('span'); probe.style.color = value; document.body.append(probe); const c = getComputedStyle(probe).color; probe.remove(); return c; }, vars[1]);
  await expect(body).toHaveCSS('color', color);
});
