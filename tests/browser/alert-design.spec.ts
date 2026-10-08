import { test, expect, type Page } from '@playwright/test';
import { openFixture } from './packed-fixture';
const update = (page: Page, options: object) => page.evaluate(options => (window as any).configureAlert(options), options);
for (const platform of ['react', 'vue2', 'native']) {
  test(`${platform}: Alert empty sections, first-line alignment and nested actions`, async ({ page }) => {
    test.setTimeout(180000);
    const errors: string[] = [];
    page.on('pageerror', error => errors.push(error.message));
    await openFixture(page, platform, '', 'alert-design');
    const alert = page.getByTestId('alert').locator(':scope > *');
    for (const size of ['sm', 'md', 'lg']) {
      for (const parts of [{ title: 'Alert title', body: 'Alert body' }, { title: '', body: 'Alert body' }, { title: 'Alert title', body: '' }, { title: ' ', body: ' ', emptyFragment: true }]) {
        for (const closable of [true, false]) {
          await update(page, { size, emptyFragment: false, ...parts, closable });
          await expect(alert).toHaveCSS('height', (size === 'sm' ? 34 : 42) + (parts.title.trim() && parts.body.trim() ? size === 'sm' ? 20 : 24 : 0) + 'px');
          if (parts.body.trim()) {
            await expect(alert.getByText('Alert body', { exact: true })).toHaveCSS('font-size', size === 'sm' ? '12px' : '14px');
            await expect(alert.getByText('Alert body', { exact: true })).toHaveCSS('line-height', size === 'sm' ? '16px' : '20px');
          }
          if (closable) {
            const close = alert.getByRole('button'), closeSize = size === 'sm' ? '24px' : '28px';
            await expect(close).toHaveCSS('width', closeSize);
            await expect(close).toHaveCSS('height', closeSize);
            const icons = await alert.locator('svg').evaluateAll(nodes => nodes.map(node => { const r = node.getBoundingClientRect(); return { y: r.y + r.height / 2, left: r.left, right: r.right }; }));
            expect(icons[0].y).toBeCloseTo(icons[1].y, 1);
            // The status icon and the close glyph sit on the same padding inset.
            const edge = await alert.evaluate(el => { const r = el.getBoundingClientRect(); return { left: r.left, right: r.right }; });
            expect(edge.right - icons[1].right).toBeCloseTo(icons[0].left - edge.left, 0);
            const top = await close.evaluate(el => el.getBoundingClientRect().top - el.closest('[data-testid="alert"]')!.firstElementChild!.getBoundingClientRect().top);
            expect(top).toBeGreaterThanOrEqual(4);
          }
        }
      }
    }
    await update(page, { size: 'md', title: 0, body: 0, emptyFragment: false, closable: true });
    await expect(alert).toHaveCSS('height', '66px');
    await expect(alert).toContainText('0');
    await update(page, { title: 'Alert title', action: true });
    const action = alert.getByRole('button', { name: 'Retry', exact: true });
    const reference = page.getByTestId('reference').getByRole('button');
    for (const property of ['margin-top', 'height', 'background-color', 'border-radius']) {
      await expect(action).toHaveCSS(property, await reference.evaluate((el, prop) => getComputedStyle(el).getPropertyValue(prop), property));
    }
    await action.click();
    await expect(page.getByTestId('events')).toHaveText('0/1');
    for (const size of ['sm', 'md']) {
      await update(page, { size, action: false, actions: true, actionSize: undefined });
      const slot = alert.getByRole('button', { name: 'Slot action', exact: true });
      await expect(slot).toHaveCSS('height', size === 'sm' ? '24px' : '32px');
      const surface = await page.evaluate(() => { const probe = document.createElement('div'); document.body.append(probe); probe.style.backgroundColor = 'var(--kjun-surface)'; const value = getComputedStyle(probe).backgroundColor; probe.remove(); return value; });
      await expect(slot).toHaveCSS('background-color', surface);
      await update(page, { actionSize: 'lg' });
      await expect(slot).toHaveCSS('height', '48px');
    }
    await update(page, { size: 'md', actions: false, actionSize: undefined });
    for (const width of [288, 200]) {
      await update(page, { width, action: false, title: '프로젝트 변경 사항을 저장하지 못했습니다', body: 'https://example.com/verylongpathwithoutanyseparatorsandaverylongmessage' });
      await expect.poll(() => alert.evaluate(el => el.scrollWidth <= el.clientWidth + 1)).toBe(true);
    }
    expect(errors).toEqual([]);
  });
  test(`${platform}: Alert primary paint and close hover, press and keyboard`, async ({ page }) => {
    for (const palette of ['default', 'dark']) {
      await openFixture(page, platform, '?palette=' + palette, 'alert-design');
      await update(page, { variant: 'primary' });
      const alert = page.getByTestId('alert').locator(':scope > *'), close = alert.getByRole('button');
      const roles = await page.evaluate(() => {
        const probe = document.createElement('div'); document.body.append(probe);
        const read = (role: string) => { probe.style.backgroundColor = `var(--kjun-${role})`; return getComputedStyle(probe).backgroundColor; };
        const result = { bg: read('brand-subtle-bg'), border: read('border'), brand: read('brand'), hover: read('hover'), active: read('active') };
        probe.remove(); return result;
      });
      await expect(alert).toHaveCSS('background-color', roles.bg);
      await expect(alert).toHaveCSS('border-top-color', roles.border);
      await expect(alert.locator('svg').first()).toHaveCSS('color', roles.brand);
      await close.hover();
      await expect(close).toHaveCSS('background-color', roles.hover);
      await page.mouse.down();
      await expect(close).toHaveCSS('background-color', roles.active);
      await page.mouse.up();
      await expect(page.getByTestId('events')).toHaveText('1/0');
      for (const [index, key] of ['Enter', 'Space'].entries()) {
        await update(page, { generation: index + 1 });
        await page.getByTestId('before').focus();
        await page.keyboard.press('Tab');
        await expect(close).toBeFocused();
        await expect(close).toHaveCSS('outline-width', '2px');
        await page.keyboard.press(key);
        await expect(alert).toHaveCount(0);
        await expect(page.getByTestId('events')).toHaveText(`${index + 2}/0`);
      }
    }
  });
}
