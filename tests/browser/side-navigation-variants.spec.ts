import { expect, test, type Locator } from '@playwright/test';
import { openFixture } from './packed-fixture';

// KjunSideNavigation railLabels (names under the icons of a collapsed menu) and density="compact" (short rows for long lists).
const clear = 'rgba(0, 0, 0, 0)';
const fillOf = (el: Locator) => el.evaluate(node => getComputedStyle(node).backgroundColor);

for (const platform of ['react', 'vue3']) {
  test(`${platform}: SideNavigation railLabels stands each icon in an indicator above its name`, async ({ page }) => {
    await openFixture(page, platform, '?collapsed=1&labels=1&dividers=1&value=checkout', 'side-navigation');
    const nav = page.getByRole('navigation', { name: '작업 공간' }), side = (await page.getByTestId('side').boundingBox())!;
    await expect(nav).toHaveAttribute('data-rail-labels', '');
    // A row is 72 wide and 64 tall: 6 + a 32 indicator + 4 + a 16 line of caption type + 6.
    const home = nav.getByRole('link', { name: '홈' }), row = (await home.boundingBox())!;
    expect(row.width).toBe(72);
    expect(row.height).toBe(64);
    expect(row.x).toBe(side.x);
    const glyph = home.locator('.kjun-side-navigation-glyph'), indicator = (await glyph.boundingBox())!;
    expect([indicator.width, indicator.height]).toEqual([56, 32]);
    expect(indicator.x - row.x).toBe(8);
    expect(indicator.y - row.y).toBe(6);
    // The name is on screen, one line under the indicator, centred in the row.
    const label = home.locator('.kjun-side-navigation-label'), text = (await label.boundingBox())!;
    expect(text.height).toBe(16);
    expect(text.y).toBe(indicator.y + indicator.height + 4);
    expect(await label.evaluate(el => getComputedStyle(el).textAlign)).toBe('center');
    // The current page (here the closed parent over it) fills the indicator, not the row.
    const parent = nav.getByRole('button', { name: /^프로젝트/ });
    await expect(parent).toHaveAttribute('data-current-within', '');
    expect(await fillOf(parent)).toBe(clear);
    expect(await fillOf(parent.locator('.kjun-side-navigation-glyph'))).not.toBe(clear);
    expect(await fillOf(glyph)).toBe(clear);
    // Hover fills the indicator too, more lightly than the current page, and no tooltip opens: the name is already there.
    await page.mouse.move(800, 600);
    await home.hover();
    await expect.poll(() => fillOf(glyph)).not.toBe(clear);
    expect(await fillOf(home)).toBe(clear);
    expect(await fillOf(glyph)).not.toBe(await fillOf(parent.locator('.kjun-side-navigation-glyph')));
    await page.waitForTimeout(1000);
    await expect(page.getByRole('tooltip')).toHaveCount(0);
    // A count stays a number on the icon's corner, clear of the name and inside the indicator's row.
    const tasks = nav.getByRole('link', { name: /할 일/ }), mark = tasks.locator('.kjun-side-navigation-glyph > .kjun-navigation-badge');
    await expect(mark).toHaveText('12');
    const badge = (await mark.boundingBox())!, icon = (await tasks.locator('.kjun-side-navigation-icon').boundingBox())!;
    expect(badge.x).toBeGreaterThan(icon.x);
    expect(badge.y + badge.height).toBeLessThanOrEqual((await tasks.locator('.kjun-side-navigation-label').boundingBox())!.y);
    // Group boundaries are the indicator's width, centred under it.
    const lines = await nav.locator('.kjun-side-navigation-list').evaluate(el => [...el.children].map(group => { const line = getComputedStyle(group, '::before');
      return line.content === 'none' ? null : [line.width, line.insetInlineStart]; }));
    expect(lines).toEqual([null, ['56px', '8px'], ['56px', '8px'], ['56px', '8px']]);
    // A parent still asks to widen with its children open.
    await parent.click();
    await expect(page.getByTestId('log')).toHaveText('wide');
    await expect(nav).not.toHaveAttribute('data-rail-labels', /.*/);
    await expect(nav.getByRole('link', { name: '결제 화면 개선' })).toBeVisible();
  });

  test(`${platform}: SideNavigation railLabels names the groups of a rail of groups`, async ({ page }) => {
    await openFixture(page, platform, '?collapsed=1&labels=1&rail=groups&value=checkout', 'side-navigation');
    const nav = page.getByRole('navigation', { name: '작업 공간' }), docs = nav.getByRole('button', { name: /^문서/ });
    await expect(docs.locator('.kjun-side-navigation-label')).toBeVisible();
    await expect(docs.locator('.kjun-side-navigation-label')).toHaveText('문서');
    expect(await fillOf(docs.locator('.kjun-side-navigation-glyph'))).not.toBe(clear);
    expect((await docs.boundingBox())!.width).toBe(72);
  });

  test(`${platform}: SideNavigation density="compact" shortens rows and quiets counts under a mouse`, async ({ page }) => {
    await openFixture(page, platform, '?compact=1&value=checkout', 'side-navigation');
    const nav = page.getByRole('navigation', { name: '작업 공간' });
    await expect(nav).toHaveAttribute('data-density', 'compact');
    expect((await nav.getByRole('link', { name: '홈' }).boundingBox())!.height).toBe(32);
    expect((await nav.getByRole('button', { name: /^프로젝트/ }).boundingBox())!.height).toBe(32);
    expect((await nav.getByRole('link', { name: '결제 화면 개선' }).boundingBox())!.height).toBe(30);
    // The count is a tertiary number without the alert fill; a dot keeps its fill, and the name keeps the number.
    const tasks = nav.getByRole('link', { name: /할 일/ }), count = tasks.locator('.kjun-navigation-badge');
    await expect(count).toHaveText('12');
    expect(await fillOf(count)).toBe(clear);
    expect(await count.evaluate(el => getComputedStyle(el).color)).not.toBe(await count.evaluate(el => getComputedStyle(el.closest('nav')!).color));
    await expect(tasks).toHaveAccessibleName(/12/);
    expect(await fillOf(nav.getByRole('link', { name: /브랜드 웹사이트/ }).locator('.kjun-navigation-badge[data-dot]'))).not.toBe(clear);
    // The current page keeps its fill and the icon and type stay as they are.
    expect(await fillOf(nav.getByRole('link', { name: '결제 화면 개선' }))).not.toBe(clear);
    expect((await nav.getByRole('link', { name: '홈' }).locator('.kjun-side-navigation-icon').boundingBox())!.height).toBe(20);
  });
}

test.describe('touch pointer', () => {
  test.use({ hasTouch: true, isMobile: true, viewport: { width: 390, height: 844 } });
  for (const platform of ['react', 'vue3']) test(`${platform}: SideNavigation density="compact" keeps the touch heights on a touch pointer`, async ({ page }) => {
    await openFixture(page, platform, '?compact=1&value=checkout', 'side-navigation');
    const nav = page.getByRole('navigation', { name: '작업 공간' });
    expect((await nav.getByRole('link', { name: '홈' }).boundingBox())!.height).toBeCloseTo(48, 2);
    expect((await nav.getByRole('link', { name: '결제 화면 개선' }).boundingBox())!.height).toBeCloseTo(44, 2);
  });
});

// Native (React Native Web): the same options drawn with Views.
test('native: SideNavigation railLabels shows names under the icons and fills the indicator', async ({ page }) => {
  await openFixture(page, 'native', '?collapsed=1&labels=1&value=checkout', 'side-navigation');
  const nav = page.getByRole('navigation', { name: '작업 공간' }), home = nav.getByRole('link', { name: '홈' }), row = (await home.boundingBox())!;
  expect(row.width).toBe(72);
  expect(row.height).toBe(64);
  await expect(home.getByText('홈', { exact: true })).toBeVisible();
  // The row stays clear; the closed parent over the current page fills its indicator.
  const parent = nav.getByRole('button', { name: /^프로젝트/ });
  expect(await fillOf(parent)).toBe(clear);
  const filled = await parent.evaluate(el => [...el.querySelectorAll('div')].some(node => getComputedStyle(node).backgroundColor !== 'rgba(0, 0, 0, 0)'
    && Math.round(node.getBoundingClientRect().width) === 56));
  expect(filled).toBe(true);
  // A count stays a number on the icon's corner.
  await expect(nav.getByRole('link', { name: /할 일/ }).getByText('12', { exact: true })).toBeVisible();
  await parent.click();
  await expect(page.getByTestId('log')).toHaveText('wide');
});

test('native: SideNavigation density="compact" shortens rows on Native Web and quiets counts', async ({ page }) => {
  await openFixture(page, 'native', '?compact=1&value=checkout', 'side-navigation');
  const nav = page.getByRole('navigation', { name: '작업 공간' });
  expect((await nav.getByRole('link', { name: '홈' }).boundingBox())!.height).toBe(32);
  expect((await nav.getByRole('link', { name: '결제 화면 개선' }).boundingBox())!.height).toBe(30);
  const count = nav.getByRole('link', { name: /할 일/ }).getByText('12', { exact: true });
  await expect(count).toBeVisible();
  expect(await count.evaluate(el => getComputedStyle(el.parentElement!).backgroundColor)).toBe(clear);
});

// A dot at the end of a row sits in the row's middle, as on Web, in either density (not lifted to the top of the line).
const dotOffset = (row: Locator) => row.evaluate(el => {
  const box = el.getBoundingClientRect(), dot = [...el.querySelectorAll('div')].find(node => { const r = node.getBoundingClientRect();
    return Math.round(r.width) === 8 && Math.round(r.height) === 8 && getComputedStyle(node).backgroundColor !== 'rgba(0, 0, 0, 0)'; });
  if (!dot) return null;
  const r = dot.getBoundingClientRect();
  return Math.abs(r.top + r.height / 2 - (box.top + box.height / 2));
});
for (const query of ['', '&compact=1']) test(`native: SideNavigation centres a dot at the end of a row${query ? ' (compact)' : ''}`, async ({ page }) => {
  await openFixture(page, 'native', '?value=checkout' + query, 'side-navigation');
  const nav = page.getByRole('navigation', { name: '작업 공간' });
  expect(await dotOffset(nav.getByRole('link', { name: /^브랜드 웹사이트/ }))).toBeLessThanOrEqual(1);
  // A closed parent stands for its children's dot at the end of its own row.
  const parent = nav.getByRole('button', { name: /^프로젝트/ });
  await parent.click();
  await expect(parent).toHaveAttribute('aria-expanded', 'false');
  expect(await dotOffset(parent)).toBeLessThanOrEqual(1);
});
