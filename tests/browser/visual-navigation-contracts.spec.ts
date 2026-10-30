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

  test(`${platform}: bottom navigation indicator follows selection without covering long labels`, async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 500 });
    await visit(page, platform, 'KjunBottomNavigation');
    await configure(page, 'KjunBottomNavigation', { long: true });
    const nav = page.getByRole('navigation', { name: '주요 탐색' });
    const activity = nav.getByRole('link', { name: /모든 프로젝트 활동 내역/ });
    await activity.click();
    await expect(activity).toHaveAttribute('aria-current', 'page');
    await expect(nav.locator('[aria-current="page"]')).toHaveCount(1);
    // The indicator hangs 4px under the selected label (not the item bottom), centered on it.
    const marker = await activity.evaluate((el, native) => {
      if (native) {
        const label = el.lastElementChild!, text = label.firstElementChild!, indicator = label.lastElementChild!;
        const css = getComputedStyle(indicator), box = indicator.getBoundingClientRect(), textBox = text.getBoundingClientRect();
        return { width: css.width, height: css.height, gap: Math.round(box.top - textBox.bottom), offCenter: Math.abs(Math.round(box.left + box.width / 2 - textBox.left - textBox.width / 2)), background: css.backgroundColor };
      }
      const label = el.querySelector('.kjun-navigation-label')!, css = getComputedStyle(label, '::after');
      return { width: css.width, height: css.height, gap: Math.round(parseFloat(css.top) - label.getBoundingClientRect().height), offCenter: 0, background: css.backgroundColor };
    }, platform === 'native');
    expect(marker).toMatchObject({ width: '20px', height: '3px', gap: 4, offCenter: 0 });
    expect(marker.background).not.toBe('rgba(0, 0, 0, 0)');
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(320);
    await captureReview(page, { path: `${output}/${platform}-bottom-long.png` });
    // CSS zoom exercises the same layout at twice its visual scale.
    await page.setViewportSize({ width: 780, height: 800 });
    await page.evaluate(() => { document.documentElement.style.zoom = '2'; });
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(780);
    await captureReview(page, { path: `${output}/${platform}-bottom-zoom200.png` });
  });
}
