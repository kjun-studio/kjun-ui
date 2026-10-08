import { expect, test, type Page, type Locator } from '@playwright/test';
import { openFixture } from './packed-fixture';
import { demoPalettes } from '../../shared/demo-colors';
const configure = (page: Page, next: object) => page.evaluate(next => (window as any).configureAccordion(next), next);
const headers = (page: Page) => page.getByTestId('frame').locator('button[aria-expanded], [role="button"][aria-expanded]');
const box = async (node: Locator) => (await node.boundingBox())!;
const bodyText = '이 계정에서 사용할 기본 정보를 확인하고 변경할 수 있습니다.';
const rgb = (hex: string) => 'rgb(' + [1, 3, 5].map(n => parseInt(hex.slice(n, n + 2), 16)).join(', ') + ')';

for (const platform of ['react', 'vue2', 'native']) {
  test(`${platform}: flat accordion geometry, title hierarchy and content spacing remain legible`, async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.setViewportSize({ width: 390, height: 800 });
    for (const palette of ['default', 'dark'] as const) {
      await page.setViewportSize({ width: 390, height: 800 });
      await openFixture(page, platform, '?palette=' + palette, 'accordion-design');
      const group = page.getByTestId('frame').locator(':scope > *').first();
      for (const tone of ['card', 'muted']) {
        await configure(page, { tone });
        await expect(group).toHaveCSS('background-color', rgb(demoPalettes[palette][tone === 'card' ? 'surface' : 'secondary']));
        await expect(group).toHaveCSS('box-shadow', 'none');
      }
      await expect(headers(page).first()).toHaveCSS('height', '48px');
      const title = headers(page).first().getByText('계정 설정', { exact: true });
      await expect(title).toHaveCSS('font-size', '14px'); await expect(title).toHaveCSS('font-weight', '600');
      await expect(headers(page).first().locator('svg')).toHaveCSS('width', '16px');
      await expect(headers(page).first().locator('svg')).toHaveCSS('stroke', rgb(demoPalettes[palette].textSecondary));
      expect(await group.evaluate(el => [el, ...el.querySelectorAll('*')].filter(node => node.tagName.toLowerCase() !== 'svg' && !node.closest('svg')).every(node => {
        const s = getComputedStyle(node); return s.borderTopWidth === '0px' && s.borderBottomWidth === '0px';
      }))).toBe(true);
      await headers(page).first().hover(); await expect(headers(page).first()).toHaveCSS('background-color', rgb(demoPalettes[palette].hover));
      await headers(page).first().click(); await page.mouse.move(0, 0);
      await expect(headers(page).first()).toHaveCSS('background-color', 'rgba(0, 0, 0, 0)');
      const body = page.getByTestId('frame').getByText(bodyText, { exact: true });
      await expect(body).toBeVisible(); await expect(body).toHaveCSS('font-size', '14px'); await expect(body).toHaveCSS('font-weight', '400');
      expect(await body.evaluate(el => { const r = document.createRange(); r.selectNodeContents(el); return r.getBoundingClientRect().x; })).toBe((await box(title)).x);
      await expect(platform === 'native' ? body.locator('..') : body).toHaveCSS('padding-bottom', '20px');
      const rotated = platform === 'native' ? headers(page).first().locator('svg').locator('..').locator('..') : headers(page).first().locator('svg');
      await expect(rotated).toHaveCSS('transform', 'matrix(-1, 0, 0, -1, 0, 0)');
      const longTitle = '작업 중인 프로젝트의 계정과 알림 환경을 함께 관리하는 설정';
      await configure(page, { title: longTitle, body: 'https://example.com/' + 'identifier'.repeat(25) });
      await page.setViewportSize({ width: 320, height: 800 });
      expect((await box(headers(page).first())).height).toBeGreaterThan(48);
      const icon = await box(headers(page).first().locator('svg'));
      expect(icon.width).toBe(16); expect(icon.x + icon.width).toBeLessThanOrEqual(304);
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(320);
    }
  });

  test(`${platform}: keyboard toggles, panel focus and disabled controls preserve opening rules`, async ({ page }) => {
    await openFixture(page, platform, '', 'accordion-design');
    await configure(page, { action: true });
    await headers(page).first().focus(); await headers(page).first().press('Enter');
    await expect(headers(page).first()).toHaveAttribute('aria-expanded', 'true');
    await expect(headers(page).first()).toHaveCSS('outline-width', '2px');
    await headers(page).first().press('Tab'); await expect(page.getByRole('button', { name: '본문 행동' })).toBeFocused();
    await page.getByRole('button', { name: '본문 행동' }).press('Shift+Tab'); await expect(headers(page).first()).toBeFocused();
    await headers(page).first().press('Space'); await expect(headers(page).first()).toHaveAttribute('aria-expanded', 'false');
    await expect(page.getByRole('button', { name: '본문 행동' })).toHaveCount(0);
    await headers(page).first().press('Enter'); await headers(page).nth(1).click();
    await expect(headers(page).first()).toHaveAttribute('aria-expanded', 'false');
    await configure(page, { multiple: true }); await headers(page).first().click();
    await expect(headers(page).first()).toHaveAttribute('aria-expanded', 'true'); await expect(headers(page).nth(1)).toHaveAttribute('aria-expanded', 'true');
    await configure(page, { disabled: true }); await expect(headers(page).first()).toBeDisabled();
    await expect(headers(page).first()).toHaveCSS('opacity', '0.5');
    const b = await box(headers(page).first()); await page.mouse.click(b.x + b.width / 2, b.y + b.height / 2);
    await expect(headers(page).first()).toHaveAttribute('aria-expanded', 'true');
    await expect(headers(page).first()).toHaveCSS('background-color', 'rgba(0, 0, 0, 0)');
  });
}
