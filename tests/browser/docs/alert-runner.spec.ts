import { test, expect } from '@playwright/test';

test.use({ reducedMotion: 'reduce' });

for (const platform of ['vue2', 'react', 'native']) {
  test(`${platform}: mobile Alert keeps recovery copy and gains room when expanded`, async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto(`/components/alert?platform=${platform}`);
    const runner = page.locator('.example-runner');
    await expect(runner).toHaveAttribute('data-ready', 'true');
    await runner.getByRole('button', { name: '프리셋', exact: true }).click();
    await page.getByRole('option', { name: '실패·재시도', exact: true }).click();
    const frame = runner.frameLocator('iframe');
    const body = '네트워크 연결 상태를 확인한 뒤 다시 시도해 주세요.';
    await expect(frame.getByText(body, { exact: true })).toBeVisible();
    await frame.getByRole('button', { name: '다시 시도', exact: true }).click();
    await expect(frame.getByText('재시도 요청', { exact: true })).toBeVisible();
    await expect(frame.getByText(body, { exact: true })).toBeVisible();

    for (const width of [375, 320]) {
      await page.setViewportSize({ width, height: 812 });
      const inlineWidth = await runner.locator('iframe').evaluate(el => el.getBoundingClientRect().width);
      expect(inlineWidth).toBeGreaterThan(width - 55);
      await runner.getByRole('button', { name: '넓게 보기', exact: true }).click();
      const dialog = page.getByRole('dialog', { name: 'Alert · 넓게 보기', exact: true });
      const expanded = dialog.frameLocator('iframe');
      await expect(expanded.getByText(body, { exact: true })).toBeVisible();
      expect(await dialog.locator('iframe').evaluate(el => el.getBoundingClientRect().width)).toBeGreaterThan(inlineWidth);
      expect(await dialog.locator('iframe').evaluate(el => {
        const doc = (el as HTMLIFrameElement).contentDocument!;
        return doc.documentElement.scrollWidth <= doc.documentElement.clientWidth;
      })).toBe(true);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      await dialog.getByRole('button', { name: '닫기', exact: true }).click();
      await expect(runner.getByRole('button', { name: '넓게 보기', exact: true })).toBeFocused();
    }
  });
}
