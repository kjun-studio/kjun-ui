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
}
