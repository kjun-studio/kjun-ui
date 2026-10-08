import { expect, test, type Page, type Locator } from '@playwright/test';
import { openFixture } from './packed-fixture';
const configure = (page: Page, next: object) => page.evaluate(next => (window as any).configurePopover(next), next);
const panel = (page: Page, platform: string, name = '팝오버 디자인') => platform === 'native' ? page.locator(`[aria-label="${name}"]`).last() : page.locator('.kjun-content-popover');
const rect = async (node: Locator) => (await node.boundingBox())!;
const trigger = (page: Page) => page.getByRole('button', { name: '팝오버 열기', exact: true });
const anchorElement = (page: Page, platform: string) => platform === 'native' ? page.getByTestId('anchor') : page.locator('[aria-haspopup="dialog"]');
async function close(page: Page) {
  await page.mouse.click(900, 700);
  await expect(page.getByTestId('open')).toHaveText('false');
}
for (const platform of ['react', 'vue2', 'native']) {
  test(`${platform}: popovers have subtle borderless surfaces and preserve placement, width and overflow`, async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    for (const palette of ['default', 'dark']) {
      await page.setViewportSize({ width: 1024, height: 768 });
      await openFixture(page, platform, '?palette=' + palette, 'popover-design');
      for (const placement of ['bottom', 'top', 'right', 'left']) {
        await configure(page, { placement });
        const anchor = await rect(anchorElement(page, platform));
        await trigger(page).click();
        const popup = panel(page, platform);
        await expect(popup).toBeVisible();
        if (placement === 'bottom') {
          await expect(popup).toHaveCSS('border-width', '0px');
          await expect(popup).toHaveCSS('border-radius', '12px');
          await expect(popup).toHaveCSS('box-shadow', 'rgba(0, 0, 0, 0.04) 0px 2px 8px 0px');
          await expect(popup).toHaveCSS('width', '240px');
          await expect(popup).toHaveCSS('height', '52px');
          const body = popup.getByText('부가 내용을 확인하세요.', { exact: true });
          await expect(body).toHaveCSS('font-size', '14px');
          await expect(body).toHaveCSS('line-height', '20px');
        }
        // Provider portals finish placement in the next update. React Aria also
        // rounds floating coordinates when the trigger has fractional width.
        await expect.poll(async () => {
          const r = await rect(popup);
          const gap = placement === 'bottom' ? r.y - anchor.y - anchor.height : placement === 'top' ? anchor.y - r.y - r.height : placement === 'right' ? r.x - anchor.x - anchor.width : anchor.x - r.x - r.width;
          return Math.abs(gap - 8);
        }).toBeLessThan(1);
        await close(page);
      }
      await configure(page, { placement: 'bottom', matchTriggerWidth: true, noPadding: true, text: '내용' });
      const matchedWidth = (await rect(anchorElement(page, platform))).width;
      await trigger(page).click();
      await expect(panel(page, platform)).toBeVisible();
      await expect.poll(async () => (await rect(panel(page, platform))).width).toBeCloseTo(matchedWidth, 0);
      await expect(panel(page, platform)).toHaveCSS('height', '20px');
      await close(page);
      await page.setViewportSize({ width: 320, height: 480 });
      await configure(page, { left: 180, top: 80, width: 120, matchTriggerWidth: false, noPadding: false, maxHeight: 160, text: 'https://example.com/' + 'content'.repeat(80) });
      await trigger(page).click();
      const popup = panel(page, platform);
      await expect(popup).toHaveCSS('height', '160px');
      await expect.poll(async () => {
        const r = await rect(popup);
        return r.x >= 8 && r.x + r.width <= 312;
      }).toBe(true);
      expect(await popup.evaluate(el => [el, ...el.querySelectorAll('*')].every(node => node.scrollWidth <= node.clientWidth + 1))).toBe(true);
      expect(await popup.evaluate(el => [el, ...el.querySelectorAll('*')].some(node => node.scrollHeight > node.clientHeight + 1 && ['auto', 'scroll'].includes(getComputedStyle(node).overflowY)))).toBe(true);
      if (platform === 'react') {
        await configure(page, { maxHeight: '140px' });
        await expect(popup).toHaveCSS('height', '140px');
      }
    }
  });

  test(`${platform}: packed examples show a quiet trigger and an intrinsic right-aligned action`, async ({ page }) => {
    await page.setViewportSize({ width: 800, height: 700 });
    await openFixture(page, platform, '?component=DsPopover', 'catalog');
    const open = page.getByRole('button', { name: '추가 정보', exact: true });
    await expect(open).toHaveCSS('background-color', 'rgba(0, 0, 0, 0)');
    await open.focus(); await open.press('Enter');
    const popup = panel(page, platform, '추가 정보'), run = popup.getByRole('button', { name: '실행', exact: true });
    await expect(run).toBeVisible();
    await expect(popup.getByText('팝오버 내용', { exact: true })).toHaveCSS('line-height', '20px');
    await expect(run).toHaveCSS('height', '40px');
    const p = await rect(popup), b = await rect(run);
    expect(b.width).toBeLessThan(100);
    expect(b.x + b.width).toBeCloseTo(p.x + p.width - 16, 0);
    await run.click();
    await expect(page.getByText('팝오버 실행', { exact: true })).toHaveCount(1);
    await page.mouse.click(750, 650);
    await expect(popup).not.toBeVisible();
    await open.press('Enter'); await expect(run).toBeVisible();
  });
}
