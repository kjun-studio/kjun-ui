import { test, expect, type Page } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import { openFixture } from './packed-fixture';

const configure = (page: Page, next: object) => page.evaluate(value => (window as any).configureToggle(value), next);
const reset = (page: Page) => page.evaluate(() => (window as any).resetToggleEvents());
const events = (page: Page) => page.getByTestId('events');
async function open(page: Page, platform: string) {
  await openFixture(page, platform, '', 'icon-toggle');
  await expect(events(page)).toBeVisible();
}
for (const platform of ['vue2', 'react', 'native']) {
  test(`${platform}: IconToggle is the only public icon toggle and remains controlled`, async ({ page }) => {
    await open(page, platform);
    const exports = await page.evaluate(() => (window as any).toggleExports);
    expect(exports).toContain('DsIconToggle');
    for (const name of ['DsCollectionToggle', 'DsFavoriteToggle', 'DsInterestToggle']) {
      expect(exports).not.toContain(name);
      expect(await readFile(`packages/${platform}/dist/index.d.ts`, 'utf8')).not.toContain(name);
    }
    const toggle = page.getByRole('button', { name: '예제 항목 관심 등록', exact: true });
    await expect(toggle).toHaveAttribute('aria-pressed', 'false');
    const inactive = await toggle.locator('svg').innerHTML();
    await toggle.click();
    await expect(events(page)).toHaveText('[["toggle",null]]');
    await expect(toggle).toHaveAttribute('aria-pressed', 'false');
    await configure(page, { active: true });
    const selected = page.getByRole('button', { name: '예제 항목 관심 해제', exact: true });
    await expect(selected).toHaveAttribute('aria-pressed', 'true');
    expect(await selected.locator('svg').innerHTML()).not.toBe(inactive);
    // Like RefreshButton, the visible name hint comes from DsTooltip and also opens on keyboard focus.
    if (platform !== 'native') await expect(selected).not.toHaveAttribute('title');
    // Re-enter by keyboard, as RefreshButton's spec does, so focus counts as keyboard modality.
    await selected.focus(); await page.keyboard.press('Tab'); await page.keyboard.press('Shift+Tab');
    await expect(page.getByRole('tooltip')).toContainText('예제 항목 관심 해제');
    await page.keyboard.press('Escape'); await expect(page.getByRole('tooltip')).toBeHidden();
    for (const key of ['Enter', 'Space']) {
      await reset(page); await selected.focus(); await page.keyboard.press(key);
      await expect(events(page)).toHaveText('[["toggle",null]]');
    }
  });

  test(`${platform}: disabled and loading block activation, preserve state and expose busy`, async ({ page }) => {
    await open(page, platform);
    const toggle = page.getByRole('button', { name: '예제 항목 관심 해제', exact: true });
    for (const blocked of [{ disabled: true, loading: false }, { disabled: false, loading: true }]) {
      await configure(page, { active: true, disabled: false, loading: false });
      await expect(toggle).toBeEnabled();
      await toggle.focus();
      await configure(page, { active: true, ...blocked });
      await expect(toggle).toBeDisabled();
      await expect(toggle).toHaveAttribute('aria-pressed', 'true');
      if (blocked.loading) await expect(toggle).toHaveAttribute('aria-busy', 'true');
      // Loading blocks activation but stays legible; only disabled dims.
      await expect(toggle).toHaveCSS('opacity', blocked.loading ? '1' : /^0\.\d+$/);
      await page.keyboard.press('Enter'); await page.keyboard.press('Space');
      await expect(events(page)).toHaveText('[]');
      await toggle.click({ force: true });
      await expect(events(page)).toHaveText('[]');
    }
    await configure(page, { loading: false, disabled: false });
    await expect(toggle).toBeEnabled();
    await expect(toggle).not.toHaveAttribute('aria-busy', 'true');
    await toggle.click(); await expect(events(page)).toHaveText('[["toggle",null]]');
  });

  test(`${platform}: MarketTable preserves action labels, colors, row payloads and loading`, async ({ page }) => {
    await open(page, platform);
    await configure(page, { favorite: [0], interest: ['b'] });
    const firstLabel = platform === 'vue2' ? '첫 항목' : '사용자 이름';
    const favorite = page.getByRole('button', { name: `${firstLabel} 즐겨찾기 해제`, exact: true });
    const interest = page.getByRole('button', { name: '둘째 항목 관심 해제', exact: true });
    for (const [button, color] of [[favorite, 'rgb(208, 136, 18)'], [interest, 'rgb(176, 51, 104)']] as const) {
      await expect(button).toHaveAttribute('aria-pressed', 'true');
      await expect.poll(() => button.locator('svg').evaluate((el, expected) =>
        [el, ...el.querySelectorAll('*')].some(node =>
          getComputedStyle(node).color === expected || getComputedStyle(node).fill === expected), color)).toBe(true);
    }
    await favorite.click(); await interest.click();
    await expect(events(page)).toHaveText('[["favorite",0],["interest","b"]]');
    await reset(page); await configure(page, { togglingFavorite: 0, togglingInterest: 'b' });
    await expect(favorite).toBeDisabled(); await expect(interest).toBeDisabled();
    await expect(favorite).toHaveAttribute('aria-busy', 'true');
    await favorite.click({ force: true }); await interest.click({ force: true });
    await expect(events(page)).toHaveText('[]');
    await configure(page, { togglingFavorite: null, togglingInterest: null, favorite: [], interest: [] });
    await expect(page.getByRole('button', { name: `${firstLabel} 즐겨찾기 등록`, exact: true })).toBeEnabled();
    await page.getByText(firstLabel, { exact: true }).click();
    await expect(events(page)).toHaveText('[["row",0]]');
  });
}
