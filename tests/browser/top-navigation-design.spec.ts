import { expect, test, type Page, type Locator } from '@playwright/test';
import { openFixture } from './packed-fixture';
import { tokens } from '../../packages/tokens/dist/index.js';
const configure = (page: Page, next: object) => page.evaluate(next => (window as any).configureTopNavigation(next), next);
const header = (page: Page) => page.getByTestId('header').locator(':scope > *').first();
const title = (page: Page, text = '프로젝트 설정') => page.getByTestId('header').getByText(text, { exact: true });
const back = (page: Page) => page.getByRole('button', { name: '뒤로 가기', exact: true });
const save = (page: Page) => page.getByRole('button', { name: '저장', exact: true });
const rect = async (node: Locator) => (await node.boundingBox())!;
async function assertReadable(page: Page, text = '프로젝트 설정') {
  await expect.poll(async () => {
    const t = await rect(title(page, text)), h = await rect(header(page));
    const controls = await page.getByTestId('header').getByRole('button').all();
    for (const control of controls) {
      const b = await rect(control);
      if (await control.evaluate(el => el.scrollWidth > el.clientWidth + 1)) return false;
      if (b.x < h.x - 1 || b.x + b.width > h.x + h.width + 1 || b.y + b.height > h.y + h.height + 1) return false;
      if (b.x < t.x + t.width - 1 && b.x + b.width > t.x + 1 && b.y < t.y + t.height - 1 && b.y + b.height > t.y + 1) return false;
    }
    return true;
  }).toBe(true);
}
async function clickAt(page: Page, node: Locator) {
  const r = await rect(node); await page.mouse.click(r.x + r.width / 2, r.y + r.height / 2);
}

for (const platform of ['react', 'vue2', 'native']) {
  test(`${platform}: header controls align with the title line independently of description and safe area`, async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 700 });
    for (const palette of ['default', 'dark']) {
      await openFixture(page, platform, '?palette=' + palette, 'top-navigation-design');
      await expect(header(page)).toHaveCSS('border-bottom-width', '0px');
      await expect(header(page)).toHaveCSS('box-shadow', 'none');
      await expect(title(page)).toHaveCSS('font-size', '20px');
      await expect(title(page)).toHaveCSS('font-weight', '600');
      await expect(title(page)).toHaveCSS('line-height', '28px');
      const t = await rect(title(page)), b = await rect(back(page)), s = await rect(save(page));
      expect(b.width).toBe(44); expect(b.height).toBe(44); expect(s.height).toBe(44);
      expect(b.y + b.height / 2).toBe(t.y + 14); expect(s.y + s.height / 2).toBe(t.y + 14);
      await expect(back(page).locator('svg')).toHaveCSS('width', '24px');
      const description = await rect(title(page, '변경할 내용을 선택하세요.'));
      expect(description.x).toBe(t.x); expect(description.y - t.y - t.height).toBe(4);
      const label = platform === 'native' ? save(page).getByText('저장', { exact: true }) : save(page).locator('.kjun-button-label');
      await expect(label).toHaveCSS('font-size', '14px'); await expect(label).toHaveCSS('font-weight', '600');
      await expect(save(page)).toHaveCSS('background-color', 'rgba(0, 0, 0, 0)');
      const outside = page.getByRole('button', { name: '일반 버튼', exact: true });
      await expect(outside).toHaveCSS('height', '32px'); await expect(outside.locator('svg')).toHaveCSS('width', '16px');
      await configure(page, { description: '' });
      await expect(header(page)).toHaveCSS('height', '56px');
      expect(await rect(back(page))).toEqual(b); expect(await rect(title(page))).toEqual(t);
      await configure(page, { safeAreaTop: 24 });
      await expect(header(page)).toHaveCSS('height', '80px');
      expect((await rect(back(page))).y - b.y).toBe(24);
    }
  });

  test(`${platform}: long titles wrap below the first aligned row without clipping optional slots`, async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 900 });
    await openFixture(page, platform, '', 'top-navigation-design');
    const long = '팀과 함께 관리하는 프로젝트의 상세 설정';
    await configure(page, { title: long, multiple: true });
    const t = await rect(title(page, long)), b = await rect(back(page));
    expect(t.height).toBeGreaterThan(28); expect(b.y + b.height / 2).toBe(t.y + 14);
    for (const text of ['저장', '취소']) {
      const r = await rect(page.getByRole('button', { name: text, exact: true }));
      expect(r.y).toBeGreaterThanOrEqual(t.y + t.height); expect(r.x + r.width).toBeLessThanOrEqual(304);
    }
    await assertReadable(page, long);
    const identifier = 'https://example.com/' + 'identifier'.repeat(15);
    await configure(page, { title: identifier });
    expect(await header(page).evaluate(el => el.scrollWidth <= el.clientWidth + 1)).toBe(true);
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(320);
    await configure(page, { title: '프로젝트 설정', leading: false, actions: false, description: '' });
    expect((await rect(title(page))).x - (await rect(header(page))).x).toBe(16);
    await expect(header(page)).toHaveCSS('height', '56px');
    await expect(back(page)).toHaveCount(0); await expect(save(page)).toHaveCount(0);
  });

  test(`${platform}: navigation buttons keep keyboard actions, disabled and loading behavior and supplied variants`, async ({ page }) => {
    await openFixture(page, platform, '', 'top-navigation-design');
    await back(page).focus(); await back(page).press('Enter');
    await back(page).press('Tab'); await expect(save(page)).toBeFocused();
    await expect(save(page)).toHaveCSS('outline-width', '2px'); await save(page).press('Space');
    await expect(page.getByTestId('events')).toHaveText('back|save');
    const before = await rect(save(page));
    await configure(page, { loading: true });
    await expect(save(page)).toBeDisabled(); await expect(save(page)).toHaveAttribute('aria-busy', 'true');
    expect(await rect(save(page))).toEqual(before); await clickAt(page, save(page));
    await expect(page.getByTestId('events')).toBeEmpty();
    await configure(page, { loading: false }); await expect(save(page)).toBeEnabled();
    await configure(page, { disabled: true });
    await expect(back(page)).toBeDisabled(); await expect(save(page)).toBeDisabled();
    await clickAt(page, back(page)); await clickAt(page, save(page)); await expect(page.getByTestId('events')).toBeEmpty();
    await configure(page, { disabled: false, variant: 'primary' });
    await page.mouse.move(0, 0);
    await expect(save(page)).not.toHaveCSS('background-color', 'rgba(0, 0, 0, 0)');
    await save(page).click(); await expect(page.getByTestId('events')).toHaveText('save');
  });

  test(`${platform}: long actions wrap without overlapping the title and return to the first row when space permits`, async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 900 });
    await openFixture(page, platform, '', 'top-navigation-design');
    const text = 'Save changes and continue to the next project without losing any changes';
    await configure(page, { actionText: text, variant: 'secondary' });
    const control = page.getByRole('button', { name: text, exact: true });
    await expect.poll(async () => (await rect(control)).height).toBeGreaterThan(44);
    await expect(control).toHaveAccessibleName(text);
    await assertReadable(page);
    const before = await rect(control);
    await configure(page, { loading: true });
    await expect(control).toBeDisabled(); expect(await rect(control)).toEqual(before);
    await configure(page, { loading: false }); await expect(control).toBeEnabled();
    await control.focus(); await control.press('Space'); await expect(page.getByTestId('events')).toHaveText('save');
    await configure(page, { actionText: 'SaveChangesAndContinueWithoutAnySpacesAtAll' });
    await assertReadable(page);
    await page.setViewportSize({ width: 1000, height: 900 });
    await expect.poll(async () => (await rect(page.getByTestId('header').getByRole('button').last())).y).toBe((await rect(back(page))).y);
    await configure(page, { actionText: '저장' });
    await page.setViewportSize({ width: 320, height: 900 });
    await expect(save(page)).toHaveCSS('height', '44px');
    await expect.poll(async () => (await rect(save(page))).y).toBe((await rect(back(page))).y);
  });

  test(`${platform}: long leading labels preserve readable title space and their full accessible name`, async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 900 });
    await openFixture(page, platform, '', 'top-navigation-design');
    const text = '프로젝트 목록으로 돌아가기';
    await configure(page, { leadingText: text });
    const control = page.getByRole('button', { name: text, exact: true });
    await expect(control).toHaveCSS('height', '44px');
    await expect(control).toHaveAccessibleName(text);
    await expect.poll(async () => (await rect(title(page))).width).toBeGreaterThanOrEqual(120);
    const label = control.getByText(text, { exact: true });
    await expect(label).toHaveCSS('text-overflow', 'ellipsis');
    if (platform !== 'native') await expect(label).toHaveCSS('display', 'block');
    await expect.poll(() => label.evaluate(el => el.scrollWidth > el.clientWidth)).toBe(true);
    await assertReadable(page);
    await control.focus(); await control.press('Enter'); await expect(page.getByTestId('events')).toHaveText('back');
    await page.setViewportSize({ width: 1000, height: 900 });
    await expect.poll(() => label.evaluate(el => el.scrollWidth <= el.clientWidth + 1)).toBe(true);
    await expect.poll(async () => (await rect(save(page))).y).toBe((await rect(control)).y);
  });

  test(`${platform}: mixed navigation controls share geometry through resize, loading and keyboard interactions`, async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 900 });
    await openFixture(page, platform, '', 'top-navigation-design');
    await configure(page, { mixed: true });
    const controls = page.getByTestId('header').getByRole('button');
    await expect(controls).toHaveCount(4);
    for (const control of await controls.all()) {
      await expect(control).toHaveCSS('width', '44px'); await expect(control).toHaveCSS('height', '44px');
      await expect(control.locator('svg')).toHaveCSS('width', '24px');
    }
    const refresh = page.getByRole('button', { name: '새로고침', exact: true }), menu = page.getByRole('button', { name: '더 보기', exact: true }), toggle = page.getByRole('button', { name: '즐겨찾기', exact: true });
    const t = await rect(toggle), r = await rect(refresh); expect(t.y).toBe(r.y);
    await assertReadable(page);
    await toggle.focus(); await toggle.press('Space'); await expect(page.getByTestId('events')).toHaveText('toggle');
    await menu.click(); await page.getByRole('menuitem', { name: '세부 정보', exact: true }).click();
    await expect(page.getByTestId('events')).toHaveText('toggle|menu');
    await configure(page, { loading: true });
    await expect(toggle).toBeDisabled(); expect(await rect(toggle)).toEqual(t);
    await expect(toggle.locator('svg')).toHaveCSS('width', '24px');
    await configure(page, { loading: false, disabled: true }); await expect(toggle).toBeDisabled();
    await configure(page, { disabled: false }); await expect(refresh).toBeEnabled();
    await page.setViewportSize({ width: 320, height: 900 });
    await expect.poll(async () => (await rect(refresh)).y).toBeGreaterThan((await rect(title(page))).y + 28);
    await expect.poll(async () => (await rect(toggle)).y).toBe((await rect(refresh)).y);
    await assertReadable(page);
    await page.setViewportSize({ width: 1000, height: 900 });
    await expect.poll(async () => (await rect(refresh)).y).toBe((await rect(back(page))).y);
    const outside = page.getByRole('button', { name: '일반 즐겨찾기', exact: true });
    // Outside navigation, the default md toggle keeps its own square (native keeps the 44pt target).
    await expect(outside).toHaveCSS('width', platform === 'native' ? '44px' : tokens.extensions.iconToggle.sizes.md + 'px');
    await expect(outside.locator('svg')).toHaveCSS('width', '16px');
  });

  test(`${platform}: packed documentation offers standalone, narrow and mixed navigation examples`, async ({ page }) => {
    const errors: string[] = []; page.on('pageerror', error => errors.push(error.message));
    await openFixture(page, platform, '?component=DsTopNavigation', 'catalog');
    let revision = 0;
    const settings = (settings: object) => page.evaluate(config => window.postMessage({ type: 'kjun:catalog-configure', config }, location.origin), { settings, revision: ++revision, reset: revision });
    const controls = page.getByRole('button');
    await expect(controls).toHaveCount(2);
    await settings({ leading: '없음', actions: '없음', showDescription: false });
    await expect(controls).toHaveCount(0); await expect(page.getByText('프로젝트 설정', { exact: true })).toBeVisible();
    await settings({ actions: '긴 문구', exampleWidth: '320' });
    await expect(controls).toHaveCount(2);
    const long = page.getByRole('button', { name: 'Save changes and continue', exact: true });
    await long.click(); await expect(page.getByText('Save changes and continue 요청', { exact: true })).toBeVisible();
    await settings({ leading: '긴 문구', exampleWidth: '320' });
    await expect(page.getByRole('button', { name: '프로젝트 목록으로 돌아가기', exact: true })).toHaveCSS('height', '44px');
    await settings({ actions: '여러 행동', exampleWidth: '288' });
    await expect(controls).toHaveCount(4);
    await settings({ actions: '아이콘 조합' });
    await expect(controls).toHaveCount(4);
    await expect(page.getByRole('button', { name: '즐겨찾기', exact: true }).locator('svg')).toHaveCSS('width', '24px');
    await page.getByRole('button', { name: '즐겨찾기', exact: true }).click();
    await expect(page.getByText('즐겨찾기 변경', { exact: true })).toBeVisible();
    expect(errors).toEqual([]);
  });
}
