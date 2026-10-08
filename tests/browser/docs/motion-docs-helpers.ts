import { expect, type Page, type Locator } from '@playwright/test';
export const platforms = ['react', 'vue2', 'native'] as const;
// Document layout specs check the docs shell around previews. React covers every width and real zoom;
// Vue 2 and Native keep the narrowest width so each platform's preview still meets a tight frame.
export const layoutWidths = (platform: string, widths: number[]) => platform === 'react' ? widths : widths.slice(0, 1);
export const checksZoom = (platform: string) => platform === 'react';
export const example = (page: Page, kind: string) => page.locator(`[data-guide-case="motion-${kind}"]`);
// Fixed layers use the iframe viewport; focus return can scroll its parent page.
export const revealFrame = (root: Locator) => root.locator('iframe').evaluate(node => {
  const header = document.querySelector('.document-shortcuts')!.getBoundingClientRect().bottom;
  window.scrollTo({ top: scrollY + node.getBoundingClientRect().top - header - 8, behavior: 'instant' });
});
export const exampleLabels: Record<string, string> = { tabs: '선택선', accordion: '펼침', modal: '모달', drawer: '패널', toast: '알림', number: '숫자' };
export async function selectMotionExample(page: Page, kind: string) {
  await page.getByRole('tablist', { name: '모션 예제', exact: true }).getByRole('tab', { name: exampleLabels[kind], exact: true }).click();
  const root = example(page, kind);
  await expect(root.locator('.guide-running')).toHaveAttribute('data-ready', 'true');
  await expect(page.locator('.motion-playground iframe')).toHaveCount(1);
  await revealFrame(root);
  return root;
}
export async function resetMotionExample(root: Locator) {
  await root.getByRole('button', { name: '초기화', exact: true }).click();
  await expect(root.locator('.guide-running')).toHaveAttribute('data-ready', 'true');
  await revealFrame(root);
}
export async function changePlatform(page: Page, platform: string) {
  await page.getByRole('button', { name: '문서 플랫폼', exact: true }).click();
  await page.getByRole('option', { name: { react: 'React', vue2: 'Vue 2', native: 'React Native' }[platform], exact: true }).click();
}
export async function clipboard(page: Page) {
  await page.addInitScript(() => {
    (window as any).__motionCopies = [];
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: {
      writeText: async (code: string) => { (window as any).__motionCopies.push(code); },
    } });
  });
}
