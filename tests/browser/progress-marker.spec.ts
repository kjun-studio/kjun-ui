import { expect, test, type Page } from '@playwright/test';
import { openFixture } from './packed-fixture';

// A marker is a reference point across the bar (today's share of a budget). Web marks it with a class; Native Web
// has no classes, so both are found by geometry: the one element that is 2px wide plus its gap and taller than the rail.
const measure = (page: Page, id: string) => page.getByTestId(id).evaluate(row => {
  const bar = row.querySelector('[role="progressbar"]') as HTMLElement;
  // The rail is the bar itself, or on Native (where a cell's progressbar is the whole row) the thin clipped track inside it.
  const thin = (el: Element) => { const b = el.getBoundingClientRect(); return b.height > 0 && b.height <= 12 && b.width > 40; };
  const rail = thin(bar) && !Array.from(bar.querySelectorAll('*')).some(el => thin(el) && getComputedStyle(el).overflow === 'hidden') ? bar
    : Array.from(bar.querySelectorAll<HTMLElement>('*')).find(el => thin(el) && getComputedStyle(el).overflow === 'hidden') ?? bar;
  const r = rail.getBoundingClientRect();
  const lines = Array.from(row.querySelectorAll<HTMLElement>('*')).map(el => el.getBoundingClientRect())
    .filter(b => b.width >= 2 && b.width <= 4 && b.height > r.height && Math.abs((b.top + b.bottom) / 2 - (r.top + r.bottom) / 2) < 0.5);
  const line = lines[0];
  return { count: lines.length, rail: { left: r.left, width: r.width, height: r.height },
    line: line ? { centre: (line.left + line.right) / 2, left: line.left, right: line.right, over: (line.height - r.height) / 2 } : null };
});
for (const platform of ['react', 'vue3', 'native']) {
  test(`${platform}: a Progress marker stands at its share of the rail and overhangs it`, async ({ page }) => {
    await openFixture(page, platform, '', 'progress-marker');
    const budget = await measure(page, 'budget');
    expect(budget.count).toBe(1);
    expect(Math.abs(budget.line!.centre - (budget.rail.left + budget.rail.width * 0.53))).toBeLessThan(1.5);
    expect(budget.line!.over).toBeGreaterThanOrEqual(3);
    // The marker is on the value's own scale: 106000 of 200000 is the same 53%.
    const scaled = await measure(page, 'scaled');
    expect(Math.abs(scaled.line!.centre - (scaled.rail.left + scaled.rail.width * 0.53))).toBeLessThan(1.5);
    // At 0 and beyond max the line stays whole inside the rail's ends.
    const start = await measure(page, 'start'), end = await measure(page, 'end');
    expect(start.line!.left).toBeGreaterThanOrEqual(start.rail.left - 1.01);
    expect(start.line!.right).toBeLessThanOrEqual(start.rail.left + 4);
    expect(end.line!.right).toBeLessThanOrEqual(end.rail.left + end.rail.width + 1.01);
    expect(end.line!.left).toBeGreaterThanOrEqual(end.rail.left + end.rail.width - 4);
    for (const id of ['none', 'busy', 'cell-none']) expect((await measure(page, id)).count, id).toBe(0);
    const cell = await measure(page, 'cell');
    expect(cell.count).toBe(1);
    expect(Math.abs(cell.line!.centre - (cell.rail.left + cell.rail.width * 0.53))).toBeLessThan(1.5);
  });
}
for (const platform of ['react', 'vue3']) {
  test(`${platform}: a Progress marker is described to screen readers and leaves the circle alone`, async ({ page }) => {
    await openFixture(page, platform, '', 'progress-marker');
    for (const id of ['budget', 'cell']) {
      const bar = page.getByTestId(id).getByRole('progressbar');
      await expect(bar).toHaveAccessibleDescription('오늘 기준 53%');
      await expect(page.getByTestId(id).locator('.kjun-progress-marker')).toHaveAttribute('aria-hidden', 'true');
    }
    await expect(page.getByTestId('scaled').getByRole('progressbar')).not.toHaveAttribute('aria-describedby');
    await expect(page.getByTestId('circle').locator('.kjun-progress-marker')).toHaveCount(0);
    // The marker keeps the text colour whatever the bar's tone, with a surface-coloured gap around it.
    const marker = page.getByTestId('budget').locator('.kjun-progress-marker');
    const text = await page.getByTestId('budget').evaluate(el => getComputedStyle(el).getPropertyValue('--_kjun-color-text'));
    expect(text).not.toBe('');
    await expect(marker).toHaveCSS('width', '2px');
    await expect(marker).toHaveCSS('box-shadow', /0px 0px 0px 1px/);
  });
}
for (const platform of ['react', 'vue3', 'native']) {
  test(`${platform}: ariaLabel names a Progress without showing text`, async ({ page }) => {
    await openFixture(page, platform, '', 'progress-marker');
    for (const id of ['named', 'named-circle']) {
      await expect(page.getByTestId(id).getByRole('progressbar', { name: '업로드 진행률', exact: true })).toBeVisible();
      await expect(page.getByTestId(id).getByText('업로드 진행률')).toHaveCount(0);
    }
  });
}
