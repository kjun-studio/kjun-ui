import { test, expect, type Page } from '@playwright/test';
import { tokens } from '@kjun-ui/tokens';
import { openFixture } from './packed-fixture';
const configure = (page: Page, next: object) => page.evaluate(next => (window as any).configureMotion(next), next);
const start = (page: Page, platform: string, scenario: string) => openFixture(page, platform, '?scenario=' + scenario, 'motion', 'development');
const marker = '.kjun-tab-indicator, [data-testid="kjun-tab-indicator"]';
const panelSelector = {
  modal: '.kjun-modal, .ds-modal-container, [role="dialog"][aria-label="Motion modal"]',
  drawer: '.kjun-drawer, .ds-drawer-panel, [aria-label="Motion drawer"]:not(.kjun-drawer-dialog)',
  menu: '.kjun-floating, .ds-dropdown-menu, [aria-label="메뉴"]',
};
test.beforeEach(async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  (page as any).motionErrors = errors;
});
test.afterEach(async ({ page }) => { expect((page as any).motionErrors).toEqual([]); });

for (const platform of ['react', 'vue2', 'native']) {
  test(`${platform}: number retargeting, strings and motion preference changes`, async ({ page }) => {
    await start(page, platform, 'numbers');
    await expect(page.getByTestId('number')).toHaveText('100.00');
    const values = await page.evaluate(async () => {
      const read = () => Number(document.querySelector('[data-testid="number"]')!.textContent!.replaceAll(',', ''));
      const frame = () => new Promise(requestAnimationFrame);
      (window as any).configureMotion({ value: 1000 });
      for (let i = 0; i < 5; i++) await frame();
      (window as any).configureMotion({ value: 120 });
      await new Promise(resolve => setTimeout(resolve, 0));
      const before = read();
      const after = [];
      for (let i = 0; i < 8; i++) { await frame(); after.push(read()); }
      return { before, after };
    });
    expect(values.before).toBeGreaterThan(120); expect(values.before).toBeLessThan(800);
    expect(Math.max(...values.after)).toBeLessThan(values.before + 1);
    expect(values.after.at(-1)).toBeLessThan(values.after[0]);
    await expect(page.getByTestId('number')).toHaveText('120.00');
    await expect(page.getByTestId('price')).toContainText('120.00');
    await configure(page, { value: 1000 }); await page.waitForTimeout(60); await configure(page, { value: '확인 중' });
    await page.waitForTimeout(650); await expect(page.getByTestId('number')).toHaveText('확인 중');
    await configure(page, { value: -25.5 }); await expect(page.getByTestId('number')).toHaveText('-25.50');
    await configure(page, { value: 1000 }); await page.emulateMedia({ reducedMotion: 'reduce' });
    await expect(page.getByTestId('number')).toHaveText('1,000.00');
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await expect(page.getByTestId('number')).toHaveText('1,000.00');
    await configure(page, { value: 123, animated: false, decimals: 1 }); await expect(page.getByTestId('number')).toHaveText('123.0');
    await configure(page, { value: 900, animated: true }); await configure(page, { show: false }); await page.waitForTimeout(650);
  });

  for (const variant of ['underline', 'pills']) test(`${platform}: ${variant} tabs keep their width and retarget the indicator`, async ({ page }) => {
    await start(page, platform, 'tabs'); await configure(page, { variant });
    const tabs = page.getByRole('tab'); await expect(tabs).toHaveCount(3); await expect(page.locator(marker)).toBeVisible();
    const before = await tabs.evaluateAll(nodes => nodes.map(el => { const r = el.getBoundingClientRect(); return { x: r.x, width: r.width }; }));
    const frames = await page.evaluate(async selector => {
      const tabs = [...document.querySelectorAll<HTMLElement>('[role="tab"]')];
      const x = () => document.querySelector(selector)!.getBoundingClientRect().x;
      const result = [x()]; tabs[2].click();
      for (let i = 0; i < 4; i++) { await new Promise(requestAnimationFrame); result.push(x()); }
      tabs[1].click();
      for (let i = 0; i < 18; i++) { await new Promise(requestAnimationFrame); result.push(x()); }
      return result;
    }, marker);
    expect(frames.some(x => x > frames[0] + 1 && x < before[2].x)).toBe(true);
    await expect(page.getByTestId('tab-value')).toHaveText('two');
    const after = await tabs.evaluateAll(nodes => nodes.map(el => { const r = el.getBoundingClientRect(); return { x: r.x, width: r.width }; }));
    after.forEach((box, i) => { expect(Math.abs(box.x - before[i].x)).toBeLessThanOrEqual(1); expect(Math.abs(box.width - before[i].width)).toBeLessThanOrEqual(1); });
    await expect.poll(async () => Math.abs((await page.locator(marker).boundingBox())!.x - ((await tabs.nth(1).boundingBox())!.x + (variant === 'underline' ? 16 : 0)))).toBeLessThanOrEqual(1);
    await configure(page, { accept: false }); await tabs.first().click(); await expect(page.getByTestId('tab-value')).toHaveText('two');
    await page.emulateMedia({ reducedMotion: 'reduce' }); await configure(page, { tab: 'three', width: 240, dir: 'rtl' });
    await expect(tabs.nth(2)).toHaveAttribute('aria-selected', 'true');
    await configure(page, { tab: 'missing' }); await expect(page.locator(marker)).toBeHidden();
  });

  test(`${platform}: accordion animates height, survives reversal and removes closed content`, async ({ page }) => {
    await start(page, platform, 'accordion');
    const heights = await page.evaluate(async () => {
      const root = document.querySelector('[data-testid="frame"]')!;
      const button = root.querySelector<HTMLElement>('button,[role="button"]')!;
      const height = () => root.getBoundingClientRect().height;
      const result = [height()]; button.click();
      for (let i = 0; i < 4; i++) { await new Promise(requestAnimationFrame); result.push(height()); }
      button.click(); await new Promise(requestAnimationFrame); button.click();
      for (let i = 0; i < 20; i++) { await new Promise(requestAnimationFrame); result.push(height()); }
      return result;
    });
    const minimum = Math.min(...heights), maximum = Math.max(...heights);
    expect(maximum).toBeGreaterThan(minimum);
    // Frame sampling varies under load; a measured intermediate height proves interpolation.
    expect(heights.some(height => height > minimum + 1 && height < maximum - 1)).toBe(true);
    await expect(page.getByTestId('details')).toBeVisible();
    await configure(page, { paragraphs: 6 }); await expect(page.getByTestId('details')).toHaveCSS('height', '240px');
    await page.getByRole('button', { name: 'Expand details' }).click(); await expect(page.getByTestId('details')).toHaveCount(0);
    await page.emulateMedia({ reducedMotion: 'reduce' }); await page.getByRole('button', { name: 'Expand details' }).click();
    await expect(page.getByTestId('details')).toBeVisible();
  });

  for (const kind of ['modal', 'drawer'] as const) test(`${platform}: ${kind} enters, exits and reopens without stale removal`, async ({ page }) => {
    await start(page, platform, 'layers');
    const selector = panelSelector[kind];
    const frames = await page.evaluate(async ({ kind, selector }) => {
      (window as any).configureMotion({ [kind]: true });
      const result = [];
      for (let i = 0; i < 22; i++) { await new Promise(requestAnimationFrame); const el = document.querySelector(selector); if (el) {
        const r = el.getBoundingClientRect(); result.push({ x: r.x, y: r.y });
      } }
      return result;
    }, { kind, selector });
    expect(new Set(frames.map(r => Math.round((kind === 'modal' ? r.y : r.x) * 10))).size).toBeGreaterThan(2);
    const retained = await page.evaluate(async ({ kind, selector }) => {
      (window as any).configureMotion({ [kind]: false });
      await Promise.resolve(); await Promise.resolve();
      const present = !!document.querySelector(selector);
      (window as any).configureMotion({ [kind]: true });
      return present;
    }, { kind, selector });
    expect(retained).toBe(true);
    await page.waitForTimeout(350); await expect(page.locator(selector)).toBeVisible();
    await page.locator(selector).getByRole('button', { name: '닫기', exact: true }).click();
    await expect(page.locator(selector)).toHaveCount(0); await expect(page.getByTestId('events')).toHaveText(`["${kind}-close"]`);
    await page.emulateMedia({ reducedMotion: 'reduce' }); await configure(page, { [kind]: true });
    await expect(page.locator(selector)).toBeVisible(); await configure(page, { [kind]: false }); await expect(page.locator(selector)).toHaveCount(0);
  });

  test(`${platform}: drawer fades only its scrim while the panel travels opaque`, async ({ page }) => {
    await start(page, platform, 'layers');
    const selector = panelSelector.drawer;
    const opacities = await page.evaluate(async selector => {
      // The panel's visible opacity is the product of its own and every ancestor's opacity.
      const effective = (node: Element | null) => { let value = 1; for (; node; node = node.parentElement) value *= Number(getComputedStyle(node).opacity); return value; };
      (window as any).configureMotion({ drawer: true });
      const result: number[] = [];
      for (let i = 0; i < 16; i++) { await new Promise(requestAnimationFrame); const el = document.querySelector(selector); if (el) result.push(effective(el)); }
      return result;
    }, selector);
    expect(opacities.length).toBeGreaterThan(2);
    // A layer may stay hidden until it is measured, but the panel is never partly transparent.
    expect(opacities.filter(value => value > 0.01 && value < 0.99)).toEqual([]);
    expect(opacities.at(-1)).toBeGreaterThan(0.99);
  });

  test(`${platform}: toast exit, stack movement and service timers remain independent`, async ({ page }) => {
    await start(page, platform, 'feedback');
    const ids = await page.evaluate(() => ['First toast', 'Second toast', 'Third toast'].map(message => (window as any).feedback.toast.info(message, { duration: 0 })));
    await expect(page.getByText('Third toast', { exact: true })).toBeVisible(); await page.waitForTimeout(250);
    const before = (await page.getByText('Third toast', { exact: true }).boundingBox())!.y;
    // Measure retention inside the page so protocol latency cannot skip the exit interval.
    const retainedFor = await page.getByText('Second toast', { exact: true }).evaluate((element, id) => new Promise<number>(resolve => {
      const started = performance.now();
      const observer = new MutationObserver(() => {
        if (!element.isConnected) { observer.disconnect(); resolve(performance.now() - started); }
      });
      observer.observe(document.body, { childList: true, subtree: true });
      (window as any).feedback.toast.dismiss(id);
    }), ids[1]);
    expect(retainedFor).toBeGreaterThanOrEqual(tokens.motion.toastExit - 20);
    await expect(page.getByText('Second toast', { exact: true })).toHaveCount(0);
    await expect.poll(async () => (await page.getByText('Third toast', { exact: true }).boundingBox())!.y).toBeLessThan(before - 10);
    await page.evaluate(() => (window as any).feedback.toast.clearAll());
    await expect(page.getByText('Third toast', { exact: true })).toHaveCount(0);
    // Observe the short lifetime in the browser; a busy test runner can miss 350ms.
    const timed = await page.evaluate(() => new Promise<{ appeared: boolean; elapsed: number }>(resolve => {
      let appeared = false;
      const started = performance.now();
      const observer = new MutationObserver(() => {
        const toast = [...document.querySelectorAll('[role="alert"]')].find(node => node.textContent?.includes('Timed toast'));
        if (toast?.getClientRects().length) appeared = true;
        else if (appeared) { observer.disconnect(); resolve({ appeared, elapsed: performance.now() - started }); }
      });
      observer.observe(document.body, { childList: true, subtree: true });
      (window as any).feedback.toast.info('Timed toast', { duration: 350 });
    }));
    expect(timed.appeared).toBe(true); expect(timed.elapsed).toBeGreaterThanOrEqual(350);
    await expect(page.getByText('Timed toast', { exact: true })).toHaveCount(0);
  });
}

test('Native menu never paints its placeholder position', async ({ page }) => {
  await start(page, 'native', 'layers');
  const result = await page.evaluate(async () => {
    const trigger = [...document.querySelectorAll<HTMLElement>('[role="button"]')].find(el => el.textContent === 'Open menu')!;
    const anchor = trigger.getBoundingClientRect(); trigger.click(); const points = [];
    for (let i = 0; i < 24; i++) { await new Promise(requestAnimationFrame); const el = document.querySelector('[aria-label="메뉴"]');
      if (el && Number(getComputedStyle(el).opacity) > 0) { const r = el.getBoundingClientRect(); points.push({ x: r.x, y: r.y }); }
    }
    return { anchor: { x: anchor.x, bottom: anchor.bottom }, points };
  });
  expect(result.points.length).toBeGreaterThan(2);
  expect(result.points.every(p => Math.abs(p.x - result.anchor.x) <= 1 && p.y >= result.anchor.bottom + 3)).toBe(true);
});
