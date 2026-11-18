import { test, expect } from '@playwright/test';
import { openFixture } from './packed-fixture';

test.use({ reducedMotion: 'reduce' });

// Vue 3 renders React's listbox DOM, so groups, labels and read-only share one contract.
for (const platform of ['react', 'vue3']) {
  test(`${platform}: Select groups put a title over their options and skip it in the keyboard order`, async ({ page }) => {
    await openFixture(page, platform, '?grouped&search', 'select-scroll');
    await page.getByRole('button', { name: '검사 선택', exact: true }).click();
    const groups = page.getByRole('group');
    await expect(groups).toHaveCount(3);
    await expect(groups.first()).toHaveAccessibleName('그룹 1');
    await expect(page.locator('.kjun-menu-section-title')).toHaveText(['그룹 1', '그룹 2', '그룹 3']);
    const search = page.getByRole('textbox', { name: '선택 항목 검색' });
    await search.fill('항목 1');
    // 항목 10–16 sit in group 2 and 17–19 in group 3; group 1 has no match and drops out with its title.
    await expect(page.locator('.kjun-menu-section-title')).toHaveText(['그룹 2', '그룹 3']);
    await search.press('ArrowDown');
    await expect(page.getByRole('option', { name: '항목 10', exact: true })).toBeFocused();
    for (let step = 0; step < 7; step++) await page.keyboard.press('ArrowDown');
    await expect(page.getByRole('option', { name: '항목 17', exact: true })).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(page.getByTestId('selection')).toHaveText('"17"');
  });

  test(`${platform}: a searchable Select hands Arrow Up on the first option and typing back to its search`, async ({ page }) => {
    await openFixture(page, platform, '?search', 'select-scroll');
    await page.getByRole('button', { name: '검사 선택', exact: true }).click();
    const search = page.getByRole('textbox', { name: '선택 항목 검색' });
    await search.press('ArrowDown');
    await expect(page.getByRole('option').first()).toBeFocused();
    await page.keyboard.press('ArrowUp');
    await expect(search).toBeFocused();
    await search.press('ArrowDown');
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('2');
    await expect(search).toBeFocused();
    await expect(search).toHaveValue('2');
    await expect(page.getByRole('option').first()).toHaveAccessibleName('항목 02');
  });

  test(`${platform}: multipleDisplay "labels" names the selection and counts the labels that do not fit`, async ({ page }) => {
    await openFixture(page, platform, '?multiple&labels&value=1,2', 'select-scroll');
    const trigger = page.getByRole('button', { name: '검사 선택', exact: true });
    await expect(trigger.locator('.kjun-select-values-text')).toHaveText('항목 01, 항목 02');
    await expect(trigger.locator('.kjun-select-values-more')).toHaveCount(0);
    await openFixture(page, platform, '?multiple&labels&value=1,2,3,4,5,6,7,8', 'select-scroll');
    const more = page.locator('.kjun-select-values-more');
    await expect(more).toHaveAttribute('aria-hidden', 'true');
    const hidden = Number((await more.textContent())!.slice(1));
    expect(hidden).toBeGreaterThan(0);
    expect(hidden).toBeLessThan(8);
    // Every label before the count fits whole; the first counted one does not.
    const fits = await page.locator('.kjun-select-values-text').evaluate((text, hidden) => {
      const left = text.getBoundingClientRect().left, rights = [...text.children].map(child => child.getBoundingClientRect().right - left);
      return rights.slice(0, rights.length - hidden).every(right => right <= text.clientWidth + 0.5) && rights[rights.length - hidden] > text.clientWidth;
    }, hidden);
    expect(fits).toBe(true);
  });

  test(`${platform}: a read-only Select shows its value without an indicator, hover or clear`, async ({ page }) => {
    await openFixture(page, platform, '?readonly&clear&value=3', 'select-scroll');
    const trigger = page.getByRole('button', { name: '검사 선택', exact: true });
    await expect(trigger).toHaveAttribute('aria-readonly', 'true');
    await expect(trigger.locator('.kjun-select-indicator')).toHaveCount(0);
    await expect(page.locator('.kjun-select-clear')).toHaveCount(0);
    const before = await trigger.evaluate(element => getComputedStyle(element).backgroundColor);
    await trigger.hover();
    const style = await trigger.evaluate(element => { const css = getComputedStyle(element); return { background: css.backgroundColor, cursor: css.cursor, color: css.color }; });
    expect(style.background).toBe(before);
    expect(style.cursor).toBe('default');
    await trigger.click();
    await expect(page.getByRole('listbox')).toHaveCount(0);
  });

  test(`${platform}: Select keeps the clear button for a value whose option has not loaded`, async ({ page }) => {
    await openFixture(page, platform, '?empty&clear&value=7', 'select-scroll');
    const clear = page.getByRole('button', { name: '선택 지우기' });
    await expect(clear).toBeVisible();
    await clear.click();
    await expect(page.getByTestId('selection')).toHaveText('null');
  });
}
