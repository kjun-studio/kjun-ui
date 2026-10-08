import { test, expect } from '@playwright/test';
import { shortcutCount } from './docs-data';

test.use({ reducedMotion: 'reduce' });

for (const width of [1440, 1280, 390, 320]) {
  test(`${width}: layout guide keeps navigation, examples and reference rows readable`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/layout?platform=react');
    const example = page.locator('[data-example="GuideScreenLayout"]');
    await expect(example).toHaveAttribute('data-ready', 'true');
    const shortcuts = page.getByRole('navigation', { name: '상세 문서 바로가기' });
    await expect(shortcuts.getByRole('link')).toHaveCount(shortcutCount('layout'));
    if (width < 768) {
      const rows = await shortcuts.getByRole('link').evaluateAll(links => links.map(link => Math.round(link.getBoundingClientRect().top)));
      expect(new Set(rows).size).toBe(1);
      expect((await shortcuts.boundingBox())!.height).toBeLessThanOrEqual(64);
    }
    await expect(example.locator('.code-block')).toHaveCount(0);

    const input = example.frameLocator('iframe').getByRole('textbox', { name: '프로젝트 이름' });
    await input.fill('배치 변경 후에도 유지');
    await shortcuts.getByRole('link', { name: '하단 CTA', exact: true }).click();
    await expect(page).toHaveURL(/#cta$/);
    await expect(page.locator('#cta')).toBeFocused();
    await expect.poll(() => page.locator('#cta').evaluate(element => {
      const bar = document.querySelector('.document-shortcuts')!;
      return element.getBoundingClientRect().top - bar.getBoundingClientRect().bottom;
    })).toBeGreaterThanOrEqual(0);
    await expect(shortcuts.locator('[aria-current]')).toHaveText('하단 CTA');
    if (width < 768) {
      await page.keyboard.press('Control+End');
      await expect(shortcuts.locator('[aria-current]')).toHaveText('검증');
      await expect.poll(() => shortcuts.locator('[aria-current]').evaluate(link => {
        const bounds = link.parentElement!.getBoundingClientRect(), target = link.getBoundingClientRect();
        return target.left >= bounds.left && target.right <= bounds.right;
      })).toBe(true);
    }
    await shortcuts.getByRole('link', { name: '열 전환', exact: true }).click();
    await expect(input).toHaveValue('배치 변경 후에도 유지');

    // The short three-column reference stays a table at every width.
    const reference = page.locator('#width .document-table');
    await expect(reference.getByRole('table')).toBeVisible();
    await expect(reference.getByRole('row')).toHaveCount(4);
    const paragraph = await page.locator('#width > .body-copy').first().boundingBox();
    const table = await reference.boundingBox();
    expect(paragraph!.width).toBeLessThanOrEqual(720);
    expect(table!.width).toBeCloseTo(paragraph!.width, 0);
    expect(await reference.evaluate(element => element.scrollWidth <= element.clientWidth + 1)).toBe(true);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await shortcuts.getByRole('link', { name: '폭·간격', exact: true }).click();
    await page.screenshot({ path: `artifacts/docs-layout-${width}.png` });
  });
}

for (const platform of ['vue2', 'react', 'native']) {
  test(`${platform}: reduced Popover preview fits its open panel and preserves keyboard actions`, async ({ page }) => {
    for (const width of [1440, 390, 320]) {
      await page.setViewportSize({ width, height: 900 });
      await page.goto('/components/popover?platform=' + platform);
      const preview = page.locator('#preview .playground');
      await expect(preview).toHaveAttribute('data-ready', 'true');
      const frame = preview.locator('iframe');
      await expect.poll(async () => (await frame.boundingBox())!.height).toBeLessThanOrEqual(280);
      const content = preview.frameLocator('iframe');
      const trigger = content.getByRole('button', { name: '추가 정보', exact: true });
      await trigger.focus();
      await trigger.press('Enter');
      const action = content.getByRole('button', { name: '실행', exact: true });
      await expect(action).toBeVisible();
      await expect.poll(async () => {
        const bounds = (await frame.boundingBox())!, button = (await action.boundingBox())!;
        return button.x >= bounds.x && button.x + button.width <= bounds.x + bounds.width + 1 &&
          button.y >= bounds.y && button.y + button.height <= bounds.y + bounds.height;
      }).toBe(true);
      await action.click();
      await expect(content.getByText('팝오버 실행', { exact: true })).toBeVisible();
      await action.press('Escape');
      await expect(action).toBeHidden();
      await expect(trigger).toBeFocused();
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      if (width === 390) await page.screenshot({ path: `artifacts/docs-popover-${platform}-${width}.png` });
    }
  });
}
