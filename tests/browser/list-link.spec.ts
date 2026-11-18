import { expect, test, type Page } from '@playwright/test';
import { openFixture } from './packed-fixture';

const fill = (page: Page, name: string) => page.locator('li.kjun-list-row', { has: page.getByText(name, { exact: true }) }).evaluate(node => getComputedStyle(node).backgroundColor);

for (const platform of ['react', 'vue3', 'native']) {
  test(`${platform}: a link row opens where target says and a new tab drops the opener and referrer`, async ({ page }) => {
    await openFixture(page, platform, '', 'list-link');
    const blank = page.getByRole('link', { name: '새 탭 링크' });
    await expect(blank).toHaveAttribute('target', '_blank');
    await expect(blank).toHaveAttribute('rel', 'noopener noreferrer');
    // The app's own rel is kept as given.
    await expect(page.getByRole('link', { name: '직접 준 rel' })).toHaveAttribute('rel', 'noopener');
    const same = page.getByRole('link', { name: '같은 창 링크' });
    await expect(same).not.toHaveAttribute('target');
    await expect(same).not.toHaveAttribute('rel');
  });

  test(`${platform}: the current row reads as current and takes the selected fill`, async ({ page }) => {
    await openFixture(page, platform, '', 'list-link');
    await expect(page.getByRole('link', { name: '현재 페이지' })).toHaveAttribute('aria-current', 'page');
    await expect(page.getByRole('button', { name: '현재 메시지' })).toHaveAttribute('aria-current', 'true');
    await expect(page.getByRole('button', { name: '다른 메시지' })).not.toHaveAttribute('aria-current');
    if (platform === 'native') return;
    const selected = await page.evaluate(() => { const probe = document.createElement('div'); probe.style.background = 'var(--kjun-selected-bg)'; document.body.append(probe); const value = getComputedStyle(probe).backgroundColor; probe.remove(); return value; });
    expect(await fill(page, '현재 메시지')).toBe(selected);
    expect(await fill(page, '다른 메시지')).not.toBe(selected);
  });
}

for (const platform of ['react', 'vue3']) {
  test(`${platform}: a disabled link row keeps the link role and reads as disabled`, async ({ page }) => {
    await openFixture(page, platform, '', 'list-link');
    const off = page.getByRole('link', { name: '비활성 링크' });
    await expect(off).toHaveAttribute('aria-disabled', 'true');
    await expect(off).not.toHaveAttribute('href');
  });
}

test('native: a pressable row names its element badge and value, and an expandable row its content', async ({ page }) => {
  await openFixture(page, 'native', '', 'list-link');
  await expect(page.getByRole('button', { name: '새 소식, New, 3건' })).toBeVisible();
  const row = page.getByRole('button', { name: '로그인한 기기' });
  const controls = await row.getAttribute('aria-controls');
  expect(controls).toBeTruthy();
  await row.click();
  await expect(page.locator(`[id="${controls}"]`)).toContainText('이 휴대폰');
});
