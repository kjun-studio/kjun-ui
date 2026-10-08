import { expect, test } from '@playwright/test';
import { interactionExample, launchInteraction } from './interaction-docs-helpers';
import { platforms, changePlatform } from './motion-docs-helpers';
import { shortcutCount } from './docs-data';
for (const platform of platforms) test(`${platform}: interaction navigation, examples, reset and platform cleanup`, async ({ page }) => {
  test.setTimeout(180000);
  await page.goto('/interaction?platform=' + platform);
  await expect(page.getByRole('heading', { level: 1, name: '상태·상호작용' })).toBeVisible();
  await expect(page.locator('.page-navigation a').first()).toHaveAttribute('href', `/accessibility?platform=${platform}`);
  await expect(page.locator('.page-navigation a').last()).toHaveAttribute('href', `/icons?platform=${platform}`);
  await expect(page.locator('.guide-running')).toHaveCount(0);
  await expect(page.locator('.document-shortcuts a')).toHaveCount(shortcutCount('interaction'));
  await page.locator('.document-shortcuts a[href="#availability"]').click();
  await expect(page).toHaveURL(new RegExp(`/interaction\\?platform=${platform}#availability$`));
  for (const id of ['states', 'interaction', 'selection', 'availability', 'loading', 'composition']) await expect(page.locator('section#' + id)).toHaveCount(1);
  for (const kind of ['button', 'tabs', 'input', 'loading']) {
    const root = await launchInteraction(page, kind), frame = root.frameLocator('iframe');
    await expect(root.locator('details')).toHaveCount(0);
    if (kind === 'button') {
      await page.keyboard.press('Enter'); await page.keyboard.press('Space');
      await expect(frame.getByText('2번 실행했습니다', { exact: true })).toBeVisible();
    }
    if (kind === 'tabs') {
      await page.keyboard.press('ArrowRight'); await expect(frame.getByRole('tab', { name: '둘째 탭' })).toBeFocused();
      await page.keyboard.press('Tab'); await expect(frame.getByRole('tabpanel')).toBeFocused();
      await frame.getByRole('tab', { name: '첫 탭', exact: true }).click();
      await frame.getByRole('button', { name: '첫 탭 비활성화' }).click();
      await expect(frame.getByRole('button', { name: '첫 탭 활성화' })).toBeFocused();
      await expect(frame.getByRole('tab', { name: '첫 탭', exact: true })).toHaveAttribute('aria-selected', 'true');
      await expect(frame.getByText('선택값: one', { exact: true })).toBeVisible();
    }
    if (kind === 'input') {
      await frame.getByRole('textbox', { name: '일반 입력', exact: true }).fill('독립 값');
      await expect(frame.getByRole('textbox', { name: '읽기 전용 입력', exact: true })).toHaveValue('장기 보유 자산');
      await frame.getByRole('button', { name: '프로젝트에서 값 갱신' }).click();
      for (const name of ['일반 입력', '읽기 전용 입력', '비활성 입력']) await expect(frame.getByRole('textbox', { name, exact: true })).toHaveValue('새 목록');
    }
    if (kind === 'loading') {
      const status = frame.getByRole('status').filter({ hasText: /저장|완료 또는 실패/ });
      await frame.getByRole('button', { name: '저장', exact: true }).click();
      await expect(frame.getByRole('button', { name: '저장', exact: true })).toHaveAttribute('aria-busy', 'true');
      await expect(status).toBeFocused();
      await expect(status).toHaveAttribute('aria-live', 'polite');
      await expect(status).toHaveAttribute('aria-atomic', 'true');
      await page.keyboard.press('Tab');
      await expect(frame.getByRole('button', { name: '완료로 처리', exact: true })).toBeFocused();
      await page.keyboard.press('Tab');
      await expect(frame.getByRole('button', { name: '실패로 처리', exact: true })).toBeFocused();
      await page.keyboard.press('Enter');
      await expect(frame.getByText('저장하지 못했습니다. 다시 시도하세요.', { exact: true })).toBeVisible();
      await expect(status).toBeFocused();
      await expect(frame.getByRole('button', { name: '완료로 처리', exact: true })).toBeDisabled();
      await expect(frame.getByRole('button', { name: '실패로 처리', exact: true })).toBeDisabled();
      await frame.getByRole('button', { name: '저장', exact: true }).click();
      await frame.getByRole('button', { name: '저장 비활성화' }).click();
    }
    await expect(root.locator('.code-block')).toHaveCount(0);
    await root.getByRole('button', { name: '초기화', exact: true }).click();
    await expect(root.locator('.guide-running')).toHaveAttribute('data-ready', 'true');
    await expect(root.getByRole('button', { name: '초기화', exact: true })).toBeFocused();
    if (kind === 'button') await expect(frame.getByText('버튼을 눌러보세요', { exact: true })).toBeVisible();
    if (kind === 'input') await expect(frame.getByRole('textbox', { name: '일반 입력', exact: true })).toHaveValue('장기 보유 자산');
    if (kind === 'tabs') await expect(frame.getByRole('button', { name: '첫 탭 비활성화' })).toBeVisible();
    if (kind === 'loading') await frame.getByRole('button', { name: '저장', exact: true }).click();
  }
  const next = platform === 'react' ? 'vue2' : 'react'; await changePlatform(page, next);
  for (const kind of ['button', 'tabs', 'input', 'loading']) {
    const root = interactionExample(page, kind);
    await expect(root.locator('.guide-running')).toHaveAttribute('data-platform', next);
    await expect(root.locator('.guide-running')).toHaveAttribute('data-ready', 'true');
  }
  await expect(interactionExample(page, 'loading').frameLocator('iframe').getByRole('button', { name: '저장', exact: true })).toBeEnabled();
  await interactionExample(page, 'tabs').getByRole('link', { name: '상세 예제' }).click();
  await expect(page).toHaveURL(new RegExp(`/components/tabs\\?platform=${next}#states$`));
  await page.getByRole('link', { name: '상태·상호작용', exact: true }).last().click();
  await expect(page).toHaveURL(new RegExp(`/interaction\\?platform=${next}$`));
  await expect(page.locator('.guide-running')).toHaveCount(0);
});
test('interaction frame failure can retry without implicit focus entry', async ({ page }) => {
  await page.route('**/previews/catalog-react.html?**', route => route.abort());
  await page.goto('/interaction?platform=react'); const root = interactionExample(page, 'loading');
  await root.getByRole('button', { name: '실행 예제 열기', exact: true }).click();
  await expect(root.getByRole('button', { name: '실행 예제 다시 시도' })).toBeVisible();
  await page.unroute('**/previews/catalog-react.html?**');
  await root.getByRole('button', { name: '다시 시도', exact: true }).click();
  await expect(root.locator('.guide-running')).toHaveAttribute('data-ready', 'true');
  await expect(root.getByRole('button', { name: '예제로 이동' })).toBeFocused();
});
