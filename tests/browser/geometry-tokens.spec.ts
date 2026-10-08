import { test, expect, chromium, type Page, type Locator } from '@playwright/test';
import { mkdtemp, mkdir, writeFile, rm } from 'node:fs/promises';
import { openFixture } from './packed-fixture';
import { tokens } from '../../packages/tokens/dist/index.js';
const platforms = ['react','vue2','native'];
const outer = (page: Page,id:string) => page.getByTestId(id).locator(':scope > *').first();
const px = (value:number) => value+'px';
async function geometry(node:Locator,expected:Record<string,string>){for(const [property,value] of Object.entries(expected))await expect(node).toHaveCSS(property,value);}
const tableCard=(page:Page,platform:string)=>platform==='native'?page.getByTestId('table').locator('[tabindex]').first():page.getByTestId('table').locator(platform==='vue2'?'.ds-table-card':'.kjun-table-card').first();
for (const platform of platforms) {
  test(`${platform}: packed geometry roles propagate through all component families`,async({page}, testInfo)=>{
    await page.setViewportSize({width:1280,height:1100});await page.emulateMedia({reducedMotion:'reduce'});
    await openFixture(page,platform,'','geometry-review');
    const e=tokens.extensions;
    await geometry(outer(page,'badge'),{'border-radius':px(e.badge.radius),'padding-top':px(e.badge.padding.xs.y),'padding-left':px(e.badge.padding.xs.x)});
    await geometry(outer(page,'chip'),{'border-radius':px(e.chip.radius),'padding-top':px(e.chip.paddingY),'padding-left':px(e.chip.paddingX)});
    await geometry(outer(page,'navigation').locator(':scope > *').first(),{'padding-left':px(e.topNavigation.paddingX),'gap':px(e.topNavigation.gap)});
    await geometry(outer(page,'list').locator(':scope > *').first(),{'padding-top':px(e.list.padding),'gap':px(e.list.gap)});
    await geometry(outer(page,'actionbar'),{'padding-left':px(e.navigation.padding),'padding-bottom':px(e.navigation.padding+7)});
    await geometry(outer(page,'card').locator(':scope > *').first(),{'padding-left':px(tokens.card.padding.md),'padding-bottom':px(tokens.card.padding.md)});
    await geometry(outer(page,'hero'),{'padding-left':px(e.kpiHero.md.paddingX),'padding-top':px(e.kpiHero.md.paddingY),'border-radius':px(e.kpiHero.radius)});
    await geometry(outer(page,'hero-sm'),{'padding-left':px(e.kpiHero.sm.paddingX),'padding-top':px(e.kpiHero.sm.paddingY)});
    await geometry(outer(page,'row'),{'padding-left':px(e.kpiRow.md.paddingX),'padding-top':px(e.kpiRow.md.paddingY),'border-radius':px(e.kpiRow.radius)});
    await geometry(outer(page,'alert'),{'padding-left':px(e.alert.md.paddingX),'padding-top':px(e.alert.md.paddingY),'border-radius':px(e.alert.radius)});
    const skeleton=platform==='native'?outer(page,'skeleton').locator(':scope > *').first():page.getByTestId('skeleton').locator(platform==='vue2'?'.ds-skeleton-card':'.kjun-skeleton-card');
    await geometry(skeleton,{'padding-left':px(e.skeleton.padding),'border-radius':px(e.skeleton.radius)});
    await page.setViewportSize({width:390,height:1100});
    await geometry(tableCard(page,platform),{'padding-left':px(e.tableCard.padding),'border-radius':px(e.tableCard.radius)});
    await page.getByRole('button',{name:'패널 열기',exact:true}).click();
    const drawer=page.locator(platform==='react'?'.kjun-drawer':platform==='vue2'?'.ds-drawer-panel':'[aria-label="검사 패널"]');
    await geometry(drawer,{'border-top-left-radius':px(e.drawer.bottomRadius),'border-top-right-radius':px(e.drawer.bottomRadius),'border-bottom-left-radius':px(e.drawer.radius)});
    await geometry(platform==='react'?drawer.locator('.kjun-drawer-header'):drawer.locator(':scope > *').first(),{'padding-left':px(e.drawer.paddingX),'padding-top':px(e.drawer.paddingY)});
    await expect(drawer).toHaveCSS('box-shadow',new RegExp(`${tokens.extensions.drawer.elevation[0].blurRadius}px`));
    await drawer.screenshot({path: testInfo.outputPath(`${platform}-drawer.png`)});
    await page.keyboard.press('Escape');await expect(drawer).toBeHidden();
    await page.getByRole('button',{name:'대화상자 열기',exact:true}).click();
    if(platform!=='native')await geometry(page.locator(platform==='react'?'.kjun-modal-overlay':'.ds-modal-overlay'),{'padding-left':px(tokens.modal.mobileInset)});
    else {
      const panel=page.locator('[aria-label="검사 대화상자"]');
      await expect(panel).toBeVisible();
      await expect.poll(async()=>Math.round((await panel.boundingBox())!.x)).toBe(tokens.modal.mobileInset);
    }
    await page.keyboard.press('Escape');
    await page.evaluate(()=>(window as any).geometryToast());
    const toast=platform==='native'?page.getByRole('alert').filter({hasText:'검사 토스트'}):page.locator('.kjun-toast');
    await geometry(toast,{'padding-left':px(e.toast.padding),'gap':px(e.toast.gap),'border-radius':px(e.toast.radius)});
    await toast.getByRole('button',{name:'토스트 실행',exact:true}).click();
    await expect(page.getByTestId('events')).toHaveText('1'); await expect(toast).toBeHidden();
    await page.evaluate(()=>(window as any).geometryToast());
    await toast.getByRole('button',{name:'알림 닫기',exact:true}).click(); await expect(toast).toBeHidden();
  });
  test(`${platform}: geometry remains usable with long content and narrow containers`,async({page}, testInfo)=>{
    await page.emulateMedia({reducedMotion:'reduce'});await openFixture(page,platform,'','geometry-review');
    await page.evaluate(()=>(window as any).geometryLong());
    for(const width of [320,390,768,1280]){
      await page.setViewportSize({width,height:1200});
      await expect.poll(()=>page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
      for(const id of ['badge','chip','navigation','list','actionbar','card','hero','hero-sm','row','row-sm','row-summary','alert','table'])
        await expect.poll(()=>page.getByTestId(id).evaluate(el=>el.scrollWidth<=el.clientWidth+1),{message:id+' fits at '+width}).toBe(true);
    }
    await page.setViewportSize({width:390,height:1000});
    await page.screenshot({path: testInfo.outputPath(`${platform}-long-390.png`),fullPage:true});
    await page.getByTestId('chip').screenshot({path: testInfo.outputPath(`${platform}-chip.png`)});
    await page.getByTestId('row-sm').screenshot({path: testInfo.outputPath(`${platform}-kpi-narrow.png`)});
    await page.getByRole('button',{name:'칩 삭제',exact:true}).click();await expect(page.getByTestId('removable').locator(':scope > *')).toHaveCount(0);
    await page.getByRole('button',{name:'하단 실행',exact:true}).press('Enter');await expect(page.getByTestId('events')).toHaveText('2');
    await page.getByTestId('list').getByRole('button').press('Enter');
    await expect(page.getByTestId('events')).toHaveText('3');
    await tableCard(page,platform).click(); await expect(page.getByTestId('events')).toHaveText('4');
    const opener=page.getByRole('button',{name:'패널 열기',exact:true});await opener.click();await page.keyboard.press('Escape');await expect(opener).toBeFocused();
    const modalOpener=page.getByRole('button',{name:'대화상자 열기',exact:true});await modalOpener.click();await page.keyboard.press('Escape');await expect(modalOpener).toBeFocused();
  });
}

test('geometry fits at actual 200% browser zoom on all three platforms',async({}, testInfo)=>{
  test.setTimeout(180000);const directory=await mkdtemp('/tmp/kjun-geometry-zoom-');await mkdir(directory+'/Default');
  await writeFile(directory+'/Default/Preferences',JSON.stringify({partition:{default_zoom_level:{x:Math.log(2)/Math.log(1.2)}}}));
  const context=await chromium.launchPersistentContext(directory,{channel:'chromium',headless:true,viewport:null,baseURL:process.env.KJUN_TEST_URL||'http://127.0.0.1:4173',args:['--window-size=780,1100']});
  try{for(const platform of platforms){const page=await context.newPage();await openFixture(page,platform,'','geometry-review');await page.evaluate(()=>(window as any).geometryLong());
    expect(await page.evaluate(()=>devicePixelRatio)).toBeGreaterThanOrEqual(2);
    expect(await page.evaluate(()=>innerWidth)).toBeLessThan(500);
    await expect.poll(()=>page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
    for(const id of ['card','chip','hero','row-sm'])await expect.poll(()=>page.getByTestId(id).evaluate(el=>el.scrollWidth<=el.clientWidth+1)).toBe(true);
    await page.screenshot({path: testInfo.outputPath(`${platform}-zoom-200.png`),fullPage:true});
    await page.close();}
  }finally{await context.close();await rm(directory,{recursive:true,force:true});}
});
