import { expect, test, type Page } from '@playwright/test';
import { openFixture } from './packed-fixture';

// The bar under each row's text and the row's value, measured per row.
const measure = (page: Page, section: string, native: boolean) => page.getByTestId(section).evaluate((root, native) => {
  const round = (n: number) => Math.round(n * 2) / 2;
  const bars = [...root.querySelectorAll<HTMLElement>(native ? '[role="progressbar"]' : '[data-bar]')];
  return bars.map(bar => {
    const box = bar.getBoundingClientRect();
    return { left: round(box.left), width: round(box.width), top: round(box.top) };
  });
}, native);
const box = async (page: Page, section: string, text: string) => (await page.getByTestId(section).getByText(text, { exact: true }).boundingBox())!;

for (const platform of ['react', 'vue3', 'native']) {
  test(`${platform}: a value on the title line leaves the description and content the full text width`, async ({ page }) => {
    await openFixture(page, platform, '', 'list-value');
    const native = platform === 'native';
    const side = await measure(page, 'side', native), title = await measure(page, 'title', native);
    expect(side).toHaveLength(3); expect(title).toHaveLength(3);
    // Beside the text, a longer value leaves a shorter bar.
    expect(side[2].width).toBeLessThan(side[1].width);
    // On the title line every bar has the same width, wider than any of the rows above, from the same start line.
    expect(new Set(title.map(bar => bar.width)).size).toBe(1);
    expect(title[0].width).toBeGreaterThan(Math.max(...side.map(bar => bar.width)));
    expect(new Set([...side, ...title].map(bar => bar.left)).size).toBe(1);
    // The value shares the title's line and still ends where a value beside the text ends.
    for (const [name, value] of [['식비', '412,300원'], ['주거·관리비', '1,250,000원']]) {
      const heading = await box(page, 'title', name), amount = await box(page, 'title', value), beside = await box(page, 'side', value);
      expect(Math.abs((heading.y + heading.height / 2) - (amount.y + amount.height / 2))).toBeLessThan(1.5);
      expect(Math.abs((amount.x + amount.width) - (beside.x + beside.width))).toBeLessThan(1);
    }
    // The description now runs under the value instead of stopping before it.
    const description = await box(page, 'title', '고정 지출, 매달 25일 자동이체'), row = title[2];
    expect(description.x).toBeCloseTo(row.left, 0);
  });
}
