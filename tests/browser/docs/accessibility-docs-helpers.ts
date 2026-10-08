import { expect, type Page, type Locator } from '@playwright/test';
export const a11yExample = (page: Page, kind: string) => page.locator(`[data-guide-case="accessibility-${kind}"]`);
export async function launch(page: Page, kind: string) {
  const root = a11yExample(page, kind), start = root.getByRole('button', { name: '실행 예제 열기', exact: true });
  await expect(start).toBeEnabled();
  await start.scrollIntoViewIfNeeded(); await start.focus(); await page.keyboard.press('Enter');
  await expect(root.locator('.guide-running')).toHaveAttribute('data-ready', 'true');
  await expect(root.getByRole('button', { name: '예제로 이동', exact: true })).toBeFocused();
  await page.keyboard.press('Enter');
  return root;
}
export async function focusedVisible(root: Locator) {
  await expect.poll(() => root.locator('iframe').evaluate((frame: HTMLIFrameElement) => {
    const active = frame.contentDocument?.activeElement as HTMLElement | null;
    if (!active || active === frame.contentDocument?.body) return false;
    const inner = active.getBoundingClientRect(), outer = frame.getBoundingClientRect();
    const sticky = Math.max(...['.topbar', '.document-shortcuts'].map(selector => document.querySelector(selector)?.getBoundingClientRect().bottom || 0));
    return outer.top + inner.top >= sticky && outer.top + inner.bottom <= innerHeight + 1 && inner.left >= -1 && inner.right <= frame.clientWidth + 1;
  })).toBe(true);
}
