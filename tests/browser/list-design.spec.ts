import { expect, test, type Locator } from '@playwright/test';
import { openFixture } from './packed-fixture';

const box = async (l: Locator) => (await l.boundingBox())!;
const color = (l: Locator) => l.evaluate(el => getComputedStyle(el).color);

for (const platform of ['react', 'vue3', 'native']) {
  const web = platform !== 'native';
  test(`${platform}: values read quieter, icons stay by the title, danger and disabled cover the whole row`, async ({ page }) => {
    await openFixture(page, platform, '', 'list-design');
    const title = page.getByText('비밀번호', { exact: true }), value = page.getByText('3개월 전 변경', { exact: true });
    expect(await color(value)).not.toBe(await color(title));
    // A long described row keeps its icon beside the first lines rather than its vertical middle.
    const long = page.getByText('모든 기기에서 함께 사용할 프로필 사진과 계정 표시 이름', { exact: true });
    const longBox = await box(long);
    expect(longBox.height).toBeGreaterThan(24);
    if (web) {
      expect(await long.evaluate(el => getComputedStyle(el).wordBreak)).toBe('keep-all');
      const icon = await box(page.locator('.kjun-list-row', { hasText: '모든 기기에서' }).locator('.kjun-list-icon'));
      expect(icon.y).toBeLessThan(longBox.y + 30);
      const danger = await color(page.getByText('계정 삭제', { exact: true }));
      expect(await page.locator('.kjun-list-row', { hasText: '계정 삭제' }).locator('.kjun-list-icon').evaluate(el => getComputedStyle(el).color)).toBe(danger);
      expect(Number(await page.locator('.kjun-list-row', { hasText: '업무 알림' }).locator('.kjun-list-main').evaluate(el => getComputedStyle(el).opacity))).toBeLessThan(1);
    }
    // The section title is a label because the app asked for one, not because it lacks a description.
    const heading = await box(page.getByText('계정', { exact: true })), label = await box(page.getByText('언어', { exact: true }));
    expect(label.height).toBeLessThan(heading.height);
  });

  test(`${platform}: a switch row toggles on any press and a choice list marks its selection`, async ({ page }) => {
    await openFixture(page, platform, '', 'list-design');
    const row = page.getByRole('switch', { name: /알림 받기/ });
    await expect(row).toHaveAttribute('aria-checked', 'true');
    await page.getByText('알림 받기', { exact: true }).click();
    await expect(page.getByTestId('state')).toContainText('"on":false');
    await expect(row).toHaveAttribute('aria-checked', 'false');
    await page.getByText('English', { exact: true }).click();
    await expect(page.getByTestId('state')).toContainText('"lang":"en"');
    // Every platform reads a choice row as a radio, checked when selected.
    await expect(page.getByRole('radio', { name: 'English' })).toHaveAttribute('aria-checked', 'true');
    await expect(page.getByRole('radio', { name: '한국어' })).toHaveAttribute('aria-checked', 'false');
    // The switch drawn in a switch row is decoration: one switch control per row, and one tab stop.
    await expect(page.getByRole('switch')).toHaveCount(await page.locator('[role="switch"]').count());
    await expect(page.locator('[role="switch"] [role="switch"], [role="switch"] [tabindex="0"]')).toHaveCount(0);
  });
}
