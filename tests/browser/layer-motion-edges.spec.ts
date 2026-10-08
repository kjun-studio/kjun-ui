import { test, expect, type Page } from '@playwright/test';
import { tokens } from '@kjun/tokens';
import { openFixture } from './packed-fixture';
const configure = (page: Page, next: object) => page.evaluate(next => (window as any).configureMotion(next), next);
const start = (page: Page, platform: string, scenario: string) => openFixture(page, platform, '?scenario=' + scenario, 'motion');
for (const platform of ['react', 'vue2', 'native']) {
  test(`${platform}: Switch moves through intermediate positions and reduction snaps`, async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'no-preference' }); await start(page, platform, 'switch');
    // Native draws the off boundary as an overlay before the thumb, so the thumb is the last child.
    const selector = platform === 'native' ? '[role="switch"] > div > div:last-child' : '.ds-switch-thumb';
    const values = await page.evaluate(async selector => {
      // Thumb centers: the off thumb is smaller (it clears the inset boundary), so its left edge travels less.
      const x = () => { const box = document.querySelector(selector)!.getBoundingClientRect(); return box.x + box.width / 2; };
      const values = [x()]; (window as any).configureMotion({ sw: true });
      for (let i = 0; i < 20; i++) { await new Promise(requestAnimationFrame); values.push(x()); }
      return values;
    }, selector);
    // Both thumb centers sit height / 2 from their track end, so the center travels width - height.
    const { widths, heights } = tokens.extensions.switch;
    expect(values.at(-1)! - values[0]).toBeCloseTo(widths.md - heights.md, 0);
    expect(values.some(value => value > values[0] + 1 && value < values.at(-1)! - 1)).toBe(true);
    await expect(page.getByRole('switch')).toBeChecked();
    await configure(page, { sw: false }); await page.emulateMedia({ reducedMotion: 'reduce' });
    await expect.poll(async () => { const box = (await page.locator(selector).first().boundingBox())!; return box.x + box.width / 2; }).toBeCloseTo(values[0], 0);
  });

  for (const position of ['left', 'right', 'top', 'bottom']) {
    test(`${platform}: ${position} Drawer stays within a narrow viewport and restores focus`, async ({ page }) => {
      await page.setViewportSize({ width: 390, height: 740 }); await start(page, platform, 'layers');
      await configure(page, { position });
      const trigger = page.getByRole('button', { name: 'Open drawer', exact: true }); await trigger.click();
      const panel = page.locator(platform === 'react' ? '.kjun-drawer' : platform === 'vue2' ? '.ds-drawer-panel' : '[aria-label="Motion drawer"]');
      await expect(panel).toBeVisible(); await page.waitForTimeout(350);
      const box = (await panel.boundingBox())!;
      expect(box.x).toBeGreaterThanOrEqual(-1); expect(box.y).toBeGreaterThanOrEqual(-1);
      expect(box.x + box.width).toBeLessThanOrEqual(391); expect(box.y + box.height).toBeLessThanOrEqual(741);
      await page.keyboard.press('Escape'); await expect(panel).toHaveCount(0); await expect(trigger).toBeFocused();
    });
  }

  test(`${platform}: changing reduced motion during an exit finishes cleanup`, async ({ page }) => {
    await start(page, platform, 'layers'); await configure(page, { modal: true }); await page.waitForTimeout(350);
    await configure(page, { modal: false }); await page.emulateMedia({ reducedMotion: 'reduce' });
    await expect(page.getByText('Modal content', { exact: true })).toHaveCount(0);
    await configure(page, { modal: true }); await expect(page.getByText('Modal content', { exact: true })).toBeVisible();
    await page.keyboard.press('Escape'); await expect(page.getByText('Modal content', { exact: true })).toHaveCount(0);
    expect(await page.evaluate(() => document.body.style.overflow)).not.toBe('hidden');
  });

  test(`${platform}: Toast pause, action and overlay transfer keep the same lifetime`, async ({ page }) => {
    await start(page, platform, 'layers');
    await page.evaluate(() => {
      (window as any).actions = 0;
      (window as any).feedback.toast.info('Pause and act', { duration: 800, action: { label: 'Do action', onClick: () => { (window as any).actions++; } } });
    });
    const action = page.getByRole('button', { name: 'Do action' }); await action.focus(); await page.waitForTimeout(900); await expect(action).toBeVisible();
    await action.click(); await expect(action).toHaveCount(0); expect(await page.evaluate(() => (window as any).actions)).toBe(1);
    await page.evaluate(() => (window as any).feedback.toast.info('Persistent transfer', { duration: 0 }));
    await page.waitForTimeout(250); await configure(page, { modal: true });
    await expect(page.getByText('Persistent transfer', { exact: true })).toHaveCount(1);
    await page.waitForTimeout(350); await expect(page.getByText('Persistent transfer', { exact: true })).toBeVisible();
    await configure(page, { modal: false }); await page.waitForTimeout(250);
    await expect(page.getByText('Persistent transfer', { exact: true })).toHaveCount(1);
    await page.evaluate(() => (window as any).feedback.toast.clearAll()); await expect(page.getByText('Persistent transfer', { exact: true })).toHaveCount(0);
  });

  test(`${platform}: the last Toast exits at its existing horizontal position`, async ({ page }) => {
    await start(page, platform, 'feedback');
    await page.evaluate(() => (window as any).feedback.toast.info('Last toast', { duration: 0 }));
    await expect(page.getByText('Last toast', { exact: true })).toBeVisible(); await page.waitForTimeout(250);
    const positions = await page.evaluate(async () => {
      const read = () => document.querySelector('[role="alert"]')!.getBoundingClientRect().x;
      const before = read(); (window as any).feedback.toast.clearAll();
      await new Promise(requestAnimationFrame); return { before, after: read() };
    });
    expect(Math.abs(positions.after - positions.before)).toBeLessThanOrEqual(1);
  });
}

test('Vue layers consume Escape before parent shortcuts and restore focus with reduced motion', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  for (const kind of ['modal', 'drawer']) {
    await start(page, 'vue2', 'layers');
    await page.evaluate(() => {
      (window as any).parentEscapes = 0;
      window.addEventListener('keydown', event => {
        if (event.key === 'Escape' && !event.defaultPrevented) (window as any).parentEscapes++;
      });
    });
    const trigger = page.getByRole('button', { name: 'Open ' + kind, exact: true });
    await trigger.click();
    await expect(page.getByText(kind === 'modal' ? 'Modal content' : 'Drawer content', { exact: true })).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page.getByText(kind === 'modal' ? 'Modal content' : 'Drawer content', { exact: true })).toHaveCount(0);
    await expect(trigger).toBeFocused();
    expect(await page.evaluate(() => (window as any).parentEscapes)).toBe(0);
  }
});

test('React layer motion preserves viewport positioning and keyboard actions of nested Toasts', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 900 });
  for (const kind of ['modal', 'drawer', 'popover']) {
    await start(page, 'react', kind === 'popover' ? 'popover' : 'layers');
    await page.getByRole('button', { name: 'Open ' + kind, exact: true }).click();
    await page.evaluate(() => {
      (window as any).toastActions = 0;
      (window as any).feedback.toast.info('Viewport toast', { duration: 0,
        action: { label: 'Toast action', onClick: () => { (window as any).toastActions++; } } });
    });
    const toast = page.getByRole('alert');
    await expect(toast).toBeVisible();
    await expect.poll(async () => {
      const box = (await toast.boundingBox())!;
      return Math.max(Math.abs(box.x - 16), Math.abs(box.y - 16));
    }).toBeLessThan(0.5);
    const action = toast.getByRole('button', { name: 'Toast action' });
    await action.focus(); await action.press('Enter');
    expect(await page.evaluate(() => (window as any).toastActions)).toBe(1);
    await expect(toast).toHaveCount(0);
  }
});

test('Native Spinner and spinning Icon rotate at a constant speed and stop for reduced motion', async ({ page }) => {
  await page.clock.install(); await page.clock.pauseAt(new Date());
  await page.emulateMedia({ reducedMotion: 'no-preference' }); await start(page, 'native', 'spinner');
  await expect(page.locator('[data-testid="frame"] svg')).toHaveCount(2);
  await page.clock.runFor(100);
  const frames = [];
  for (let i = 0; i < 40; i++) {
    await page.clock.runFor(32);
    frames.push(await page.evaluate(() => ({ t: performance.now(), angles: [...document.querySelectorAll('[data-testid="frame"] svg')].map(svg => {
      const matrix = new DOMMatrixReadOnly(getComputedStyle(svg.parentElement!).transform);
      return (Math.atan2(matrix.m12, matrix.m11) * 180 / Math.PI + 360) % 360;
    }) })));
  }
  for (let column = 0; column < 2; column++) {
    let total = 0;
    const errors = [];
    for (let i = 1; i < frames.length; i++) {
      total += (frames[i].angles[column] - frames[i - 1].angles[column] + 360) % 360;
      errors.push(Math.abs(total - (frames[i].t - frames[0].t) * 0.36));
    }
    expect(Math.max(...errors)).toBeLessThan(12);
  }
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.clock.runFor(32);
  const read = () => page.locator('[data-testid="frame"] svg').evaluateAll(nodes => nodes.map(svg => getComputedStyle(svg.parentElement!).transform));
  const before = await read(); await page.clock.runFor(160); expect(await read()).toEqual(before);
});
