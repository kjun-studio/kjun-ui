import { captureReview } from './review-captures';
import { test, expect, chromium } from '@playwright/test';
import { mkdtemp, mkdir, writeFile, rm } from 'node:fs/promises';
import { openFixture } from './packed-fixture';
import { box, middle, open, openSelect, state, option } from './visual-contract-helpers';

for (const platform of ['react', 'vue3', 'native']) {
  test(`${platform}: narrow containers preserve groups, actions and unclipped content`,async({page})=>{
    for(const width of [320,390,768,1280]) {
      await page.setViewportSize({width,height:1000});
      await openFixture(page,platform,'','visual-contract');
      const time=page.getByTestId('time'), parts=await time.locator('button').all();
      const bounds=await Promise.all(parts.map(box));
      for(const r of bounds.slice(0,3)) expect(Math.abs(middle(r)-middle(bounds[0]))).toBeLessThan(1);
      for(const id of ['quantity','quantity-block','time','card','card-dividers','bar','navigation']) {
        const node=page.getByTestId(id);expect(await node.evaluate(el=>el.scrollWidth<=el.clientWidth+1),id+' at '+width).toBe(true);
      }
      const bar=page.getByTestId('bar'), description=bar.getByText('변경한 내용을 모든 기기에 적용합니다.',{exact:true});
      const save=bar.getByRole('button',{name:'변경 사항 저장'});
      if(width<480) expect((await box(save)).y).toBeGreaterThanOrEqual((await box(description)).y+(await box(description)).height+11);
      else expect(Math.abs(middle(await box(description))-middle(await box(save)))).toBeLessThan(1);
      expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
      if([390,1280].includes(width)) await captureReview(page, {path:`artifacts/component-design-update/${platform}-${width}.png`,fullPage:true});
    }
  });

  test(`${platform}: recovery actions, loading label and popover content remain usable`,async({page})=>{
    await page.emulateMedia({reducedMotion:'reduce'});
    await openFixture(page,platform,'','visual-contract');
    const error=page.getByTestId('error'), retry=error.getByRole('button',{name:'다시 시도'});
    const message=error.getByText('목록을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.',{exact:true});
    expect((await box(retry)).y-(await box(message)).y-(await box(message)).height).toBeGreaterThanOrEqual(11);
    await retry.click();await expect(page.getByTestId('state')).toContainText('"retry":1');
    await expect(page.getByTestId('refresh-error')).toContainText('유지한 데이터');
    await expect(page.getByTestId('chart').getByText('차트를 불러오는 중',{exact:true})).toBeVisible();
    const trigger=page.getByRole('button',{name:'팝오버 열기'});await trigger.click();
    const run=page.getByRole('button',{name:'팝오버 실행'}), body=page.getByText('팝오버 내용',{exact:true});
    await expect(run).toBeVisible();
    expect((await box(run)).y-(await box(body)).y-(await box(body)).height).toBeGreaterThanOrEqual(11);
    await run.click();await expect(page.getByTestId('state')).toContainText('"retry":2');
    // Native web modal's platform Escape support is covered by the existing layer tests.
    if(platform!=='native') {await page.keyboard.press('Escape');await expect(run).not.toBeVisible();}
  });

  test(`${platform}: Card dividers and Popover noPadding provide explicit layout overrides`,async({page})=>{
    for(const noInset of [false,true]) {
      await openFixture(page,platform,noInset?'?no-inset':'','visual-contract');
      for(const id of ['card','card-dividers']) {
        const dimensions=await page.getByTestId(id).locator(':scope > div').first().evaluate(root=>{
          const sections=[...root.children].filter(el=>el.getAttribute('aria-hidden')!=='true');
          const header=sections[0],footer=sections[sections.length-1];
          const hs=getComputedStyle(header),fs=getComputedStyle(footer);
          return {headerBorder:hs.borderBottomWidth,footerBorder:fs.borderTopWidth,left:hs.paddingLeft,top:hs.paddingTop};
        });
        expect(dimensions.headerBorder).toBe(id==='card'?'0px':'1px');
        expect(dimensions.footerBorder).toBe(id==='card'?'0px':'1px');
        expect(dimensions.left).toBe(noInset?'0px':'16px');
        expect(dimensions.top).toBe(noInset?'0px':'16px');
      }
    }
    for(const noPadding of [false,true]) {
      await openFixture(page,platform,noPadding?'?no-padding':'','visual-contract');
      await page.getByRole('button',{name:'팝오버 열기'}).click();
      const run=page.getByRole('button',{name:'팝오버 실행'});
      await expect(run).toBeVisible();
      const content=run.locator('..');
      await expect(content).toHaveCSS('padding-top',noPadding?'0px':'16px');
      await expect(content).toHaveCSS('gap',noPadding?'0px':'12px');
    }
  });

  test(`${platform}: Popover width stays within the viewport and action bars use their own width`,async({page})=>{
    await page.setViewportSize({width:320,height:1000});
    for(const match of [false,true]) {
      await openFixture(page,platform,'?long'+(match?'&match-width':''),'visual-contract');
      const trigger=page.getByRole('button',{name:'팝오버 열기'}), triggerWidth=(await box(page.getByRole('button',{name:'팝오버 열기'}).locator('..'))).width;
      await trigger.click();
      const run=page.getByRole('button',{name:'팝오버 실행'});
      await expect(run).toBeVisible();
      const content=run.locator('..'), r=await box(content);
      expect(r.x).toBeGreaterThanOrEqual(8);expect(r.x+r.width).toBeLessThanOrEqual(312);
      const expected=match ? triggerWidth : 240;
      expect(Math.abs(r.width+2-expected)).toBeLessThanOrEqual(2);
      expect(await content.evaluate(el=>el.scrollWidth<=el.clientWidth+1)).toBe(true);
    }
    await page.setViewportSize({width:1280,height:1000});
    await openFixture(page,platform,'?narrow-bar','visual-contract');
    const bar=page.getByTestId('bar'), description=bar.getByText('변경한 내용을 모든 기기에 적용합니다.',{exact:true});
    const save=bar.getByRole('button',{name:'변경 사항 저장'});
    expect((await box(bar)).width).toBe(360);
    expect((await box(save)).y-(await box(description)).y-(await box(description)).height).toBeGreaterThanOrEqual(11);
  });

  test(`${platform}: skeleton roles, Empty hierarchy and narrow titles remain legible`, async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    for (const mode of ['', '&dark']) {
      await page.setViewportSize({ width: 375, height: 1000 }); await open(page, platform, '?roles' + mode);
      const field = page.getByTestId('form-md').locator(platform === 'native' ? ':scope > div > div > div:last-child' : '.kjun-skeleton-block, .kjun-skeleton-block');
      expect((await box(field)).width).toBeCloseTo((await box(page.getByTestId('form-md'))).width, 0);
      const shape = page.getByTestId('skeleton').locator(platform === 'native' ? ':scope > div > div' : '.kjun-skeleton-block, .kjun-skeleton-block');
      if (platform === 'native') await expect(shape).toHaveCSS('background-color', 'rgb(120, 154, 188)');
      else {
        const background = await shape.evaluate(el => getComputedStyle(el).backgroundImage);
        expect(background).toContain('rgb(120, 154, 188)'); expect(background).toContain('rgb(171, 205, 239)');
      }
      const empty = page.getByTestId('empty'), title = empty.getByText('항목이 없습니다', { exact: true });
      await expect(title).toHaveCSS('font-size', '16px'); await expect(title).toHaveCSS('font-weight', '600');
      const description = empty.getByText('조건을 바꾸거나 새 항목을 추가하세요.', { exact: true });
      await expect(description).toHaveCSS('font-size', '12px');
      expect((await box(empty.getByRole('button', { name: '추가' }))).y - (await box(description)).y - (await box(description)).height).toBeGreaterThanOrEqual(16);
      const titleNode = page.getByTestId('navigation').getByText('팀과 함께 관리하는 프로젝트의 상세 설정', { exact: true });
      expect(await titleNode.evaluate(el => {
        const text = el.firstChild!, index = text.textContent!.indexOf('프로젝트');
        const range = document.createRange(); range.setStart(text, index); range.setEnd(text, index + 4);
        return [...range.getClientRects()].length;
      })).toBe(1);
      await captureReview(page, { path: `artifacts/component-visual-fixes-20260915/${platform}-${mode ? 'dark' : 'light'}-375.png`, fullPage: true });
    }
    await page.setViewportSize({ width: 320, height: 1000 }); await open(page, platform, '?identifier');
    expect(await page.getByTestId('navigation').evaluate(el => el.scrollWidth <= el.clientWidth + 1)).toBe(true);
  });
}

test('updated component layouts remain usable at actual 200% browser zoom', async () => {
  const directory = await mkdtemp('/tmp/kjun-visual-zoom-');
  await mkdir(directory + '/Default');
  await writeFile(directory + '/Default/Preferences', JSON.stringify({ partition: { default_zoom_level: { x: Math.log(2) / Math.log(1.2) } } }));
  // Full Chromium reads page zoom preferences; the headless shell does not.
  const context = await chromium.launchPersistentContext(directory, { channel: 'chromium', headless: true, viewport: null, baseURL: process.env.KJUN_TEST_URL || 'http://127.0.0.1:4173', args: ['--window-size=1280,1000'], reducedMotion: 'reduce' });
  context.setDefaultTimeout(30000);
  try {
    const page = await context.newPage();
    for (const platform of ['react', 'vue3', 'native']) {
      await open(page, platform);
      expect(await page.evaluate(() => devicePixelRatio)).toBe(2);
      for (const id of ['navigation', 'form-md', 'empty', 'loaded', 'select']) expect(await page.getByTestId(id).evaluate(el => el.scrollWidth <= el.clientWidth + 1), platform + ' ' + id).toBe(true);
      await openSelect(page);
      const cherry = page.getByRole(platform === 'native' ? 'radio' : 'option', { name: '체리', exact: true });
      await expect(cherry).toBeVisible();
      await cherry.click(); await expect(page.getByTestId('state')).toContainText('"selected":"c"');
    }
  } finally { await context.close(); await rm(directory, { recursive: true, force: true }); }
});
