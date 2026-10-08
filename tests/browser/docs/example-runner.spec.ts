import { test, expect, type Locator, type Page } from '@playwright/test';

test.use({ reducedMotion: 'reduce' });
async function choose(page: Page, label: string, value: string) {
  await page.getByRole('button', { name: label, exact: true }).click();
  await page.getByRole('option', { name: value, exact: true }).click();
  await expect(page.locator('.example-runner')).toHaveAttribute('data-ready', 'true');
}
async function visit(page: Page, slug: string, platform: string) {
  await page.goto(`/components/${slug}?platform=${platform}`);
  await expect(page.locator('.example-runner')).toHaveAttribute('data-ready', 'true');
  return page.frameLocator('.example-runner iframe');
}

for (const platform of ['vue2', 'react', 'native']) {
  test(`${platform}: presets only expose effective controls and reset modified settings`, async ({ page }) => {
    await visit(page, 'button', platform);
    const runner = page.locator('.example-runner');
    await expect(runner.getByRole('button', { name: '프리셋', exact: true })).toBeVisible();
    await expect(runner.getByRole('button', { name: '예제 설정', exact: true })).toHaveAttribute('aria-expanded', 'false');
    await choose(page, '프리셋', '크기 비교');
    await runner.getByRole('button', { name: '예제 설정', exact: true }).click();
    await expect(runner.getByRole('button', { name: '크기', exact: true })).toHaveCount(0);
    await expect(runner.getByRole('switch', { name: '아이콘 전용', exact: true })).toHaveCount(0);
    await runner.getByRole('switch', { name: '비활성', exact: true }).press('Space');
    await expect(runner.locator('.runner-modified')).toBeVisible();
    await expect(runner.frameLocator('iframe').getByRole('button', { name: '저장', exact: true }).first()).toBeDisabled();
    await runner.getByRole('button', { name: '예제 초기화', exact: true }).click();
    await expect(runner.locator('.runner-modified')).toHaveCount(0);
    await expect(runner.frameLocator('iframe').getByRole('button', { name: '저장', exact: true }).first()).toBeEnabled();
    await choose(page, '프리셋', '기본');
    await expect(runner.getByRole('switch', { name: '아이콘 전용', exact: true })).toBeVisible();
    if (platform === 'react') await runner.screenshot({ path: 'artifacts/runner-desktop.png' });
  });

  test(`${platform}: wide inspector edits preserve input and return focus`, async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 1000 });
    const frame = await visit(page, 'input', platform);
    await frame.getByRole('textbox', { name: '목록 이름', exact: true }).fill('확대해도 유지');
    await page.getByRole('button', { name: '넓게 보기', exact: true }).click();
    const dialog = page.getByRole('dialog', { name: 'Input · 넓게 보기', exact: true });
    const input = dialog.frameLocator('iframe').getByRole('textbox', { name: '목록 이름', exact: true });
    await expect(input).toHaveValue('확대해도 유지');
    await dialog.getByRole('switch', { name: '읽기 전용', exact: true }).press('Space');
    await expect(input).not.toBeEditable();
    if (platform === 'react') await page.screenshot({ path: 'artifacts/runner-wide.png' });
    await dialog.getByRole('button', { name: '닫기', exact: true }).click();
    await expect(page.getByRole('button', { name: '넓게 보기', exact: true })).toBeFocused();
    await expect(frame.getByRole('textbox', { name: '목록 이름', exact: true })).toHaveValue('확대해도 유지');
    await expect(frame.getByRole('textbox', { name: '목록 이름', exact: true })).not.toBeEditable();
  });

  test(`${platform}: ErrorBoundary exposes failure and recovery, ScrollFade overflows horizontally`, async ({ page }) => {
    const boundary = await visit(page, 'error-boundary', platform);
    await boundary.getByRole('button', { name: '오류 발생', exact: true }).press('Enter');
    await expect(boundary.getByText('예제를 표시할 수 없습니다', { exact: true })).toBeVisible();
    await boundary.getByRole('button', { name: '예제 복구', exact: true }).press('Enter');
    await expect(boundary.getByText('정상 콘텐츠를 표시합니다.', { exact: true })).toBeVisible();
    await expect(page.locator('.example-runner')).toHaveAttribute('data-ready', 'true');
    await page.setViewportSize({ width: 390, height: 844 });
    await visit(page, 'scroll-fade', platform);
    expect(await page.locator('.example-runner iframe').evaluate(frame => {
      const document = (frame as HTMLIFrameElement).contentDocument!;
      return [...document.querySelectorAll<HTMLElement>('*')].some(element =>
        ['auto', 'scroll'].includes(getComputedStyle(element).overflowX) && element.scrollWidth > element.clientWidth + 20);
    })).toBe(true);
  });
}

test('actual canvas width stays accurate on mobile and all tools remain reachable', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await visit(page, 'table', 'react');
  await page.getByRole('button', { name: '375px 좁은 화면', exact: true }).click();
  const runner = page.locator('.example-runner');
  const width = await runner.locator('iframe').evaluate(element => Math.round(element.getBoundingClientRect().width));
  await expect(runner.getByLabel('실제 미리보기 너비')).toHaveText(`${width}px`);
  await expect(runner.locator('.runner-width-note')).toContainText(`${width}px`);
  await runner.getByRole('button', { name: '예제 설정', exact: true }).click();
  await expect(runner.getByRole('group', { name: '모양', exact: true })).toBeVisible();
  await expect(runner.getByRole('group', { name: '동작', exact: true })).toBeVisible();
  await expect(runner.getByRole('group', { name: '상태', exact: true })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: 'artifacts/runner-mobile.png', fullPage: true });
});

test('closed layer examples use a compact canvas and grow when opened', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  const frame = await visit(page, 'modal', 'react');
  const iframe = page.locator('.example-runner iframe');
  await expect.poll(() => iframe.evaluate(element => element.getBoundingClientRect().height)).toBeLessThan(300);
  await frame.getByRole('button', { name: '모달 열기', exact: true }).press('Enter');
  await expect(frame.getByRole('dialog')).toBeVisible();
  await expect.poll(() => iframe.evaluate(element => element.getBoundingClientRect().height)).toBeGreaterThanOrEqual(600);
  await frame.getByRole('dialog').getByRole('button', { name: '취소', exact: true }).press('Enter');
  await expect.poll(() => iframe.evaluate(element => element.getBoundingClientRect().height)).toBeLessThan(300);
});

async function expectOnlyListScroll(list: Locator) {
  const geometry = await list.evaluate(element => {
    const panel = element.closest('.kjun-floating')!;
    const ancestors = [];
    for (let current = element.parentElement; current; current = current.parentElement) {
      ancestors.push({ overflow: current.scrollHeight - current.clientHeight, top: current.scrollTop });
      if (current === panel) break;
    }
    const bounds = panel.getBoundingClientRect();
    return { ancestors, listOverflow: element.scrollHeight - element.clientHeight, top: bounds.top, bottom: bounds.bottom,
      width: bounds.width, height: bounds.height, viewportHeight: innerHeight, viewportWidth: innerWidth };
  });
  expect(geometry.listOverflow).toBeGreaterThan(1);
  for (const ancestor of geometry.ancestors) {
    expect(ancestor.overflow).toBeLessThanOrEqual(1);
    expect(ancestor.top).toBe(0);
  }
  expect(geometry.top).toBeGreaterThanOrEqual(0);
  expect(geometry.bottom).toBeLessThanOrEqual(geometry.viewportHeight);
  expect(geometry.width).toBeLessThanOrEqual(geometry.viewportWidth);
  expect(geometry.height).toBeLessThanOrEqual(240);
}

test('Alert preview preset dropdown has only one scrollable region', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto('/components/alert?platform=vue2');
  const runner = page.locator('.example-runner');
  await expect(runner).toHaveAttribute('data-ready', 'true');
  await runner.getByRole('button', { name: '프리셋', exact: true }).click();
  const list = page.getByRole('listbox', { name: '프리셋' });
  await expectOnlyListScroll(list);
  await page.getByRole('option', { name: '긴 문구', exact: true }).click();
  await expect(list).toBeHidden();
  await expect(runner.getByRole('button', { name: '프리셋', exact: true })).toContainText('긴 문구');
});
