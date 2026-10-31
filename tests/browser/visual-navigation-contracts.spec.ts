import { captureReview } from './review-captures';
import { test, expect } from '@playwright/test';
import { openFixture } from './packed-fixture';
import { box, output, configure, visit } from './visual-contract-helpers';

for (const platform of ['react', 'vue3', 'native']) {
  test(`${platform}: tabs and bottom navigation express selection without moving their contents`,async({page})=>{
    await openFixture(page,platform,'','visual-contract');
    const tabs=page.getByTestId('tabs'), first=tabs.getByRole('tab',{name:'활동',exact:false}), files=tabs.getByRole('tab',{name:'파일'});
    const before=await box(files);await files.click();
    await expect(files).toHaveAttribute('aria-selected','true');
    expect(await box(files)).toEqual(before);
    if(platform!=='native') {
      const indicator=tabs.locator('.kjun-tab-indicator');
      // The shared indicator follows the label width, centered under the selected tab.
      await expect.poll(async()=>{const r=await box(indicator),f=await box(files);return Math.abs(r.x+r.width/2-(f.x+f.width/2))<=1&&r.width>0&&r.width<=f.width;}).toBe(true);
      const line=await indicator.evaluate(el=>{const s=getComputedStyle(el);return {height:s.height,color:s.backgroundColor};});
      expect(line.height).toBe('2px');expect(line.color).not.toBe('rgba(0, 0, 0, 0)');
      await files.press('ArrowLeft');await expect(first).toHaveAttribute('aria-selected','true');
    }
    const nav=page.getByTestId('navigation'), home=nav.getByRole('link',{name:'홈',exact:true}), activity=nav.getByRole('link',{name:'활동',exact:true});
    await nav.scrollIntoViewIfNeeded();const r=await box(home);await activity.click();await expect(activity).toHaveAttribute('aria-current','page');expect(await box(home)).toEqual(r);
  });

  test(`${platform}: bottom navigation selection fills the icon without marks under long labels`, async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 500 });
    await visit(page, platform, 'KjunBottomNavigation');
    await configure(page, 'KjunBottomNavigation', { long: true });
    const nav = page.getByRole('navigation', { name: '주요 탐색' });
    const activity = nav.getByRole('link', { name: /모든 프로젝트 활동 내역/ });
    await activity.click();
    await expect(activity).toHaveAttribute('aria-current', 'page');
    await expect(nav.locator('[aria-current="page"]')).toHaveCount(1);
    // Selection swaps to the filled icon; nothing hangs under the long label.
    const fills = await nav.locator('svg').evaluateAll(all => all.map(svg => getComputedStyle(svg.querySelector('path')!).fill));
    expect(fills[0]).toBe('none');
    const label = activity.getByText(/모든 프로젝트 활동 내역/);
    const below = await activity.evaluate((el, text) => { const t = [...el.querySelectorAll('*')].find(n => n.textContent === text && !n.children.length)!.getBoundingClientRect();
      return [...el.querySelectorAll('*')].filter(n => { const r = n.getBoundingClientRect(); return r.top >= t.bottom && r.height > 0 && r.height <= 4; }).length; }, '모든 프로젝트 활동 내역');
    expect(below).toBe(0);
    await expect(label).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(320);
    await captureReview(page, { path: `${output}/${platform}-bottom-long.png` });
    // CSS zoom exercises the same layout at twice its visual scale.
    await page.setViewportSize({ width: 780, height: 800 });
    await page.evaluate(() => { document.documentElement.style.zoom = '2'; });
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(780);
    await captureReview(page, { path: `${output}/${platform}-bottom-zoom200.png` });
  });
}
