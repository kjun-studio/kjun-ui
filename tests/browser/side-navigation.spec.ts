import { expect, test } from '@playwright/test';
import { openFixture } from './packed-fixture';

// KjunSideNavigation (web): a vertical menu of links aligned to the start, with titled groups and one level of children.
for (const platform of ['react', 'vue3']) {
  test(`${platform}: SideNavigation lists links from the start edge and marks the current one`, async ({ page }) => {
    await openFixture(page, platform, '', 'side-navigation');
    const nav = page.getByRole('navigation', { name: '작업 공간' });
    const home = nav.getByRole('link', { name: '홈' }), tasks = nav.getByRole('link', { name: /할 일/ });
    await expect(home).toHaveAttribute('aria-current', 'page');
    await expect(tasks).not.toHaveAttribute('aria-current', /.*/);
    // Items fill the given width, are 40 tall and start their content at the same inset (a button would centre it).
    const side = await page.getByTestId('side').boundingBox(), box = await home.boundingBox();
    expect(box!.width).toBe(side!.width);
    expect(box!.height).toBe(40);
    const icons = await nav.locator('.kjun-side-navigation-icon').evaluateAll(els => els.map(el => Math.round(el.getBoundingClientRect().left)));
    expect(new Set(icons).size).toBe(1);
    expect(icons[0] - Math.round(side!.x)).toBe(12);
    // The current item is filled; the others are not until hovered.
    const clear = 'rgba(0, 0, 0, 0)';
    expect(await home.evaluate(el => getComputedStyle(el).backgroundColor)).not.toBe(clear);
    expect(await tasks.evaluate(el => getComputedStyle(el).backgroundColor)).toBe(clear);
    await tasks.hover();
    await expect.poll(() => tasks.evaluate(el => getComputedStyle(el).backgroundColor)).not.toBe(clear);
    // The badge sits at the end of the row and is part of the link's name.
    const badge = tasks.locator('.kjun-navigation-badge');
    await expect(badge).toHaveText('12');
    const badgeBox = await badge.boundingBox(), row = await tasks.boundingBox();
    expect(Math.round(row!.x + row!.width - (badgeBox!.x + badgeBox!.width))).toBe(12);
    await tasks.click();
    await expect(tasks).toHaveAttribute('aria-current', 'page');
    await tasks.click();
    await expect(page.getByTestId('log')).toHaveText('go:tasks go:tasks again:tasks');
  });

  test(`${platform}: SideNavigation groups have titles, a parent opens its children and a disabled link stays out of the way`, async ({ page }) => {
    await openFixture(page, platform, '', 'side-navigation');
    const nav = page.getByRole('navigation', { name: '작업 공간' });
    await expect(nav.getByRole('group', { name: '문서' })).toBeVisible();
    await expect(nav.getByRole('group', { name: '관리' }).getByRole('link', { name: '설정' })).toBeVisible();
    const parent = nav.getByRole('button', { name: '프로젝트' });
    await expect(parent).toHaveAttribute('aria-expanded', 'false');
    await expect(nav.getByRole('link', { name: '결제 화면 개선' })).toHaveCount(0);
    await parent.click();
    await expect(parent).toHaveAttribute('aria-expanded', 'true');
    const child = nav.getByRole('link', { name: '결제 화면 개선' });
    await expect(child).toBeVisible();
    // A child starts where its parent's label starts and is a step lower.
    const label = await parent.locator('.kjun-side-navigation-label').boundingBox(), childLabel = await child.locator('.kjun-side-navigation-label').boundingBox();
    expect(Math.abs(childLabel!.x - label!.x)).toBeLessThan(1);
    await expect.poll(async () => (await child.boundingBox())!.height).toBe(36);
    // The first child sits the same 2 below its parent as every other row sits below the one before it.
    const first = await nav.getByRole('link', { name: '브랜드 웹사이트' }).boundingBox(), parentBox = await parent.boundingBox();
    expect(Math.round(first!.y - (parentBox!.y + parentBox!.height))).toBe(2);
    // Toggling the parent does not navigate.
    await expect(page.getByTestId('log')).toHaveText('');
    await child.click();
    await expect(child).toHaveAttribute('aria-current', 'page');
    // Closed over the current page, the parent keeps the place: stronger text, no fill of its own.
    await parent.click();
    await expect(parent).toHaveAttribute('data-current-within', '');
    // A long label keeps one line.
    const long = nav.getByRole('link', { name: /아주 긴 이름/ });
    expect((await long.boundingBox())!.height).toBe(40);
    expect(await long.locator('.kjun-side-navigation-label').evaluate(el => el.scrollWidth > el.clientWidth)).toBe(true);
    const billing = nav.getByRole('link', { name: '결제', exact: true });
    await expect(billing).toHaveAttribute('aria-disabled', 'true');
    await billing.click({ force: true });
    await expect(page.getByTestId('log')).toHaveText('go:checkout');
  });

  test(`${platform}: SideNavigation starts with the current page's parent open and is reachable by keyboard`, async ({ page }) => {
    await openFixture(page, platform, '?value=checkout', 'side-navigation');
    const nav = page.getByRole('navigation', { name: '작업 공간' }), parent = nav.getByRole('button', { name: '프로젝트' });
    await expect(parent).toHaveAttribute('aria-expanded', 'true');
    await expect(nav.getByRole('link', { name: '결제 화면 개선' })).toHaveAttribute('aria-current', 'page');
    await page.keyboard.press('Tab');
    await expect(nav.getByRole('link', { name: '홈' })).toBeFocused();
    await expect(nav.getByRole('link', { name: '홈' })).toHaveCSS('outline-style', 'solid');
    await page.keyboard.press('Tab'); await page.keyboard.press('Tab');
    await expect(parent).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(parent).toHaveAttribute('aria-expanded', 'false');
  });

  test(`${platform}: SideNavigation keeps loose items apart from a group, leaves new-tab links to the browser and stands a closed parent for its children`, async ({ page }) => {
    await openFixture(page, platform, '', 'side-navigation');
    const nav = page.getByRole('navigation', { name: '작업 공간' }), log = page.getByTestId('log');
    // "도움말" follows the "문서" group without a title of its own: it keeps a title's distance (16), not the 2 between rows.
    const help = nav.getByRole('link', { name: '도움말 (새 창)' }), archive = nav.getByRole('link', { name: /아주 긴 이름/ });
    const above = await archive.boundingBox(), helpBox = await help.boundingBox();
    expect(Math.round(helpBox!.y - (above!.y + above!.height))).toBe(16);
    await expect(help).toHaveAttribute('target', '_blank');
    await expect(help).toHaveAttribute('rel', 'noopener noreferrer');
    await expect(help.locator('.kjun-side-navigation-trailing')).toBeVisible();
    // Synthetic clicks do not open tabs, so they show what the app is asked without leaving the page.
    const click = (name: string | RegExp, init: MouseEventInit = {}) => nav.getByRole('link', { name }).evaluate((el, init) => el.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, button: 0, ...init })), init);
    await click('도움말 (새 창)');
    await click('설정', { ctrlKey: true });
    await click('설정', { metaKey: true });
    await click('설정', { button: 1 });
    await expect(log).toHaveText('');
    await click('설정');
    await expect(log).toHaveText('go:settings');
    // A closed parent shows a dot when a child has a badge, and says so; open, the dot moves to the child.
    const parent = nav.getByRole('button', { name: '프로젝트, 새 소식' });
    await expect(parent.locator('.kjun-navigation-badge[data-dot]')).toBeVisible();
    await parent.click();
    await expect(nav.getByRole('button', { name: '프로젝트', exact: true })).toHaveAttribute('aria-expanded', 'true');
    // A child draws no icon even when it has one, so its label stays on its parent's label line.
    const brand = nav.getByRole('link', { name: /브랜드 웹사이트/ });
    await expect(brand.locator('.kjun-side-navigation-icon')).toHaveCount(0);
    await expect(brand.locator('.kjun-navigation-badge[data-dot]')).toBeVisible();
    const parentLabel = await nav.getByRole('button', { name: '프로젝트', exact: true }).locator('.kjun-side-navigation-label').boundingBox();
    expect(Math.abs((await brand.locator('.kjun-side-navigation-label').boundingBox())!.x - parentLabel!.x)).toBeLessThan(1);
    // The panel ids do not come from keys, so a key with spaces still points at its panel.
    const panel = await nav.getByRole('button', { name: '프로젝트', exact: true }).getAttribute('aria-controls');
    expect(panel).toMatch(/^[\w-]+$/);
    await expect(page.locator('#' + panel)).toHaveCount(1);
  });

  test(`${platform}: SideNavigation opens the parent of a page reached later, with late items and with expanded owned by the app`, async ({ page }) => {
    await openFixture(page, platform, '?late=1&value=checkout', 'side-navigation');
    const nav = page.getByRole('navigation', { name: '작업 공간' });
    await expect(nav.getByRole('button', { name: '프로젝트' })).toHaveAttribute('aria-expanded', 'true');
    await expect(page.getByTestId('log')).toHaveText('');
    await page.goto('about:blank');
    await openFixture(page, platform, '?controlled=1', 'side-navigation');
    const parent = page.getByRole('navigation', { name: '작업 공간' }).getByRole('button', { name: /^프로젝트/ });
    await expect(parent).toHaveAttribute('aria-expanded', 'false');
    await page.getByTestId('to-checkout').click();
    await expect(page.getByTestId('log')).toHaveText('open:projects');
    await expect(parent).toHaveAttribute('aria-expanded', 'true');
  });

  test(`${platform}: SideNavigation collapsed shows icons only, names them in tooltips and widens to open a parent`, async ({ page }) => {
    await openFixture(page, platform, '?collapsed=1&value=checkout', 'side-navigation');
    const nav = page.getByRole('navigation', { name: '작업 공간' }), side = (await page.getByTestId('side').boundingBox())!;
    await expect(nav).toHaveAttribute('data-collapsed', '');
    const home = nav.getByRole('link', { name: '홈' }), box = (await home.boundingBox())!;
    expect(box.width).toBe(side.width);
    expect(box.height).toBe(40);
    // The icon stays where it is in the full menu; the label is kept for screen readers only.
    expect(Math.round((await home.locator('.kjun-side-navigation-icon').boundingBox())!.x - side.x)).toBe(12);
    expect((await home.locator('.kjun-side-navigation-label').boundingBox())!.width).toBeLessThanOrEqual(1);
    await expect(nav.getByRole('group', { name: '문서' })).toBeVisible();
    // A count moves onto the icon's corner, inside the row.
    const tasks = nav.getByRole('link', { name: /할 일/ }), badge = (await tasks.locator('.kjun-side-navigation-glyph > .kjun-navigation-badge').boundingBox())!;
    expect(badge.x + badge.width).toBeLessThanOrEqual(side.x + side.width);
    // The parent holding the current page takes the fill; no chevron, and its child's dot sits on its icon.
    const parent = nav.getByRole('button', { name: /^프로젝트/ });
    expect(await parent.evaluate(el => getComputedStyle(el).backgroundColor)).not.toBe('rgba(0, 0, 0, 0)');
    await expect(parent.locator('.kjun-side-navigation-chevron')).toHaveCount(0);
    await expect(parent.locator('.kjun-side-navigation-glyph > .kjun-navigation-badge[data-dot]')).toBeVisible();
    await expect(nav.getByRole('link', { name: '결제 화면 개선' })).toHaveCount(0);
    // React Aria opens a hover tooltip once the pointer has moved on the page, as the tooltip specs do.
    await page.mouse.move(800, 600);
    await home.hover();
    await expect(page.getByRole('tooltip')).toHaveText('홈');
    await parent.click();
    await expect(page.getByTestId('log')).toHaveText('wide');
    await expect(nav).not.toHaveAttribute('data-collapsed', /.*/);
    await expect(parent).toHaveAttribute('aria-expanded', 'true');
    await expect(nav.getByRole('link', { name: '결제 화면 개선' })).toBeVisible();
  });
}

// Native (React Native Web): the same menu drawn with Views. Rows keep Web's visible heights; the 44 touch target is
// hitSlop, which a browser cannot show, so it is not covered here.
test('native: SideNavigation marks the current destination, opens a parent and reports navigation', async ({ page }) => {
  await openFixture(page, 'native', '', 'side-navigation');
  const nav = page.getByRole('navigation', { name: '작업 공간' });
  const home = nav.getByRole('link', { name: '홈' }), tasks = nav.getByRole('link', { name: /할 일/ });
  await expect(home).toHaveAttribute('aria-current', 'page');
  const side = await page.getByTestId('side').boundingBox(), box = await home.boundingBox();
  expect(box!.width).toBe(side!.width);
  expect(box!.height).toBe(40);
  const clear = 'rgba(0, 0, 0, 0)';
  expect(await home.evaluate(el => getComputedStyle(el).backgroundColor)).not.toBe(clear);
  expect(await tasks.evaluate(el => getComputedStyle(el).backgroundColor)).toBe(clear);
  await expect(tasks.getByText('12', { exact: true })).toBeVisible();
  // The badge is Web's size (16 tall, no ring around it) and ends at the row's inset.
  const badge = await tasks.getByText('12', { exact: true }).locator('..').boundingBox(), row = await tasks.boundingBox();
  expect(badge!.height).toBe(16);
  expect(Math.round(row!.x + row!.width - (badge!.x + badge!.width))).toBe(12);
  await tasks.click();
  await expect(tasks).toHaveAttribute('aria-current', 'page');
  await tasks.click();
  await expect(page.getByTestId('log')).toHaveText('go:tasks go:tasks again:tasks');
  await expect(nav.getByRole('group', { name: '문서' })).toBeVisible();
  const parent = nav.getByRole('button', { name: '프로젝트' });
  await expect(parent).toHaveAttribute('aria-expanded', 'false');
  await parent.click();
  await expect(parent).toHaveAttribute('aria-expanded', 'true');
  const child = nav.getByRole('link', { name: '결제 화면 개선' });
  await expect(child).toBeVisible();
  await expect.poll(async () => (await child.boundingBox())!.height).toBe(36);
  // A child's label starts where its parent's label starts.
  const labelLeft = (text: string) => nav.getByText(text, { exact: true }).evaluate(el => el.getBoundingClientRect().left);
  expect(Math.abs(await labelLeft('결제 화면 개선') - await labelLeft('프로젝트'))).toBeLessThan(1);
  await expect(page.getByTestId('log')).toHaveText('go:tasks go:tasks again:tasks');
  const billing = nav.getByRole('link', { name: '결제', exact: true });
  await expect(billing).toHaveAttribute('aria-disabled', 'true');
});

test('native: SideNavigation starts with the current page\'s parent open', async ({ page }) => {
  await openFixture(page, 'native', '?value=checkout', 'side-navigation');
  const nav = page.getByRole('navigation', { name: '작업 공간' });
  await expect(nav.getByRole('button', { name: '프로젝트' })).toHaveAttribute('aria-expanded', 'true');
  await expect(nav.getByRole('link', { name: '결제 화면 개선' })).toHaveAttribute('aria-current', 'page');
});

test('native: SideNavigation keeps loose items apart from a group and stands a closed parent for its children', async ({ page }) => {
  await openFixture(page, 'native', '', 'side-navigation');
  const nav = page.getByRole('navigation', { name: '작업 공간' });
  const help = nav.getByRole('link', { name: '도움말 (새 창)' }), archive = nav.getByRole('link', { name: /아주 긴 이름/ });
  const above = await archive.boundingBox(), helpBox = await help.boundingBox();
  expect(Math.round(helpBox!.y - (above!.y + above!.height))).toBe(16);
  await expect(help).toHaveAttribute('target', '_blank');
  await expect(nav.getByRole('button', { name: '프로젝트, 새 소식' })).toBeVisible();
});

test('native: SideNavigation collapsed shows icons only and widens to open a parent', async ({ page }) => {
  await openFixture(page, 'native', '?collapsed=1&value=checkout', 'side-navigation');
  const nav = page.getByRole('navigation', { name: '작업 공간' }), side = (await page.getByTestId('side').boundingBox())!;
  const home = nav.getByRole('link', { name: '홈' });
  expect((await home.boundingBox())!.width).toBe(side.width);
  await expect(nav.getByText('홈', { exact: true })).toHaveCount(0);
  const parent = nav.getByRole('button', { name: /^프로젝트/ });
  expect(await parent.evaluate(el => getComputedStyle(el).backgroundColor)).not.toBe('rgba(0, 0, 0, 0)');
  await parent.click();
  await expect(page.getByTestId('log')).toHaveText('wide');
  await expect(parent).toHaveAttribute('aria-expanded', 'true');
  await expect(nav.getByRole('link', { name: '결제 화면 개선' })).toBeVisible();
});
