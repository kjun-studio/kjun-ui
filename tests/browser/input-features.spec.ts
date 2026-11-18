import { expect, test, type Page } from '@playwright/test';
import { openFixture } from './packed-fixture';
// Input reveal and count, SearchInput plain loading and pass-through, on the input-design fixture.
const configure = (page: Page, next: object) => page.evaluate(next => (window as any).configureInputDesign(next), next);
const extras = (page: Page, next: object) => page.evaluate(next => (window as any).configureInputExtras(next), next);
const width = (page: Page, id: string) => page.getByTestId(id).locator('input').evaluate(el => el.getBoundingClientRect().width);
const insetLeft = (page: Page, id: string) => page.getByTestId(id).locator('input').evaluate(el => getComputedStyle(el).paddingLeft);

for (const platform of ['react', 'vue3', 'native']) {
  test(`${platform}: a revealable password shows its text and keeps the field's width`, async ({ page }) => {
    await openFixture(page, platform, '', 'input-design');
    const scope = page.getByTestId('password'), input = scope.locator('input');
    await expect(input).toHaveAttribute('type', 'password');
    const show = scope.getByRole('button', { name: '비밀번호 보기' });
    await expect(show).toHaveText(/보기/);
    const before = await input.evaluate(el => [el.getBoundingClientRect().width, getComputedStyle(el).paddingRight]);
    const button = await show.boundingBox();
    await show.click();
    await expect(input).not.toHaveAttribute('type', 'password');
    const hide = scope.getByRole('button', { name: '비밀번호 숨기기' });
    await expect(hide).toBeVisible();
    expect(await input.evaluate(el => [el.getBoundingClientRect().width, getComputedStyle(el).paddingRight])).toEqual(before);
    expect((await hide.boundingBox())!.width).toBeCloseTo(button!.width, 0);
    await hide.click();
    await expect(input).toHaveAttribute('type', 'password');
    await configure(page, { disabled: true });
    await expect(scope.getByRole('button', { name: '비밀번호 보기' })).toBeDisabled();
  });

  test(`${platform}: Input counts like Textarea and keeps clear for a one-character value`, async ({ page }) => {
    await openFixture(page, platform, '', 'input-design');
    const scope = page.getByTestId('counted'), input = scope.locator('input');
    await expect(scope.getByText('8/10')).toBeVisible();
    if (platform !== 'native') {
      const count = scope.locator('.kjun-input-count');
      expect(await input.getAttribute('aria-describedby')).toContain(await count.getAttribute('id'));
      await expect(count).toHaveCSS('font-size', '12px');
    }
    await input.fill('장기');
    await expect(scope.getByText('2/10')).toBeVisible();
    await input.fill('0');
    await expect(scope.getByRole('button', { name: '입력 지우기' })).toBeVisible();
  });

  test(`${platform}: plain SearchInput shows loading in the icon's place and passes its own attributes`, async ({ page }) => {
    await openFixture(page, platform, '', 'input-design');
    const scope = page.getByTestId('search-plain'), input = scope.locator('input');
    await expect(input).toHaveAttribute('enterkeyhint', 'search');
    await expect(input).toHaveAttribute('id', 'plain-search');
    const inset = await insetLeft(page, 'search-plain'), wide = await width(page, 'search-plain');
    await extras(page, { searchLoading: true });
    await expect(input).toHaveAttribute('aria-busy', 'true');
    await expect(scope.locator('svg').first()).toBeVisible();
    if (platform !== 'native') await expect(scope.locator('.kjun-spinner-glyph')).toHaveCount(1);
    expect(await insetLeft(page, 'search-plain')).toBe(inset);
    expect(await width(page, 'search-plain')).toBe(wide);
    await extras(page, { searchLoading: false });
    await expect(input).not.toHaveAttribute('aria-busy', 'true');
  });
}
