import { expect, test, type Page, type Locator } from '@playwright/test';
import { openFixture } from './packed-fixture';
import { demoPalettes } from '../../shared/demo-colors';
const configure = (page: Page, next: object) => page.evaluate(next => (window as any).configureTabs(next), next);
const marker = (page: Page) => page.locator('.kjun-tab-indicator, [data-testid="kjun-tab-indicator"]');
const tabs = (page: Page) => page.getByRole('tab');
const box = async (node: Locator) => (await node.boundingBox())!;
const label = (tab: Locator, platform: string) => platform === 'native' ? tab.locator('[dir="auto"]').nth(1) : tab.locator('.kjun-motion-label > span');
const rgb = (hex: string) => 'rgb(' + [1, 3, 5].map(n => parseInt(hex.slice(n, n + 2), 16)).join(', ') + ')';
async function aligned(page: Page, index: number, variant: string) {
  await expect(marker(page)).toBeVisible();
  await expect.poll(async () => {
    const target = await tabs(page).nth(index).evaluate(el => {
      const r = el.getBoundingClientRect(), style = getComputedStyle(el);
      return { x: r.x, y: r.y, width: r.width, height: r.height, left: parseFloat(style.paddingLeft), right: parseFloat(style.paddingRight) };
    });
    const actual = await box(marker(page)), underline = variant === 'underline';
    const desired = { x: target.x + (underline ? target.left : 0), y: target.y + (underline ? target.height - 2 : 0), width: target.width - (underline ? target.left + target.right : 0), height: underline ? 2 : target.height };
    return Object.entries(desired).every(([key, value]) => Math.abs(actual[key as keyof typeof actual] - value) <= 1) ? 'aligned' : JSON.stringify({ actual, desired });
  }, { timeout: 5000 }).toBe('aligned');
}

for (const platform of ['react', 'vue2', 'native']) {
  test(`${platform}: shared tab sizes, readable labels and flat indicators align across variants and palettes`, async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    for (const palette of ['default', 'dark'] as const) {
      await openFixture(page, platform, '?palette=' + palette, 'tabs-design');
      for (const variant of ['underline', 'pills']) for (const density of ['comfortable', 'compact']) {
        await configure(page, { variant, density, value: 'one' });
        await aligned(page, 0, variant);
        await expect(tabs(page).first()).toHaveCSS('height', density === 'compact' ? '32px' : '44px');
        await expect(label(tabs(page).first(), platform)).toHaveCSS('font-size', '14px');
        await expect(label(tabs(page).first(), platform)).toHaveCSS('font-weight', '600');
        await expect(label(tabs(page).nth(1), platform)).toHaveCSS('font-weight', '500');
        await expect(label(tabs(page).nth(1), platform)).toHaveCSS('color', rgb(demoPalettes[palette].textSecondary));
        await expect(tabs(page).nth(2)).toHaveCSS('opacity', '0.5');
        await expect(marker(page)).toHaveCSS('box-shadow', 'none');
        await expect(marker(page)).toHaveCSS('background-color', rgb(variant === 'underline' ? demoPalettes[palette].brand : demoPalettes[palette].active));
        if (variant === 'underline') expect((await box(label(tabs(page).first(), platform))).x).toBe((await box(page.getByTestId('content-one'))).x);
        const before = await tabs(page).evaluateAll(nodes => nodes.map(el => { const r = el.getBoundingClientRect(); return { x: r.x, width: r.width }; }));
        await tabs(page).nth(1).click(); await aligned(page, 1, variant); await page.mouse.move(0, 0);
        await expect(label(tabs(page).first(), platform)).toHaveCSS('font-weight', '500');
        await expect(label(tabs(page).nth(1), platform)).toHaveCSS('font-weight', '600');
        expect(await tabs(page).evaluateAll(nodes => nodes.map(el => { const r = el.getBoundingClientRect(); return { x: r.x, width: r.width }; }))).toEqual(before);
        await expect(page.getByTestId('content-two')).toBeVisible(); await expect(page.getByTestId('content-one')).toBeHidden();
      }
    }
  });

  test(`${platform}: supplied tab state, disabled items and keyboard activation remain controlled`, async ({ page }) => {
    await openFixture(page, platform, '', 'tabs-design');
    await tabs(page).first().focus();
    if (platform === 'native') {
      await tabs(page).nth(1).focus(); await tabs(page).nth(1).press('Enter');
    } else {
      await tabs(page).first().press('ArrowRight'); await expect(tabs(page).nth(1)).toBeFocused();
    }
    await expect(page.getByTestId('value')).toHaveText('two');
    if (platform !== 'native') {
      await tabs(page).nth(1).press('ArrowRight'); await expect(tabs(page).nth(3)).toBeFocused();
      await tabs(page).nth(3).press('Home'); await expect(tabs(page).first()).toBeFocused();
      await tabs(page).first().press('End'); await expect(tabs(page).nth(3)).toBeFocused();
    } else { await tabs(page).nth(3).focus(); await tabs(page).nth(3).press('Enter'); }
    await expect(page.getByTestId('value')).toHaveText('three');
    await expect(tabs(page).nth(3)).toHaveCSS('outline-width', '2px');
    await configure(page, { accept: false });
    await tabs(page).first().click(); await expect(page.getByTestId('events')).toHaveText('one');
    await expect(page.getByTestId('value')).toHaveText('three'); await aligned(page, 3, 'underline');
    await configure(page, { accept: true });
    const disabled = await box(tabs(page).nth(2)); await page.mouse.click(disabled.x + disabled.width / 2, disabled.y + disabled.height / 2);
    await expect(page.getByTestId('events')).toBeEmpty(); await expect(page.getByTestId('value')).toHaveText('three');
  });

  test(`${platform}: narrow scrolling and dynamic labels preserve indicator placement`, async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 700 });
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await openFixture(page, platform, '', 'tabs-design');
    const items = Array.from({ length: 8 }, (_, i) => ({ name: 't' + i, label: '긴 프로젝트 이름 ' + i, ...(i === 1 ? { icon: 'file', badge: 999 } : {}) }));
    await configure(page, { items, value: 't0', width: 288 }); await aligned(page, 0, 'underline');
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(320);
    await tabs(page).last().click(); await aligned(page, 7, 'underline');
    await expect(page.getByTestId('content-t7')).toBeVisible();
    await configure(page, { density: 'compact' }); await aligned(page, 7, 'underline');
    await configure(page, { variant: 'pills' }); await aligned(page, 7, 'pills');
    await configure(page, { items: items.map((item, i) => i === 7 ? { ...item, label: '이름 변경 후 긴 마지막 항목', badge: 99 } : item) }); await aligned(page, 7, 'pills');
    await configure(page, { width: 220 }); await aligned(page, 7, 'pills');
    await configure(page, { items: items.slice(0, 2), value: 't0', variant: 'underline', density: 'comfortable' });
    await aligned(page, 0, 'underline');
    await configure(page, { value: 'missing' }); await expect(marker(page)).toBeHidden();
  });
}
