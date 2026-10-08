import { test, expect } from '@playwright/test';

test.use({ reducedMotion: 'reduce' });

for (const platform of ['vue2', 'react', 'native']) {
  test(`${platform}: layout controls preserve inputs across disclosure and width changes`, async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/layout?platform=' + platform);
    const example = page.locator('[data-example="GuideScreenLayout"]');
    await expect(example).toHaveAttribute('data-ready', 'true');
    await expect(example.locator('.layout-preview-hint')).toContainText('한 열');
    const input = example.frameLocator('iframe').getByRole('textbox', { name: '프로젝트 이름', exact: true });
    await input.fill('배치를 바꿔도 유지하는 값');

    const details = example.getByRole('button', { name: '세부 설정', exact: true });
    const palette = example.getByRole('button', { name: '색상 예제', exact: true });
    await expect(details).toHaveAttribute('aria-expanded', 'false');
    await expect(palette).toBeHidden();
    await details.focus(); await details.press('Enter');
    await expect(palette).toBeVisible();
    await example.getByRole('switch', { name: '긴 콘텐츠', exact: true }).press('Space');
    await details.click();
    await expect(palette).toBeHidden();
    await expect(input).toHaveValue('배치를 바꿔도 유지하는 값');

    const expand = example.getByRole('button', { name: '넓게 보기', exact: true });
    await expand.click();
    const dialog = page.getByRole('dialog', { name: '열 전환 비교 · 넓게 보기', exact: true });
    await expect(dialog.locator('.layout-preview-hint')).toContainText('두 열');
    const expandedInput = dialog.frameLocator('iframe').getByRole('textbox', { name: '프로젝트 이름', exact: true });
    await expect(expandedInput).toHaveValue('배치를 바꿔도 유지하는 값');
    await dialog.getByRole('button', { name: '375px 좁은 화면', exact: true }).click();
    await expect(dialog.locator('.layout-preview-hint')).toContainText('한 열');
    await expect(dialog.frameLocator('iframe').getByTestId('foundation-area')).toContainText('가용 폭 375px');
    await expect(expandedInput).toHaveValue('배치를 바꿔도 유지하는 값');
    await page.keyboard.press('Escape');
    await expect(dialog).toBeHidden();
    await expect(expand).toBeFocused();
    await expect(input).toHaveValue('배치를 바꿔도 유지하는 값');
    await example.getByRole('switch', { name: '읽기·입력 중심 단일 열', exact: true }).press('Space');
    await expect(example.locator('.layout-preview-hint')).toContainText('읽기·입력 모드');
    await expect(input).toHaveValue('배치를 바꿔도 유지하는 값');

    await page.setViewportSize({ width: 320, height: 900 });
    await expect(example.getByRole('button', { name: '넓게 보기', exact: true })).toBeHidden();
    await expect(example.getByRole('button', { name: '375px 좁은 화면', exact: true })).toBeHidden();
    await expect(input).toHaveValue('배치를 바꿔도 유지하는 값');
    const cta = page.locator('[data-example="GuideScrollCTA"]');
    await expect(cta).toHaveAttribute('data-ready', 'true');
    await expect(cta.getByRole('switch', { name: '긴 콘텐츠', exact: true })).toHaveCount(0);
    await expect(cta.getByRole('switch', { name: '키보드 상태 모의 적용', exact: true })).toHaveCount(0);
    await expect(cta.getByRole('spinbutton', { name: '하단 안전 영역' })).toBeHidden();
    await cta.getByRole('switch', { name: 'CTA를 본문 위에 고정', exact: true }).press('Space');
    const preview = cta.frameLocator('iframe');
    await preview.getByRole('button', { name: '키보드 상태 적용', exact: true }).click();
    await expect(preview.getByRole('navigation')).toHaveCount(0);
    await preview.getByRole('button', { name: '긴 CTA 문구', exact: true }).click();
    await expect(preview.getByText('팀원이 함께 사용하는 프로젝트입니다.', { exact: false })).toBeVisible();
    await cta.getByRole('button', { name: '세부 설정', exact: true }).click();
    await expect(cta.getByRole('spinbutton', { name: '하단 안전 영역' })).toBeVisible();
    await cta.getByRole('spinbutton', { name: '하단 안전 영역' }).fill('0');
    await cta.getByRole('button', { name: '세부 설정', exact: true }).click();
    await expect(preview.getByRole('button', { name: '키보드 상태 해제', exact: true })).toBeVisible();
    const scroll = preview.getByTestId('foundation-scroll');
    await expect.poll(async () => {
      await scroll.evaluate(element => { element.scrollTop = element.scrollHeight; });
      const last = (await preview.getByText('마지막 콘텐츠', { exact: true }).boundingBox())!;
      const dock = (await preview.getByTestId('foundation-dock').boundingBox())!;
      return last.y + last.height <= dock.y + 1;
    }).toBe(true);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await cta.scrollIntoViewIfNeeded();
    await page.screenshot({ path: `artifacts/docs-layout-cta-${platform}-320.png` });
  });
}
