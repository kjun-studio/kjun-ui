import { test, expect, chromium, type Page } from '@playwright/test';
import { readFile, mkdtemp, mkdir, writeFile, rm } from 'node:fs/promises';
import { presetConfig } from '../../../shared/example-registry';
// @ts-ignore Node-only compiler of copied examples against installed tarballs.
import { prepareExample, compileEntries } from '../../../scripts/example-consumers.mjs';
// @ts-ignore Fresh packed previews, independent of the running docs production build.
import { servePreviews } from '../../../scripts/guide-capture.mjs';

let previewServer: { url: string; close: () => Promise<void> };
test.beforeAll(async () => { previewServer = await servePreviews(); });
test.afterAll(async () => { await previewServer.close(); });

async function configure(page: Page, name: string, settings = {}, values = {}, revision = 1) {
  await page.evaluate(config => {
    window.postMessage({ type: 'kjun:catalog-configure', config }, location.origin);
  }, { settings: { ...presetConfig(name).settings, ...settings }, values, revision, reset: revision });
  await expect.poll(() => page.evaluate(() => (window as any).foundationSnapshot?.revision)).toBe(revision);
}
async function visit(page: Page, platform: string, name: string, settings = {}) {
  await page.addInitScript(() => window.addEventListener('message', event => {
    if (event.data?.type === 'kjun:catalog-snapshot') (window as any).foundationSnapshot = event.data;
  }));
  await page.goto(`${previewServer.url}/previews/catalog-${platform}.html?component=${name}`);
  await expect.poll(() => page.evaluate(() => !!(window as any).foundationSnapshot)).toBe(true);
  await configure(page, name, settings);
}
async function replay(page: Page, platform: string, name: string) {
  const state: any = await page.evaluate(() => new Promise(resolve => {
    const receive = (event: MessageEvent) => {
      if (event.data?.type !== 'kjun:catalog-copy-result' || event.data.requestId !== 'foundation-copy') return;
      window.removeEventListener('message', receive); resolve(event.data.snapshot);
    };
    window.addEventListener('message', receive);
    window.postMessage({ type: 'kjun:catalog-copy', requestId: 'foundation-copy' }, location.origin);
  }));
  const id = name + '-foundation-copy';
  const entry = await prepareExample(platform, name, 'foundation-copy', state.settings, state.values);
  await compileEntries(platform, { [id]: entry });
  await page.route('**/previews/export-checks/**', async route => {
    const path = new URL(route.request().url()).pathname.split('/export-checks/')[1];
    await route.fulfill({ body: await readFile('artifacts/export-checks/' + path), contentType: path.endsWith('.html') ? 'text/html' : path.endsWith('.js') ? 'application/javascript' : 'text/css' });
  });
  await page.goto(`${previewServer.url}/previews/export-checks/${platform}/${id}.html`);
}
async function bottomIsReachable(page: Page) {
  const scroll = page.getByTestId('foundation-scroll');
  await scroll.evaluate(el => { el.scrollTop = el.scrollHeight; });
  const last = page.getByText('마지막 콘텐츠', { exact: true });
  await expect(last).toBeVisible();
  await expect.poll(async () => {
    // Native onLayout can increase bottom padding after the first scroll.
    await scroll.evaluate(el => { el.scrollTop = el.scrollHeight; });
    const end = (await last.boundingBox())!, dock = (await page.getByTestId('foundation-dock').boundingBox())!;
    return end.y + end.height <= dock.y + 1;
  }).toBe(true);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
}

for (const platform of ['vue2', 'react', 'native']) {
  test(`${platform} Foundation uses available width, exact boundaries and reading order`, async ({ page }) => {
    await visit(page, platform, 'GuideScreenLayout', { long: true });
    await page.getByRole('textbox', { name: '프로젝트 이름', exact: true }).fill('유지할 입력');
    for (const width of [320, 375, 767, 768, 1023, 1024, 1199, 1200, 1440]) {
      await page.setViewportSize({ width, height: 1000 });
      const gutter = width < 768 ? 16 : width < 1200 ? 24 : 32;
      await expect(page.getByTestId('foundation-area')).toContainText(`가용 폭 ${width}px · ${width < 1024 ? '1열' : '2열'} · 좌우 ${gutter}px`);
      const container = (await page.getByTestId('foundation-container').boundingBox())!;
      const main = (await page.getByTestId('foundation-main').boundingBox())!, aside = (await page.getByTestId('foundation-aside').boundingBox())!;
      expect(container.width).toBeCloseTo(Math.min(width, 1200), 0);
      expect(main.x - container.x).toBeCloseTo(gutter, 0);
      if (width < 1024) expect(aside.y - main.y - main.height).toBeCloseTo(width < 768 ? 16 : 24, 0);
      else {
        expect(main.y).toBeCloseTo(aside.y, 0);
        expect(main.width / aside.width).toBeCloseTo(2, 1);
        expect(aside.x - main.x - main.width).toBeCloseTo(24, 0);
      }
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      await expect(page.getByRole('textbox')).toHaveValue('유지할 입력');
    }
    await page.getByRole('textbox').focus();
    await page.keyboard.press('Tab');
    await expect(page.getByRole('button', { name: '변경 사항 저장', exact: true })).toBeFocused();
    await page.keyboard.press('Tab');
    await expect(page.getByRole('button', { name: '변경 기록', exact: true })).toBeFocused();
    await configure(page, 'GuideScreenLayout', { reading: true }, { project: '복사한 입력' }, 2);
    await expect(page.getByTestId('foundation-aside')).toHaveCount(0);
    expect((await page.getByTestId('foundation-container').boundingBox())!.width).toBeCloseTo(720, 0);
    await replay(page, platform, 'GuideScreenLayout');
    await expect(page.getByRole('textbox')).toHaveValue('복사한 입력');
    expect((await page.getByTestId('foundation-container').boundingBox())!.width).toBeCloseTo(720, 0);
  });

  test(`${platform} CTA remeasures long content, keyboard and safe area without covering the end`, async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 1000 });
    await visit(page, platform, 'GuideScrollCTA');
    for (const overlay of [false, true]) {
      await configure(page, 'GuideScrollCTA', { overlay }, {}, overlay ? 3 : 2);
      await bottomIsReachable(page);
      const initialHeight = (await page.getByTestId('foundation-dock').boundingBox())!.height;
      await page.getByRole('button', { name: '긴 CTA 문구', exact: true }).click();
      await expect.poll(async () => (await page.getByTestId('foundation-dock').boundingBox())!.height).toBeGreaterThan(initialHeight);
      await bottomIsReachable(page);
      await page.getByRole('button', { name: '키보드 상태 적용', exact: true }).click();
      await expect(page.getByRole('navigation')).toHaveCount(0);
      await bottomIsReachable(page);
      await page.getByRole('button', { name: '키보드 상태 해제', exact: true }).click();
      await expect(page.getByRole('navigation')).toBeVisible();
      await bottomIsReachable(page);
    }
    // A safe inset is counted once, even when both bottom components are shown.
    await configure(page, 'GuideScrollCTA', { overlay: true, safeAreaBottom: 0 }, {}, 4);
    const withoutInset = (await page.getByTestId('foundation-dock').boundingBox())!.height;
    await configure(page, 'GuideScrollCTA', { overlay: true, safeAreaBottom: 34 }, {}, 5);
    await expect.poll(async () => (await page.getByTestId('foundation-dock').boundingBox())!.height - withoutInset).toBeCloseTo(34, 0);
    await page.getByRole('textbox').fill('복사한 화면');
    await replay(page, platform, 'GuideScrollCTA');
    await expect(page.getByRole('textbox')).toHaveValue('복사한 화면');
    await bottomIsReachable(page);
  });

  test(`${platform} Modal and actionable Toast stay above CTA and restore focus`, async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 900 });
    await visit(page, platform, 'GuideLayerStack', { overlay: true, long: true });
    const trigger = page.getByRole('button', { name: '변경 내용 확인', exact: true });
    await trigger.focus(); await trigger.click();
    const dialog = page.getByRole('dialog').last();
    await expect(dialog).toBeVisible();
    await expect.poll(async () => (await dialog.boundingBox())!.height).toBeCloseTo(440, 0);
    expect(await trigger.evaluate(el => {
      const rect = el.getBoundingClientRect();
      return el.contains(document.elementFromPoint(rect.x + rect.width / 2, rect.y + rect.height / 2));
    })).toBe(false);
    const background = page.getByTestId('foundation-scroll');
    const backgroundBefore = await background.evaluate(el => el.scrollTop);
    await page.getByRole('button', { name: 'Toast 표시', exact: true }).click();
    const toast = page.getByRole('alert').filter({ hasText: '변경 내용을 확인했습니다' });
    await expect(toast).toBeVisible();
    const toastBox = (await toast.boundingBox())!;
    expect(toastBox.y + toastBox.height).toBeLessThanOrEqual((await dialog.boundingBox())!.y);
    const action = toast.getByRole('button', { name: '기록 보기', exact: true });
    await action.focus(); await action.press('Enter');
    await expect.poll(() => page.evaluate(() => (window as any).foundationSnapshot.values.message)).toBe('알림의 기록 보기 실행');
    await page.getByText('모달 마지막 콘텐츠', { exact: true }).scrollIntoViewIfNeeded();
    await expect(page.getByRole('button', { name: '검토 완료', exact: true })).toBeVisible();
    expect(await background.evaluate(el => el.scrollTop)).toBe(backgroundBefore);
    await page.getByRole('button', { name: '검토 완료', exact: true }).focus();
    for (let i = 0; i < 8; i++) {
      await page.keyboard.press('Tab');
      expect(await trigger.evaluate(el => el === document.activeElement)).toBe(false);
      expect(await background.evaluate(el => el.contains(document.activeElement))).toBe(false);
    }
    await page.getByRole('button', { name: '검토 완료', exact: true }).click();
    await expect(page.getByRole('dialog')).toHaveCount(0);
    await expect(trigger).toBeFocused();
    await replay(page, platform, 'GuideLayerStack');
    await page.getByRole('button', { name: '변경 내용 확인', exact: true }).click();
    await expect(page.getByRole('dialog').last()).toBeVisible();
    await page.getByRole('button', { name: 'Toast 표시', exact: true }).click();
    await expect(page.getByRole('button', { name: '기록 보기', exact: true })).toBeVisible();
    await page.getByRole('button', { name: '검토 완료', exact: true }).click();
    await expect(page.getByRole('dialog')).toHaveCount(0);
    // The persistent Toast returns to the page when its Modal closes; dismiss it before using what it covers.
    const persistent = page.getByRole('alert').filter({ hasText: '변경 내용을 확인했습니다' });
    await persistent.getByRole('button', { name: '알림 닫기', exact: true }).click();
    await expect(persistent).toHaveCount(0);
    const popupTrigger = page.getByRole('button', { name: '팝업 메뉴', exact: true });
    await popupTrigger.click();
    await page.getByRole('button', { name: '새 모달 열기', exact: true }).click();
    await expect(page.getByRole('button', { name: '알림 표시', exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: '새 모달 열기', exact: true })).toHaveCount(0);
    await page.keyboard.press('Escape');
    await expect(popupTrigger).toBeFocused();
  });
}

test('Foundation routes, search and wide packed preview are connected', async ({ page }) => {
  for (const path of ['/layout', '/elevation']) {
    await page.goto(path + '?platform=react');
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(path === '/layout' ? '화면 배치' : '레이어·Elevation');
  }
  await page.getByRole('button', { name: '문서 검색', exact: true }).click();
  const search = page.getByRole('dialog', { name: '문서 검색', exact: true });
  await search.getByRole('combobox').fill('z-index');
  await expect(search.getByRole('option').first()).toContainText('레이어·Elevation');
  await page.keyboard.press('Escape');
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto('/layout?platform=react');
  const preview = page.locator('[data-example="GuideScreenLayout"]');
  await expect(preview).toHaveAttribute('data-ready', 'true');
  await preview.getByRole('button', { name: '넓게 보기', exact: true }).click();
  await expect(page.getByRole('dialog').frameLocator('iframe').getByTestId('foundation-area')).toContainText('2열');
  await page.keyboard.press('Escape');
  await page.setViewportSize({ width: 375, height: 900 });
  for (const path of ['/layout', '/elevation']) {
    await page.goto(path + '?platform=react');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  }
});

test('Foundation remains usable at actual 200% browser zoom', async () => {
  test.setTimeout(120000);
  const directory = await mkdtemp('/tmp/kjun-foundation-zoom-');
  await mkdir(directory + '/Default');
  await writeFile(directory + '/Default/Preferences', JSON.stringify({ partition: { default_zoom_level: { x: Math.log(2) / Math.log(1.2) } } }));
  const context = await chromium.launchPersistentContext(directory, {
    channel: 'chromium', headless: true, viewport: null,
    baseURL: process.env.KJUN_TEST_URL || 'http://127.0.0.1:4173', args: ['--window-size=1440,1000'],
  });
  try {
    const page = context.pages()[0];
    for (const platform of ['vue2', 'react', 'native']) {
      await visit(page, platform, 'GuideScreenLayout', { long: true });
      expect(await page.evaluate(() => ({ width: innerWidth, ratio: devicePixelRatio }))).toEqual({ width: 720, ratio: 2 });
      await expect(page.getByTestId('foundation-area')).toContainText('1열');
      await page.getByRole('textbox').fill('확대 화면 입력');
      await expect(page.getByRole('textbox')).toHaveValue('확대 화면 입력');
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      await visit(page, platform, 'GuideScrollCTA', { overlay: true, long: true, keyboardVisible: true });
      await bottomIsReachable(page);
      await page.getByRole('button', { name: '변경 사항 저장', exact: true }).click();
      await expect.poll(() => page.evaluate(() => (window as any).foundationSnapshot.values.message)).toBe('변경 사항 저장');
    }
  } finally {
    await context.close();
    await rm(directory, { recursive: true, force: true });
  }
});
