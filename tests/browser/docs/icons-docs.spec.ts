import { test, expect } from '@playwright/test';
import { icons, filledIcons } from '@kjun-ui/tokens/icons';
import { tokens } from '@kjun-ui/tokens';
import { setIconFilled, setIconSize, iconCard, iconExample, chooseIcon, launchIcon } from './icons-docs-helpers';
import { changePlatform, clipboard } from './motion-docs-helpers';
import { iconPageSize } from './docs-data';
test.describe.configure({ timeout: 180000 });
test('search, IME, pagination, keyboard selection, focus recovery and reset', async ({ page }) => {
  await page.goto('/icons?platform=react');
  await expect(page.getByRole('button', { name: '문서 검색', exact: true })).toBeEnabled();
  const input = page.getByLabel('이름·한국어 용도 검색');
  await expect(page.locator('.icon-card')).toHaveCount(iconPageSize);
  await expect(iconExample(page)).toHaveCount(0);
  await expect(iconCard(page, 'a-b')).toBeEnabled();
  await iconCard(page, 'a-b').focus(); await page.keyboard.press('Space');
  await expect(iconCard(page, 'a-b')).toHaveAttribute('aria-pressed', 'true');
  await expect(iconCard(page, 'a-b')).toBeFocused();
  await page.keyboard.press('Tab'); await expect(iconCard(page, 'a-b-2')).toBeFocused();
  await page.keyboard.press('Enter'); await expect(iconCard(page, 'a-b-2')).toHaveAttribute('aria-pressed', 'true');
  await expect(iconExample(page).locator('.guide-running')).toHaveAttribute('data-ready', 'true');
  await page.getByRole('button', { name: '선택한 아이콘 상세로 이동' }).click();
  await expect(page.getByRole('heading', { name: '선택한 아이콘 상세', exact: true })).toBeFocused();
  await page.getByRole('button', { name: '다음 페이지', exact: true }).click();
  await expect(page.locator('.icon-pagination')).toContainText('2 /');
  await expect(page.locator('.icon-detail')).toContainText('a-b');
  await input.focus(); await input.dispatchEvent('compositionstart'); await input.fill('즐겨찾기');
  await expect(page.locator('.icon-card')).toHaveCount(iconPageSize);
  await expect(page.locator('.icon-pagination')).toContainText('2 /');
  await input.dispatchEvent('compositionend', { data: '즐겨찾기' });
  await expect(input).toBeFocused(); await expect(iconCard(page, 'star')).toBeVisible();
  // A single result page needs no page navigation.
  await expect(page.locator('.icon-pagination')).toHaveCount(0);
  await expect(page.locator('.icon-detail')).toContainText('현재 검색 결과 밖');
  await input.fill('ARROW LEFT'); await expect(page.locator('.icon-official').first()).toHaveText('arrow-left');
  await input.fill('star 지우개'); await expect(page.locator('.icon-results')).toContainText('일치하는 아이콘이 없습니다');
  await page.getByRole('button', { name: '검색 초기화', exact: true }).click();
  await expect(input).toHaveValue(''); await expect(page.locator('.icon-card')).toHaveCount(iconPageSize);
  await expect(input).toBeFocused();
  await expect(page.getByRole('button', { name: '검색 초기화', exact: true })).toHaveCount(0);
  await iconCard(page, 'a-b').focus();
  // A result update caused outside the focused grid must recover a removed focus target.
  await page.getByRole('button', { name: '다음 페이지', exact: true }).evaluate((node: HTMLButtonElement) => node.click());
  await expect(page.getByRole('heading', { name: '검색 결과' })).toBeFocused();
});
for (const platform of ['react', 'vue2', 'native']) test(`${platform}: selection, shapes, sizes and source`, async ({ page }) => {
  await clipboard(page); await page.goto('/icons?platform=' + platform);
  await chooseIcon(page, 'heart'); const root = await launchIcon(page);
  const frame = root.frameLocator('iframe'), svg = frame.locator('svg').first();
  await setIconSize(page, '24');
  await setIconFilled(page);
  await expect(root.locator('.guide-running')).toHaveAttribute('data-ready', 'true');
  await expect(svg).toHaveAttribute('width', platform === 'vue2' ? '24px' : '24');
  const filledPath = filledIcons.heart.find(([tag]) => tag === 'path')![1].d;
  await expect(svg.locator('path').first()).toHaveAttribute('d', filledPath);
  await expect(root.locator('.code-block')).toHaveCount(0);
  await page.getByRole('button', { name: '이름 복사', exact: true }).click();
  await expect.poll(() => page.evaluate(() => (window as any).__motionCopies.at(-1))).toBe('heart');
  await chooseIcon(page, 'star'); await expect(page.getByLabel('채움형', { exact: true })).toBeChecked();
  // The full registry adds search's official filled variant; arrow-left is outline-only.
  await chooseIcon(page, 'search'); await expect(page.getByLabel('채움형', { exact: true })).toBeChecked();
  await chooseIcon(page, 'arrow-left'); await expect(page.getByLabel('채움형', { exact: true })).toBeDisabled();
  await expect(page.locator('.icon-detail [role=status]').first()).toContainText('선형으로 전환');
  await chooseIcon(page, 'heart'); await expect(page.getByLabel('선형', { exact: true })).toBeChecked();
  await expect(page.getByRole('button', { name: '아이콘 크기', exact: true })).toContainText('24 · ');
  // The detail preview is a comparison view: settings live beside it, so it has no reset control.
  await expect(root.getByRole('button', { name: '초기화', exact: true })).toHaveCount(0);
  await chooseIcon(page, 'refresh');
  await expect(root.locator('.guide-running')).toHaveAttribute('data-ready', 'true');
  await expect(svg.locator('g[transform="matrix(-1 0 0 1 24 0)"]')).toHaveCount(0);
  await expect(svg.locator('path').first()).toHaveAttribute('d', icons.refresh[0][1].d);
  const variants = await launchIcon(page, 'variants'), shapes = variants.frameLocator('iframe').locator('svg');
  await expect(shapes).toHaveCount(6);
  await expect(shapes.nth(4).locator('path').first()).toHaveAttribute('d', icons.search.find(([tag]) => tag === 'path')![1].d);
  await expect(shapes.nth(5).locator('path').first()).toHaveAttribute('d', icons['help-circle'].find(([tag]) => tag === 'path')![1].d);
  const align = await launchIcon(page, 'alignment'), af = align.frameLocator('iframe'), sizes = af.locator('svg');
  for (const [i, size] of Object.values(tokens.iconSizes).entries()) await expect(sizes.nth(i)).toHaveAttribute('width', platform === 'vue2' ? size + 'px' : String(size));
  if (platform !== 'native') {
    await af.getByRole('button', { name: '글자 크기 24px로 변경' }).click();
    await expect.poll(() => sizes.nth(10).evaluate(node => node.getBoundingClientRect().width)).toBe(24);
    await expect.poll(() => sizes.nth(11).evaluate(node => node.getBoundingClientRect().width)).toBe(16);
    await align.getByRole('button', { name: '초기화', exact: true }).click();
    await expect(af.getByRole('button', { name: '글자 크기 24px로 변경' })).toBeVisible();
  }
  const toggle = await launchIcon(page, 'toggle'), toggleButton = toggle.frameLocator('iframe').getByRole('button').first();
  await toggleButton.click(); await expect(toggleButton).toHaveAttribute('aria-pressed', 'true');
});
test('platform changes keep selection and replace sessions; document links and departure', async ({ page }) => {
  await page.goto('/icons?platform=react#catalog'); await chooseIcon(page, 'star');
  await setIconSize(page, '20'); await setIconFilled(page);
  const root = await launchIcon(page), previous = await root.locator('iframe').getAttribute('src');
  for (const platform of ['vue2', 'native', 'react']) {
    await changePlatform(page, platform);
    await expect(root.locator('.guide-running')).toHaveAttribute('data-ready', 'true');
    await expect(root.locator('.guide-running')).toHaveAttribute('data-platform', platform);
    await expect(page.getByRole('button', { name: '아이콘 크기', exact: true })).toContainText('20 · '); await expect(page.getByLabel('채움형', { exact: true })).toBeChecked();
    await expect(root.locator('iframe')).not.toHaveAttribute('src', previous!);
    await expect(page.locator('.icon-detail').getByRole('link', { name: 'Icon API', exact: true })).toHaveAttribute('href', '/components/icon?platform=' + platform + '#api');
  }
  await page.locator('.icon-detail').getByRole('link', { name: 'Icon API', exact: true }).click();
  await expect(page).toHaveURL(/\/components\/icon\?platform=react#api/);
  await page.locator('#guidelines').getByRole('link', { name: '아이콘 목록·검색' }).click();
  await expect(page).toHaveURL(/\/icons\?platform=react#catalog/);
  await expect(iconExample(page)).toHaveCount(0);
  for (const id of ['catalog', 'size-alignment', 'variants', 'usage']) await expect(page.locator('main #' + id)).toHaveCount(1);
});
test('table of contents, previous/next navigation and document search', async ({ page }) => {
  await page.goto('/icons?platform=vue2#variants');
  await expect(page.getByRole('button', { name: '문서 검색', exact: true })).toBeEnabled();
  const toc = page.getByRole('navigation', { name: '상세 문서 바로가기' });
  await expect(toc.getByRole('link')).toHaveText(['아이콘 목록·검색', '크기·정렬', '형태 선택', '사용 규칙']);
  await toc.getByRole('link', { name: '사용 규칙', exact: true }).click();
  await expect(page).toHaveURL(/platform=vue2#usage/); await expect(page.locator('#usage')).toBeFocused();
  await expect(page.locator('.page-navigation a').first()).toHaveAttribute('href', '/interaction?platform=vue2');
  await expect(page.locator('.page-navigation a').last()).toHaveAttribute('href', '/usage-guide?platform=vue2');
  await page.getByRole('button', { name: '문서 검색', exact: true }).click();
  const dialog = page.getByRole('dialog', { name: '문서 검색', exact: true });
  const input = dialog.getByRole('combobox', { name: '문서 검색어' });
  await input.fill('아이콘 검색');
  await expect(dialog.getByRole('option').first()).toContainText('아이콘');
  await page.keyboard.press('Enter'); await expect(page).toHaveURL(/\/icons\?platform=vue2/);
});

test('initial controls wait for hydration and the final build keeps selected settings', async ({ page }) => {
  test.setTimeout(180000);
  let release!: () => void;
  const loaded = new Promise<void>(resolve => { release = resolve; });
  await page.route('**/*.js', async route => { if (route.request().resourceType() === 'script') await loaded; await route.continue(); });
  await page.goto('/icons?platform=react', { waitUntil: 'commit' });
  await expect(page.getByLabel('이름·한국어 용도 검색')).toBeDisabled();
  await expect(page.locator('.icon-card')).toHaveCount(0);
  release();
  await chooseIcon(page, 'star');
  await expect(page.locator('.icon-card').first()).toBeFocused();
  await setIconSize(page, '24');
  await setIconFilled(page);
  const root = await launchIcon(page);
  await expect(root.frameLocator('iframe').locator('svg').first()).toHaveAttribute('width', '24');
  await root.locator('iframe').focus();
  await expect(root.locator('iframe')).toBeFocused();
  for (const width of [1440, 375, 320]) {
    await page.setViewportSize({ width, height: 1000 });
    await page.locator('.icon-detail').scrollIntoViewIfNeeded();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
    await page.screenshot({ path: `artifacts/icons-review/final-detail-${width}.png` });
  }
});
