import { test, expect } from '@playwright/test';
import { platforms, changePlatform } from './motion-docs-helpers';
import { a11yExample, launch } from './accessibility-docs-helpers';
import { shortcutCount } from './docs-data';
for (const platform of platforms) {
  test(`${platform}: accessibility navigation, manual entry, reset, runtime state and platform cleanup`, async ({ page }) => {
    await page.goto('/accessibility?platform=' + platform);
    await expect(page.getByRole('heading', { level: 1, name: '접근성', exact: true })).toBeVisible();
    await expect(page.locator('.document-shortcuts a')).toHaveCount(shortcutCount('accessibility'));
    await expect(page.locator('.doc-nav a[aria-current="page"]')).toHaveText('접근성');
    await expect(page.locator('.page-navigation a').first()).toHaveAttribute('href', `/styling?platform=${platform}`);
    await expect(page.locator('.page-navigation a').last()).toHaveAttribute('href', `/interaction?platform=${platform}`);
    for (const link of await page.locator('.document-shortcuts a').all()) {
      const hash = await link.getAttribute('href'); await link.click();
      await expect(page).toHaveURL(url => url.hash === hash && url.searchParams.get('platform') === platform);
      await expect(page.locator(hash!)).toBeFocused();
    }
    const tabRoot = await launch(page, 'tabs'), tabs = tabRoot.frameLocator('iframe');
    await expect(tabs.getByRole('tab', { name: '첫 탭', exact: true })).toBeFocused();
    await page.keyboard.press('ArrowRight'); await expect(tabs.getByRole('tab', { name: '둘째 탭' })).toBeFocused();
    await page.keyboard.press('Tab'); await expect(tabs.getByRole('tabpanel')).toBeFocused();
    await expect(tabRoot.getByRole('link', { name: '상세 예제' })).toHaveAttribute('href', `/components/tabs?platform=${platform}#accessibility`);
    const modalRoot = await launch(page, 'modal'), modal = modalRoot.frameLocator('iframe');
    await page.keyboard.press('Enter'); await expect(modal.getByRole('dialog', { name: '작업 확인', exact: true })).toBeVisible();
    await page.keyboard.press('Escape'); await expect(modal.getByRole('dialog')).toHaveCount(0);
    await expect(modal.getByRole('button', { name: '모달 열기' })).toBeFocused();
    const reset = modalRoot.getByRole('button', { name: '초기화', exact: true });
    await reset.focus(); await page.keyboard.press('Enter');
    await expect(modalRoot.locator('.guide-running')).toHaveAttribute('data-ready', 'true');
    await expect(reset).toBeFocused(); await expect(modal.getByRole('dialog')).toHaveCount(0);
    await modal.getByRole('button', { name: '모달 열기', exact: true }).click();
    await expect(modal.getByRole('dialog', { name: '작업 확인', exact: true })).toBeVisible();
    // An open modal traps keyboard focus inside its iframe. Use the document
    // reset control by pointer; keyboard reset is covered above after Escape.
    await reset.click();
    await expect(modalRoot.locator('.guide-running')).toHaveAttribute('data-ready', 'true');
    await expect(reset).toBeFocused(); await expect(modal.getByRole('dialog')).toHaveCount(0);
    const formRoot = await launch(page, 'form'), form = formRoot.frameLocator('iframe');
    await expect(form.getByRole('textbox', { name: '목록 이름', exact: true })).toBeFocused();
    await form.getByRole('textbox', { name: '목록 이름', exact: true }).fill('장기 투자');
    await form.getByRole('button', { name: '오류 표시', exact: true }).click();
    await expect(form.getByRole('textbox', { name: '목록 이름', exact: true })).toHaveAccessibleDescription(/목록 이름을 입력/);
    await form.getByRole('button', { name: '목록 검색', exact: true }).click();
    await expect(form.getByText('검색 실행: 장기 투자', { exact: true })).toBeVisible();
    await expect(formRoot.locator('.code-block')).toHaveCount(0);
    await modal.getByRole('button', { name: '모달 열기' }).click();
    const next = platform === 'react' ? 'vue2' : 'react'; await changePlatform(page, next);
    await expect(page.getByRole('button', { name: '문서 플랫폼', exact: true })).toBeFocused();
    await expect(modalRoot.locator('.guide-running')).toHaveAttribute('data-platform', next);
    await expect(modalRoot.locator('.guide-running')).toHaveAttribute('data-ready', 'true');
    await expect(modalRoot.frameLocator('iframe').getByRole('dialog')).toHaveCount(0);
    await expect(formRoot.frameLocator('iframe').getByRole('textbox', { name: '목록 이름', exact: true })).toHaveValue('');
    await tabRoot.getByRole('link', { name: '상세 예제' }).click();
    await expect(page).toHaveURL(new RegExp(`/components/tabs\\?platform=${next}#accessibility$`));
    await expect(page.locator('[data-guide-case="accessibility-tabs"]')).toHaveCount(0);
    await page.getByRole('link', { name: '접근성 공통 가이드', exact: true }).click();
    await expect(page).toHaveURL(new RegExp(`/accessibility\\?platform=${next}$`));
    await expect(page.locator('.guide-running')).toHaveCount(0);
  });
}
test('manual launch does not steal focus after loading; failed frame retry keeps the entry control', async ({ page }) => {
  await page.route('**/previews/catalog-react.html?**', route => route.abort());
  await page.goto('/accessibility?platform=react');
  const root = a11yExample(page, 'tabs'); await root.getByRole('button', { name: '실행 예제 열기', exact: true }).click();
  const heading = page.getByRole('heading', { name: '키보드 조작', exact: true });
  await heading.evaluate(node => { node.setAttribute('tabindex', '-1'); (node as HTMLElement).focus(); });
  await expect(root.getByRole('button', { name: '실행 예제 다시 시도' })).toBeVisible();
  await expect(heading).toBeFocused();
  await page.unroute('**/previews/catalog-react.html?**');
  await root.getByRole('button', { name: '다시 시도', exact: true }).click();
  await expect(root.locator('.guide-running')).toHaveAttribute('data-ready', 'true');
  await expect(root.getByRole('button', { name: '예제로 이동' })).toBeFocused();
});
