import { test, expect, type Page } from '@playwright/test';
import { openFixture } from './packed-fixture';
const markerSelector = '.kjun-button-group-indicator, [data-testid="kjun-button-group-indicator"]';
const configure = (page: Page, next: object) => page.evaluate(next => (window as any).configureGroup(next), next);
const marker = (page: Page) => page.locator(markerSelector);
const buttons = (page: Page) => page.getByTestId('frame').getByRole('button');
const rects = (page: Page) => buttons(page).evaluateAll(items => items.map(item => {
  const r = item.getBoundingClientRect(); return { x: r.x, y: r.y, width: r.width, height: r.height };
}));
async function aligned(page: Page, index: number) {
  await expect(marker(page)).toBeVisible();
  await expect.poll(async () => {
    const a = await marker(page).boundingBox(), b = await buttons(page).nth(index).boundingBox();
    return !!a && !!b && ['x', 'y', 'width', 'height'].every(key => Math.abs(a[key as keyof typeof a] - b[key as keyof typeof b]) <= 1);
  }).toBe(true);
}
async function record(page: Page) {
  await page.evaluate(selector => {
    const frames: any[] = [];
    (window as any).motionFrames = frames;
    const started = performance.now();
    const tick = () => {
      const el = document.querySelector(selector)!;
      const r = el.getBoundingClientRect();
      frames.push({ t: performance.now() - started, x: r.x, width: r.width,
        selected: [...document.querySelectorAll('[data-testid="frame"] [role="button"], [data-testid="frame"] button')].findIndex(el => el.getAttribute('aria-pressed') === 'true') });
      if (performance.now() - started < 600) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, markerSelector);
}
for (const platform of ['react', 'vue2', 'native']) {
  test(`${platform}: size tokens preserve track inset and matching item corners through selection and resize`, async ({ page }, testInfo) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await openFixture(page, platform, '', 'button-group');
    const track = marker(page).locator('..');
    const checkInset = async (padding: number) => {
      const outer = (await track.boundingBox())!;
      const first = (await buttons(page).first().boundingBox())!;
      const last = (await buttons(page).last().boundingBox())!;
      for (const inset of [first.x - outer.x, first.y - outer.y,
        outer.x + outer.width - last.x - last.width, outer.y + outer.height - first.y - first.height]) {
        expect(Math.abs(inset - padding)).toBeLessThanOrEqual(1);
      }
    };
    for (const [size, height, padding, radius, itemRadius] of [
      ['xs', 24, 2, 6, 4], ['sm', 32, 3, 8, 5], ['md', 40, 4, 10, 6],
      ['lg', 48, 4, 12, 8], ['xl', 56, 4, 14, 10],
    ] as const) {
      await configure(page, { size, value: 'a', fullWidth: false, width: 360 });
      await aligned(page, 0);
      await expect(track).toHaveCSS('padding', `${padding}px`);
      await expect(track).toHaveCSS('border-radius', `${radius}px`);
      await expect(track).toHaveCSS('height', `${platform === 'native' ? Math.max(height, 44 + 2 * padding) : height}px`);
      await expect(marker(page)).toHaveCSS('border-radius', `${itemRadius}px`);
      for (const item of await buttons(page).all()) await expect(item).toHaveCSS('border-radius', `${itemRadius}px`);
      await checkInset(padding);
      const before = await rects(page);
      await buttons(page).last().click(); await aligned(page, 2);
      expect(await rects(page)).toEqual(before);
      if (size === 'md') await page.getByTestId('frame').screenshot({ path: testInfo.outputPath(`button-group-inset-${platform}.png`) });
      await configure(page, { fullWidth: true, width: 280 }); await aligned(page, 2);
      await expect(track).toHaveCSS('width', '280px');
      await checkInset(padding);
    }
  });

  test(`${platform}: immediate controlled selection, 200ms movement and stable button geometry`, async ({ page }, testInfo) => {
    const errors: string[] = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await openFixture(page, platform, '', 'button-group', 'development');
    await aligned(page, 0);
    const before = await rects(page), start = before[0].x, end = before[2].x;
    expect(before.every(box => box.height === (platform === 'native' ? 44 : 32))).toBe(true);
    await record(page);
    await buttons(page).nth(2).click();
    await expect(page.getByTestId('value')).toHaveText('c');
    await expect(page.getByTestId('events')).toHaveText('[["value","c"],["change","c"]]');
    await aligned(page, 2);
    const frames = await page.evaluate(() => (window as any).motionFrames) as { t: number; x: number; width: number; selected: number }[];
    expect(frames.some(f => f.selected === 2 && f.x > start + 1 && f.x < end - 1)).toBe(true);
    expect(frames.every(f => f.x >= start - 1 && f.x <= end + 1)).toBe(true);
    expect(await rects(page)).toEqual(before);
    if (platform !== 'native') {
      await expect(marker(page)).toHaveCSS('transition-duration', '0.2s, 0.2s');
      await expect(marker(page)).toHaveCSS('border-radius', '6px');
    }
    await page.screenshot({ path: testInfo.outputPath(`button-group-${platform}.png`) });
    expect(errors).toEqual([]);
  });

  test(`${platform}: rapid clicks retarget from the current position and controlled rejection stays selected`, async ({ page }, testInfo) => {
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await openFixture(page, platform, '', 'button-group'); await aligned(page, 0);
    const boxes = await rects(page);
    // Reverse at an observed intermediate position; rendering need not commit within three frames.
    const during = await page.evaluate(async selector => {
      const root = document.querySelector('[data-testid="frame"]')!;
      const choices = [...root.querySelectorAll<HTMLElement>('button, [role="button"]')];
      const start = document.querySelector(selector)!.getBoundingClientRect().x;
      choices[2].click();
      let x = start;
      for (let i = 0; i < 30 && x <= start + 1; i++) {
        await new Promise(requestAnimationFrame);
        x = document.querySelector(selector)!.getBoundingClientRect().x;
      }
      choices[1].click();
      await new Promise(requestAnimationFrame);
      return { before: x, after: document.querySelector(selector)!.getBoundingClientRect().x };
    }, markerSelector);
    expect(during.before).toBeGreaterThan(boxes[0].x + 1);
    expect(during.before).toBeLessThan(boxes[2].x);
    expect(Math.abs(during.after - during.before)).toBeLessThan(Math.abs(boxes[2].x - boxes[0].x) / 2);
    await aligned(page, 1);
    await expect(page.getByTestId('events')).toHaveText('[["value","c"],["change","c"],["value","b"],["change","b"]]');
    await configure(page, { accept: false }); await buttons(page).nth(0).click();
    await expect(page.getByTestId('value')).toHaveText('b'); await aligned(page, 1);
    expect(await rects(page)).toEqual(boxes);
  });

  test(`${platform}: reduced motion, resize, option changes and missing selection align without stale indicators`, async ({ page }, testInfo) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await openFixture(page, platform, '', 'button-group'); await aligned(page, 0);
    await buttons(page).nth(2).click(); await aligned(page, 2);
    if (platform !== 'native') await expect(marker(page)).toHaveCSS('transition-property', 'none');
    await configure(page, { fullWidth: true, width: 360 }); await aligned(page, 2);
    await configure(page, { width: 280, size: 'lg' }); await aligned(page, 2);
    await configure(page, { value: 'missing' }); await expect(marker(page)).toBeHidden();
    await configure(page, { value: 'a', options: [{ value: 'a', label: '변경된 긴 이름' }, { value: 'c', label: '전체' }] });
    await aligned(page, 0); await expect(buttons(page)).toHaveCount(2);
    await configure(page, { disabled: true });
    await expect(buttons(page).first()).toBeDisabled(); await expect(marker(page)).toHaveCSS('opacity', '1');
    await configure(page, { options: [] }); await expect(marker(page)).toBeHidden();
    await expect(page.getByTestId('events')).toHaveText('[["value","c"],["change","c"]]');
  });

  test(`${platform}: keyboard selection and motion-preference changes preserve focus`, async ({ page }, testInfo) => {
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await openFixture(page, platform, '', 'button-group'); await aligned(page, 0);
    await buttons(page).first().focus();
    if (platform === 'native') await page.keyboard.press('Tab');
    else await page.keyboard.press('ArrowRight');
    await expect(buttons(page).nth(1)).toBeFocused(); await expect(page.getByTestId('value')).toHaveText('a');
    await page.keyboard.press('Enter'); await aligned(page, 1);
    await expect(buttons(page).nth(1)).toBeFocused();
    await buttons(page).nth(2).click();
    await page.emulateMedia({ reducedMotion: 'reduce' }); await aligned(page, 2);
    await expect(buttons(page).nth(2)).toBeFocused();
    await configure(page, { value: 'a' }); await aligned(page, 0);
  });
}

for (const platform of ['react', 'vue2']) test(`${platform}: RTL scroll, hidden mount and font changes retain the selected background`, async ({ page }, testInfo) => {
  await openFixture(page, platform, '', 'button-group'); await aligned(page, 0);
  await configure(page, { dir: 'rtl', width: 150 }); await aligned(page, 0);
  await buttons(page).last().click(); await aligned(page, 2);
  await page.getByTestId('frame').evaluate(async el => {
    (el as HTMLElement).style.display = 'none';
    (window as any).configureGroup({ value: 'b' });
    await Promise.resolve(); await Promise.resolve();
    (el as HTMLElement).style.display = '';
  });
  await aligned(page, 1);
  await page.getByTestId('frame').evaluate(el => { (el as HTMLElement).style.fontFamily = 'monospace'; });
  await aligned(page, 1);
});
