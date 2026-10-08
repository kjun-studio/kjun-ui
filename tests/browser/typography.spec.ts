import { test, expect, chromium } from '@playwright/test';
import { mkdtemp, mkdir, writeFile, rm } from 'node:fs/promises';
import { openFixture } from './packed-fixture';
import { tokens } from '../../packages/tokens/dist/index.js';
const textStyle = async (node: import('@playwright/test').Locator, ownText = false) => node.evaluate((el, ownText) => {
  const walker=document.createTreeWalker(el,NodeFilter.SHOW_TEXT);
  let text; while(text=walker.nextNode()) if(text.textContent?.trim() && (!ownText || text.parentElement===el)) {
    const parent=text.parentElement!, s=getComputedStyle(parent);
    return {size:s.fontSize,line:s.lineHeight,weight:s.fontWeight,tracking:s.letterSpacing,color:s.color};
  }
  throw Error('No text in fixture');
}, ownText);
for(const platform of ['react','vue2','native']) {
  test(`${platform}: packed typography, geometry, foreground and focus roles`,async({page}, testInfo)=>{
    await openFixture(page,platform,'','typography');
    expect((await textStyle(page.getByTestId('body'))).size).toBe(tokens.typography.body.fontSizePx+'px');
    expect((await textStyle(page.getByTestId('body')))).toMatchObject({line:tokens.typography.body.lineHeightPx+'px',weight:String(tokens.typography.body.fontWeight)});
    for(const size of ['xs','sm','md','lg','xl'] as const) {
      const button=page.getByRole('button',{name:'버튼 '+size,exact:true});
      expect((await textStyle(button)).size).toBe(tokens.button.fontSizes[size]+'px');
      expect((await textStyle(button))).toMatchObject({line:tokens.button.typography[size].lineHeightPx+'px',weight:String(tokens.button.typography[size].fontWeight)});
      expect((await button.boundingBox())!.height).toBe(tokens.button.heights[size]);
    }
    for(const size of ['sm','md','lg'] as const) {
      const input=page.getByRole('textbox',{name:'입력 '+size});
      await expect(input).toHaveCSS('font-size',tokens.input[size as keyof typeof tokens.input].fontSize+'px');
      expect(await input.evaluate(el=>getComputedStyle(el,'::placeholder').fontSize)).toBe(tokens.input[size as keyof typeof tokens.input].placeholderSize+'px');
      await input.fill('입력 ABC'); await expect(input).toHaveCSS('font-size',tokens.input[size as keyof typeof tokens.input].fontSize+'px');
      expect((await input.boundingBox())!.height).toBe(tokens.input[size].height);
    }
    const card=page.getByTestId('card').locator(':scope > *').first();
    await expect(card).toHaveCSS('border-top-left-radius',tokens.card.radii.md+'px');
    await expect(card.locator(':scope > *').first()).toHaveCSS('padding-top',tokens.card.padding.md+'px');
    expect(await card.evaluate(el=>getComputedStyle(el).boxShadow)).toContain(tokens.card.elevation.raised[0].blurRadius+'px');
    expect((await textStyle(page.getByText('카드 제목',{exact:true})))).toMatchObject({size:tokens.typography.cardTitle.fontSizePx+'px',line:tokens.typography.cardTitle.lineHeightPx+'px',weight:String(tokens.typography.cardTitle.fontWeight)});
    for(const [variant,color] of [['primary','rgb(170, 187, 204)'],['danger','rgb(187, 204, 221)'],['success','rgb(204, 221, 238)'],['warning','rgb(17, 34, 51)']])
      expect((await textStyle(page.getByRole('button',{name:'색상 '+variant,exact:true}))).color).toBe(color);
    await page.getByRole('button',{name:'버튼 xs',exact:true}).focus();
    await page.keyboard.press('Tab');
    await expect(page.getByRole('button',{name:'버튼 sm',exact:true})).toHaveCSS('outline-color','rgb(255, 0, 255)');
    await page.getByRole('button',{name:'열기',exact:true}).click();
    expect(await textStyle(page.getByText('토큰 모달',{exact:true}))).toMatchObject({size:tokens.modal.titleSize+'px',line:tokens.modal.titleLineHeight+'px',weight:String(tokens.modal.titleWeight)});
    await page.evaluate(()=>(window as any).updateTokenPalette());
    expect((await textStyle(page.getByRole('button',{name:'모달 버튼',exact:true}))).color).toBe('rgb(255, 255, 255)');
    await page.getByRole('button',{name:'모달 버튼',exact:true}).focus();
    await page.keyboard.press('Tab'); await page.keyboard.press('Shift+Tab');
    await expect(page.getByRole('button',{name:'모달 버튼',exact:true})).toHaveCSS('outline-color','rgb(0, 119, 0)');
    await page.keyboard.press('Escape');
    await expect(page.getByRole('button',{name:'모달 버튼',exact:true})).toHaveCount(0);
    await page.getByRole('button',{name:'서랍 열기',exact:true}).click();
    expect(await textStyle(page.getByText('토큰 서랍',{exact:true}))).toMatchObject({size:'20px',line:'28px',weight:'700',tracking:'-0.2px'});
    await page.keyboard.press('Escape');
    await expect(page.getByRole('button',{name:'서랍 버튼',exact:true})).toHaveCount(0);
  });
  test(`${platform}: all input families use input metrics and options use body metrics`,async({page}, testInfo)=>{
    await openFixture(page,platform,'','typography');
    for(const size of ['sm','md','lg'] as const) {
      const fields=page.getByTestId('fields-'+size);
      const inputMetrics = {size:tokens.input[size].fontSize+'px',line:tokens.input[size].lineHeight+'px',weight:String(tokens.typography.input.fontWeight)};
      for(const input of await fields.locator('input, textarea').all()) {
        await expect(input).toHaveCSS('font-size',tokens.input[size as keyof typeof tokens.input].fontSize+'px');
        await expect(input).toHaveCSS('line-height',tokens.input[size].lineHeight+'px');
        expect(await input.evaluate(el=>getComputedStyle(el,'::placeholder').fontSize)).toBe(tokens.input[size as keyof typeof tokens.input].placeholderSize+'px');
      }
      expect((await textStyle(fields.getByText('선택 값',{exact:true})))).toMatchObject(inputMetrics);
      for (const text of ['2026. 09. 16.','미정']) expect(await textStyle(fields.getByText(text,{exact:true}))).toMatchObject(inputMetrics);
      const trigger=fields.getByRole(platform === 'vue2' ? 'combobox' : 'button',{name:'선택 '+size,exact:true});
      await trigger.scrollIntoViewIfNeeded();
      // Vue dismisses popups on page scroll; let the scripted scroll settle before opening.
      await page.evaluate(() => new Promise<void>(resolve => requestAnimationFrame(() => requestAnimationFrame(() => resolve()))));
      await trigger.focus();
      await trigger.press(platform === 'native' ? 'Enter' : 'ArrowDown');
      expect((await textStyle(page.getByRole(platform === 'native' ? 'radio' : 'option',{name:'다른 옵션',exact:true})))).toMatchObject({size:tokens.typography.body.fontSizePx+'px',line:tokens.typography.body.lineHeightPx+'px'});
      await expect(page.getByRole(platform === 'native' ? 'radio' : 'option',{name:'선택 값',exact:true})).toHaveCSS('background-color','rgb(238, 221, 238)');
      if(platform === 'react') await expect(page.getByRole('option',{name:'선택 값',exact:true})).toHaveCSS('outline-color','rgb(255, 0, 255)');
      await page.keyboard.press('Escape');
      await expect(page.getByRole(platform === 'native' ? 'radio' : 'option',{name:'다른 옵션',exact:true})).toHaveCount(0);
    }
  });
  test(`${platform}: nested inputs and selected brand controls use semantic roles`,async({page}, testInfo)=>{
    await page.setViewportSize({width:1280,height:1100});
    await openFixture(page,platform,'','typography');
    const pagination=page.getByTestId('pagination');
    const selected=[pagination.getByText('1',{exact:true}).filter({visible:true}),page.getByTestId('market-cards').getByRole('button',{name:'선택 지표',exact:true})];
    for(const node of selected) await expect.poll(async()=>(await textStyle(node)).color).toBe('rgb(170, 187, 204)');
    if(platform==='native') {
      expect(await textStyle(pagination.getByText('20개씩',{exact:true}))).toMatchObject({size:'16px',line:'24px'});
      await page.getByRole('button',{name:'날짜 sm',exact:true}).click();
      await expect.poll(async()=>(await textStyle(page.getByRole('button',{name:'2026-09-16',exact:true}))).color).toBe('rgb(170, 187, 204)');
    } else {
      const select=pagination.getByRole(platform === 'vue2' ? 'combobox' : 'button',{name:'페이지당 항목 수'});
      await expect(select).toHaveCSS('font-size','16px');
      expect((await select.boundingBox())!.height).toBe(tokens.input.sm.height);
      await select.scrollIntoViewIfNeeded();
      await page.evaluate(() => new Promise<void>(resolve => requestAnimationFrame(() => requestAnimationFrame(() => resolve()))));
      await select.click();
      await expect(page.getByRole('option').first()).toHaveCSS('font-size','14px');
      await page.keyboard.press('Escape');
    }
    await page.evaluate(()=>(window as any).updateTokenPalette());
    for(const node of selected) await expect.poll(async()=>(await textStyle(node)).color).toBe('rgb(255, 255, 255)');
    if(platform==='native') {
      await expect.poll(async()=>(await textStyle(page.getByRole('button',{name:'2026-09-16',exact:true}))).color).toBe('rgb(255, 255, 255)');
      await page.keyboard.press('Escape');
    } else {
      await page.evaluate(()=>document.documentElement.style.fontSize='20px');
      expect(await textStyle(page.getByTestId('fields-sm').getByText('2026. 09. 16.',{exact:true}))).toMatchObject({size:'20px',line:'30px'});
      await expect(pagination.getByRole(platform === 'vue2' ? 'combobox' : 'button',{name:'페이지당 항목 수'})).toHaveCSS('font-size','20px');
    }
  });
  test(`${platform}: KPI stages and narrow layouts`,async({page}, testInfo)=>{
    for(const width of [320,390,768,1280]) {
      await page.setViewportSize({width,height:1100});await openFixture(page,platform,'','typography');
      const hero=page.getByTestId('hero').getByText('1,234,567,890',{exact:true});
      expect((await textStyle(hero))).toMatchObject({size:width<=640?'32px':'40px',line:width<=640?'40px':'48px',weight:'700',tracking:width<=640?'-0.64px':'-0.8px'});
      expect((await textStyle(page.getByTestId('hero').getByText('₩',{exact:true})))).toMatchObject({size:width<=640?'16px':'20px'});
      expect((await textStyle(page.getByTestId('hero-small').getByText('USD',{exact:true})))).toMatchObject({size:'14px'});
      expect((await textStyle(page.getByTestId('hero-small').getByText('23,456',{exact:true}))).size).toBe('24px');
      expect((await textStyle(page.getByTestId('row').getByText('12,345',{exact:true}))).size).toBe(width<=768?'20px':'24px');
      const summary=page.getByTestId('row-summary');
      expect(await textStyle(summary.getByText(/USD\s*54,321$/),true)).toMatchObject({size:'24px',line:'32px',weight:'700'});
      expect(await textStyle(summary.getByText('USD',{exact:true}))).toMatchObject({size:'14px',line:'20px',weight:'500'});
      expect(await textStyle(summary.getByText(/678\s*개$/),true)).toMatchObject({size:width<=768?'14px':'24px',line:width<=768?'20px':'32px'});
      expect(await textStyle(summary.getByText('개',{exact:true}))).toMatchObject({size:width<=768?'12px':'14px',line:width<=768?'16px':'20px'});
      expect(await textStyle(summary.getByText(/항목\s*전체 내역$/),true)).toMatchObject({size:'14px',line:'20px',weight:'400'});
      expect(await textStyle(summary.getByText('항목',{exact:true}))).toMatchObject({size:'12px',line:'16px',weight:'400'});
      expect(await textStyle(page.getByTestId('row-small').getByText(/9,876\s*EUR$/),true)).toMatchObject({size:'20px',line:'28px'});
      expect(await textStyle(page.getByTestId('row-small').getByText('EUR',{exact:true}))).toMatchObject({size:'12px',line:'16px'});
      expect((await textStyle(page.getByText('작은 배지',{exact:true})))).toMatchObject({size:'12px',line:'16px',weight:'600'});
      expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
      const delta=page.getByTestId('hero-delta');
      for (const text of ['+EUR1,234','+2.5%']) {
        await expect(delta.getByText(text,{exact:true})).toBeVisible();
        expect(await textStyle(delta.getByText(text,{exact:true}))).toMatchObject({size:'16px',line:'24px',weight:'600'});
      }
      for (const unit of ['%','JPY']) expect(await textStyle(delta.getByText(unit,{exact:true}))).toMatchObject({size:'12px',line:'16px'});
      expect(await textStyle(delta.getByText('+EUR1,234',{exact:true}).getByText('EUR',{exact:true}))).toMatchObject({size:'12px',line:'16px'});
      const narrow=page.getByTestId('narrow');
      expect(await narrow.evaluate(el=>el.scrollWidth<=el.clientWidth), JSON.stringify(await narrow.evaluate(el=>Array.from(el.querySelectorAll('*')).filter(node=>node.getBoundingClientRect().right>el.getBoundingClientRect().right+1).map(node=>({text:node.textContent?.slice(0,60),width:node.getBoundingClientRect().width,style:(node as HTMLElement).style.cssText}))))).toBe(true);
      const longText=narrow.getByText('긴 한국어와 English description that must remain fully readable in a narrow container',{exact:true});
      expect(await longText.evaluate(el=>el.scrollHeight<=el.clientHeight+1)).toBe(true);
      if(width===390 || width===1280) {
        await page.screenshot({path: testInfo.outputPath(`${platform}-${width}.png`),fullPage:true});
        await narrow.screenshot({path: testInfo.outputPath(`${platform}-narrow-${width}.png`)});
      }
    }
  });
}

test('typography stays usable at actual 200% browser zoom',async({}, testInfo)=>{
  test.setTimeout(120000);
  const directory=await mkdtemp('/tmp/kjun-type-zoom-');await mkdir(directory+'/Default');
  await writeFile(directory+'/Default/Preferences',JSON.stringify({partition:{default_zoom_level:{x:Math.log(2)/Math.log(1.2)}}}));
  const context=await chromium.launchPersistentContext(directory,{channel:'chromium',headless:true,viewport:null,baseURL:process.env.KJUN_TEST_URL||'http://127.0.0.1:4173',args:['--window-size=780,1100']});
  try {
    const page=context.pages()[0];
    for(const platform of ['react','vue2','native']) {
      await openFixture(page,platform,'','typography');
      expect(await page.evaluate(()=>({ratio:devicePixelRatio,width:innerWidth}))).toEqual({ratio:2,width:390});
      await page.getByRole('textbox',{name:'입력 md'}).fill('확대한 화면의 입력');
      await expect(page.getByRole('textbox',{name:'입력 md'})).toHaveValue('확대한 화면의 입력');
      expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
      await page.getByRole('button',{name:'열기',exact:true}).click();
      await expect(page.getByRole('button',{name:'모달 버튼',exact:true})).toBeVisible();
      const cdp=await context.newCDPSession(page);
      const screenshot=await cdp.send('Page.captureScreenshot',{format:'png',captureBeyondViewport:false});
      await mkdir(testInfo.outputDir,{recursive:true});
      await writeFile(testInfo.outputPath(`${platform}-zoom-200.png`),Buffer.from(screenshot.data,'base64'));
      await cdp.detach();
    }
  } finally {await context.close();await rm(directory,{recursive:true,force:true});}
});
