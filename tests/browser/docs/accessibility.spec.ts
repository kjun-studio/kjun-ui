import { test, expect, chromium, type Page } from '@playwright/test';
import { mkdtemp, mkdir, writeFile, readFile, rm } from 'node:fs/promises';
import generated from '../../../apps/docs/lib/generated/accessibility.json' with { type: 'json' };
import coverage from '../../../apps/docs/lib/generated/coverage.json' with { type: 'json' };
const ready = (page: Page) => expect(page.getByRole('button', { name: '문서 플랫폼', exact: true })).toBeEnabled();
const overflow = async (page: Page) => expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
const labels = ['키보드 동작', '라벨·오류 연결', '포커스 이동·복귀'];

for (const platform of ['vue2', 'react', 'native']) test(`${platform}: shared descriptions, API anchors and explicit record links connect exact check evidence`, async ({ page }) => {
  test.setTimeout(120000);
  for (const [path, name] of [['button', 'DsButton'], ['input', 'DsInput'], ['modal', 'DsModal'], ['select', 'DsSelect'], ['skeleton', 'DsSkeleton'], ['feedback', 'KjunFeedbackProvider']]) {
    await page.goto((path === 'feedback' ? '/feedback' : '/components/' + path) + '?platform=' + platform + '#accessibility'); await ready(page);
    await expect(page.locator('#accessibility [data-accessibility-item] h3')).toHaveText(labels);
    await expect(page.locator('#accessibility .accessibility-status')).toHaveCount(3);
    await expect(page.locator('#accessibility a.accessibility-status')).toHaveCount(0);
    const recordLink = page.getByRole('link', { name: '라벨·오류 연결 · 검증 기록 보기', exact: true });
    await recordLink.focus(); await page.keyboard.press('Shift+Tab'); await page.keyboard.press('Tab'); await expect(recordLink).toBeFocused();
    const href = await recordLink.getAttribute('href'); expect(href).toContain('component=' + name); expect(href).toContain('platform=' + platform); expect(href).toContain('#labeling');
    if (path === 'skeleton') await expect(page.locator('#accessibility')).toContainText('해당 없음 사유');
    if (path === 'input') {
      const api = page.locator('#accessibility .accessibility-api a').first(); const apiHref = await api.getAttribute('href');
      await api.click(); await expect(page).toHaveURL(url => url.hash === apiHref!.split('#')[1] || url.hash === '#' + apiHref!.split('#')[1]);
      await expect(page.locator('[id="' + apiHref!.split('#')[1] + '"]')).toBeVisible();
      await page.goBack(); await recordLink.focus();
    }
    await page.keyboard.press('Enter');
    await expect(page).toHaveURL(url => url.pathname === '/verification' && url.searchParams.get('component') === name && url.searchParams.get('platform') === platform && url.hash === '#labeling');
    await expect(page.locator('[data-verification-item] h2')).toHaveText(labels);
    await expect(page.locator('#labeling .verification-id')).toContainText(`${name}.${platform}.labeling.v1`);
    await expect(page.locator('#verification-environment')).toContainText('스크린리더');
    if (platform === 'native') await expect(page.locator('#verification-environment')).toContainText('Native Web');
    await page.goBack(); await expect(page.locator('#accessibility')).toBeVisible();
  }
});

test('component/platform/record restore on reload and back, including original JSON download', async ({ page, request }) => {
  const run = generated.runs[0];
  await page.goto(`/verification?component=DsInput&platform=react&record=${run.id}#focus`); await ready(page);
  await expect(page.getByRole('button', { name: '대상', exact: true })).toContainText('Input');
  await expect(page.locator('#focus .verification-id')).toContainText('DsInput.react.focus.v1');
  // Narrow the long target list the way a reader does instead of clicking in the same frame as a scripted scroll.
  await page.getByRole('button', { name: '대상', exact: true }).click(); await page.getByRole('textbox', { name: '선택 항목 검색' }).fill('Modal');
  await page.getByRole('option', { name: 'Modal', exact: true }).click();
  await expect(page).toHaveURL(url => url.searchParams.get('component') === 'DsModal');
  await page.getByRole('button', { name: '문서 플랫폼', exact: true }).click(); await page.getByRole('option', { name: 'React Native', exact: true }).click();
  await expect(page.locator('#focus .verification-id')).toContainText('DsModal.native.focus.v1');
  await page.goBack(); await expect(page.locator('#focus .verification-id')).toContainText('DsModal.react.focus.v1');
  await page.goBack(); await expect(page.getByRole('button', { name: '대상', exact: true })).toContainText('Input');
  await expect(page).toHaveURL(url => url.searchParams.get('record') === run.id && url.hash === '#focus');
  await page.reload(); await expect(page.locator('#focus .verification-id')).toContainText('DsInput.react.focus.v1');
  const link = page.getByRole('link', { name: '원본 실행 기록 다운로드 (.json)', exact: true });
  const response = await request.get((await link.getAttribute('href'))!); expect(response.ok()).toBe(true);
  expect((await response.body()).equals(await readFile('docs/accessibility-runs/' + run.id + '.json'))).toBe(true);
  const downloaded = page.waitForEvent('download'); await link.click(); expect((await downloaded).suggestedFilename()).toBe(run.id + '.json');
});

for (const width of [1600, 390]) test(`${width}px: expanded record links open implementation provenance and preserve original record date`, async ({ page, request }) => {
  await page.setViewportSize({ width, height: 1000 });
  await page.goto('/catalog?q=DsButton&platform=react#coverage'); await ready(page);
  // The table marks the name cell; the mobile card marks the whole card.
  const row = page.locator('[data-coverage-component="DsButton"]:visible').locator('xpath=ancestor-or-self::*[self::tr or @role="listitem"][1]');
  await expect(row.locator('.coverage-status')).toHaveText(['지원', '지원', '미리보기']);
  await expect(row.locator('a .coverage-status')).toHaveCount(0);
  const recordLink = row.getByRole('link', { name: 'Button Native Web 검증 기록 보기', exact: true });
  await expect(recordLink).toHaveCount(0);
  await row.getByRole('button', { name: 'Button 플랫폼 차이·근거 펼치기', exact: true }).click();
  for (const [platform, label] of [['vue2', 'Vue 2'], ['react', 'React'], ['native', 'Native Web']]) {
    const href = await row.getByRole('link', { name: `Button ${label} 검증 기록 보기`, exact: true }).getAttribute('href');
    expect(href).toContain('component=DsButton'); expect(href).toContain('platform=' + platform);
    expect(href).toContain('record=' + coverage.components.find(entry => entry.name === 'DsButton')!.recordId);
  }
  await overflow(page);
  await recordLink.focus(); await page.keyboard.press('Enter');
  await expect(page).toHaveURL(url => url.pathname === '/verification' && url.searchParams.get('platform') === 'native');
  const record = coverage.records.find(record => record.id === coverage.components.find(entry => entry.name === 'DsButton')!.recordId)!;
  await expect(page.locator('.verification-legacy time')).toHaveText(record.date);
  await expect(page.locator('.verification-legacy')).toContainText('구현');
  await expect(page.locator('#keyboard')).toContainText('자동검사 결과를 포함하지 않습니다');
  const response = await request.get(record.download); expect((await response.body()).equals(await readFile(record.source))).toBe(true);
  await page.goBack(); await expect(page.getByRole('textbox', { name: '컴포넌트 검색어', exact: true })).toHaveValue('DsButton');
});

test('failed, not-run, N/A, stale and invalid records are distinct without fallback success', async ({ page }) => {
  const failedRun = generated.runs.find(run => run.results.some(result => result.status === 'failed'))!;
  expect(failedRun).toBeTruthy(); const failed = failedRun.results.find(result => result.status === 'failed')!;
  await page.goto(`/verification?component=${failed.component}&platform=${failed.platform}&record=${failedRun.id}#${failed.item}`); await ready(page);
  await expect(page.locator('#' + failed.item + ' .accessibility-status')).toContainText('실패');
  await expect(page.locator('#' + failed.item + ' .verification-failure')).toContainText('실패 사유');
  const partial = generated.runs.find(run => run.results.some(result => result.status === 'not-run'))!;
  const skipped = partial.results.find(result => result.status === 'not-run')!;
  await page.goto(`/verification?component=${skipped.component}&platform=${skipped.platform}&record=${partial.id}#${skipped.item}`);
  await expect(page.locator('#' + skipped.item + ' .accessibility-status')).toContainText('미실행');
  await page.goto(`/verification?component=DsSkeleton&platform=react&record=${partial.id}#keyboard`);
  await expect(page.locator('#keyboard .accessibility-status')).toContainText('해당 없음');
  const stale = generated.runs.find(run => run.stale)!; expect(stale).toBeTruthy();
  await page.goto(`/verification?component=DsButton&platform=react&record=${stale.id}`);
  await expect(page.locator('.verification-stale')).toContainText('재검증 필요');
  await page.goto('/verification?component=DsInput&platform=react&record=missing-record');
  await expect(page.getByRole('alert')).toContainText('기록을 찾을 수 없습니다');
  await expect(page.locator('[data-verification-item]')).toHaveCount(0);
});

test('390px evidence layout contains text, selectors, observations and downloads without overflow', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/verification?component=KjunFeedbackProvider&platform=native'); await ready(page);
  await overflow(page); await page.getByText('검증한 패키지 버전·무결성', { exact: true }).click(); await overflow(page);
  await page.locator('#labeling').scrollIntoViewIfNeeded(); await overflow(page);
  await page.screenshot({ path: 'artifacts/accessibility-390.png', fullPage: true });
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto('/verification?component=DsInput&platform=react'); await ready(page);
  await page.screenshot({ path: 'artifacts/accessibility-desktop.png', fullPage: true });
});

test('actual browser 200% zoom keeps evidence controls and text readable', async () => {
  const directory = await mkdtemp('/tmp/kjun-a11y-zoom-');
  await mkdir(directory + '/Default');
  await writeFile(directory + '/Default/Preferences', JSON.stringify({ partition: { default_zoom_level: { x: Math.log(2) / Math.log(1.2) } } }));
  const context = await chromium.launchPersistentContext(directory, { channel: 'chromium', headless: true, viewport: null, args: ['--window-size=1440,1000'] });
  try {
    const page = await context.newPage(); await page.goto((process.env.KJUN_TEST_URL || 'http://127.0.0.1:4173') + '/verification?component=DsInput&platform=react'); await ready(page);
    expect(await page.evaluate(() => devicePixelRatio)).toBeGreaterThanOrEqual(2);
    await overflow(page); await expect(page.getByRole('button', { name: '대상', exact: true })).toBeVisible();
    const cdp = await context.newCDPSession(page);
    const screenshot = await cdp.send('Page.captureScreenshot', { captureBeyondViewport: false });
    await writeFile('artifacts/accessibility-zoom-200.png', Buffer.from(screenshot.data, 'base64'));
  } finally { await context.close(); await rm(directory, { recursive: true, force: true }); }
});
