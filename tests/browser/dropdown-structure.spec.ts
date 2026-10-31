import { expect, test, type Page } from '@playwright/test';
import { openFixture } from './packed-fixture';

const configure = (page: Page, next: object) => page.evaluate(next => (window as any).configureStructure(next), next);
const menu = (page: Page, platform: string) => page.locator(platform === 'native' ? '[aria-label="메뉴"]' : '.kjun-dropdown');
const row = (page: Page, text: string) => page.locator('[role^="menuitem"], [role="radio"], [role="checkbox"]').filter({ hasText: text });
const trigger = (page: Page) => page.getByRole('button', { name: '구조 메뉴', exact: true });

for (const platform of ['react', 'vue3', 'native']) {
  const web = platform !== 'native';
  const radio = web ? 'menuitemradio' : 'radio', checkbox = web ? 'menuitemcheckbox' : 'checkbox';

  test(`${platform}: sections, single choices, toggles, descriptions and shortcuts`, async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await openFixture(page, platform, '', 'dropdown-structure');
    await trigger(page).click();
    const group = page.getByRole('group', { name: '정렬', exact: true });
    await expect(group).toBeVisible();
    await expect(group.getByRole(radio)).toHaveCount(2);
    await expect(page.getByRole(radio, { name: '이름순' })).toHaveAttribute('aria-checked', 'true');
    await expect(page.getByRole(radio, { name: '날짜순' })).toHaveAttribute('aria-checked', 'false');
    const toggle = page.getByRole(checkbox, { name: /숨긴 항목 보기/ });
    await expect(toggle).toHaveAttribute('aria-checked', 'true');
    await expect(toggle).toContainText('보관한 항목 포함');
    // The shortcut is a visible hint on the web; touch Native has no keyboard to hint at.
    if (web) {
      await expect(toggle).toContainText('⌘H');
      await expect(toggle).toHaveAttribute('aria-keyshortcuts', '⌘H');
    }
    // The single choice and the toggle draw their check in the leading column, before the label.
    const check = (await toggle.locator('svg').first().boundingBox())!, label = (await toggle.getByText('숨긴 항목 보기').boundingBox())!;
    expect(check.x).toBeLessThan(label.x);
    // The check column comes first and the icon column after it, even on rows that use only one of them.
    const icon = (await row(page, '공유').locator('svg').first().boundingBox())!;
    expect(icon.x).toBeGreaterThan(check.x + check.width);
    expect(Math.round((await row(page, '공유').getByText('공유').boundingBox())!.x)).toBe(Math.round(label.x));
    await toggle.click();
    await expect(menu(page, platform)).toBeHidden();
    await expect(page.getByTestId('last')).toHaveText('숨긴 항목 보기');
    await trigger(page).click();
    await expect(page.getByRole(checkbox, { name: /숨긴 항목 보기/ })).toHaveAttribute('aria-checked', 'false');
  });

  test(`${platform}: a submenu opens in place and returns by its back row`, async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await openFixture(page, platform, '', 'dropdown-structure');
    await trigger(page).click();
    const share = row(page, '공유');
    await expect(share).toHaveAttribute('aria-haspopup', 'menu');
    await share.click();
    await expect(menu(page, platform)).toBeVisible();
    const back = page.getByRole('menuitem', { name: '뒤로, 공유', exact: true });
    await expect(back).toBeVisible();
    await expect(row(page, '링크 복사')).toBeVisible();
    await expect(row(page, '이름순')).toHaveCount(0);
    await back.click();
    await expect(row(page, '이름순')).toBeVisible();
    await expect(row(page, '링크 복사')).toHaveCount(0);
    await row(page, '공유').click();
    await row(page, '이메일로 보내기').click();
    await expect(menu(page, platform)).toBeHidden();
    await expect(page.getByTestId('last')).toHaveText('이메일로 보내기');
    // A fresh opening starts again at the top level.
    await trigger(page).click();
    await expect(row(page, '이름순')).toBeVisible();
  });

  test(`${platform}: compact density tightens rows for fine pointers`, async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await openFixture(page, platform, '', 'dropdown-structure');
    await trigger(page).click();
    const remove = row(page, '삭제');
    await expect.poll(async () => (await remove.boundingBox())!.height).toBe(web ? 40 : 44);
    await page.keyboard.press('Escape');
    await expect(menu(page, platform)).toBeHidden();
    await configure(page, { density: 'compact' });
    await trigger(page).click();
    await expect.poll(async () => (await remove.boundingBox())!.height).toBe(32);
  });

  if (web) test(`${platform}: a pointer opening paints nothing, the keyboard focuses rows and arrows walk submenus`, async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await openFixture(page, platform, '', 'dropdown-structure');
    await trigger(page).click();
    await expect(page.getByRole('menu')).toBeFocused();
    await expect(page.locator('.kjun-menu-item[data-focused]')).toHaveCount(0);
    await page.keyboard.press('Escape');
    await expect(trigger(page)).toBeFocused();
    await trigger(page).press('Enter');
    await expect(row(page, '이름순')).toBeFocused();
    await page.keyboard.press('End');
    await expect(row(page, '삭제')).toBeFocused();
    await page.keyboard.press('ArrowUp');
    await expect(row(page, '공유')).toBeFocused();
    await page.keyboard.press('ArrowRight');
    await expect(page.getByRole('menuitem', { name: '뒤로, 공유', exact: true })).toBeFocused();
    await expect(row(page, '링크 복사')).toBeVisible();
    await page.keyboard.press('ArrowLeft');
    await expect(row(page, '이름순')).toBeVisible();
    await expect(row(page, '링크 복사')).toHaveCount(0);
    await page.keyboard.press('Escape');
    await expect(menu(page, platform)).toBeHidden();
    await expect(trigger(page)).toBeFocused();
  });
}
