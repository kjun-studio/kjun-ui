import { test, expect } from '@playwright/test';
import { setIconFilled, setIconSize, chooseIcon, iconExample, launchIcon } from './icons-docs-helpers';
import { changePlatform } from './motion-docs-helpers';
test.describe.configure({ timeout: 180000 });
test('frame retry preserves selection even when unused source metadata fails', async ({ page }) => {
  await page.route('**/previews/catalog-react.html*', route => route.fulfill({ contentType: 'text/html', body: '<html></html>' }));
  await page.route('**/previews/sources/GuideIconSelection.json', route => route.abort());
  await page.goto('/icons?platform=react'); await chooseIcon(page, 'heart');
  const root = iconExample(page);
  await root.scrollIntoViewIfNeeded();
  await expect(root.getByText('실행 화면을 불러오지 못했습니다.')).toBeVisible();
  await chooseIcon(page, 'star'); await setIconSize(page, '18');
  await expect(root.getByText('실행 화면을 불러오지 못했습니다.')).toBeVisible();
  await page.unroute('**/previews/catalog-react.html*');
  await root.getByRole('button', { name: '다시 시도', exact: true }).click();
  await expect(root.locator('.guide-running')).toHaveAttribute('data-ready', 'true');
  await expect(root.frameLocator('iframe').locator('svg').first()).toHaveAttribute('width', '18');
  await expect(root.locator('.code-block')).toHaveCount(0);
  await expect(page.getByRole('button', { name: '아이콘 크기', exact: true })).toContainText('18 · ');
});
test('stale frame messages cannot overwrite a new icon selection', async ({ page }) => {
  await page.goto('/icons?platform=react'); await chooseIcon(page, 'heart');
  const root = await launchIcon(page);
  const oldSession = new URL((await root.locator('iframe').getAttribute('src'))!, page.url()).searchParams.get('session');
  await chooseIcon(page, 'star'); await setIconSize(page, '20');
  await setIconFilled(page);
  await expect(root.locator('.guide-running')).toHaveAttribute('data-ready', 'true');
  await root.frameLocator('iframe').locator('body').evaluate((_, session) => parent.postMessage({ type: 'kjun:catalog-snapshot', component: 'GuideIconSelection', platform: 'react', session, revision: 1, settings: { name: 'heart', size: 12, filled: false }, values: {}, height: 9999 }, location.origin), oldSession);
  await expect(root.frameLocator('iframe').locator('svg').first()).toHaveAttribute('width', '20');
  await changePlatform(page, 'native');
  await expect(root.locator('.guide-running')).toHaveAttribute('data-ready', 'true');
  await expect(root.frameLocator('iframe').locator('svg').first()).toHaveAttribute('width', '20');
  await expect(page.locator('.icon-name pre')).toHaveText('star');
});
test('clipboard failures and late completion never mark a new selection copied', async ({ page }) => {
  await page.addInitScript(() => {
    (window as any).__pendingCopies = [];
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText: () => new Promise((resolve, reject) => (window as any).__pendingCopies.push({ resolve, reject })) } });
  });
  await page.goto('/icons?platform=react'); await chooseIcon(page, 'heart');
  const name = page.locator('.icon-name');
  await name.getByRole('button', { name: '이름 복사' }).click();
  await chooseIcon(page, 'star'); await page.evaluate(() => (window as any).__pendingCopies.shift().resolve());
  await expect(name.locator('output')).toHaveText('');
  await name.getByRole('button', { name: '이름 복사' }).click();
  await page.evaluate(() => (window as any).__pendingCopies.shift().reject(Error('denied')));
  await expect(name.locator('output')).toContainText('공식 이름을 직접 선택'); await expect(name.locator('pre')).toHaveText('star');
});
