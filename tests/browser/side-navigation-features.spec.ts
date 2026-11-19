import { expect, test, type Locator } from '@playwright/test';
import { openFixture } from './packed-fixture';

// KjunSideNavigation: per-group options and counts, the flyout of a collapsed parent, header/footer and the collapse
// toggle, row actions, router links, scrolling to the current page and a disabled parent's tooltip.
const clear = 'rgba(0, 0, 0, 0)';
const fillOf = (el: Locator) => el.evaluate(node => getComputedStyle(node).backgroundColor);

for (const platform of ['react', 'vue3']) {
  test(`${platform}: SideNavigation group options: a group's own collapsible and defaultOpen, a small chevron after the name and counts`, async ({ page }) => {
    await openFixture(page, platform, '?groups=1&pergroup=1', 'side-navigation');
    const nav = page.getByRole('navigation', { name: '작업 공간' });
    // "문서" starts open (defaultOpen); "관리" (collapsible: false) keeps a plain title and its rows.
    const docs = nav.getByRole('button', { name: /^문서/ });
    await expect(docs).toHaveAttribute('aria-expanded', 'true');
    await expect(nav.getByRole('button', { name: '관리' })).toHaveCount(0);
    await expect(nav.getByRole('link', { name: '설정' })).toBeVisible();
    // The chevron is 14 at the title's end, and turns over like a parent's once open.
    const chevron = docs.locator('.kjun-side-navigation-chevron'), mark = (await chevron.boundingBox())!, title = (await docs.boundingBox())!;
    expect([mark.width, mark.height]).toEqual([14, 14]);
    expect(Math.round(title.x + title.width - (mark.x + mark.width))).toBe(12);
    await expect.poll(() => chevron.evaluate(el => getComputedStyle(el).transform)).toMatch(/^matrix\(-1, 0, 0, -1/);
    // Counts are off by default.
    await docs.click();
    await expect(docs.locator('.kjun-side-navigation-count')).toHaveCount(0);

    await openFixture(page, platform, '?groups=1&counts=1', 'side-navigation');
    const admin = page.getByRole('navigation', { name: '작업 공간' }).getByRole('button', { name: '관리' }), side = (await page.getByTestId('side').boundingBox())!;
    // A group title holds the number of its rows before its chevron, quiet and tabular; a badge inside a closed group wins as a dot.
    const count = admin.locator('.kjun-side-navigation-count');
    await expect(count).toHaveText('2');
    await expect(count).toHaveAttribute('aria-hidden', 'true');
    const end = (await admin.locator('.kjun-side-navigation-chevron').boundingBox())!;
    expect(Math.round(side.x + side.width - (end.x + end.width))).toBe(12);
    expect((await count.boundingBox())!.x).toBeLessThan(end.x);
    const docsTitle = page.getByRole('navigation', { name: '작업 공간' }).getByRole('button', { name: /^문서/ });
    await expect(docsTitle.locator('.kjun-side-navigation-count')).toHaveCount(0);
    await expect(docsTitle.locator('.kjun-navigation-badge[data-dot]')).toBeVisible();
    // It stays in place when the group opens.
    await admin.click();
    await expect(count).toHaveText('2');
  });

  test(`${platform}: SideNavigation an empty group shows its empty line where a child row's name starts, in the menu and in a flyout`, async ({ page }) => {
    await openFixture(page, platform, '?empty=1', 'side-navigation');
    const nav = page.getByRole('navigation', { name: '작업 공간' });
    const line = nav.locator('.kjun-side-navigation-empty');
    await expect(line).toHaveText('즐겨찾기한 문서가 없습니다');
    const home = (await nav.getByRole('link', { name: '홈' }).boundingBox())!, box = (await line.boundingBox())!;
    const start = await line.evaluate(el => parseFloat(getComputedStyle(el).paddingInlineStart));
    expect(Math.round(box.x + start - home.x)).toBe(44);
    expect(Math.round(box.height)).toBe(36);
    await expect(nav.getByRole('group', { name: '즐겨찾기' }).getByRole('link')).toHaveCount(0);
    await openFixture(page, platform, '?collapsed=1&flyout=1&rail=groups&empty=1', 'side-navigation');
    await page.getByRole('navigation', { name: '작업 공간' }).getByRole('button', { name: '즐겨찾기' }).click();
    await expect(page.getByRole('dialog', { name: '즐겨찾기' }).locator('.kjun-side-navigation-empty')).toHaveText('즐겨찾기한 문서가 없습니다');
  });

  test(`${platform}: SideNavigation collapsed groups are apart by the gap alone unless railDividers, and a flyout opens level with its icon`, async ({ page }) => {
    await openFixture(page, platform, '?collapsed=1', 'side-navigation');
    const nav = page.getByRole('navigation', { name: '작업 공간' });
    const lines = () => nav.locator('.kjun-side-navigation-list').evaluate(el => [...el.children].map(group => getComputedStyle(group, '::before').content));
    expect(await lines()).toEqual(['none', 'none', 'none', 'none']);
    await openFixture(page, platform, '?collapsed=1&flyout=1', 'side-navigation');
    const parent = page.getByRole('navigation', { name: '작업 공간' }).getByRole('button', { name: /^프로젝트/ });
    await parent.click();
    const panel = page.getByRole('dialog', { name: '프로젝트' });
    await expect(panel).toBeVisible();
    // Top edges line up, and the title starts where the rows' names start.
    expect(Math.abs((await panel.boundingBox())!.y - (await parent.boundingBox())!.y)).toBeLessThanOrEqual(1);
    const title = await panel.locator('.kjun-popover-header').evaluate(el => { const range = document.createRange(); range.selectNodeContents(el); return range.getBoundingClientRect().x; });
    expect(Math.round(title)).toBe(Math.round((await panel.locator('.kjun-side-navigation-label').first().boundingBox())!.x));
  });

  test(`${platform}: SideNavigation collapsedParent="flyout" shows a collapsed parent's children beside it and keeps the column narrow`, async ({ page }) => {
    await openFixture(page, platform, '?collapsed=1&flyout=1&value=checkout', 'side-navigation');
    const nav = page.getByRole('navigation', { name: '작업 공간' }), log = page.getByTestId('log');
    const parent = nav.getByRole('button', { name: /^프로젝트/ }), box = (await parent.boundingBox())!;
    // Half the selection fill on the icon: it holds the current page.
    expect(await fillOf(parent)).not.toBe(clear);
    await parent.click();
    const panel = page.getByRole('dialog', { name: '프로젝트' });
    await expect(panel).toBeVisible();
    await expect(parent).toHaveAttribute('aria-expanded', 'true');
    await expect(nav).toHaveAttribute('data-collapsed', '');
    // Beside the icon, with the children as full rows starting at the panel's edge.
    expect((await panel.boundingBox())!.x).toBeGreaterThanOrEqual(box.x + box.width);
    const checkout = panel.getByRole('link', { name: '결제 화면 개선' });
    await expect(checkout).toHaveAttribute('aria-current', 'page');
    expect((await checkout.locator('.kjun-side-navigation-label').boundingBox())!.x - (await checkout.boundingBox())!.x).toBeCloseTo(12, 0);
    await panel.getByRole('link', { name: /브랜드 웹사이트/ }).click();
    await expect(panel).toBeHidden();
    await expect(log).toHaveText('go:brand');
    // → opens it from the keyboard, Escape closes it.
    await parent.focus();
    await page.keyboard.press('ArrowRight');
    await expect(page.getByRole('dialog', { name: '프로젝트' })).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page.getByRole('dialog', { name: '프로젝트' })).toBeHidden();
    await expect(log).toHaveText('go:brand');
    // ← from a row with nothing above it in the panel closes the panel and puts focus back on the icon.
    await parent.focus();
    await page.keyboard.press('ArrowRight');
    const again = page.getByRole('dialog', { name: '프로젝트' });
    await expect(again).toBeVisible();
    await again.getByRole('link', { name: '결제 화면 개선' }).focus();
    await page.keyboard.press('ArrowLeft');
    await expect(again).toBeHidden();
    await expect(parent).toBeFocused();

    // A rail of groups opens the group's rows the same way.
    await openFixture(page, platform, '?collapsed=1&flyout=1&rail=groups', 'side-navigation');
    await page.getByRole('navigation', { name: '작업 공간' }).getByRole('button', { name: '관리' }).click();
    const group = page.getByRole('dialog', { name: '관리' });
    await expect(group.getByRole('link', { name: '설정' })).toBeVisible();
    await expect(group.getByRole('link', { name: '설정' }).locator('.kjun-side-navigation-icon')).toHaveCount(1);
    await expect(page.getByTestId('log')).toHaveText('');
  });

  test(`${platform}: SideNavigation header, footer and the collapse toggle; names fade in after widening`, async ({ page }) => {
    await openFixture(page, platform, '?chrome=1', 'side-navigation');
    const nav = page.getByRole('navigation', { name: '작업 공간' }), list = nav.locator('.kjun-side-navigation-list');
    await expect(page.getByTestId('header')).toHaveText('KJ Studio');
    await expect(page.getByTestId('footer')).toBeVisible();
    // Header above the list, footer below it; only the list scrolls inside the 260 column.
    const header = (await page.getByTestId('header').boundingBox())!, listBox = (await list.boundingBox())!, footer = (await page.getByTestId('footer').boundingBox())!;
    expect(header.y + header.height).toBeLessThanOrEqual(listBox.y);
    expect(listBox.y + listBox.height).toBeLessThanOrEqual(footer.y);
    expect(Math.round((await nav.boundingBox())!.height)).toBe(260);
    expect(await list.evaluate(el => el.scrollHeight > el.clientHeight && getComputedStyle(el).overflowY === 'auto')).toBe(true);
    const toggle = nav.getByRole('button', { name: '메뉴 접기' });
    await expect(toggle).toHaveAttribute('aria-expanded', 'true');
    expect((await toggle.boundingBox())!.width).toBe(32);
    await toggle.click();
    await expect(nav).toHaveAttribute('data-collapsed', '');
    await expect(page.getByTestId('header')).toHaveText('K');
    const widen = nav.getByRole('button', { name: '메뉴 펼치기' });
    await expect(widen).toHaveAttribute('aria-expanded', 'false');
    // Collapsed, the toggle is a row like the icons (44 by 40) and sits above the footer's content.
    expect([(await widen.boundingBox())!.width, (await widen.boundingBox())!.height]).toEqual([44, 40]);
    expect((await widen.boundingBox())!.y).toBeLessThan((await page.getByTestId('footer').boundingBox())!.y);
    // The names wait for the column and fade in; the window closes after twice the control motion. It is short, so the
    // page itself reads the animation the moment the window opens.
    await nav.evaluate(el => { (window as any).reveal = new Promise(done => new MutationObserver((_, watch) => {
      if (!el.hasAttribute('data-expanding')) return;
      watch.disconnect(); done(getComputedStyle(el.querySelector('.kjun-side-navigation-label')!).animationName);
    }).observe(el, { attributes: true, attributeFilter: ['data-expanding'] })); });
    await widen.click();
    expect(await page.evaluate(() => (window as any).reveal)).toBe('kjun-side-navigation-reveal');
    await expect(nav).not.toHaveAttribute('data-expanding', /.*/);
    await expect(page.getByTestId('log')).toHaveText('wide wide');
  });

  test(`${platform}: SideNavigation row and group actions appear with hover or focus and report the row`, async ({ page }) => {
    await openFixture(page, platform, '?actions=1', 'side-navigation');
    const nav = page.getByRole('navigation', { name: '작업 공간' }), log = page.getByTestId('log');
    const archive = nav.getByRole('link', { name: /아주 긴 이름/ }), row = nav.locator('.kjun-side-navigation-row', { has: page.getByRole('link', { name: /아주 긴 이름/ }) });
    const actions = row.locator('.kjun-side-navigation-actions');
    await page.mouse.move(800, 600);
    expect(await actions.evaluate(el => getComputedStyle(el).opacity)).toBe('0');
    await archive.hover();
    await expect.poll(() => actions.evaluate(el => getComputedStyle(el).opacity)).toBe('1');
    // Two 24 buttons, 2 apart, the last one's icon at the row's end inset; the name stops short of them.
    const add = row.getByRole('button', { name: '새 문서' }), more = row.getByRole('button', { name: '더 보기' });
    const addBox = (await add.boundingBox())!, moreBox = (await more.boundingBox())!, rowBox = (await archive.boundingBox())!;
    expect([moreBox.width, moreBox.height]).toEqual([24, 24]);
    expect(Math.round(moreBox.x - (addBox.x + addBox.width))).toBe(2);
    expect(Math.round(rowBox.x + rowBox.width - (moreBox.x + moreBox.width))).toBe(8);
    const label = (await archive.locator('.kjun-side-navigation-label').boundingBox())!;
    expect(label.x + label.width).toBeLessThanOrEqual(addBox.x);
    await add.click();
    await expect(log).toHaveText('act:archive:new');
    // A button is beside the link, never inside it.
    expect(await add.evaluate(el => !!el.closest('a'))).toBe(false);
    // Keyboard: focus on the link shows them too.
    await page.mouse.move(800, 600);
    await archive.focus();
    await expect.poll(() => actions.evaluate(el => getComputedStyle(el).opacity)).toBe('1');
    // A group title's action.
    const heading = nav.locator('.kjun-side-navigation-heading', { hasText: '관리' });
    await heading.hover();
    await nav.getByRole('button', { name: '관리 항목 추가' }).click();
    await expect(log).toHaveText('act:archive:new act:관리:add');
  });

  test(`${platform}: SideNavigation linkAs renders the app's router link; the current row scrolls into its column`, async ({ page }) => {
    await openFixture(page, platform, '?link=1', 'side-navigation');
    const nav = page.getByRole('navigation', { name: '작업 공간' });
    const tasks = nav.getByRole('link', { name: /할 일/ });
    await expect(tasks).toHaveAttribute('data-router-link', '');
    await expect(tasks).toHaveAttribute('href', '#tasks');
    await expect(tasks).toHaveClass(/kjun-side-navigation-item/);
    await tasks.click();
    await expect(tasks).toHaveAttribute('aria-current', 'page');
    await expect(page.getByTestId('log')).toHaveText('go:tasks');
    // A disabled destination stays a plain link with no href.
    await expect(nav.getByRole('link', { name: '결제', exact: true })).not.toHaveAttribute('data-router-link', /.*/);

    await openFixture(page, platform, '?short=1&value=settings', 'side-navigation');
    const side = page.getByTestId('side'), settings = page.getByRole('link', { name: '설정' });
    await expect.poll(() => side.evaluate(el => el.scrollTop)).toBeGreaterThan(0);
    const column = (await side.boundingBox())!, row = (await settings.boundingBox())!;
    expect(row.y + row.height).toBeLessThanOrEqual(column.y + column.height + 1);
    expect(await page.evaluate(() => window.scrollY)).toBe(0);
  });

  test(`${platform}: SideNavigation a disabled parent keeps its tooltip and name while collapsed and does not open`, async ({ page }) => {
    await openFixture(page, platform, '?collapsed=1&disabledparent=1', 'side-navigation');
    const nav = page.getByRole('navigation', { name: '작업 공간' }), parent = nav.getByRole('button', { name: /^프로젝트/ });
    await expect(parent).toHaveAttribute('aria-disabled', 'true');
    await page.mouse.move(800, 600);
    await parent.hover();
    await expect(page.getByRole('tooltip')).toHaveText('프로젝트');
    await parent.click({ force: true });
    await expect(page.getByTestId('log')).toHaveText('');
    await expect(nav).toHaveAttribute('data-collapsed', '');
  });
}

// Native (React Native Web): the same options drawn with Views. Hover-only behaviour does not apply (actions always show).
test('native: SideNavigation flyout, group counts, actions and the collapse toggle', async ({ page }) => {
  await openFixture(page, 'native', '?collapsed=1&flyout=1&value=checkout', 'side-navigation');
  const nav = page.getByRole('navigation', { name: '작업 공간' });
  await nav.getByRole('button', { name: /^프로젝트/ }).click();
  const panel = page.getByRole('dialog', { name: '프로젝트' });
  await expect(panel.getByRole('link', { name: '결제 화면 개선' })).toBeVisible();
  // The panel opens level with the icon (right-start). Native Web names its full-screen Modal dialog after the panel, so
  // measure the labelled panel inside it.
  expect(Math.abs((await panel.getByLabel('프로젝트', { exact: true }).boundingBox())!.y - (await nav.getByRole('button', { name: /^프로젝트/ }).boundingBox())!.y)).toBeLessThanOrEqual(1);
  await panel.getByRole('link', { name: /브랜드 웹사이트/ }).click();
  await expect(page.getByTestId('log')).toHaveText('go:brand');
  await expect(page.getByRole('dialog')).toHaveCount(0);

  await openFixture(page, 'native', '?groups=1&counts=1&actions=1&chrome=1', 'side-navigation');
  const menu = page.getByRole('navigation', { name: '작업 공간' });
  await expect(menu.getByRole('button', { name: '관리', exact: true })).toContainText('2');
  await menu.getByRole('button', { name: /^문서/ }).click();
  // A row's action buttons sit in the middle of the row, as on Web.
  const archive = (await menu.getByRole('link', { name: /보관함/ }).boundingBox())!, add = (await menu.getByRole('button', { name: '새 문서' }).boundingBox())!;
  expect(Math.abs(add.y + add.height / 2 - (archive.y + archive.height / 2))).toBeLessThanOrEqual(1);
  await menu.getByRole('button', { name: '새 문서' }).click();
  await expect(page.getByTestId('log')).toHaveText('groups:문서 act:archive:new');
  await expect(page.getByTestId('header')).toHaveText('KJ Studio');
  await menu.getByRole('button', { name: '메뉴 접기' }).click();
  await expect(page.getByTestId('header')).toHaveText('K');
  await expect(menu.getByRole('button', { name: '메뉴 펼치기' })).toBeVisible();
});
