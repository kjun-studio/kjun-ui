import { test, expect, type Page, type Locator } from '@playwright/test';
import { openFixture } from './packed-fixture';
import { tokens } from '../../packages/tokens/src/index';
import { demoPalettes } from '../../shared/demo-colors';

const card = tokens.card as typeof tokens.card & { headerGaps: Record<string, number>; titleMinWidth: number; sideMediaWidth: number; mediaAspects: Record<string, number> };
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

for (const platform of ['react', 'vue3', 'native']) {
  test.describe(`${platform}: KjunCard code review`, () => {
    test.beforeEach(async ({ page }) => {
      await page.setViewportSize({ width: 900, height: 2400 });
      await openFixture(page, platform, '', 'card-design');
    });

    test('a list inside a tinted card keeps its badges in their own tone', async ({ page }) => {
      const fill = await at(page, 'tint-list').getByText('새 항목', { exact: true }).evaluate(el => {
        for (let node: Element | null = el; node; node = node.parentElement) {
          const color = getComputedStyle(node).backgroundColor;
          if (color !== 'rgba(0, 0, 0, 0)' && color !== 'transparent') return color;
        }
        return '';
      });
      expect(fill).toBe(rgb(palette.successBg));
    });

    test('a badge beside a two-line title stays on its first line', async ({ page }) => {
      const title = await box(at(page, 'two-line').getByText('두 줄로 넘어가는 아주 긴 카드 제목', { exact: true }));
      const badge = await box(at(page, 'two-line').getByText('진행', { exact: true }));
      expect(title.height).toBeGreaterThan(tokens.typography.cardTitle.lineHeightPx * 1.5);
      expect(badge.y).toBeGreaterThanOrEqual(title.y - 1);
      expect(badge.y + badge.height).toBeLessThanOrEqual(title.y + tokens.typography.cardTitle.lineHeightPx + 4);
    });

    test('media at the start sits beside the content at its token width, full height', async ({ page }) => {
      // The frame KJUN sizes is the media's parent; what fills it is the app's (web CSS stretches a plain child).
      const r = await box(root(page, 'side-media')), media = await box(page.getByTestId('side-media').locator('..'));
      const title = await box(at(page, 'side-media').getByText('가로 카드', { exact: true }));
      near(media.width, card.sideMediaWidth);
      near(media.x, r.x); near(media.y, r.y); near(media.height, r.height);
      near(title.x, r.x + card.sideMediaWidth + card.padding.md);
    });

    test('mediaAspect gives the top media a fixed ratio', async ({ page }) => {
      const media = await box(page.getByTestId('aspect-media').locator('..'));
      near(media.width / media.height, card.mediaAspects.wide, 0.02);
    });

    test('a node title renders inside the heading', async ({ page }) => {
      await expect(at(page, 'node-title').getByRole('heading', { level: 3 })).toContainText('노드 제목 12');
    });

    test('href makes the whole card one link with no heading; disabled keeps the link role without an address', async ({ page }) => {
      const link = at(page, 'link').getByRole('link', { name: '링크 카드' });
      await expect(link).toHaveAttribute('href', '#card-link');
      await expect(at(page, 'link').getByRole('heading')).toHaveCount(0);
      await link.click();
      await expect(page.getByTestId('presses')).toHaveText('1');
      const blocked = at(page, 'link-disabled').getByRole('link', { name: '막힌 링크 카드' });
      await expect(blocked).toHaveAttribute('aria-disabled', 'true');
      await expect(blocked).not.toHaveAttribute('href', /.*/);
      await blocked.click({ force: true });
      await expect(page.getByTestId('presses')).toHaveText('1');
    });

    test('a link card lifts on hover like a pressable card', async ({ page }) => {
      const link = root(page, 'link');
      const before = await link.evaluate(el => getComputedStyle(el).boxShadow);
      await link.hover();
      await expect.poll(() => link.evaluate(el => getComputedStyle(el).boxShadow)).not.toBe(before);
    });

    if (platform !== 'native') {
      test('a footer alone beside side media draws no divider, as on Native', async ({ page }) => {
        await expect(at(page, 'side-footer').locator('.kjun-card-footer')).toHaveCSS('border-top-width', '0px');
      });

      test('a keydown listener runs first and can stop the press', async ({ page }) => {
        const guarded = root(page, 'guarded');
        await guarded.focus();
        await guarded.dispatchEvent('keydown', { key: 'Enter' });
        await expect(page.getByTestId('presses')).toHaveText('0');
        await guarded.dispatchEvent('keydown', { key: ' ' });
        await guarded.dispatchEvent('keyup', { key: ' ' });
        await expect(page.getByTestId('presses')).toHaveText('1');
      });

      test('header buttons wrap through the button wrap contract', async ({ page }) => {
        await expect(at(page, 'narrow-button').getByRole('button')).toHaveAttribute('data-wrap', /.*/);
      });

      test('a held Enter presses once and Space presses on release', async ({ page }) => {
        const pressable = root(page, 'pressable');
        await pressable.focus();
        await pressable.dispatchEvent('keydown', { key: 'Enter' });
        for (let i = 0; i < 3; i++) await pressable.dispatchEvent('keydown', { key: 'Enter', repeat: true });
        await expect(page.getByTestId('presses')).toHaveText('1');
        await pressable.dispatchEvent('keydown', { key: ' ' });
        await expect(page.getByTestId('presses')).toHaveText('1');
        await pressable.dispatchEvent('keyup', { key: ' ' });
        await expect(page.getByTestId('presses')).toHaveText('2');
      });

      test('a control added later to a pressable card still warns', async ({ page }) => {
        const warnings: string[] = [];
        page.on('console', message => { if (message.type() === 'warning' || message.type() === 'error') warnings.push(message.text()); });
        // Development warnings only exist in the development build.
        await openFixture(page, platform, '', 'card-design', 'development');
        await page.evaluate(() => (window as any).addNestedControl());
        await expect(at(page, 'pressable').getByText('안쪽 링크')).toBeVisible();
        await expect.poll(() => warnings.some(text => text.includes('pressable or link card contains buttons or links'))).toBe(true);
      });
    }
  });
}
