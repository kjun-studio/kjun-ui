import { test, expect } from '@playwright/test';
import { tokens } from '../../packages/tokens/dist/index.js';
import { openFixture } from './packed-fixture';
import { box, chartPart, chartRoot } from './visual-contract-helpers';

for (const platform of ['react', 'vue3', 'native']) {
  test(`${platform}: chart loading labels remain clear without animation and can be hidden`,async({page})=>{
    await page.emulateMedia({reducedMotion:'reduce'});
    for(const kind of ['frame','donut','matrix']) {
      await openFixture(page,platform,'?kind='+kind,'visual-contract');
      await expect(page.getByTestId('chart').getByRole('status')).toHaveText('차트를 불러오는 중');
    }
    await openFixture(page,platform,'?no-text','visual-contract');
    await expect(page.getByTestId('chart').getByText('차트를 불러오는 중',{exact:true})).toHaveCount(0);
    await expect(page.getByTestId('chart').getByRole('status')).toHaveCount(0);
  });

  test(`${platform}: chart skeleton frame draws only a non-scaling chart-grid frame`,async({page})=>{
    await page.emulateMedia({reducedMotion:'reduce'});
    for(const width of [320,760]) {
      await openFixture(page,platform,`?kind=frame&chart-width=${width}`,'visual-contract');
      const plot=chartPart(page,'plot');
      await expect(plot).toHaveAttribute('aria-hidden','true');
      await expect(plot.locator('path')).toHaveCount(1);
      await expect(plot.locator('rect')).toHaveCount(0);
      const path=plot.locator('path');
      expect(await path.evaluate(el=>getComputedStyle(el).vectorEffect)).toBe('non-scaling-stroke');
      expect(await path.evaluate(el=>getComputedStyle(el).strokeWidth)).toBe('1px');
      if(platform!=='native') expect(await path.getAttribute('stroke')).toBe('var(--_kjun-color-chart-grid)');
    }
  });

  test(`${platform}: chart skeleton frame keeps a width inside a shrink-to-fit parent`,async({page})=>{
    test.skip(platform==='native','inline-block parents are a web layout case');
    await openFixture(page,platform,'?kind=frame&chart-shrink','visual-contract');
    expect((await box(chartRoot(page))).width).toBeGreaterThan(100);
  });

  test(`${platform}: chart skeleton draws a frame for a removed kind and names it frame`,async({page})=>{
    await openFixture(page,platform,'?kind=line','visual-contract');
    await expect(chartRoot(page)).toHaveAttribute('data-kjun-chart-kind','frame');
    await expect(chartPart(page,'plot')).toHaveCount(1);
  });

  test(`${platform}: chart skeleton status is a polite live region`,async({page})=>{
    test.skip(platform!=='native','role="status" is already polite on the web; Native needs an explicit live region');
    await openFixture(page,platform,'?kind=frame','visual-contract');
    await expect(chartPart(page,'status')).toHaveAttribute('aria-live','polite');
  });

  test(`${platform}: chart skeleton matrix draws rows × columns round cells`,async({page})=>{
    await page.emulateMedia({reducedMotion:'reduce'});
    for(const width of [320,760]) {
      await openFixture(page,platform,`?kind=matrix&rows=3&columns=5&chart-width=${width}`,'visual-contract');
      await expect(chartPart(page,'cell')).toHaveCount(15);
      await expect(chartPart(page,'plot')).toHaveCount(0);
      // A stretched SVG rect turned this corner elliptical ("4px 2px"); a CSS/View cell keeps it round.
      const radius=await chartPart(page,'cell').first().evaluate(el=>getComputedStyle(el).borderTopLeftRadius);
      expect(radius.split(' ').every(v=>v===`${tokens.extensions.skeleton.lineRadius}px`)).toBe(true);
    }
    await openFixture(page,platform,'?kind=matrix&rows=0&columns=2.5','visual-contract');
    await expect(chartPart(page,'cell')).toHaveCount(2);
  });

  test(`${platform}: chart skeleton donut keeps its label inside the hole`,async({page})=>{
    await page.emulateMedia({reducedMotion:'reduce'});
    await openFixture(page,platform,'?kind=donut','visual-contract');
    const donut=chartPart(page,'donut');
    await expect(donut.locator('*')).toHaveCount(0);
    const ring=await box(donut), label=await box(chartPart(page,'status').getByText('차트를 불러오는 중',{exact:true}));
    const hole=ring.height-2*tokens.extensions.chartSkeleton.donutThickness;
    expect(label.width).toBeLessThanOrEqual(hole+1);
    expect(label.height).toBeLessThanOrEqual(hole+1);
    expect(Math.abs(label.x+label.width/2-(ring.x+ring.width/2))).toBeLessThanOrEqual(1);
  });

  test(`${platform}: chart skeleton spinner mode and loading delay keep the height`,async({page})=>{
    await page.emulateMedia({reducedMotion:'reduce'});
    await openFixture(page,platform,'?spinner','visual-contract');
    await expect(chartPart(page,'loading')).toBeVisible();
    // The chart's status carries the text; the spinner inside it is decorative so nothing is announced twice.
    await expect(page.getByTestId('chart').getByRole('status')).toHaveCount(1);
    await expect(page.getByTestId('chart').getByRole('status')).toHaveText('차트를 불러오는 중');
    await expect(chartPart(page,'plot')).toHaveCount(0);
    expect((await box(chartRoot(page))).height).toBe(180);
    await openFixture(page,platform,'?spinner&no-text','visual-contract');
    await expect(chartPart(page,'loading')).toBeVisible();
    await expect(page.getByTestId('chart').getByRole('status')).toHaveCount(0);
    await openFixture(page,platform,'?delay=4000','visual-contract');
    expect((await box(chartRoot(page))).height).toBe(180);
    await expect(page.getByTestId('chart').getByRole('status')).toHaveCount(0);
    await expect(page.getByTestId('chart').getByRole('status')).toHaveText('차트를 불러오는 중',{timeout:15000});
  });
}
