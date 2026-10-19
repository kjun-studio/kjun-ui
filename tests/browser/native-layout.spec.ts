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
