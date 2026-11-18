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

    test('stack xs gap, justify between and a divider between children', async ({ page }) => {
      const [a, b] = [await box(boxes(page, 'stack-xs').nth(0)), await box(boxes(page, 'stack-xs').nth(1))];
      expect(Math.round(b.y - (a.y + a.height))).toBe(tokens.space.stack.xs);
      // justify="between": the last child sits on the stack's bottom edge.
      const area = await box(page.getByTestId('stack-justify')), last = await box(boxes(page, 'stack-justify').nth(1));
      expect(Math.round(area.y + area.height - (last.y + last.height))).toBe(0);
      // divider: a hairline sits inside the gap, so neighbours stay one gap apart, and there is none after the last.
      const rows = boxes(page, 'stack-divider'), [first, second, third] = [await box(rows.nth(0)), await box(rows.nth(1)), await box(rows.nth(2))];
      const step = tokens.space.stack.sm;
      expect(Math.round(second.y - (first.y + first.height))).toBe(step);
      expect(Math.round(third.y - (second.y + second.height))).toBe(step);
      const stack = await box(page.getByTestId('stack-divider'));
      expect(Math.round(stack.y + stack.height - (third.y + third.height))).toBe(0);
    });

    test('under stretch, buttons and badges keep their own width and a block button fills it', async ({ page }) => {
      const area = await box(page.getByTestId('stack-controls'));
      const save = await box(page.getByTestId('stack-controls').getByRole('button', { name: '저장' }));
      const full = await box(page.getByTestId('stack-controls').getByRole('button', { name: '전체 폭' }));
      const badge = await box(page.getByTestId('stack-controls').getByText('신규', { exact: true }));
      expect(save.width).toBeLessThan(area.width / 2);
      expect(badge.width).toBeLessThan(area.width / 2);
      expect(Math.round(full.width)).toBe(Math.round(area.width));
      expect(Math.round(save.x)).toBe(Math.round(area.x));
    });

    test('a gap per screen width follows the breakpoints', async ({ page }) => {
      const gap = async () => { const [a, b] = [await box(boxes(page, 'stack-responsive').nth(0)), await box(boxes(page, 'stack-responsive').nth(1))]; return Math.round(b.y - (a.y + a.height)); };
      await expect.poll(gap).toBe(tokens.space.stack.lg);
      await page.setViewportSize({ width: tokens.responsive.stackMedium - 1, height: 900 });
      await expect.poll(gap).toBe(tokens.space.stack.sm);
    });

    const distance = async (page: Page, id: string, axis: 'x' | 'y' = 'y', from = 0) => {
      const [a, b] = [await box(boxes(page, id).nth(from)), await box(boxes(page, id).nth(from + 1))];
      return Math.round(axis === 'y' ? b.y - (a.y + a.height) : b.x - (a.x + a.width));
    };

    test('smMd is the 12px step between sm and md', async ({ page }) => {
      expect(await distance(page, 'stack-smmd')).toBe(tokens.space.stack.smMd);
    });

    test('an inset hairline keeps the gap and a strong band adds its thickness, fragments included', async ({ page }) => {
      expect(await distance(page, 'stack-inset')).toBe(tokens.space.stack.md);
      expect(await distance(page, 'stack-strong')).toBe(tokens.space.stack.md + tokens.border.dividerStrongWidth);
      // Children inside a fragment get dividers between them like any other child, on every platform.
      for (const from of [0, 1]) expect(await distance(page, 'stack-fragment', 'y', from)).toBe(tokens.space.stack.sm + tokens.border.dividerStrongWidth);
      expect(await distance(page, 'inline-strong', 'x')).toBe(tokens.space.inline.md + tokens.border.dividerStrongWidth);
    });

    test('a chip keeps its own width under stretch', async ({ page }) => {
      const area = await box(page.getByTestId('stack-chip')), chip = await box(page.getByTestId('stack-chip').getByText('식비', { exact: true }));
      expect(chip.width).toBeLessThan(area.width / 2);
    });

    test('an expandable text shows a more button only when it overflows, and opens and closes', async ({ page }) => {
      const region = page.getByTestId('text-expand'), more = region.getByRole('button', { name: '더보기' });
      await expect(more).toBeVisible();
      await expect(page.getByTestId('text-expand-short').getByRole('button')).toHaveCount(0);
      const text = region.getByText(/한 줄로 줄여야/).first();
      const lineHeight = tokens.typography.body.lineHeightPx, closed = await box(text);
      expect(Math.round(closed.height)).toBe(2 * lineHeight);
      if (platform !== 'native') await expect(more).toHaveAttribute('aria-expanded', 'false');
      await more.click();
      const less = region.getByRole('button', { name: '접기' });
      await expect(less).toBeVisible();
      if (platform !== 'native') await expect(less).toHaveAttribute('aria-expanded', 'true');
      await expect.poll(async () => Math.round((await box(text)).height)).toBeGreaterThan(2 * lineHeight);
      // The button sits one xs step under the text, at its start.
      const [opened, button] = [await box(text), await box(less)];
      expect(Math.round(button.y - (opened.y + opened.height))).toBe(tokens.space.stack.xs);
      expect(Math.round(button.x)).toBe(Math.round(opened.x));
      await less.click();
      await expect(region.getByRole('button', { name: '더보기' })).toBeVisible();
      await expect.poll(async () => Math.round((await box(text)).height)).toBe(2 * lineHeight);
    });

    test('content-width controls follow the alignment: centered in an Inline, centered by a centered Stack', async ({ page }) => {
      const row = page.getByTestId('inline-controls');
      const [button, badge] = [await box(row.getByRole('button', { name: '저장' })), await box(row.getByText('신규', { exact: true }))];
      expect(Math.abs((button.y + button.height / 2) - (badge.y + badge.height / 2))).toBeLessThan(1);
      const area = await box(page.getByTestId('stack-center-copy')), copy = await box(page.getByTestId('stack-center-copy').getByRole('button'));
      expect(Math.abs((area.x + area.width / 2) - (copy.x + copy.width / 2))).toBeLessThan(1);
    });

    test('align and justify change with the width, and a button follows them', async ({ page }) => {
      const region = page.getByTestId('stack-align-responsive');
      await page.setViewportSize({ width: tokens.responsive.stackMedium, height: 900 });
      await expect.poll(async () => { const [a, b] = [await box(region), await box(region.getByRole('button'))]; return Math.round(a.x + a.width - (b.x + b.width)); }).toBe(0);
      const [first, button] = [await box(boxes(page, 'stack-align-responsive').first()), await box(region.getByRole('button'))];
      expect(Math.abs((first.y + first.height / 2) - (button.y + button.height / 2))).toBeLessThan(1);
      await page.setViewportSize({ width: tokens.responsive.stackMedium - 1, height: 900 });
      await expect.poll(async () => Math.round((await box(region.getByRole('button'))).x - (await box(region)).x)).toBe(0);
      expect((await box(region.getByRole('button'))).width).toBeLessThan((await box(region)).width / 2);
    });

    test('rowGap sets the space between wrapped lines and gap stays between neighbours', async ({ page }) => {
      expect(await distance(page, 'inline-row-gap', 'x')).toBe(tokens.space.inline.sm);
      expect(await distance(page, 'inline-row-gap', 'y', 1)).toBe(tokens.space.stack.md);
    });

    test('direction turns the stack into a row from the medium width', async ({ page }) => {
      await page.setViewportSize({ width: tokens.responsive.stackMedium, height: 900 });
      await expect.poll(() => distance(page, 'stack-direction', 'x')).toBe(tokens.space.stack.md);
      await page.setViewportSize({ width: tokens.responsive.stackMedium - 1, height: 900 });
      await expect.poll(() => distance(page, 'stack-direction')).toBe(tokens.space.stack.md);
    });

    test('padding takes space.inset steps and paddingX replaces the sides', async ({ page }) => {
      const area = await box(page.getByTestId('stack-padding')), inner = await box(boxes(page, 'stack-padding').first());
      expect(Math.round(inner.x - area.x)).toBe(tokens.space.inset.lg);
      expect(Math.round(inner.y - area.y)).toBe(tokens.space.inset.md);
    });

    test('responsive="container" follows the width of the stack itself, the default follows the screen', async ({ page }) => {
      await page.setViewportSize({ width: tokens.responsive.stackWide + 100, height: 900 });
      await expect.poll(() => distance(page, 'stack-container')).toBe(tokens.space.stack.xs);
      await expect.poll(() => distance(page, 'stack-viewport')).toBe(tokens.space.stack.lg);
    });

    test('a spacer pushes what follows to the end and gets no divider', async ({ page }) => {
      const area = await box(page.getByTestId('stack-spacer')), [first, last] = [await box(boxes(page, 'stack-spacer').first()), await box(boxes(page, 'stack-spacer').last())];
      expect(Math.round(first.y - area.y)).toBe(0);
      expect(Math.round(area.y + area.height - (last.y + last.height))).toBe(0);
      if (platform !== 'native') await expect(page.getByTestId('stack-spacer').locator('[data-kjun-stack-divider]')).toHaveCount(0);
    });

    if (platform !== 'vue3') {
      test('turning the divider on keeps the state of each child', async ({ page }) => {
        const area = page.getByTestId('stack-toggle');
        await area.getByRole('button', { name: '누름 0' }).click();
        await area.getByRole('button', { name: '구분선 전환' }).click();
        await expect(area.getByRole('button', { name: '누름 1' })).toBeVisible();
      });
    }

    if (platform !== 'native') {
      test('an app li rule does not paint the divider, and an app class can set the gap', async ({ page }) => {
        const line = page.getByTestId('stack-app-li').locator('[data-kjun-stack-divider]');
        expect(Math.round((await box(line)).height)).toBe(tokens.border.defaultWidth);
        expect(await line.evaluate(el => getComputedStyle(el).paddingTop)).toBe('0px');
        expect(await distance(page, 'stack-app-gap')).toBe(40);
      });
      test('as="form" takes the attributes of a form', async ({ page }) => {
        const area = page.getByTestId('stack-form-tag');
        await expect(area.locator('form')).toHaveAttribute('novalidate', '');
        await area.getByRole('button', { name: '보내기' }).click();
        await expect(area.getByText('보냄', { exact: true })).toBeVisible();
      });
    }

    if (platform === 'native') {
      test('native stack keeps app keys, so stateful children keep their state when one is added in front', async ({ page }) => {
        const keyed = page.getByTestId('stack-keys');
        await keyed.getByRole('button', { name: '앞에 추가' }).click();
        await expect(keyed.getByText(/째$/)).toHaveText(['첫째', '둘째', '셋째']);
      });
      test('native stack passes View props through', async ({ page }) => {
        await expect(page.getByTestId('stack-native-props')).toHaveAttribute('aria-label', '쌓인 영역');
      });
    } else {
      test('as="ul" is a list without bullets, and its dividers are hidden list rows', async ({ page }) => {
        const list = page.getByTestId('stack-list').getByRole('list');
        await expect(list.getByRole('listitem')).toHaveCount(3);
        expect(await list.evaluate(el => [getComputedStyle(el).listStyleType, getComputedStyle(el).paddingInlineStart])).toEqual(['none', '0px']);
        await expect(list.locator('> li[data-kjun-stack-divider][aria-hidden="true"]')).toHaveCount(2);
        await expect(page.locator('#stack-web-id')).toHaveAttribute('aria-label', '쌓인 영역');
      });
    }

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
