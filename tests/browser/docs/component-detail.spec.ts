import { test, expect } from '@playwright/test';
import { revealFrame } from './motion-docs-helpers';
import { openExampleSettings } from './example-settings';

test.use({ reducedMotion: 'reduce' });
const platforms = ['vue2', 'react', 'native'] as const;

for (const platform of platforms) {
  test(`${platform}: detail previews lead the page and remain usable at desktop and mobile widths`, async ({ page }) => {
    test.setTimeout(180000);
    const errors: string[] = [];
    page.on('pageerror', error => errors.push(error.message));
    for (const width of [1280, 390]) {
      await page.setViewportSize({ width, height: 720 });
      for (const slug of ['button', 'input', 'select', 'modal', 'table', 'feedback']) {
        await page.goto(`${slug === 'feedback' ? '/feedback' : '/components/' + slug}?platform=${platform}`);
        const playground = page.locator('#preview .playground');
        await expect(playground).toHaveAttribute('data-ready', 'true');
        const settings = playground.getByRole('button', { name: '예제 설정', exact: true });
        await expect(settings).toHaveAttribute('aria-expanded', 'false');
        await expect(page.locator('#usage').getByRole('button', { name: '기본 코드 복사', exact: true })).toBeEnabled();
        await expect(playground.locator('.playground-settings')).toBeHidden();
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
        const frame = playground.locator('iframe');
        expect(await frame.evaluate(element => {
          const view = (element as HTMLIFrameElement).contentWindow!;
          return view.document.documentElement.scrollWidth <= view.innerWidth;
        })).toBe(true);
        if (width === 1280) {
          const box = await frame.boundingBox();
          expect(box!.y).toBeLessThan(560);
          expect(box!.width).toBeGreaterThan(600);
        }
        if (slug === 'button') {
          await expect(page.locator('#anatomy > h2')).toHaveCSS('font-size', '24px');
          await expect(page.locator('#anatomy > h2')).toHaveCSS('font-weight', '600');
          await expect(page.locator('#states [data-guide-case]')).toHaveCount(5);
          await expect(page.locator('#states .guide-case-actions, #states details')).toHaveCount(0);
          await expect(page.locator('main .design-case')).toHaveCount(0);
          await page.screenshot({ path: `artifacts/detail-${platform}-${width}.png` });
        }
        await settings.click();
        if (slug === 'modal') await expect(playground.getByText('기본 예제', { exact: true })).toBeVisible();
        else await expect(playground.getByRole('button', { name: '프리셋', exact: true })).toBeVisible();
        await settings.click();
        await expect(playground).toHaveAttribute('data-ready', 'true');
      }
    }
    expect(errors).toEqual([]);
  });

  test(`${platform}: hiding settings preserves input and leaves basic code unchanged`, async ({ page }) => {
    await page.goto('/components/input?platform=' + platform);
    const playground = page.locator('#preview .playground');
    await expect(playground).toHaveAttribute('data-ready', 'true');
    const input = playground.frameLocator('iframe').getByRole('textbox', { name: '목록 이름', exact: true });
    await input.fill('접어도 유지되는 값');
    await openExampleSettings(page);
    const readonly = playground.getByRole('switch', { name: '읽기 전용', exact: true });
    await readonly.focus(); await readonly.press('Space');
    await expect(input).not.toBeEditable();
    const original = await page.locator('#usage pre').innerText();
    const settings = playground.getByRole('button', { name: '예제 설정', exact: true });
    await settings.click();
    await expect(input).toHaveValue('접어도 유지되는 값');
    await page.getByRole('navigation', { name: '상세 문서 바로가기' }).getByRole('link', { name: 'API', exact: true }).click();
    await page.goBack();
    await expect(input).toHaveValue('접어도 유지되는 값');
    await openExampleSettings(page);
    await expect(page.locator('#usage pre')).toHaveText(original);
    await expect(readonly).toBeChecked();
    await page.evaluate(() => Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText: async (text: string) => { (window as any).__detailCopy = text; } },
    }));
    for (const label of ['기본 코드 복사']) {
      await page.evaluate(() => { (window as any).__detailCopy = ''; });
      await page.locator('#usage').getByRole('button', { name: label, exact: true }).click();
      await expect.poll(() => page.evaluate(() => (window as any).__detailCopy)).not.toContain('접어도 유지되는 값');
    }
  });

  test(`${platform}: compact layer comparisons retain their open and close interactions`, async ({ page }) => {
    await page.goto('/components/modal?platform=' + platform + '#states');
    const example = page.locator('#states [data-guide-case="open"]');
    await example.getByRole('button', { name: '실행 비교 열기', exact: true }).click();
    await expect(example.locator('.guide-running')).toHaveAttribute('data-ready', 'true');
    const frame = example.frameLocator('iframe');
    const dialog = frame.getByRole('dialog').last();
    await expect(dialog).toBeVisible();
    await revealFrame(example);
    await dialog.getByRole('button', { name: '취소', exact: true }).click();
    await expect(frame.getByRole('dialog')).toHaveCount(0);
    await frame.getByRole('button', { name: '모달 열기', exact: true }).click();
    await expect(dialog).toBeVisible();
    await expect(example.getByRole('button', { name: '초기화', exact: true })).toHaveCount(0);
  });
}

test('a failed comparison can retry without exposing the interactive toolbar', async ({ page }) => {
  await page.goto('/components/button?platform=react');
  await expect(page.locator('#preview .playground')).toHaveAttribute('data-ready', 'true');
  const pattern = '**/previews/catalog-react.html?**';
  await page.route(pattern, route => route.abort());
  const comparison = page.locator('#states [data-guide-case="button-variants"]');
  await comparison.scrollIntoViewIfNeeded();
  const retry = comparison.getByRole('button', { name: '다시 시도', exact: true });
  await expect(retry).toBeVisible();
  await page.unroute(pattern);
  await retry.click();
  await expect(comparison.locator('.guide-running')).toHaveAttribute('data-ready', 'true');
  await expect(retry).toHaveCount(0);
  await expect(comparison.locator('details, .guide-case-actions')).toHaveCount(0);
});

test('legacy design anchors lead to concise links and full guides keep their tools', async ({ page }) => {
  await page.goto('/components/button?platform=react#design-action-placement');
  const row = page.locator('#design-action-placement');
  await expect(row).toBeInViewport();
  await row.getByRole('link').click();
  await expect(page).toHaveURL(/usage-guide\/forms\?platform=react#action-placement/);
  const example = page.locator('[data-design-case="action-placement"]');
  // Route images and the earlier live examples settle before a pointer click.
  const figures = example.locator('.design-pair[data-width="375"] img');
  await expect(figures).toHaveCount(2);
  await expect.poll(() => figures.evaluateAll(images => images.every(image => (image as HTMLImageElement).complete && (image as HTMLImageElement).naturalWidth > 0))).toBe(true);
  await expect(page.locator('.catalog-playground[data-ready="false"]')).toHaveCount(0);
  const trigger = example.locator('.design-execution').getByRole('button', { name: '실행 예제 보기', exact: true });
  await trigger.click();
  await expect(example.locator('.design-execution').getByRole('button', { name: '실행 예제 접기', exact: true })).toHaveAttribute('aria-expanded', 'true');
  const after = example.locator('[data-guide-case="action-placement-after-375"]');
  await after.scrollIntoViewIfNeeded();
  await expect(after.locator('.guide-running')).toHaveAttribute('data-ready', 'true');
  await expect(after.getByRole('button', { name: '초기화', exact: true })).toBeVisible();
  await expect(after.locator('.code-block')).toHaveCount(0);
  await expect(example.locator('.implementation-usage')).toHaveCount(0);
});

test('API detail tables stay within a 320px page and platform transitions replace expanded descriptions', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 800 });
  await page.goto('/components/select?platform=vue2#api');
  await page.getByRole('button', { name: 'open 사용 계약', exact: true }).click();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  const container = page.locator('#api .kjun-table-scroll').first();
  expect(await container.evaluate(e => e.scrollWidth > e.clientWidth)).toBe(true);
  await page.getByRole('button', { name: '문서 플랫폼', exact: true }).click();
  await page.getByRole('option', { name: 'React', exact: true }).click();
  await expect(page.getByRole('button', { name: 'open 사용 계약', exact: true })).toHaveAttribute('aria-expanded', 'false');
  await page.getByRole('button', { name: 'open 사용 계약', exact: true }).click();
  await expect(page.locator('#api .api-member-details')).toContainText('생략하거나 undefined이면 내부');
  await expect(page.locator('#api .api-member-details')).not.toContainText('isOpen');
});

for (const platform of ['react', 'vue2', 'native']) test(`${platform}: button documentation comparisons render packed sizes, variants and narrow layouts`, async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto(`/components/button?platform=${platform}`);
  const choose = async (label: string, value: string) => {
    await page.getByRole('button', { name: label, exact: true }).click();
    await page.getByRole('option', { name: value, exact: true }).click();
  };
  const preview = page.locator('.playground');
  await expect(preview).toHaveAttribute('data-ready', 'true');
  await preview.getByRole('button', { name: '예제 설정', exact: true }).click();
  const demo = page.frameLocator('.playground iframe');
  const buttons = demo.getByRole('button');
  await expect(buttons).toHaveCount(1);
  expect((await buttons.first().boundingBox())!.width).toBeLessThan(150);
  for (const [preset, count] of [['크기 비교', 5], ['변형 비교', 7], ['라벨·아이콘 비교', 7], ['상태 비교', 3]] as const) {
    await choose('프리셋', preset);
    await expect(buttons).toHaveCount(count);
    const radii = preset === '크기 비교' ? [8, 10, 12, 14, 16] : Array(count).fill(12);
    for (const [index, btn] of (await buttons.all()).entries()) await expect(btn).toHaveCSS('border-radius', `${radii[index]}px`);
    if (preset === '크기 비교') {
      await expect.poll(() => buttons.evaluateAll(items => items.map(el => el.getBoundingClientRect().height))).toEqual([24, 32, 40, 48, 56]);
      await preview.screenshot({ path: `artifacts/button-design-${platform}-sizes.png` });
    }
    if (preset === '변형 비교') await preview.screenshot({ path: `artifacts/button-design-${platform}-variants.png` });
    if (preset === '상태 비교') {
      const widths = await buttons.evaluateAll(items => items.map(el => el.getBoundingClientRect().width));
      expect(new Set(widths).size).toBe(1);
      await expect(buttons.nth(1)).toBeDisabled();
      await expect(buttons.nth(2)).toBeDisabled();
    }
  }
  await choose('색상 예제', '어두운 배경 예제');
  await choose('프리셋', '라벨·아이콘 비교');
  await expect(buttons).toHaveCount(7);
  await preview.screenshot({ path: `artifacts/button-design-${platform}-dark.png` });
  await choose('프리셋', '전체 너비 · 375px');
  await expect(buttons).toHaveCount(1);
  await expect(buttons.first()).toHaveCSS('height', '48px');
  await expect(buttons.first()).toHaveCSS('border-radius', '14px');
  expect((await buttons.first().boundingBox())!.width).toBeGreaterThan(250);
  expect((await buttons.first().boundingBox())!.width).toBeLessThanOrEqual(375);
  expect(errors).toEqual([]);
});

for (const platform of ['vue2', 'react', 'native'] as const) {
  test(`${platform} API summaries, details, defaults and ownership follow the document platform`, async ({ page }) => {
    const errors: string[] = []; page.on('pageerror', e => errors.push(e.message));
    await page.goto(`/components/select?platform=${platform}#api`);
    const api = page.locator('#api');
    await expect(api.getByRole('table', { name: '속성', exact: true })).toBeVisible();
    const clearable = api.getByRole('row').filter({ has: page.getByRole('cell', { name: 'clearable', exact: true }) });
    await expect(clearable).toContainText('false');
    await expect(clearable).toContainText('현재 선택을 지울');
    const toggle = api.getByRole('button', { name: 'open 사용 계약', exact: true });
    await toggle.focus(); await page.keyboard.press('Enter');
    await expect(toggle).toHaveAttribute('aria-expanded', 'true');
    await expect(api.locator('.api-member-details')).toContainText('생략하거나 undefined이면 내부');
    await expect(api.locator('.api-member-details')).toContainText('외부 prop 변경은 다시 통지하지 않습니다');
    await page.keyboard.press('Space'); await expect(toggle).toHaveAttribute('aria-expanded', 'false');
    await expect(toggle).toBeFocused();
    await page.goto(`/components/form-group?platform=${platform}#api`);
    await expect(page.locator('.api-ownership')).toContainText('value prop이나 값 변경 이벤트가 없습니다');
    await expect(page.locator('#api').getByRole('cell', { name: 'value', exact: true })).toHaveCount(0);
    await page.goto(`/components/table?platform=${platform}#api`);
    if (platform === 'vue2') {
      await expect(page.getByRole('table', { name: '슬롯', exact: true })).toContainText('cell-*');
      await expect(page.getByRole('table', { name: '슬롯', exact: true }).getByRole('cell', { name: 'default', exact: true })).toHaveCount(0);
      await expect(page.getByRole('table', { name: '이벤트', exact: true })).toContainText('selection-change');
    } else await expect(page.locator('#api')).toContainText('TableColumn<Row>');
    expect(errors).toEqual([]);
  });
}
