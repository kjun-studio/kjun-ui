import { expect, type Page } from '@playwright/test';
export const iconExample = (page: Page, name = 'selection') => page.locator(`[data-guide-case="icons-${name}"]`);
export const iconCard = (page: Page, name: string) => page.getByRole('button', { name: new RegExp('^' + name + ' · ') });
export async function chooseIcon(page: Page, name: string) {
  await expect(page.getByRole('button', { name: '문서 검색', exact: true })).toBeEnabled();
  await page.getByLabel('이름·한국어 용도 검색').fill(name);
  await iconCard(page, name).click();
}
export async function launchIcon(page: Page, name = 'selection') {
  const root = iconExample(page, name);
  await root.scrollIntoViewIfNeeded();
  if (name === 'toggle') await root.getByRole('button', { name: '실행 예제 열기', exact: true }).click();
  await expect(root.locator('.guide-running')).toHaveAttribute('data-ready', 'true');
  return root;
}

export async function setIconSize(page: Page, size: string) {
  await page.getByRole('button', { name: '아이콘 크기', exact: true }).click();
  await page.getByRole('option', { name: new RegExp('^' + size + ' · ') }).click();
}

export async function setIconFilled(page: Page, filled = true) {
  await page.getByRole('radiogroup', { name: '아이콘 형태' }).getByText(filled ? '채움형' : '선형', { exact: true }).click();
}
