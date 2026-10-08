import { expect, type Page } from '@playwright/test';
export const interactionExample = (page: Page, kind: string) => page.locator(`[data-guide-case="interaction-${kind}"]`);
export async function launchInteraction(page: Page, kind: string) {
  const root = interactionExample(page, kind), start = root.getByRole('button', { name: '실행 예제 열기', exact: true });
  await expect(start).toBeEnabled(); await start.scrollIntoViewIfNeeded(); await start.focus(); await page.keyboard.press('Enter');
  await expect(root.locator('.guide-running')).toHaveAttribute('data-ready', 'true');
  await expect(root.getByRole('button', { name: '예제로 이동', exact: true })).toBeFocused();
  await page.keyboard.press('Enter'); return root;
}
