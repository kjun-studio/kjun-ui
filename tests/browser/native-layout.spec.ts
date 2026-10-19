import { test, expect, type Page } from '@playwright/test';
import { openFixture } from './packed-fixture';

const platforms = ['react', 'vue3', 'native'] as const;
const box = (page: Page, testId: string) => page.getByTestId(testId).evaluate(el => el.getBoundingClientRect().toJSON());

test('native: no text node reaches a View, including empty strings and string affixes', async ({ page }) => {
  const errors: string[] = [];
  page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
  await openFixture(page, 'native', '', 'native-layout', 'development');
  await expect(page.getByTestId('empty-text').getByText('빈 제목 카드')).toBeVisible();
  await expect(page.getByTestId('empty-text').getByText('약', { exact: true })).toBeVisible();
  expect(errors.filter(text => text.includes('Unexpected text node'))).toEqual([]);
});

test('native: narrow segment labels stay on one line', async ({ page }) => {
  await openFixture(page, 'native', '', 'native-layout');
  const root = page.getByTestId('segment-narrow');
  for (const name of ['지난 달 기록', '올해 전체 보기', '진행 중인 일']) {
    const label = root.getByText(name, { exact: true }).last();
    const lines = await label.evaluate(el => Math.round(el.getBoundingClientRect().height / parseFloat(getComputedStyle(el).lineHeight)));
    expect(lines, name).toBe(1);
  }
});

for (const platform of platforms) {
  test(`${platform}: FeedbackProvider keeps the parent's flex layout`, async ({ page }) => {
    await openFixture(page, platform, '', 'native-layout');
    const child = await box(page, 'feedback-child');
    expect(Math.round(child.height)).toBe(120);
  });
}

for (const platform of platforms) {
  test(`${platform}: KpiRow segment labels never break inside a word on narrow screens`, async ({ page }) => {
    await page.setViewportSize({ width: 300, height: 800 });
    await openFixture(page, platform, '', 'native-layout');
    await expect(page.getByTestId('kpi-segments').getByText('누적 평가손익률').first()).toBeVisible();
        // A line may only start right after a space: Korean labels must not split between syllables.
    const breaks = await page.getByTestId('kpi-segments').evaluate(root => {
      const bad: string[] = [];
      // Web marks labelled segments; Native Web renders each segment's texts in one row view.
      const segments = root.querySelectorAll('.kjun-kpi-row__segment--labeled').length ? root.querySelectorAll('.kjun-kpi-row__segment--labeled') : root.querySelectorAll('div[dir="auto"]');
      for (const el of segments) {
        const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
        let previous: { top: number; char: string } | null = null;
        for (let node = walker.nextNode(); node; node = walker.nextNode()) {
          const text = node.textContent ?? '';
          previous = null; // a label and its value may part between them
          for (let i = 0; i < text.length; i++) {
            const range = document.createRange(); range.setStart(node, i); range.setEnd(node, i + 1);
            const rect = range.getClientRects()[0]; if (!rect) continue;
            if (previous && rect.top > previous.top + 2 && previous.char !== ' ' && text[i] !== ' ') bad.push(el.textContent + ' @' + i);
            previous = { top: rect.top, char: text[i] };
          }
        }
      }
      return bad;
    });
    expect(breaks).toEqual([]);
  });
}

const rect = (locator: ReturnType<Page['getByRole']>) => locator.evaluate(el => el.getBoundingClientRect().toJSON());
for (const platform of platforms) {
  test(`${platform}: a bottom Drawer stops short of the top safe area and pads the bottom one`, async ({ page }) => {
    await page.setViewportSize({ width: 400, height: 700 });
    await openFixture(page, platform, '', 'native-layout');
    await page.getByRole('button', { name: '아래 시트 열기' }).click();
    const dialog = page.getByRole('dialog', { name: '시트 bottom' });
    await expect(dialog).toBeVisible();
    await expect(page.getByRole('button', { name: '시트 확인' })).toBeInViewport();
    await page.waitForTimeout(500);
    const panel = await rect(dialog), confirm = await rect(page.getByRole('button', { name: '시트 확인' }));
    // 700 viewport − 20 top safe area − 48 sheet gap
    expect(panel.height).toBeLessThanOrEqual(633);
    expect(panel.height).toBeGreaterThan(600);
    expect(Math.round(panel.bottom)).toBe(700);
    expect(confirm.bottom).toBeLessThanOrEqual(700 - 34);
  });
  test(`${platform}: a bottom Drawer takes an explicit maxHeight`, async ({ page }) => {
    await page.setViewportSize({ width: 400, height: 700 });
    await openFixture(page, platform, '?max', 'native-layout');
    await page.getByRole('button', { name: '아래 시트 열기' }).click();
    const dialog = page.getByRole('dialog', { name: '시트 bottom' });
    await expect(page.getByRole('button', { name: '시트 확인' })).toBeInViewport();
    await page.waitForTimeout(500);
    expect(Math.round((await rect(dialog)).height)).toBeLessThanOrEqual(300);
    expect(Math.round((await rect(dialog)).height)).toBeGreaterThan(280);
  });
  test(`${platform}: top and side Drawers pad the safe areas`, async ({ page }) => {
    await page.setViewportSize({ width: 400, height: 700 });
    await openFixture(page, platform, '', 'native-layout');
    await page.getByRole('button', { name: '위 시트 열기' }).click();
    const top = page.getByRole('dialog', { name: '시트 top' });
    await expect(top).toBeVisible(); await page.waitForTimeout(500);
    const topPanel = await rect(top), topTitle = await rect(top.getByText('시트 top', { exact: true }));
    expect(topTitle.top - topPanel.top).toBeGreaterThanOrEqual(20);
    expect(topPanel.height).toBeLessThanOrEqual(700 - 48 + 1);
    await page.keyboard.press('Escape');
    await expect(top).toBeHidden();
    await page.getByRole('button', { name: '오른쪽 시트 열기' }).click();
    const side = page.getByRole('dialog', { name: '시트 right' });
    await expect(page.getByRole('button', { name: '시트 확인' })).toBeInViewport(); await page.waitForTimeout(500);
    const sidePanel = await rect(side), sideTitle = await rect(side.getByText('시트 right', { exact: true })), confirm = await rect(page.getByRole('button', { name: '시트 확인' }));
    expect(sideTitle.top - sidePanel.top).toBeGreaterThanOrEqual(20);
    expect(confirm.bottom).toBeLessThanOrEqual(700 - 34);
  });
}
