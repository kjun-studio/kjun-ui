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
    const ink = await tasks.evaluate(el => getComputedStyle(el).color);
    await tasks.hover();
    await expect.poll(() => tasks.evaluate(el => getComputedStyle(el).backgroundColor)).not.toBe(clear);
    // Hover is a lighter wash than the current page's fill and leaves the text alone, so it never reads as the selection.
    expect(await tasks.evaluate(el => getComputedStyle(el).backgroundColor)).not.toBe(await home.evaluate(el => getComputedStyle(el).backgroundColor));
    expect(await tasks.evaluate(el => getComputedStyle(el).color)).toBe(ink);
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
    // Closed over the current page, the parent keeps the place a step below the page itself: the page's ink and weight,
    // without its fill, so the fill only ever means the current page.
    // Read the ink once the press-to-selected transition has settled.
    await page.mouse.move(800, 600);
    await page.waitForTimeout(400);
    const selectedInk = await child.evaluate(el => getComputedStyle(el).color);
    await parent.click();
    await page.mouse.move(800, 600);
    await expect(parent).toHaveAttribute('data-current-within', '');
    await expect.poll(() => parent.evaluate(el => getComputedStyle(el).backgroundColor)).toBe('rgba(0, 0, 0, 0)');
    await expect.poll(() => parent.evaluate(el => getComputedStyle(el).color)).toBe(selectedInk);
    expect(await parent.evaluate(el => getComputedStyle(el).fontWeight)).toBe('600');
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
    // Panel ids are made from keys with anything outside [A-Za-z0-9_-] encoded, so any key still points at its panel.
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
    // The row is the box around its icon (12 + 20 + 12 by 40), not the column's width, so the fill wraps the icon.
    const home = nav.getByRole('link', { name: '홈' }), box = (await home.boundingBox())!;
    expect(box.width).toBe(44);
    expect(box.height).toBe(40);
    expect(box.x).toBe(side.x);
    // The icon stays where it is in the full menu; the label is kept for screen readers only.
    expect(Math.round((await home.locator('.kjun-side-navigation-icon').boundingBox())!.x - side.x)).toBe(12);
    expect((await home.locator('.kjun-side-navigation-label').boundingBox())!.width).toBeLessThanOrEqual(1);
    await expect(nav.getByRole('group', { name: '문서' })).toBeVisible();
    // A count would cover the icon on its corner, so it shrinks to a dot inside the row; the link's name keeps the number.
    const tasks = nav.getByRole('link', { name: /할 일/ }), mark = tasks.locator('.kjun-side-navigation-glyph > .kjun-navigation-badge');
    await expect(mark).toHaveAttribute('data-dot');
    await expect(mark).toHaveText('');
    await expect(tasks).toHaveAccessibleName(/12/);
    const badge = (await mark.boundingBox())!;
    expect(badge.x + badge.width).toBeLessThanOrEqual(side.x + side.width);
    // With the titles hidden, each later group starts under a hairline the icon's width, centred in the gap.
    const lines = await nav.locator('.kjun-side-navigation-list').evaluate(el => [...el.children].map(group => { const line = getComputedStyle(group, '::before');
      return line.content === 'none' ? null : [line.width, line.height, line.insetInlineStart]; }));
    expect(lines).toEqual([null, ['20px', '1px', '12px'], ['20px', '1px', '12px'], ['20px', '1px', '12px']]);
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
    // Beside the icon, not out at the column's far edge.
    const tip = (await page.getByRole('tooltip').boundingBox())!;
    expect(tip.x).toBeGreaterThanOrEqual(box.x + box.width);
    expect(tip.x).toBeLessThan(box.x + box.width + 16);
    await parent.click();
    await expect(page.getByTestId('log')).toHaveText('wide');
    await expect(nav).not.toHaveAttribute('data-collapsed', /.*/);
    await expect(parent).toHaveAttribute('aria-expanded', 'true');
    await expect(nav.getByRole('link', { name: '결제 화면 개선' })).toBeVisible();
  });

  test(`${platform}: SideNavigation collapsibleGroups opens and closes groups and keeps the current page in view`, async ({ page }) => {
    await openFixture(page, platform, '?groups=1', 'side-navigation');
    const nav = page.getByRole('navigation', { name: '작업 공간' }), clear = 'rgba(0, 0, 0, 0)';
    // Only the current page's group starts open; home is loose, so both titled groups start closed.
    const docs = nav.getByRole('button', { name: /^문서/ }), admin = nav.getByRole('button', { name: '관리' });
    await expect(docs).toHaveAttribute('aria-expanded', 'false');
    await expect(admin).toHaveAttribute('aria-expanded', 'false');
    await expect(nav.getByRole('button', { name: /^프로젝트/ })).toBeHidden();
    // A title is a 32-tall toggle row; closed over a badge it shows a dot and says so.
    expect((await docs.boundingBox())!.height).toBe(32);
    await expect(docs).toHaveAccessibleName('문서, 새 소식');
    await expect(docs.locator('.kjun-navigation-badge[data-dot]')).toBeVisible();
    // The group stays a labelled group for screen readers.
    await expect(nav.getByRole('group', { name: /^문서/ })).toBeVisible();
    await admin.click();
    await expect(admin).toHaveAttribute('aria-expanded', 'true');
    await expect(nav.getByRole('link', { name: '설정' })).toBeVisible();
    await expect(page.getByTestId('log')).toHaveText('groups:관리');
    // Moving to a page in a closed group opens it and reports the new list.
    await page.getByTestId('to-checkout').click();
    await expect(docs).toHaveAttribute('aria-expanded', 'true');
    await expect(page.getByTestId('log')).toHaveText('groups:관리 groups:관리,문서');
    await expect(nav.getByRole('link', { name: '결제 화면 개선' })).toHaveAttribute('aria-current', 'page');
    // Closed over the current page, the title takes full ink instead of its tertiary grey, and no fill.
    await docs.click();
    await page.mouse.move(800, 600);
    await expect(docs).toHaveAttribute('data-current-within', '');
    await expect.poll(() => docs.evaluate(el => getComputedStyle(el).backgroundColor)).toBe(clear);
    expect(await docs.evaluate(el => getComputedStyle(el).color)).not.toBe(await admin.evaluate(el => getComputedStyle(el).color));
    await expect(nav.getByRole('link', { name: '결제 화면 개선' })).toBeHidden();
  });

  test(`${platform}: SideNavigation rail="groups" shows one icon per group and widens with that group open`, async ({ page }) => {
    await openFixture(page, platform, '?collapsed=1&rail=groups&groups=1&value=checkout', 'side-navigation');
    const nav = page.getByRole('navigation', { name: '작업 공간' });
    await expect(nav).toHaveAttribute('data-rail', 'groups');
    // Loose items keep their own row; each group is one button with its icon, in order.
    const rows = nav.locator('.kjun-side-navigation-item');
    await expect(rows).toHaveCount(5);
    for (const [at, name] of [/^홈$/, /^할 일, .*12/, /^문서, 새 소식$/, /^도움말/, /^관리$/].entries()) await expect(rows.nth(at)).toHaveAccessibleName(name);
    const docs = nav.getByRole('button', { name: /^문서/ }), admin = nav.getByRole('button', { name: '관리' });
    // The group holding the current page takes half the selection fill (icons only, there is no name to strengthen); its
    // badge shows as a dot on the icon.
    await expect(docs).toHaveAttribute('data-current-within', '');
    expect(await docs.evaluate(el => getComputedStyle(el).backgroundColor)).not.toBe('rgba(0, 0, 0, 0)');
    await expect(docs.locator('.kjun-side-navigation-glyph > .kjun-navigation-badge[data-dot]')).toBeVisible();
    expect((await admin.boundingBox())!.width).toBe(44);
    // Pressing a group asks to widen and opens that group.
    await admin.click();
    await expect(nav).not.toHaveAttribute('data-collapsed', /.*/);
    await expect(nav.getByRole('button', { name: '관리' })).toHaveAttribute('aria-expanded', 'true');
    await expect(nav.getByRole('link', { name: '설정' })).toBeVisible();
    await expect(page.getByTestId('log')).toHaveText('groups:문서,관리 wide');
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
  // Closed over the current page, the parent is marked without the selection fill (that is the page's alone).
  const parent = nav.getByRole('button', { name: /^프로젝트/ });
  await parent.click();
  await page.mouse.move(800, 600);
  await expect.poll(() => parent.evaluate(el => getComputedStyle(el).backgroundColor)).toBe('rgba(0, 0, 0, 0)');
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
  const home = nav.getByRole('link', { name: '홈' }), box = (await home.boundingBox())!;
  expect(box.width).toBe(44);
  expect(box.x).toBe(side.x);
  await expect(nav.getByText('홈', { exact: true })).toHaveCount(0);
  const parent = nav.getByRole('button', { name: /^프로젝트/ });
  expect(await parent.evaluate(el => getComputedStyle(el).backgroundColor)).not.toBe('rgba(0, 0, 0, 0)');
  // The count on the icon's corner shrinks to a dot; the name keeps the number.
  const tasks = nav.getByRole('link', { name: /할 일/ });
  await expect(tasks.getByText('12', { exact: true })).toHaveCount(0);
  await expect(tasks).toHaveAccessibleName(/12/);
  await parent.click();
  await expect(page.getByTestId('log')).toHaveText('wide');
  await expect(parent).toHaveAttribute('aria-expanded', 'true');
  await expect(nav.getByRole('link', { name: '결제 화면 개선' })).toBeVisible();
});

test.describe('touch pointer', () => {
  test.use({ hasTouch: true, isMobile: true, viewport: { width: 390, height: 844 } });
  for (const platform of ['react', 'vue3']) test(`${platform}: SideNavigation rows grow to 48, children and group titles to 44 on a touch pointer`, async ({ page }) => {
    await openFixture(page, platform, '?groups=1&value=checkout', 'side-navigation');
    expect(await page.evaluate(() => matchMedia('(pointer: coarse)').matches)).toBe(true);
    const nav = page.getByRole('navigation', { name: '작업 공간' });
    expect((await nav.getByRole('link', { name: '홈' }).boundingBox())!.height).toBeCloseTo(48, 2);
    expect((await nav.getByRole('link', { name: '결제 화면 개선' }).boundingBox())!.height).toBeCloseTo(44, 2);
    expect((await nav.getByRole('button', { name: /^문서/ }).boundingBox())!.height).toBeCloseTo(44, 2);
    // Mobile emulation scales the page, so sizes are compared to two decimals.
    // Icons stay 20 and the label stays 14: only the row's height changes.
    expect((await nav.getByRole('link', { name: '홈' }).locator('.kjun-side-navigation-icon').boundingBox())!.height).toBeCloseTo(20, 2);
  });
});

test('native: SideNavigation collapsibleGroups toggles groups and rail="groups" shows one icon per group', async ({ page }) => {
  await openFixture(page, 'native', '?groups=1', 'side-navigation');
  const nav = page.getByRole('navigation', { name: '작업 공간' });
  const docs = nav.getByRole('button', { name: /^문서/ });
  await expect(docs).toHaveAttribute('aria-expanded', 'false');
  // Native Web keeps Web's pointer height for a title (32); a device takes the touch height.
  expect((await docs.boundingBox())!.height).toBe(32);
  await docs.click();
  await expect(docs).toHaveAttribute('aria-expanded', 'true');
  await expect(nav.getByRole('button', { name: /^프로젝트/ })).toBeVisible();
  await expect(page.getByTestId('log')).toHaveText('groups:문서');
  await openFixture(page, 'native', '?collapsed=1&rail=groups&groups=1&value=checkout', 'side-navigation');
  const rail = page.getByRole('navigation', { name: '작업 공간' }), admin = rail.getByRole('button', { name: '관리' });
  await expect(rail.getByRole('button', { name: /^문서/ })).toBeVisible();
  expect(await rail.getByRole('button', { name: /^문서/ }).evaluate(el => getComputedStyle(el).backgroundColor)).not.toBe('rgba(0, 0, 0, 0)');
  await admin.click();
  await expect(page.getByTestId('log')).toHaveText('groups:문서,관리 wide');
  await expect(rail.getByRole('button', { name: '관리' })).toHaveAttribute('aria-expanded', 'true');
});
