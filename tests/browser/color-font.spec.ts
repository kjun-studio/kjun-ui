import { test, expect, type Locator, type Page } from '@playwright/test';
import { openFixture } from './packed-fixture';

async function textStyle(node: Locator, text?: string) {
  return node.evaluate((element, wanted) => {
    const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
    let current;
    while (current = walker.nextNode()) {
      if (!current.textContent?.trim() || wanted && current.textContent.trim() !== wanted) continue;
      const parent = current.parentElement!, s = getComputedStyle(parent);
      let surface: Element | null = parent;
      while (surface && getComputedStyle(surface).backgroundColor === 'rgba(0, 0, 0, 0)') surface = surface.parentElement;
      return { family: s.fontFamily.split(',')[0].trim(), variant: s.fontVariantNumeric, color: s.color,
        background: surface ? getComputedStyle(surface).backgroundColor : null };
    }
    throw Error('Missing text: ' + wanted);
  }, text);
}
const errors = (page: Page) => page.evaluate(() => (window as any).colorFontErrors as string[]);
const open = (page: Page, platform: string, query = '') => openFixture(page, platform, query, 'color-font');
const numbers = ['number', 'heat', 'progress', 'up-text', 'down-text', 'up-pill', 'down-pill', 'up-badge', 'down-badge', 'neutral'];

async function verifySamples(page: Page, numeric: string, body: string, changed = false, prefix = '') {
  for (const id of numbers) await expect.poll(() => textStyle(page.getByTestId(prefix + id)))
    .toMatchObject({ family: numeric, variant: 'tabular-nums' });
  const kpi = page.getByTestId(prefix + 'kpi');
  for (const value of ['TEXT VALUE', '접두', '접미', '42', 'segment'])
    await expect.poll(() => textStyle(kpi, value)).toMatchObject({ family: body, variant: 'normal' });
  await expect.poll(() => textStyle(kpi, '123,456')).toMatchObject({ family: numeric, variant: 'tabular-nums' });
  for (const variant of ['text', 'pill', 'badge']) {
    expect((await textStyle(page.getByTestId(prefix + 'up-' + variant))).color).toBe(changed ? 'rgb(124, 50, 153)' : 'rgb(22, 115, 74)');
    expect((await textStyle(page.getByTestId(prefix + 'down-' + variant))).color).toBe(changed ? 'rgb(132, 80, 0)' : 'rgb(35, 92, 210)');
  }
  expect((await textStyle(page.getByTestId(prefix + 'up-badge'))).background).toBe(changed ? 'rgb(240, 228, 244)' : 'rgb(225, 243, 232)');
  expect((await textStyle(page.getByTestId(prefix + 'down-badge'))).background).toBe(changed ? 'rgb(248, 239, 219)' : 'rgb(228, 236, 250)');
  expect((await textStyle(page.getByTestId(prefix + 'neutral'))).color).toBe('rgb(102, 102, 102)');
}

for (const platform of ['react', 'vue2', 'native']) {
  test(`${platform}: numeric/body fonts and financial roles survive scoped modal updates`, async ({ page }, info) => {
    await open(page, platform);
    await verifySamples(page, 'monospace', 'serif');
    expect((await textStyle(page.getByTestId('ordinary'))).family).toBe('serif');
    const item = page.getByTestId('kpi').getByRole('button').first();
    await item.click(); await expect(page.getByTestId('clicks')).toHaveText('1');
    await page.getByRole('button', { name: 'Open font dialog', exact: true }).click();
    await verifySamples(page, 'monospace', 'serif', false, 'dialog-');
    await page.getByRole('button', { name: 'Change dialog values', exact: true }).click();
    await verifySamples(page, 'serif', 'sans-serif', true, 'dialog-');
    await page.keyboard.press('Escape');
    await expect(page.getByRole('dialog')).toHaveCount(0);
    await verifySamples(page, 'serif', 'sans-serif', true);
    expect((await textStyle(page.getByTestId('outer'))).family).toBe('cursive');
    expect((await textStyle(page.getByTestId('ordinary'))).family).toBe('sans-serif');
    await expect(page.getByRole('button', { name: 'Open font dialog', exact: true })).toBeFocused();
    expect(await errors(page)).toEqual([]);
    await page.screenshot({ path: info.outputPath(platform + '-fonts.png'), fullPage: true });
  });

  test(`${platform}: omitted numeric font follows the nearest body font`, async ({ page }) => {
    await open(page, platform, '?scenario=fallback');
    await verifySamples(page, 'serif', 'serif');
    await page.getByRole('button', { name: 'Change values', exact: true }).click();
    await verifySamples(page, 'sans-serif', 'sans-serif', true);
    expect((await textStyle(page.getByTestId('outer'))).family).toBe('sans-serif');
    expect(await errors(page)).toEqual([]);
  });

  test(`${platform}: core-only numeric components do not require financial colors`, async ({ page }) => {
    await open(page, platform, '?scenario=core');
    await expect(page.getByRole('button', { name: 'Use price colors' })).toBeVisible();
    await expect(page.getByText('123', { exact: true })).toBeVisible();
    expect(await errors(page)).toEqual([]);
  });

  test(`${platform}: a newly selected price mode diagnoses missing domain colors`, async ({ page }) => {
    await open(page, platform, '?scenario=late-domain');
    expect(await errors(page)).toEqual([]);
    await page.getByRole('button', { name: 'Use price colors' }).click();
    await expect.poll(async () => (await errors(page)).join(' ')).toMatch(/Missing KJUN (?:CSS )?domain color/);
  });

  test(`${platform}: domain diagnostics use the local scope instead of the outer palette`, async ({ page }) => {
    await open(page, platform, '?scenario=scoped-domain');
    await expect.poll(async () => (await errors(page)).join(' ')).toMatch(/Missing KJUN (?:CSS )?domain colors/);
  });
}

for (const platform of ['react', 'vue2']) {
  test(`${platform}: missing body font has an explicit diagnostic`, async ({ page }) => {
    await open(page, platform, '?scenario=missing-font');
    await expect.poll(async () => (await errors(page)).join(' ')).toContain('--kjun-font');
  });

  test(`${platform}: every financial entry point diagnoses a missing domain contract`, async ({ page }) => {
    for (const component of ['signed', 'deviation', 'heat', 'badge', 'kpi', 'hero', 'sparkline', 'collection', 'table', 'market', 'flash']) {
      await open(page, platform, '?scenario=missing-domain&case=' + component);
      await expect.poll(async () => (await errors(page)).join(' '), { message: component }).toContain('Missing KJUN CSS domain colors');
    }
  });

  test(`${platform}: partial domain mapping reports the omitted roles`, async ({ page }) => {
    await open(page, platform, '?scenario=partial-domain');
    await expect.poll(async () => (await errors(page)).join(' ')).toContain('priceDown');
    expect((await errors(page)).join(' ')).not.toMatch(/: priceUp,/);
  });
}

const configureFollowup = (page: Page, next: object) => page.evaluate(next => (window as any).configureFollowup(next), next);
const followupFixture = (page: Page, platform: string, scenario: string) => openFixture(page, platform, `?scenario=${scenario}`, "review-followup");
for (const platform of ["react", "vue2", "native"]) test(`${platform} core-only colors support nested overrides and live modal updates`, async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", error => errors.push(error.message));
  await openFixture(page, platform, "", "color-contract");
  const outer = page.getByRole("textbox", { name: "Outer input", exact: true });
  const scoped = page.getByRole("textbox", { name: "Scoped input", exact: true });
  await expect(outer).toHaveCSS("background-color", "rgb(221, 238, 255)");
  await expect(scoped).toHaveCSS("background-color", "rgb(221, 238, 255)");
  await page.getByRole("button", { name: "Open dialog" }).click();
  const dialogInput = page.getByRole("dialog", { name: "Core colors" }).getByRole("textbox");
  await dialogInput.focus();
  await expect(dialogInput).toHaveCSS("border-top-color", "rgb(34, 68, 102)");
  await configureFollowup(page, { changed: true });
  await expect(dialogInput).toHaveCSS("border-top-color", "rgb(102, 34, 68)");
  await page.keyboard.press("Escape");
  await page.mouse.move(0, 0);
  await expect(scoped).toHaveCSS("background-color", "rgb(221, 238, 221)");
  await configureFollowup(page, { override: true });
  await expect(scoped).toHaveCSS("background-color", "rgb(238, 221, 204)");
  await configureFollowup(page, { override: false });
  await expect(scoped).toHaveCSS("background-color", "rgb(221, 238, 221)");
  await expect(outer).toHaveCSS("background-color", "rgb(221, 238, 255)");
  expect(errors).toEqual([]);
});
