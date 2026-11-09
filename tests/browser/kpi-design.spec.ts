import { expect, test, type Locator, type Page } from '@playwright/test';
import { tokens } from '../../packages/tokens/dist/index.js';
import { openFixture } from './packed-fixture';
import { captureReview } from './review-captures';
// The KPI design review: hierarchy, units, the percent chip, the direction caret, the row's text values, label badges,
// clickable chevrons, explicit summary footnotes and the narrow-screen aside, on every platform.
const e = tokens.extensions;
const px = (value: number) => `${value}px`;
const box = async (node: Locator) => (await node.boundingBox())!;
const style = (node: Locator) => node.evaluate(el => {
  const css = getComputedStyle(el);
  return { size: css.fontSize, weight: css.fontWeight, transform: css.textTransform };
});
// A painted fill between a text and its KPI root: the percent chip's tint, not the card's surface.
const tinted = (node: Locator) => node.evaluate(el => {
  const root = el.closest('[data-testid]')!.firstElementChild;
  for (let node: Element | null = el; node && node !== root; node = node.parentElement) {
    const css = getComputedStyle(node);
    if (Number(css.opacity) < 1) return 'dimmed';
    if (css.backgroundColor !== 'rgba(0, 0, 0, 0)') return 'tinted';
  }
  return 'none';
});
const svgSizes = (root: Locator) => root.evaluate(el => [...el.querySelectorAll('svg')].map(svg => Math.round(svg.getBoundingClientRect().width)));

for (const platform of ['react', 'vue3', 'native']) {
  test(`${platform}: KPI hierarchy, units, chip, caret, row text values, badges and chevrons`, async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await openFixture(page, platform, '', 'kpi-design');
    const hero = page.getByTestId('hero'), row = page.getByTestId('row');
    await expect(hero.getByText('총 평가 금액', { exact: true })).toBeVisible();
    // The hero label is the label role, two sizes above the 12px secondary label, which is never upper-cased.
    expect(await style(hero.getByText('총 평가 금액', { exact: true }))).toMatchObject({ size: px(tokens.typography.label.fontSizePx), weight: String(tokens.typography.label.fontWeight) });
    const english = hero.getByText('Cash balance', { exact: true });
    expect((await style(english)).transform).toBe('none');
    expect(await english.evaluate(el => (el as HTMLElement).innerText)).toBe('Cash balance');
    // Every unit sits at the 500 weight.
    for (const unit of await hero.getByText('원', { exact: true }).all()) expect((await style(unit)).weight).toBe('500');
    // The percent change is a tinted chip, never dimmed; the caret replaces the amount's sign.
    expect(await tinted(hero.getByText(/^\+1\.9/).first())).toBe('tinted');
    expect(await svgSizes(hero)).toContain(e.kpiHero.deltaIconSize);
    // Web keeps the sign for screen readers in hidden text; Native puts it in the delta's accessibility label.
    if (platform === 'native') await expect(hero.getByLabel('+2,345,678원', { exact: true })).toHaveCount(1);
    else await expect(hero.locator('.kjun-sr-only')).toHaveText('+');
    // A label badge sits right after its label, not at the far edge of the cell.
    const label = await box(row.getByText('상태', { exact: true })), badge = await box(row.getByText('연결', { exact: true }));
    expect(badge.x - (label.x + label.width)).toBeLessThanOrEqual(e.kpiRow.md.labelGap + e.kpiRow.badgePadding.x + 1);
    // A text value shares the number line, so the two values center on the same line.
    const number = await box(row.getByText(/^1,234,567/).last()), text = await box(row.getByText('정상', { exact: true }).last());
    expect(Math.abs(number.y + number.height / 2 - (text.y + text.height / 2))).toBeLessThanOrEqual(1.5);
    // Only the clickable cell draws a chevron.
    expect((await svgSizes(row)).filter(size => size === e.kpiRow.chevronSize)).toHaveLength(1);
    await captureReview(page, { path: `artifacts/kpi-design-${platform}-1280.png` });
  });

  test(`${platform}: narrow KPIs keep the aside below and leave summary footnotes to explicit items`, async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 900 });
    await openFixture(page, platform, '', 'kpi-design');
    const hero = page.getByTestId('hero');
    await expect(hero.getByText('입금', { exact: true })).toBeVisible();
    const aside = await box(hero.getByText('입금', { exact: true })), delta = await box(hero.getByText('전일 대비', { exact: true }));
    expect(aside.y).toBeGreaterThanOrEqual(delta.y + delta.height + e.kpiHero.asideGap - 1);
    await expect(page.getByTestId('hero-hidden').getByText('숨는 버튼', { exact: true })).toBeHidden();
    // With no mobileSecondary, the third item is a full-width cell starting at the left edge, not an inline footnote.
    const row = page.getByTestId('row');
    const first = await box(row.getByText('평가 금액', { exact: true })), third = await box(row.getByText('상태', { exact: true }));
    expect(third.y).toBeGreaterThan(first.y);
    expect(Math.abs(third.x - first.x)).toBeLessThanOrEqual(1);
    await captureReview(page, { path: `artifacts/kpi-design-${platform}-375.png`, fullPage: true });
  });
}
