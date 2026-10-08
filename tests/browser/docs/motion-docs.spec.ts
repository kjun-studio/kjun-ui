import { test, expect } from '@playwright/test';
import { platforms, example, selectMotionExample, resetMotionExample, changePlatform, revealFrame } from './motion-docs-helpers';
import { motionScenarios, shortcutCount } from './docs-data';

test('motion selector waits for hydration and supports keyboard selection', async ({ page }) => {
  let release!: () => void;
  const scripts = new Promise<void>(resolve => { release = resolve; });
  await page.route('**/_next/static/chunks/*.js', async route => { await scripts; await route.continue(); });
  await page.goto('/motion?platform=native', { waitUntil: 'commit' });
  const tabs = page.getByRole('tablist', { name: '모션 예제', exact: true });
  try {
    await expect(tabs.getByRole('tab')).toHaveCount(motionScenarios.length);
    for (const tab of await tabs.getByRole('tab').all()) await expect(tab).toBeDisabled();
  } finally { release(); }
  await tabs.getByRole('tab', { name: '숫자', exact: true }).click();
  await expect(example(page, 'number').locator('.guide-running')).toHaveAttribute('data-ready', 'true');
  await expect(example(page, 'number').getByRole('link', { name: 'AnimatedNumber 상세 문서' })).toHaveAttribute('href', '/components/animated-number?platform=native');
  for (const [key, label, kind] of [['Home', '선택선', 'tabs'], ['ArrowRight', '펼침', 'accordion'], ['End', '숫자', 'number']]) {
    await page.keyboard.press(key);
    await expect(tabs.getByRole('tab', { name: label, exact: true })).toHaveAttribute('aria-selected', 'true');
    await expect(example(page, kind).locator('.guide-running')).toHaveAttribute('data-ready', 'true');
    await expect(page.locator('.motion-playground iframe')).toHaveCount(1);
  }
});

for (const platform of platforms) {
  test(`${platform}: six motion examples interact, reset and clean up on platform change`, async ({ page }) => {
    test.setTimeout(180000);
    const errors: string[] = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/motion?platform=' + platform);
    if (platform === 'native') await expect(page.locator('#reduced-motion')).toContainText('동작 줄이기를 켜면 즉시 배치합니다.');
    await expect(page.locator('[data-motion-preference]')).toHaveAttribute('data-motion-preference', 'reduce');
    await expect(page.locator('.motion-playground iframe')).toHaveCount(1);
    await expect(page.getByRole('button', { name: /실행 예제 (열기|닫기)/ })).toHaveCount(0);

    const tabs = await selectMotionExample(page, 'tabs'), tf = tabs.frameLocator('iframe');
    await tf.getByRole('tab', { name: '둘째 탭' }).click();
    await expect(tf.getByRole('tab', { name: '둘째 탭' })).toHaveAttribute('aria-selected', 'true');
    await resetMotionExample(tabs);
    await expect(tf.getByRole('tab', { name: '첫 탭', exact: true })).toHaveAttribute('aria-selected', 'true');

    const accordion = await selectMotionExample(page, 'accordion'), af = accordion.frameLocator('iframe');
    await af.getByRole('button', { name: '첫 항목' }).click();
    await expect(af.getByText('첫 내용', { exact: true })).toBeVisible();
    await resetMotionExample(accordion);
    await expect(af.getByText('첫 내용', { exact: true })).toBeHidden();

    for (const kind of ['modal', 'drawer']) {
      const root = await selectMotionExample(page, kind), frame = root.frameLocator('iframe');
      const panel = platform === 'native' ? frame.locator('[aria-label="작업 확인"]') : frame.getByRole('dialog');
      const trigger = frame.getByRole('button', { name: kind === 'modal' ? '모달 열기' : '패널 열기', exact: true });
      await trigger.click();
      await revealFrame(root);
      await expect(panel).toBeVisible();
      await expect(root.locator('.motion-preview-stage')).toHaveCSS('height', '480px');
      await frame.getByRole('button', { name: '닫기', exact: true }).click();
      await expect(frame.getByRole('dialog')).toHaveCount(0);
      await trigger.click();
      await revealFrame(root);
      await frame.getByRole('button', { name: '닫기', exact: true }).press('Escape');
      await expect(frame.getByRole('dialog')).toHaveCount(0);
      await expect(trigger).toBeFocused();
      await trigger.click();
      await revealFrame(root);
      await frame.getByRole('button', { name: '알림 표시', exact: true }).click();
      await expect(frame.getByText('열린 레이어의 영역 알림', { exact: true })).toBeVisible();
      await resetMotionExample(root);
      await expect(frame.getByRole('dialog')).toHaveCount(0);
      await expect(frame.getByText('열린 레이어의 영역 알림', { exact: true })).toHaveCount(0);
    }

    const toast = await selectMotionExample(page, 'toast'), sf = toast.frameLocator('iframe');
    await sf.getByRole('button', { name: '알림 3개 표시' }).click();
    await revealFrame(toast);
    for (const n of [1, 2, 3]) await expect(sf.getByText('알림 ' + n, { exact: true })).toBeVisible();
    await sf.getByRole('button', { name: '중간 알림 닫기' }).click();
    await expect(sf.getByText('알림 2', { exact: true })).toHaveCount(0);
    await expect(sf.getByText('알림 3', { exact: true })).toBeVisible();
    await resetMotionExample(toast);
    await expect(sf.getByRole('alert')).toHaveCount(0);
    await sf.getByRole('button', { name: '알림 3개 표시' }).click();
    await selectMotionExample(page, 'tabs');
    await expect(toast).toHaveCount(0);
    await selectMotionExample(page, 'toast');
    await expect(sf.getByRole('alert')).toHaveCount(0);

    const number = await selectMotionExample(page, 'number'), nf = number.frameLocator('iframe');
    await expect(nf.getByText('100', { exact: true })).toBeVisible();
    await nf.getByRole('button', { name: '1000으로 변경' }).click();
    await expect(nf.getByText('1,000', { exact: true })).toBeVisible();
    await nf.getByRole('button', { name: '120으로 변경' }).click();
    await expect(nf.getByText('120', { exact: true })).toBeVisible();
    await resetMotionExample(number);
    await expect(nf.getByText('100', { exact: true })).toBeVisible();
    await nf.getByRole('button', { name: '1000으로 변경' }).click();

    let current = platform as string;
    const next = platform === 'react' ? 'vue2' : platform === 'vue2' ? 'native' : 'react';
    await changePlatform(page, next); current = next;
    await expect(number.locator('.guide-running')).toHaveAttribute('data-platform', next);
    await expect(number.locator('.guide-running')).toHaveAttribute('data-ready', 'true');
    await expect(nf.getByText('100', { exact: true })).toBeVisible();
    for (const kind of ['modal', 'drawer', 'toast']) {
      const root = await selectMotionExample(page, kind), frame = root.frameLocator('iframe');
      await frame.getByRole('button', { name: kind === 'modal' ? '모달 열기' : kind === 'drawer' ? '패널 열기' : '알림 3개 표시', exact: true }).click();
      await revealFrame(root);
      if (kind !== 'toast') await frame.getByRole('button', { name: '알림 표시', exact: true }).click();
      current = current === platform ? next : platform;
      await changePlatform(page, current);
      await expect(root.locator('.guide-running')).toHaveAttribute('data-platform', current);
      await expect(root.locator('.guide-running')).toHaveAttribute('data-ready', 'true');
      await expect(frame.getByRole('dialog')).toHaveCount(0);
      await expect(frame.getByRole('alert')).toHaveCount(0);
      // Switching the selected example also discards an open layer or notification.
      await frame.getByRole('button', { name: kind === 'modal' ? '모달 열기' : kind === 'drawer' ? '패널 열기' : '알림 3개 표시', exact: true }).click();
      await selectMotionExample(page, 'tabs');
      await expect(root).toHaveCount(0);
      await selectMotionExample(page, kind);
      await expect(frame.getByRole('dialog')).toHaveCount(0);
      await expect(frame.getByRole('alert')).toHaveCount(0);
    }
    await page.locator('.page-navigation a').first().click();
    await expect(page).toHaveURL(new RegExp('/tokens\\?platform=' + current));
    await expect(page.locator('.motion-playground')).toHaveCount(0);
    expect(errors).toEqual([]);
  });
}

test('motion navigation, old anchor, search and table of contents preserve the platform', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto('/tokens?platform=native#motion');
  await page.locator('#motion').getByRole('link', { name: '모션 기준과 견본' }).click();
  await expect(page).toHaveURL(/\/motion\?platform=native$/);
  await expect(page.locator('.doc-nav a[aria-current="page"]')).toHaveText('모션·애니메이션');
  const nav = page.getByRole('navigation', { name: '상세 문서 바로가기' });
  await expect(nav.getByRole('link')).toHaveCount(shortcutCount('motion'));
  for (const link of await nav.getByRole('link').all()) {
    const href = await link.getAttribute('href');
    await link.click();
    await expect(page).toHaveURL(url => url.hash === href && url.searchParams.get('platform') === 'native');
    await expect(page.locator(href!)).toBeFocused();
  }
  await expect(page.locator('.page-navigation a').first()).toContainText('디자인 토큰');
  await expect(page.locator('.page-navigation a').last()).toHaveAttribute('href', /platform=native/);
  for (const query of ['모션', '애니메이션', 'motion', 'animation', '전환', '동작 줄이기']) {
    await page.getByRole('button', { name: '문서 검색', exact: true }).click();
    const dialog = page.getByRole('dialog', { name: '문서 검색', exact: true });
    await dialog.getByRole('combobox').fill(query);
    await expect(dialog.getByRole('option').first()).toContainText('모션·애니메이션');
    await dialog.getByRole('combobox').press('Enter');
    await expect(page).toHaveURL(/\/motion\?platform=native$/);
  }
});

test('failed motion frames retry and reject old snapshots after reset', async ({ page }) => {
  await page.route('**/previews/catalog-react.html*', route => route.fulfill({ contentType: 'text/html', body: '<html></html>' }));
  await page.goto('/motion?platform=react');
  await page.getByRole('tablist', { name: '모션 예제', exact: true }).getByRole('tab', { name: '숫자', exact: true }).click();
  const root = example(page, 'number');
  await expect(root.getByText('실행 화면을 불러오지 못했습니다.')).toBeVisible();
  await page.unroute('**/previews/catalog-react.html*');
  await root.getByRole('button', { name: '다시 시도', exact: true }).click();
  await expect(root.locator('.guide-running')).toHaveAttribute('data-ready', 'true');
  await root.frameLocator('iframe').getByRole('button', { name: '1000으로 변경' }).click();
  await resetMotionExample(root);
  await root.frameLocator('iframe').locator('body').evaluate(() => {
    const session = new URLSearchParams(location.search).get('session');
    parent.postMessage({ type: 'kjun:catalog-snapshot', component: 'GuideMotionNumber', platform: 'react', session, revision: 1, values: { number: 777 }, settings: {}, height: 9999 }, location.origin);
  });
  await expect(root.frameLocator('iframe').getByText('100', { exact: true })).toBeVisible();
  await expect(root.locator('.code-block, details')).toHaveCount(0);
  await changePlatform(page, 'vue2');
  await expect(root.locator('.guide-running')).toHaveAttribute('data-ready', 'true');
  await expect(root.frameLocator('iframe').getByText('100', { exact: true })).toBeVisible();
});
