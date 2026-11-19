import { test, expect, type Page } from '@playwright/test';
import { openFixture } from './packed-fixture';
const update = (page: Page, options: object) => page.evaluate(options => (window as any).configureAlert(options), options);
// Web serializes color-mix() as color(srgb ...) and Native Web as rgba(); both normalize to 0-255 channels plus alpha.
const rgba = (value: string) => {
  const n = value.match(/-?\d*\.?\d+/g)!.map(Number);
  return value.startsWith('color(') ? [...n.slice(0, 3).map(c => Math.round(c * 255)), n[3] ?? 1] : [...n.slice(0, 3), n[3] ?? 1];
};
const expectTint = (value: string, text: string, alpha: number) => {
  const [r, g, b, a] = rgba(value), [tr, tg, tb] = rgba(text);
  expect([r, g, b]).toEqual([tr, tg, tb]);
  expect(a).toBeCloseTo(alpha, 2);
};
for (const platform of ['react', 'vue3', 'native']) {
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
          // Each size has its own height: padding and the title line step up from sm to md to lg.
          await expect(alert).toHaveCSS('height', ({ sm: 40, md: 52, lg: 64 } as Record<string, number>)[size] + (parts.title.trim() && parts.body.trim() ? size === 'sm' ? 18 : 22 : 0) + 'px');
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
    await expect(alert).toHaveCSS('height', '74px');
    await expect(alert).toContainText('0');
    await update(page, { title: 'Alert title', action: true });
    const action = alert.getByRole('button', { name: 'Retry', exact: true });
    const reference = page.getByTestId('reference').getByRole('button');
    for (const property of ['margin-top', 'height', 'background-color', 'border-radius']) {
      await expect(action).toHaveCSS(property, await reference.evaluate((el, prop) => getComputedStyle(el).getPropertyValue(prop), property));
    }
    await action.click();
    await expect(page.getByTestId('events')).toHaveText('0/1');
    for (const size of ['sm', 'md', 'lg']) {
      await update(page, { size, action: false, actions: true, actionSize: undefined });
      const slot = alert.getByRole('button', { name: 'Slot action', exact: true });
      await expect(slot).toHaveCSS('height', ({ sm: '24px', md: '32px', lg: '40px' } as Record<string, string>)[size]);
      const text = await page.evaluate(() => { const probe = document.createElement('div'); document.body.append(probe); probe.style.color = 'var(--kjun-text)'; const value = getComputedStyle(probe).color; probe.remove(); return value; });
      // Secondary actions tint the alert fill with the text role instead of sitting on it as a white surface.
      expectTint(await slot.evaluate(el => getComputedStyle(el).backgroundColor), text, 0.08);
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
  test(`${platform}: untitled actions sit beside the message and wrap under it when the message would be too narrow`, async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', error => errors.push(error.message));
    await openFixture(page, platform, '', 'alert-design');
    const alert = page.getByTestId('alert').locator(':scope > *');
    const box = async (target: typeof alert) => (await target.boundingBox())!;
    for (const closable of [false, true]) {
      await update(page, { size: 'md', title: '', body: '변경 사항을 저장하지 못했습니다', action: false, actions: true, actionSize: undefined, closable, width: 520 });
      const slot = alert.getByRole('button', { name: 'Slot action', exact: true }), body = alert.getByText('변경 사항을 저장하지 못했습니다', { exact: true });
      // Beside: centred on the message's first line, and the alert keeps its one-line height.
      await expect(alert).toHaveCSS('height', '52px');
      let s = await box(slot), b = await box(body);
      expect(Math.abs(s.y + s.height / 2 - (b.y + b.height / 2))).toBeLessThanOrEqual(1);
      expect(s.x).toBeGreaterThan(b.x + b.width);
      // Narrow: under the message from its start, one action gap down, inside the padding.
      await update(page, { width: 200 });
      await expect.poll(async () => (await box(slot)).y - ((await box(body)).y + (await box(body)).height)).toBeCloseTo(12, 0);
      s = await box(slot); b = await box(body);
      const a = await box(alert);
      expect(Math.round(s.x)).toBe(Math.round(b.x));
      expect(Math.round(a.y + a.height - s.y - s.height)).toBe(16);
      expect(await alert.evaluate(el => el.scrollWidth <= el.clientWidth + 1)).toBe(true);
      // Wide again: back beside the message.
      await update(page, { width: 520 });
      await expect(alert).toHaveCSS('height', '52px');
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
        const result = { bg: read('brand-subtle-bg'), brand: read('brand'), text: read('text'), dangerBg: read('danger-bg'), dangerAccent: read('danger-accent') };
        probe.remove(); return result;
      });
      // Soft fill without a border: semantic tones color only the icon; info is a translucent text tint.
      for (const [variant, bg, icon] of [['info', null, roles.text], ['danger', roles.dangerBg, roles.dangerAccent], ['primary', roles.bg, roles.brand]]) {
        await update(page, { variant, title: 'Alert title', body: 'Alert body' });
        if (bg) await expect(alert).toHaveCSS('background-color', bg);
        else expectTint(await alert.evaluate(el => getComputedStyle(el).backgroundColor), roles.text, 0.06);
        await expect(alert).toHaveCSS('border-top-width', '0px');
        await expect(alert.locator('svg').first()).toHaveCSS('color', icon);
        await expect(alert.getByText('Alert title', { exact: true })).toHaveCSS('color', roles.text);
        await expect(alert.getByText('Alert body', { exact: true })).toHaveCSS('color', roles.text);
      }
      await close.hover();
      await expect.poll(async () => rgba(await close.evaluate(el => getComputedStyle(el).backgroundColor))[3]).toBeCloseTo(0.12, 2);
      await page.mouse.down();
      await expect.poll(async () => rgba(await close.evaluate(el => getComputedStyle(el).backgroundColor))[3]).toBeCloseTo(0.16, 2);
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
