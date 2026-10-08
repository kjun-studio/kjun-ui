import { test, expect, chromium, type Page } from '@playwright/test';
import { mkdtemp, mkdir, writeFile, rm } from 'node:fs/promises';
async function exercise(page: Page) {
  await page.goto('/elevation?platform=react', { waitUntil: 'domcontentloaded' });
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('레이어·Elevation');
  const details = page.getByRole('button', { name: '토큰 원형과 페이지 레이어 보기' });
  await expect(details).toHaveAttribute('aria-expanded', 'false');
  const preview = page.locator('[data-example="GuideLayerStack"]');
  const settings = preview.getByRole('button', { name: '예제 설정', exact: true });
  await expect(settings).toHaveAttribute('aria-expanded', 'false');
  await expect(preview.getByRole('spinbutton', { name: '하단 안전 영역' })).toBeHidden();
  await expect(page.locator('.elevation-concepts dt')).toHaveText(['표면 표현', '표시 순서', '입력·포커스']);
  const rule = page.getByRole('button', { name: '제어형 팝업의 상태 처리', exact: true });
  await expect(rule).toHaveAttribute('aria-expanded', 'false');
  await rule.click();
  await expect(page.getByText('제어형 상태 반영이 늦어도', { exact: false })).toBeVisible();
  await rule.click();
  await expect(page.locator('.elevation-examples .kjun-card').first()).toHaveCSS('box-shadow', 'none');
  const cards = page.locator('.elevation-card-comparison .kjun-card');
  const first = await cards.first().textContent();
  expect(await cards.allTextContents()).toEqual([first, first, first]);
  const sizes = await cards.evaluateAll(nodes => nodes.map(node => ({ width: node.getBoundingClientRect().width, height: node.getBoundingClientRect().height })));
  expect(sizes[1]).toEqual(sizes[0]);
  expect(sizes[2]).toEqual(sizes[0]);
  const shadows = await cards.evaluateAll(nodes => nodes.map(node => getComputedStyle(node).boxShadow));
  expect(shadows[0]).toBe('none');
  expect(new Set(shadows).size).toBe(3);
  const spacing = await page.locator('.elevation-card-comparison').evaluate(node => {
    const style = getComputedStyle(node);
    return { gap: parseFloat(style.gap), padding: parseFloat(style.paddingLeft) };
  });
  expect(spacing.gap).toBeGreaterThanOrEqual(16);
  expect(spacing.padding).toBeGreaterThanOrEqual(16);
  const popup = page.getByRole('button', { name: 'Popover 열기', exact: true });
  await popup.click();
  await page.getByRole('button', { name: '팝업에서 새 모달 열기' }).click();
  await expect(page.getByRole('dialog', { name: '새 활성 창' })).toBeVisible();
  await expect(page.getByRole('button', { name: '팝업에서 새 모달 열기' })).toHaveCount(0);
  await page.getByRole('button', { name: '중첩 창 열기', exact: true }).click();
  const nested = page.getByRole('dialog', { name: '중첩 창', exact: true });
  await expect(nested).toBeVisible();
  await expect(nested.locator('.elevation-status')).toContainText('중첩 창 열기 버튼');
  await page.keyboard.press('Escape');
  await expect(page.getByRole('button', { name: '중첩 창 열기', exact: true })).toBeFocused();
  await expect(page.getByRole('dialog', { name: '새 활성 창' })).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(popup).toBeFocused();
  await page.getByRole('button', { name: 'Drawer 열기', exact: true }).click();
  await expect(page.getByRole('dialog', { name: '배경을 차단하는 패널' })).toBeVisible();
  await page.keyboard.press('Escape');
  await page.getByRole('button', { name: 'Toast 표시', exact: true }).click();
  await expect(page.getByRole('alert').filter({ hasText: '그림자 없이' })).toHaveCSS('box-shadow', 'none');
  await expect(preview).toHaveAttribute('data-ready', 'true');
  const frame = preview.frameLocator('iframe');
  await expect(frame.getByRole('button').first()).toHaveText('팝업 메뉴');
  await frame.getByRole('button', { name: '팝업 메뉴', exact: true }).click();
  await frame.getByRole('button', { name: '새 모달 열기', exact: true }).click();
  await expect(frame.getByRole('dialog', { name: '팝업에서 연 새 모달' })).toBeVisible();
  await expect(frame.getByRole('button', { name: '새 모달 열기', exact: true })).toHaveCount(0);
  await page.keyboard.press('Escape');
  await expect(frame.getByRole('button', { name: '팝업 메뉴', exact: true })).toBeFocused();
  await settings.click();
  await expect(preview.getByRole('spinbutton', { name: '하단 안전 영역' })).toBeVisible();
  await settings.click();
  await details.click();
  await expect(details).toHaveAttribute('aria-expanded', 'true');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
}
test('elevation documentation preserves packed surfaces, disclosure defaults and focus at three widths', async ({ page, browserName }) => {
  test.setTimeout(180000);
  const errors: string[] = []; page.on('pageerror', error => errors.push(error.message));
  await page.emulateMedia({ reducedMotion: 'reduce' });
  for (const width of [320, 375, 1440]) {
    await page.setViewportSize({ width, height: 1000 });
    await exercise(page);
    await page.screenshot({ path: `artifacts/elevation/docs-${browserName}-${width}.png`, fullPage: true });
  }
  expect(errors).toEqual([]);
});
test('elevation documentation and windows remain usable at actual 200% browser zoom', async ({ browserName }) => {
  test.setTimeout(180000);
  test.skip(browserName !== 'chromium', 'Chromium profile preferences configure actual browser zoom.');
  const directory = await mkdtemp('/tmp/kjun-elevation-zoom-');
  await mkdir(directory + '/Default');
  await writeFile(directory + '/Default/Preferences', JSON.stringify({ partition: { default_zoom_level: { x: Math.log(2) / Math.log(1.2) } } }));
  const context = await chromium.launchPersistentContext(directory, { channel: 'chromium', headless: true, viewport: null,
    baseURL: process.env.KJUN_TEST_URL || 'http://127.0.0.1:4173', args: ['--window-size=1440,1000'] });
  try {
    const page = context.pages()[0];
    await exercise(page);
    expect(await page.evaluate(() => ({ width: innerWidth, ratio: devicePixelRatio }))).toEqual({ width: 720, ratio: 2 });
    await page.screenshot({ path: 'artifacts/elevation/docs-zoom200.png', fullPage: true });
  } finally { await context.close(); await rm(directory, { recursive: true, force: true }); }
});

for (const platform of ['react', 'vue2', 'native']) {
  test(`${platform} elevation walkthrough closes its popup and keeps modal Toast actionable`, async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 1000 });
    await page.goto('/elevation?platform=' + platform, { waitUntil: 'domcontentloaded' });
    const preview = page.locator('[data-example="GuideLayerStack"]');
    await expect(preview).toHaveAttribute('data-ready', 'true');
    await expect(preview.getByRole('button', { name: '예제 설정', exact: true })).toHaveAttribute('aria-expanded', 'false');
    const frame = preview.frameLocator('iframe');
    const popup = frame.getByRole('button', { name: '팝업 메뉴', exact: true });
    await expect(frame.getByRole('button').first()).toHaveText('팝업 메뉴');
    await popup.click();
    await frame.getByRole('button', { name: '새 모달 열기', exact: true }).click();
    await expect(frame.getByRole('dialog').last()).toBeVisible();
    await expect(frame.getByRole('button', { name: '새 모달 열기', exact: true })).toHaveCount(0);
    await page.keyboard.press('Escape');
    await expect(popup).toBeFocused();
    const confirm = frame.getByRole('button', { name: '변경 내용 확인', exact: true });
    await confirm.click();
    await frame.getByRole('button', { name: 'Toast 표시', exact: true }).click();
    const toast = frame.getByRole('alert').filter({ hasText: '변경 내용을 확인했습니다' });
    await expect(toast).toBeVisible();
    await toast.getByRole('button', { name: '기록 보기', exact: true }).click();
    await frame.getByRole('button', { name: '검토 완료', exact: true }).click();
    await expect(confirm).toBeFocused();
  });
}
