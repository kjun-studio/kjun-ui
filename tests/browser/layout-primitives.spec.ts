import { expect, test, type Locator, type Page } from '@playwright/test';
import { tokens } from '../../packages/tokens/dist/index.js';
import { openFixture } from './packed-fixture';
import { formLabels, longSentence, narrowNumber, toneProbes, toneTexts } from '../fixtures/layout-primitives-values';
// KjunText, KjunStack and KjunInline: names (roles and steps) pick every size, color and gap from tokens.
const box = async (locator: Locator) => (await locator.boundingBox())!;
const px = (n: number) => `${n}px`;
const boxes = (page: Page, id: string) => page.getByTestId(id).locator('.app-box');
for (const platform of ['react', 'vue3', 'native']) {
  test.describe(platform, () => {
    test.beforeEach(async ({ page }) => {
      await openFixture(page, platform, '', 'layout-primitives');
      await expect(page.getByTestId('text-variants').getByText('body', { exact: true })).toBeVisible();
    });

    test('text variants use the typography roles', async ({ page }) => {
      const region = page.getByTestId('text-variants');
      for (const role of ['pageTitle', 'bodyLg', 'body', 'bodyLong', 'labelStrong', 'caption', 'captionStrong', 'numberMd'] as const) {
        const text = region.getByText(role, { exact: true });
        await expect(text, role).toHaveCSS('font-size', px(tokens.typography[role].fontSizePx));
        await expect(text, role).toHaveCSS('line-height', px(tokens.typography[role].lineHeightPx));
      }
      if (platform === 'native') {
        await expect(region.getByText('pageTitle', { exact: true })).toHaveAttribute('role', 'heading');
      } else {
        const tag = (role: string) => region.getByText(role, { exact: true }).evaluate(el => el.tagName);
        expect([await tag('pageTitle'), await tag('body'), await tag('numberMd')]).toEqual(['H1', 'P', 'SPAN']);
        // The strong steps keep their base step's size and only raise the weight.
        for (const role of ['labelStrong', 'captionStrong'] as const)
          await expect(region.getByText(role, { exact: true }), role).toHaveCSS('font-weight', String(tokens.typography[role].fontWeight));
      }
    });

    test('tones map to the text color roles', async ({ page }) => {
      for (const tone of Object.keys(toneProbes) as (keyof typeof toneProbes)[]) {
        const expected = await page.getByTestId('probe-' + tone).evaluate(el => getComputedStyle(el).color);
        await expect(page.getByTestId('text-tones').getByText(toneTexts[tone], { exact: true }), tone).toHaveCSS('color', expected);
      }
    });

    test('inherit keeps the surrounding size and weight and takes its own tone', async ({ page }) => {
      const part = page.getByTestId('text-features').getByText('3건', { exact: true });
      await expect(part).toHaveCSS('font-size', px(tokens.typography.sectionTitle.fontSizePx));
      await expect(part).toHaveCSS('font-weight', String(tokens.typography.sectionTitle.fontWeight));
      await expect(part).toHaveCSS('color', await page.getByTestId('probe-danger').evaluate(el => getComputedStyle(el).color));
    });

    test('numeric, decoration and a line count below one', async ({ page }) => {
      const region = page.getByTestId('text-features');
      const digits = region.getByText('1111', { exact: true });
      expect(await digits.evaluate(el => getComputedStyle(el).fontVariantNumeric)).toContain('tabular-nums');
      await expect(digits).toHaveCSS('font-size', px(tokens.typography.body.fontSizePx));
      expect(await region.getByText('할인 전 가격', { exact: true }).evaluate(el => getComputedStyle(el).textDecorationLine)).toContain('line-through');
      await expect(region.getByText('줄 수가 1보다 작으면 줄이지 않습니다', { exact: true })).not.toHaveCSS('overflow', 'hidden');
    });

    test('maxLines clamps visibly but keeps the text', async ({ page }) => {
      const text = page.getByTestId('text-clamp').getByText(longSentence.trim().slice(0, 10));
      expect((await box(text)).height).toBeLessThanOrEqual(tokens.typography.body.lineHeightPx + 1);
      expect((await text.textContent())!.trim()).toBe(longSentence.trim());
    });

    test('number variants use fixed-width digits', async ({ page }) => {
      const value = page.getByTestId('text-number').getByText('1234', { exact: true });
      expect(await value.evaluate(el => getComputedStyle(el).fontVariantNumeric)).toContain('tabular-nums');
    });

    test('stack gaps follow space.stack and space.section', async ({ page }) => {
      for (const [id, gap] of [['stack-md', tokens.space.stack.md], ['stack-section', tokens.space.section.md]] as const) {
        const [first, second] = [await box(boxes(page, id).nth(0)), await box(boxes(page, id).nth(1))];
        expect(Math.round(second.y - (first.y + first.height)), id).toBe(gap);
      }
    });

    test('inline gap follows space.inline', async ({ page }) => {
      const [first, second] = [await box(boxes(page, 'inline-sm').nth(0)), await box(boxes(page, 'inline-sm').nth(1))];
      expect(Math.round(second.x - (first.x + first.width))).toBe(tokens.space.inline.sm);
    });

    test('inline wraps on a narrow screen', async ({ page }) => {
      await page.setViewportSize({ width: 320, height: 800 });
      const items = boxes(page, 'inline-narrow');
      await expect.poll(async () => (await box(items.last())).y > (await box(items.first())).y).toBe(true);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    });

    test('form groups follow the stack gap only', async ({ page }) => {
      // Same group structure in both regions, so the difference is only the spacing between groups.
      const distance = async (labels: string[]) => {
        const input = await box(page.getByRole('textbox', { name: labels[0], exact: true }));
        const label = await box(page.getByText(labels[1], { exact: true }));
        return label.y - (input.y + input.height);
      };
      const stacked = await distance(formLabels.stack), free = await distance(formLabels.free);
      expect(Math.round(free - stacked)).toBe(tokens.extensions.form.itemGap - tokens.space.stack.md);
    });

    if (platform === 'native') {
      // A bare string inside a View crashes on a device; RN Web renders it anyway, so check it sits in a Text (dir="auto").
      for (const [id, text] of [['stack-string', '문자열 자식'], ['stack-fragment-string', '조각 안 문자열']]) {
        test(`native stack wraps raw strings in Text: ${id}`, async ({ page }) => {
          await expect(page.getByTestId(id).getByText(text, { exact: true })).toHaveAttribute('dir', 'auto');
        });
      }
    } else {
      test('app markup inside stack keeps its own styles', async ({ page }) => {
        const heading = parseFloat(await page.getByTestId('stack-app-markup').locator('h2').evaluate(el => getComputedStyle(el).fontSize));
        expect(heading).toBeGreaterThan(tokens.typography.body.fontSizePx);
      });

      test('links inside KjunText keep the browser link style', async ({ page }) => {
        const link = page.getByTestId('text-link').getByRole('link', { name: '동의' });
        expect(await link.evaluate(el => getComputedStyle(el).textDecorationLine)).toContain('underline');
      });

      test('a heading takes focus from code and a paragraph can be a status', async ({ page }) => {
        const region = page.getByTestId('text-focus');
        const heading = region.getByRole('heading', { name: '새 화면 제목' });
        await expect(heading).toHaveAttribute('tabindex', '-1');
        await page.evaluate(() => (window as any).kjunHeading.focus());
        await expect(heading).toBeFocused();
        await expect(region.getByRole('status')).toHaveText('저장했습니다');
      });

      test('app content rules do not restyle KjunText margin or color', async ({ page }) => {
        const text = page.getByTestId('app-prose').getByText('앱 본문 안의 글자', { exact: true });
        await expect(text).toHaveCSS('margin-bottom', '0px');
        expect(await text.evaluate(el => getComputedStyle(el).color)).not.toBe('rgb(1, 2, 3)');
      });

      test('numbers do not break between digits in a narrow box', async ({ page }) => {
        const value = page.getByTestId('number-narrow').getByText(narrowNumber, { exact: true });
        expect((await box(value)).height).toBeLessThanOrEqual(tokens.typography.numberMd.lineHeightPx + 1);
      });

      test('display numbers do not break between digits either', async ({ page }) => {
        const value = page.getByTestId('display-narrow').getByText(narrowNumber, { exact: true });
        expect((await box(value)).height).toBeLessThanOrEqual(tokens.typography.displayMd.lineHeightPx + 1);
      });

      test('titles break between words and balance their lines', async ({ page }) => {
        const title = page.getByTestId('text-variants').getByText('pageTitle', { exact: true });
        await expect(title).toHaveCSS('word-break', 'keep-all');
        expect(await title.evaluate(el => getComputedStyle(el).textWrap)).toContain('balance');
        await expect(page.getByTestId('text-variants').getByText('body', { exact: true })).toHaveCSS('word-break', 'normal');
      });

      test('as takes list and definition tags, and title and lang reach the element', async ({ page }) => {
        const term = page.getByTestId('text-features').getByText('결제 수단', { exact: true });
        expect(await term.evaluate(el => el.tagName)).toBe('DT');
        await expect(term).toHaveAttribute('title', '결제 수단 전체 이름');
        await expect(term).toHaveAttribute('lang', 'ko');
      });

      test('app markup inside nested stacks keeps its own styles', async ({ page }) => {
        const heading = parseFloat(await page.getByTestId('nested-app-markup').locator('h2').evaluate(el => getComputedStyle(el).fontSize));
        expect(heading).toBeGreaterThan(tokens.typography.body.fontSizePx);
      });
    }
  });
}
