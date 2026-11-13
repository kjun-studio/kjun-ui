import { test, expect, type Page, type Locator } from '@playwright/test';
import { openFixture } from './packed-fixture';
import { tokens } from '../../packages/tokens/src/index';
import { demoPalettes } from '../../shared/demo-colors';

const card = tokens.card as typeof tokens.card & { headerGaps: Record<string, number>; titleMinWidth: number };
const palette = demoPalettes.default;
const longTitle = '분기별 프로젝트 운영 현황과 다음 단계 계획서';
const longSubtitle = '팀 전체가 함께 관리하는 문서와 최근 활동 기록을 모았습니다';
const rgb = (hex: string) => `rgb(${[1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16)).join(', ')})`;
const near = (actual: number, expected: number, tolerance = 0.6) => expect(Math.abs(actual - expected)).toBeLessThanOrEqual(tolerance);
const box = async (element: Locator) => { await expect(element).toBeVisible(); return (await element.boundingBox())!; };
const at = (page: Page, id: string) => page.locator(`[data-case="${id}"]`);
const root = (page: Page, id: string) => at(page, id).locator(':scope > *').first();
/** Characters on both sides of every line break inside the element's text. */
const lineBreaks = (element: Locator) => element.evaluate(el => {
  const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT), range = document.createRange(), breaks: string[] = [];
  let top: number | null = null, previous = '';
  for (let node = walker.nextNode(); node; node = walker.nextNode()) {
    const text = node.textContent || '';
    for (let i = 0; i < text.length; i++) {
      range.setStart(node, i); range.setEnd(node, i + 1);
      const rect = range.getClientRects()[0];
      if (!rect) continue;
      if (top !== null && rect.top > top + 2) breaks.push(previous + '|' + text[i]);
      top = rect.top; previous = text[i];
    }
  }
  return breaks;
});

for (const platform of ['react', 'vue3', 'native']) {
  test.describe(`${platform}: KjunCard design review`, () => {
    test.beforeEach(async ({ page }) => {
      await page.setViewportSize({ width: 900, height: 1600 });
      await openFixture(page, platform, '', 'card-design');
    });

    test('Korean titles and subtitles wrap between words', async ({ page }) => {
      for (const text of [longTitle, longSubtitle]) {
        const breaks = await lineBreaks(at(page, 'narrow').getByText(text, { exact: true }));
        expect(breaks.length).toBeGreaterThan(0);
        for (const pair of breaks) expect(pair.startsWith(' ') || pair.endsWith(' ')).toBe(true);
      }
    });

    test('a badge keeps the title row; a wide action moves below at the start', async ({ page }) => {
      const title = await box(at(page, 'narrow').getByText(longTitle, { exact: true }));
      const badge = await box(at(page, 'narrow').getByText('진행 중', { exact: true }));
      expect(badge.y).toBeLessThan(title.y + 24);
      expect(badge.x).toBeGreaterThan(title.x + title.width);
      const heading = await box(at(page, 'narrow-button').getByText('프로젝트 현황', { exact: true }));
      const action = await box(at(page, 'narrow-button').getByRole('button'));
      expect(action.y).toBeGreaterThanOrEqual(heading.y + heading.height);
      near(action.x, heading.x);
    });

    test('subtitle reads in body type and the header sits closer to the body', async ({ page }) => {
      const wide = at(page, 'wide');
      const subtitle = wide.getByText('팀 전체가 함께 관리하는 문서', { exact: true });
      await expect(subtitle).toHaveCSS('font-size', `${tokens.typography.body.fontSizePx}px`);
      await expect(subtitle).toHaveCSS('line-height', `${tokens.typography.body.lineHeightPx}px`);
      const s = await box(subtitle), body = await box(wide.getByText('이번 분기 문서를 검토했습니다.', { exact: true }));
      near(body.y - (s.y + s.height), card.headerGaps.md);
    });

    test('footerAlign end puts the footer actions at the end', async ({ page }) => {
      const r = await box(root(page, 'wide')), last = await box(at(page, 'wide').getByRole('button', { name: '프로젝트 보기' }));
      near(r.x + r.width - (last.x + last.width), card.padding.md);
    });

    test('tinted surfaces are one flat fill and lift their badges onto the surface colour', async ({ page }) => {
      if (platform === 'native') await expect(at(page, 'accent').locator('svg')).toHaveCount(0);
      else await expect(root(page, 'accent')).toHaveCSS('background-image', 'none');
      await expect(root(page, 'success')).toHaveCSS('background-color', rgb(palette.successLight));
      for (const [id, label] of [['success', '완료'], ['muted', '보조']]) {
        // The badge fill is the nearest painted box around its label.
        const fill = await at(page, id).getByText(label, { exact: true }).evaluate(el => {
          for (let node: Element | null = el; node; node = node.parentElement) {
            const color = getComputedStyle(node).backgroundColor;
            if (color !== 'rgba(0, 0, 0, 0)' && color !== 'transparent') return color;
          }
          return '';
        });
        expect(fill).toBe(rgb(palette.surface));
      }
    });

    test('headingLevel sets the title level; false and pressable cards draw no heading', async ({ page }) => {
      await expect(at(page, 'heading4').getByRole('heading', { level: 4, name: '네 번째 수준 제목' })).toBeVisible();
      await expect(at(page, 'wide').getByRole('heading', { level: 3, name: '3분기 운영 현황' })).toBeVisible();
      await expect(at(page, 'no-heading').getByRole('heading')).toHaveCount(0);
      await expect(at(page, 'pressable').getByRole('heading')).toHaveCount(0);
      await at(page, 'pressable').getByRole('button', { name: '눌리는 카드' }).click();
      await expect(page.getByTestId('presses')).toHaveText('1');
    });

    if (platform !== 'native') test('a flat pressable card lifts one step on hover', async ({ page }) => {
      const pressable = root(page, 'pressable');
      const raised = await pressable.evaluate(el => {
        const probe = document.createElement('div'); probe.style.boxShadow = 'var(--_kjun-elevation-raised)'; el.appendChild(probe);
        const value = getComputedStyle(probe).boxShadow; probe.remove(); return value;
      });
      expect(raised).not.toBe('none');
      await pressable.hover();
      await expect.poll(() => pressable.evaluate(el => getComputedStyle(el).boxShadow)).toBe(raised);
    });
  });
}
