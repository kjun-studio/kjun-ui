import { test, expect, type Page, type Locator } from '@playwright/test';
import { openFixture } from './packed-fixture';
import { tokens } from '../../packages/tokens/src/index';
import { demoPalettes } from '../../shared/demo-colors';

const empty = tokens.extensions.empty as Record<string, number>;
const update = (page: Page, options: object) => page.evaluate(options => (window as any).configureEmpty(options), options);
const box = async (element: Locator) => { await expect(element).toBeVisible(); return (await element.boundingBox())!; };
const rgb = (hex: string) => `rgb(${[1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16)).join(', ')})`;
const near = (actual: number, expected: number) => expect(Math.abs(actual - expected)).toBeLessThanOrEqual(0.6);
const longText = '검색어의 철자를 확인하거나 필터를 줄여 보세요. 최근 30일간 등록된 문서만 보여 주고 있습니다.';

async function open(page: Page, platform: string, width: number) {
  await page.setViewportSize({ width, height: 800 });
  await openFixture(page, platform, '', 'empty');
}
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
  test.describe(`${platform}: KjunEmpty`, () => {
    test('actions sit side by side with a gap on wide screens', async ({ page }) => {
      await open(page, platform, 1024);
      const region = page.getByTestId('region');
      const [first, second] = [await box(region.getByRole('button', { name: '필터 초기화' })), await box(region.getByRole('button', { name: '새 문서' }))];
      near(first.y, second.y);
      near(second.x - (first.x + first.width), empty.actionsGap);
      await region.getByRole('button', { name: '새 문서' }).click();
      await expect(page.getByTestId('events')).toHaveText('1');
    });

    test('actions stack in their own order at full width on phones', async ({ page }) => {
      await open(page, platform, 375);
      await update(page, { width: 327 });
      const region = page.getByTestId('region');
      const first = await box(region.getByRole('button', { name: '필터 초기화' })), second = await box(region.getByRole('button', { name: '새 문서' }));
      expect(first.y).toBeLessThan(second.y);
      near(second.y - (first.y + first.height), empty.actionsGap);
      near(first.x, second.x);
      near(first.width, empty.actionsMaxWidth);
      near(second.width, empty.actionsMaxWidth);
    });

    test('description reads in body type, close under the title', async ({ page }) => {
      await open(page, platform, 1024);
      const region = page.getByTestId('region');
      const title = region.getByText('조건에 맞는 문서가 없습니다', { exact: true });
      const description = region.getByText('필터를 초기화하거나 새 문서를 만들어 보세요.', { exact: true });
      await expect(description).toHaveCSS('font-size', `${tokens.typography.body.fontSizePx}px`);
      await expect(description).toHaveCSS('line-height', `${tokens.typography.body.lineHeightPx}px`);
      const t = await box(title), d = await box(description), button = await box(region.getByRole('button').first());
      near(d.y - (t.y + t.height), empty.descriptionGap);
      near(button.y - (d.y + d.height), empty.actionGap);
    });

    test('icon is a light 1.5px line in the tertiary text colour', async ({ page }) => {
      await open(page, platform, 1024);
      const region = page.getByTestId('region'), svg = region.locator('svg').first();
      const icon = await box(svg), title = await box(region.getByText('조건에 맞는 문서가 없습니다', { exact: true }));
      near(icon.width, empty.iconSize);
      near(title.y - (icon.y + icon.height), empty.iconGap);
      near(icon.y - (await box(region)).y, empty.paddingY);
      const drawn = await svg.locator('path').first().evaluate(path => {
        const style = getComputedStyle(path), svg = path.ownerSVGElement!;
        return { stroke: style.stroke, width: parseFloat(style.strokeWidth) * svg.getBoundingClientRect().width / 24 };
      });
      near(drawn.width, empty.iconStroke);
      expect(drawn.stroke).toBe(rgb(demoPalettes.default.textTertiary));
    });

    test('Korean copy wraps between words and keeps side padding', async ({ page }) => {
      await open(page, platform, 375);
      await update(page, { width: 327, description: longText });
      const region = page.getByTestId('region'), description = region.getByText(longText, { exact: true });
      const breaks = await lineBreaks(description);
      expect(breaks.length).toBeGreaterThan(0);
      for (const pair of breaks) expect(pair.startsWith(' ') || pair.endsWith(' ')).toBe(true);
      const r = await box(region), d = await box(description);
      expect(d.x).toBeGreaterThanOrEqual(r.x + empty.paddingX - 0.5);
      expect(d.x + d.width).toBeLessThanOrEqual(r.x + r.width - empty.paddingX + 0.5);
    });

    test('size sm draws a smaller icon, title and padding for cards', async ({ page }) => {
      await open(page, platform, 1024);
      await update(page, { size: 'sm', actions: 1 });
      const region = page.getByTestId('region'), svg = region.locator('svg').first();
      const title = region.getByText('조건에 맞는 문서가 없습니다', { exact: true });
      await expect(title).toHaveCSS('font-size', `${empty.smTitleSize}px`);
      await expect(title).toHaveCSS('line-height', `${empty.smTitleLineHeight}px`);
      const icon = await box(svg), t = await box(title), d = await box(region.getByText('필터를 초기화하거나 새 문서를 만들어 보세요.', { exact: true }));
      near(icon.width, empty.smIconSize);
      near(icon.y - (await box(region)).y, empty.smPaddingY);
      near(t.y - (icon.y + icon.height), empty.smIconGap);
      const button = await box(region.getByRole('button'));
      near(button.y - (d.y + d.height), empty.smActionGap);
      const strokeWidth = await svg.locator('path').first().evaluate(path => parseFloat(getComputedStyle(path).strokeWidth) * path.ownerSVGElement!.getBoundingClientRect().width / 24);
      near(strokeWidth, empty.iconStroke);
    });
  });
}

for (const platform of ['react', 'vue3', 'native']) {
  test.describe(`${platform}: KjunEmpty parts and options`, () => {
    test('content without nodes draws no action area or its gap', async ({ page }) => {
      await open(page, platform, 1024);
      await update(page, { actions: 0, emptyChildren: true });
      const region = page.getByTestId('region');
      const d = await box(region.getByText('필터를 초기화하거나 새 문서를 만들어 보세요.', { exact: true }));
      near((await box(region)).y + (await box(region)).height - (d.y + d.height), empty.paddingY);
    });

    test('root takes the app style (and class on the web)', async ({ page }) => {
      await open(page, platform, 1024);
      await update(page, { rootStyle: true });
      const root = page.getByTestId('region').locator(':scope > *').first();
      await expect(root).toHaveCSS('background-color', 'rgb(1, 2, 3)');
      if (platform !== 'native') await expect(root).toHaveClass(/kjun-empty/), await expect(root).toHaveClass(/app-empty/);
    });

    test('description and icon accept nodes', async ({ page }) => {
      await open(page, platform, 1024);
      await update(page, { descriptionNode: true, iconNode: true });
      const region = page.getByTestId('region');
      const title = await box(region.getByText('조건에 맞는 문서가 없습니다', { exact: true }));
      const description = await box(region.getByText('노드로 넣은 설명', { exact: true }));
      const icon = await box(region.locator('svg').first());
      near(icon.width, 40);
      near(title.y - (icon.y + icon.height), empty.iconGap);
      near(description.y - (title.y + title.height), empty.descriptionGap);
    });

    test('title can be a heading and the message can be announced', async ({ page }) => {
      await open(page, platform, 1024);
      const region = page.getByTestId('region');
      await expect(region.getByRole('heading')).toHaveCount(0);
      await expect(region.getByRole('status')).toHaveCount(0);
      await update(page, { headingLevel: 3, live: 'polite' });
      await expect(region.getByRole('heading', { level: 3, name: '조건에 맞는 문서가 없습니다' })).toBeVisible();
      await expect(region.getByRole('status')).toContainText('필터를 초기화하거나 새 문서를 만들어 보세요.');
    });

    test('inside a list section the list type wins over size sm', async ({ page }) => {
      await open(page, platform, 1024);
      await update(page, { inList: true, size: 'sm', actions: 0 });
      const title = page.getByTestId('region').getByText('조건에 맞는 문서가 없습니다', { exact: true });
      await expect(title).toHaveCSS('color', rgb(demoPalettes.default.textSecondary));
      await expect(title).toHaveCSS('font-weight', String(tokens.typography.body.fontWeight));
    });

    if (platform !== 'native') test('nodes placed in the action area keep their own type', async ({ page }) => {
      await open(page, platform, 1024);
      await update(page, { innerParagraph: true });
      const inner = page.getByTestId('inner');
      await expect(inner).toHaveCSS('font-weight', String(tokens.typography.body.fontWeight));
      await expect(inner).toHaveCSS('max-width', 'none');
    });
  });
}
