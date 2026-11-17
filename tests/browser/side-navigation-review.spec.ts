import { expect, test } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { openFixture } from './packed-fixture';

// KjunSideNavigation after the design review: the collapse toggle's own icons, names in full ink with lighter icons, a 500
// weight on the current page, neutral badges, the "opens" mark on collapsed parents and groups, short rail names, group
// titles ending in count and chevron, a second level, group limits, headings and arrow keys.
const pathOf = (name: string) => {
  const source = readFileSync(`packages/icons/dist/icons/${name}.js`, 'utf8');
  return JSON.parse(source.slice(source.indexOf('{')).replace(/;\s*$/, '')).outline.find(([tag]: [string]) => tag === 'path')[1].d as string;
};
const color = (hex: string) => `rgb(${[1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16)).join(', ')})`;
const text = color('#111111'), secondary = color('#666666');

for (const platform of ['react', 'vue3']) {
  test(`${platform}: SideNavigation review: the collapse toggle draws its sidebar icons, never the unknown-icon mark`, async ({ page }) => {
    await openFixture(page, platform, '?chrome=1', 'side-navigation');
    const toggle = page.getByRole('button', { name: '메뉴 접기' }), html = () => toggle.locator('svg').innerHTML();
    expect(await html()).toContain(pathOf('layout-sidebar-left-collapse'));
    expect(await html()).not.toContain(pathOf('help-circle'));
    await toggle.click();
    expect(await page.getByRole('button', { name: '메뉴 펼치기' }).locator('svg').innerHTML()).toContain(pathOf('layout-sidebar-left-expand'));
  });

  test(`${platform}: SideNavigation review: names in full ink, icons a step lighter, the current page at 500 and neutral totals in grey`, async ({ page }) => {
    await openFixture(page, platform, '?tones=1', 'side-navigation');
    const nav = page.getByRole('navigation', { name: '작업 공간' });
    const tasks = nav.getByRole('link', { name: /^할 일/ }), home = nav.getByRole('link', { name: '홈' });
    await expect(tasks).toHaveCSS('color', text);
    await expect(tasks.locator('.kjun-side-navigation-glyph')).toHaveCSS('color', secondary);
    await expect(home).toHaveCSS('font-weight', '500');
    await expect(home.locator('.kjun-side-navigation-glyph')).toHaveCSS('color', text);
    const count = tasks.locator('.kjun-navigation-badge');
    await expect(count).toHaveAttribute('data-tone', 'neutral');
    await expect(count).toHaveCSS('background-color', color('#ECECEC'));
    await expect(count).toHaveCSS('color', secondary);
    // The dot that stands for "브랜드 웹사이트" under the closed parent stays an alert.
    await expect(nav.getByRole('button', { name: /^프로젝트/ }).locator('.kjun-navigation-badge')).not.toHaveAttribute('data-tone', 'neutral');
  });

  test(`${platform}: SideNavigation review: collapsed parents and groups carry the opens mark; links do not`, async ({ page }) => {
    await openFixture(page, platform, '?collapsed=1', 'side-navigation');
    const nav = page.getByRole('navigation', { name: '작업 공간' });
    const parent = nav.getByRole('button', { name: /^프로젝트/ });
    await expect(parent.locator('.kjun-side-navigation-opens')).toHaveCount(1);
    await expect(nav.getByRole('link', { name: '홈' }).locator('.kjun-side-navigation-opens')).toHaveCount(0);
    // The mark sits on the icon's lower end corner, inside the row.
    const glyph = (await parent.locator('.kjun-side-navigation-glyph').boundingBox())!, mark = (await parent.locator('.kjun-side-navigation-opens').boundingBox())!, row = (await parent.boundingBox())!;
    expect([mark.width, mark.height]).toEqual([10, 10]);
    expect(mark.x + mark.width).toBeGreaterThan(glyph.x + glyph.width);
    expect(mark.y + mark.height).toBeGreaterThan(glyph.y + glyph.height);
    expect(mark.x + mark.width).toBeLessThanOrEqual(row.x + row.width);
    await openFixture(page, platform, '?collapsed=1&rail=groups', 'side-navigation');
    const group = page.getByRole('navigation', { name: '작업 공간' }).getByRole('button', { name: /^문서/ });
    await expect(group.locator('.kjun-side-navigation-opens')).toHaveCount(1);
    // It widens rather than expanding in place, so it claims no expanded state.
    await expect(group).not.toHaveAttribute('aria-expanded', /.*/);
  });

  test(`${platform}: SideNavigation review: a labelled rail shows the short name and keeps the full one`, async ({ page }) => {
    await openFixture(page, platform, '?collapsed=1&labels=1&shortlabels=1', 'side-navigation');
    const archive = page.getByRole('navigation', { name: '작업 공간' }).getByRole('link', { name: '아주 긴 이름을 가진 프로젝트 문서 보관함' });
    await expect(archive.locator('.kjun-side-navigation-label')).toHaveText('보관함');
    // React Aria opens a hover tooltip once the pointer has moved on the page.
    await page.mouse.move(800, 600);
    await archive.hover();
    await expect(page.getByRole('tooltip')).toHaveText('아주 긴 이름을 가진 프로젝트 문서 보관함');
  });

  test(`${platform}: SideNavigation review: a group title ends with its count and a chevron that turns over, open or closed`, async ({ page }) => {
    await openFixture(page, platform, '?groups=1&counts=1', 'side-navigation');
    const admin = page.getByRole('navigation', { name: '작업 공간' }).getByRole('button', { name: '관리' });
    const count = admin.locator('.kjun-side-navigation-count'), chevron = admin.locator('.kjun-side-navigation-chevron');
    await expect(count).toHaveText('2');
    expect((await chevron.boundingBox())!.x).toBeGreaterThan((await count.boundingBox())!.x);
    await admin.click();
    await expect(admin).toHaveAttribute('aria-expanded', 'true');
    await expect(count).toHaveText('2');
    await expect.poll(() => chevron.evaluate(el => getComputedStyle(el).transform)).toMatch(/^matrix\(-1, 0, 0, -1/);
  });

  test(`${platform}: SideNavigation review: a second level opens with the current page and starts one indent further in`, async ({ page }) => {
    await openFixture(page, platform, '?nested=1&value=tokens', 'side-navigation');
    const nav = page.getByRole('navigation', { name: '작업 공간' });
    await expect(nav.getByRole('button', { name: /^프로젝트/ })).toHaveAttribute('aria-expanded', 'true');
    const design = nav.getByRole('button', { name: /^디자인/ });
    await expect(design).toHaveAttribute('aria-expanded', 'true');
    const tokens = nav.getByRole('link', { name: '토큰' });
    await expect(tokens).toHaveAttribute('aria-current', 'page');
    await expect(tokens).toHaveAttribute('data-depth', '2');
    expect(Math.round((await tokens.boundingBox())!.height)).toBe(32);
    const child = (await nav.getByRole('link', { name: '결제 화면 개선' }).locator('.kjun-side-navigation-label').boundingBox())!;
    expect(Math.round((await tokens.locator('.kjun-side-navigation-label').boundingBox())!.x - child.x)).toBe(16);
    // Closing the second level leaves it standing for the page, with the neutral dot of "아이콘".
    await design.click();
    await expect(design).toHaveAttribute('data-current-within', '');
    await expect(design.locator('.kjun-navigation-badge')).toHaveAttribute('data-tone', 'neutral');
  });

  test(`${platform}: SideNavigation review: a group's limit folds its rows behind "more", keeps the current page and focuses what it reveals`, async ({ page }) => {
    await openFixture(page, platform, '?limit=1', 'side-navigation');
    const nav = page.getByRole('navigation', { name: '작업 공간' }), more = nav.getByRole('button', { name: '1개 더 보기' });
    await expect(nav.getByRole('link', { name: /보관함$/ })).toHaveCount(0);
    await expect(more).toHaveAttribute('aria-expanded', 'false');
    await more.focus();
    await page.keyboard.press('Enter');
    const archive = nav.getByRole('link', { name: /보관함$/ });
    await expect(archive).toBeFocused();
    await expect(nav.getByRole('button', { name: '접기' })).toHaveAttribute('aria-expanded', 'true');
    // The current page is never folded away, and then nothing is left to fold.
    await openFixture(page, platform, '?limit=1&value=archive', 'side-navigation');
    await expect(page.getByRole('navigation', { name: '작업 공간' }).getByRole('link', { name: /보관함$/ })).toHaveAttribute('aria-current', 'page');
    await expect(page.getByRole('navigation', { name: '작업 공간' }).locator('.kjun-side-navigation-more')).toHaveCount(0);
  });

  test(`${platform}: SideNavigation review: group titles are headings, and arrow keys open, enter, leave and close`, async ({ page }) => {
    await openFixture(page, platform, '?groups=1', 'side-navigation');
    const nav = page.getByRole('navigation', { name: '작업 공간' });
    await expect(nav.getByRole('heading', { level: 2, name: '관리' })).toBeVisible();
    const docs = nav.getByRole('button', { name: /^문서/ }), projects = nav.getByRole('button', { name: /^프로젝트/ });
    await docs.focus();
    await expect(docs).toHaveAttribute('aria-expanded', 'false');
    await page.keyboard.press('ArrowRight');
    await expect(docs).toHaveAttribute('aria-expanded', 'true');
    await page.keyboard.press('ArrowRight');
    await expect(projects).toBeFocused();
    await page.keyboard.press('ArrowRight');
    await expect(projects).toHaveAttribute('aria-expanded', 'true');
    await page.keyboard.press('ArrowRight');
    await expect(nav.getByRole('link', { name: /^브랜드 웹사이트/ })).toBeFocused();
    await page.keyboard.press('ArrowLeft');
    await expect(projects).toBeFocused();
    await page.keyboard.press('ArrowLeft');
    await expect(projects).toHaveAttribute('aria-expanded', 'false');
    await page.keyboard.press('ArrowLeft');
    await expect(docs).toBeFocused();
    await page.keyboard.press('ArrowLeft');
    await expect(docs).toHaveAttribute('aria-expanded', 'false');
  });
}

test('native: SideNavigation review: neutral totals, the opens mark and a second level on Native Web', async ({ page }) => {
  await openFixture(page, 'native', '?tones=1&nested=1&value=tokens', 'side-navigation');
  await expect(page.getByRole('link', { name: '토큰' })).toBeVisible();
  await expect(page.getByRole('button', { name: /^디자인/ })).toHaveAttribute('aria-expanded', 'true');
  await openFixture(page, 'native', '?collapsed=1', 'side-navigation');
  await expect(page.getByRole('button', { name: /^프로젝트/ })).toBeVisible();
});
