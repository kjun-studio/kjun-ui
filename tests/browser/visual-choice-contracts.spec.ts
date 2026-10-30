import { captureReview } from './review-captures';
import { test, expect } from '@playwright/test';
import { openFixture } from './packed-fixture';
import { box, open, openSelect, state, option } from './visual-contract-helpers';

for (const platform of ['react', 'vue3', 'native']) {
  test(`${platform}: vertical RadioGroup stays one column in a short container`,async({page})=>{
    // A grid parent stretches the group to a definite 96px height, the case where a wrapping column flexbox splits.
    test.skip(platform==='native','React Native Web has no grid parent to give the group a definite height');
    await openFixture(page,platform,'','visual-contract');
    const radios=page.getByTestId('radio-vertical').getByRole('radio');
    await expect(radios).toHaveCount(6);
    const xs=await radios.evaluateAll(els=>els.map(el=>Math.round(el.getBoundingClientRect().x)));
    expect(new Set(xs).size).toBe(1);
  });

  test(`${platform}: single-choice menu items are radios with a checked state`,async({page})=>{
    test.skip(platform==='native','Native already exposes radio items');
    await openFixture(page,platform,'','visual-contract');
    const trigger=page.getByRole('button',{name:'정렬 메뉴'});
    await trigger.focus(); await page.keyboard.press('Enter');
    await expect(page.getByRole('menuitemradio',{name:'최신순'})).toHaveAttribute('aria-checked','true');
    await expect(page.getByRole('menuitemradio',{name:'이름순'})).toHaveAttribute('aria-checked','false');
    await expect(page.getByRole('menuitemradio',{name:'최신순'})).toBeFocused();
    await page.getByRole('menuitem',{name:'정렬 초기화'}).click();
    await expect(page.getByTestId('state')).toContainText('"sortReset":true');
    await expect(page.getByTestId('state')).toContainText('"sortClicks":1');
    await expect(page.getByRole('menuitemradio')).toHaveCount(0);
  });

  test(`${platform}: a menu item that stops being single-choice drops its radio role`,async({page})=>{
    test.skip(platform==='native','Native already exposes radio items');
    await openFixture(page,platform,'','visual-contract');
    await page.getByRole('button',{name:'플립 메뉴'}).click();
    await expect(page.getByRole('menuitemradio',{name:'플립 항목'})).toHaveCount(1);
    await expect(page.getByTestId('state')).toContainText('"sortFlip":true');
    const item=page.getByRole('menuitem',{name:'플립 항목'});
    await expect(item).toHaveCount(1);
    await expect(item).not.toHaveAttribute('aria-checked',/.*/);
  });

  test(`${platform}: lighter menus preserve selected, disabled and dismissal states`, async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' }); await open(page, platform);
    await openSelect(page);
    const role = platform === 'native' ? 'radio' : 'option';
    const apple = page.getByRole(role, { name: '사과', exact: true }); await expect(apple).toBeVisible();
    expect((await box(apple)).height).toBeGreaterThanOrEqual(44);
    await expect(page.getByRole(role, { name: '배', exact: true })).toHaveAttribute('aria-disabled', 'true');
    const panel = await apple.evaluate(el => {
      let node: Element | null = el;
      while (node && getComputedStyle(node).boxShadow === 'none') node = node.parentElement;
      if (!node) return null;
      const s = getComputedStyle(node); return { shadow: s.boxShadow, radius: s.borderRadius };
    });
    // Field popups use 12px corners; general menu panels use 8px.
    expect(panel?.shadow).toContain('0px 2px 8px'); expect(panel?.radius).toBe('12px');
    await captureReview(page, { path: `artifacts/component-visual-fixes-20260915/${platform}-select-open.png` });
    await page.getByRole(role, { name: '체리', exact: true }).click();
    await expect(page.getByTestId('state')).toContainText('"selected":"c"'); await expect(apple).toHaveCount(0);
    await page.getByRole('button', { name: '메뉴 열기', exact: true }).click();
    const item = page.getByRole('menuitem', { name: '메뉴 항목', exact: true }); await expect(item).toBeVisible();
    expect((await box(item)).height).toBeGreaterThanOrEqual(44);
    await page.keyboard.press('Escape'); await expect(item).toHaveCount(0);
    await expect(page.getByRole('button', { name: '메뉴 열기', exact: true })).toBeFocused();
  });
}
