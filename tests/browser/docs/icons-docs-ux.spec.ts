import { test, expect } from '@playwright/test';
import { setIconSize, iconCard, launchIcon } from './icons-docs-helpers';
import { iconPageSize } from './docs-data';

test('selection stays beside its row across widths, pages and empty searches', async ({ page }) => {
  test.setTimeout(180000);
  await page.goto('/icons?platform=react');
  await expect(iconCard(page, 'a-b')).toBeEnabled();
  await expect(page.locator('.icon-detail')).toHaveCount(0);
  await expect(page.getByRole('button', { name: '검색 초기화', exact: true })).toHaveCount(0);
  for (const width of [1280, 390, 320]) {
    await page.setViewportSize({ width, height: 900 });
    const first = await page.locator('.icon-card').nth(0).boundingBox(), second = await page.locator('.icon-card').nth(1).boundingBox();
    expect(first!.y).toBe(second!.y);
    for (const name of ['a-b-2', 'adjustments']) {
      const card = iconCard(page, name);
      await card.click();
      await expect(card).toBeFocused();
      await expect.poll(async () => {
        const selected = await card.locator('..').boundingBox(), detail = await page.locator('.icon-detail').boundingBox();
        return detail!.y - (selected!.y + selected!.height);
      }).toBeLessThan(20);
      await expect.poll(async () => {
        const selected = await card.locator('..').boundingBox(), detail = await page.locator('.icon-detail').boundingBox();
        return detail!.y - (selected!.y + selected!.height);
      }).toBeGreaterThanOrEqual(0);
      await launchIcon(page);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
    }
  }
  await setIconSize(page, '24');
  await page.getByRole('button', { name: '다음 페이지', exact: true }).click();
  await expect(page.locator('.icon-detail')).toContainText('이전 페이지의 선택');
  await page.getByLabel('이름·한국어 용도 검색').fill('heart');
  await expect(iconCard(page, 'heart')).toBeVisible();
  const result = await iconCard(page, 'heart').boundingBox(), retained = await page.locator('.icon-detail').boundingBox();
  expect(result!.y + result!.height).toBeLessThan(retained!.y);
  await page.getByLabel('이름·한국어 용도 검색').fill('no-such-kjun-icon');
  await expect(page.locator('.icon-detail')).toContainText('현재 검색 결과 밖');
  await expect(page.getByRole('button', { name: '아이콘 크기', exact: true })).toContainText('24 · ');
  await expect(page.locator('.icon-card')).toHaveCount(0);
  await page.getByRole('button', { name: '검색 초기화', exact: true }).click();
  await expect(page.getByLabel('이름·한국어 용도 검색')).toBeFocused();
  await expect(page.locator('.icon-card')).toHaveCount(iconPageSize);
  await expect(page.locator('.icon-detail')).toContainText('adjustments');
});

test('size and shape comparisons appear on arrival; technical detail expands by keyboard', async ({ page }) => {
  await page.goto('/icons?platform=react');
  for (const name of ['alignment', 'variants']) {
    const root = await launchIcon(page, name);
    await expect(root.getByRole('button', { name: '실행 예제 열기' })).toHaveCount(0);
    await expect(root.frameLocator('iframe').locator('svg').first()).toBeVisible();
  }
  const summary = page.getByText('플랫폼별 크기 API와 단위', { exact: true });
  await summary.focus();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('table', { name: '플랫폼 · 기본 크기 · 크기 API 예' })).toBeVisible();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('table', { name: '플랫폼 · 기본 크기 · 크기 API 예' })).not.toBeVisible();
  await expect(page.locator('.icon-usage-rules h3')).toHaveText(['장식은 중복해서 읽지 않기', '중요한 정보는 텍스트와 함께', '아이콘 버튼에는 행동 이름']);
});
