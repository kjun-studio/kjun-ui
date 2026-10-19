import { mkdtemp, mkdir, writeFile, rm } from 'node:fs/promises';
import { test, expect, chromium, type Locator, type Page } from '@playwright/test';
import { presetConfig } from '../../shared/example-registry';
import { openFixture } from './packed-fixture';
import { tokens } from '../../packages/tokens/dist/index.js';
const box = async (node:Locator) => (await node.boundingBox())!;
const chartPart = (page:Page, name:string) => page.getByTestId('chart').locator(`[data-kjun-chart-part="${name}"]`);
const chartRoot = (page:Page) => page.getByTestId('chart').locator('[data-kjun-chart-kind]');
const middle = (r:{y:number;height:number}) => r.y + r.height/2;
for(const platform of ['react','vue3','native']) {
  test(`${platform}: compound controls retain their geometry, width options and number interactions`,async({page})=>{
    for(const [size,height] of [['sm',32],['md',40],['lg',48]] as const) {
      await page.setViewportSize({width:768,height:1000});
      await openFixture(page,platform,'?size='+size,'visual-contract');
      await expect(page.getByTestId('quantity')).toBeVisible();
      const quantity=page.getByTestId('quantity'), input=quantity.getByRole('spinbutton');
      await expect(input).toHaveValue('2');
      const controls=[await box(input),...await Promise.all((await quantity.getByRole('button').all()).map(box))];
      for(const r of controls) {expect(r.height).toBe(height);expect(Math.abs(middle(r)-middle(controls[0]))).toBeLessThan(1);}
      await expect(input).toHaveCSS('font-size','16px');
      // Native touch layouts wrap each part in a 44px target; fine pointers keep the visible control height, like Web.
      if(platform==='native') { const target=await page.evaluate(()=>matchMedia('(pointer: coarse)').matches)?44:height; for(const control of [input,...await quantity.getByRole('button').all()]) expect((await box(control.locator('..'))).height).toBeGreaterThanOrEqual(target); }
      expect((await box(page.getByTestId('quantity-block').getByRole('spinbutton'))).width).toBeGreaterThan(controls[0].width);
      await quantity.getByRole('button',{name:'수량 늘리기'}).click();await expect(input).toHaveValue('3');
      await input.fill('99');await input.press('Enter');await expect(input).toHaveValue('10');
      await expect(quantity.getByRole('button',{name:'수량 늘리기'})).toBeDisabled();
      await input.fill('4');await input.press('Escape');await expect(input).toHaveValue('10');
      const time=page.getByTestId('time');
      // Vue uses role=combobox on a button; include its three triggers.
      const parts=await time.locator('button').all();
      const bounds=await Promise.all(parts.map(box));
      expect(bounds.length).toBe(4);
      // Native keeps a 44px clear target centered on the field; the field itself keeps its size height.
      for(const [index,r] of bounds.entries()) {expect(r.height).toBe(platform==='native'&&index===3?44:height);expect(Math.abs(middle(r)-middle(bounds[0]))).toBeLessThan(1);}
      if(platform==='native') expect((await box(time.locator(':scope > div').first())).height).toBe(height);
      expect((await box(page.getByTestId('ordinary').locator('button').first())).height).toBe(40);
      await time.getByRole('button',{name:'알림 시각 지우기'}).click();
      // Like Input and Select, the clear action leaves once there is nothing to clear.
      await expect(time.getByRole('button',{name:'알림 시각 지우기'})).toHaveCount(0);
    }
  });
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
      if([390,1280].includes(width)) await page.screenshot({path:`artifacts/component-design-update/${platform}-${width}.png`,fullPage:true});
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
  test(`${platform}: vertical RadioGroup stays one column in a short container`,async({page})=>{
    // A grid parent stretches the group to a definite 96px height, the case where a wrapping column flexbox splits.
    test.skip(platform==='native','React Native Web has no grid parent to give the group a definite height');
    await openFixture(page,platform,'','visual-contract');
    const radios=page.getByTestId('radio-vertical').getByRole('radio');
    await expect(radios).toHaveCount(6);
    const xs=await radios.evaluateAll(els=>els.map(el=>Math.round(el.getBoundingClientRect().x)));
    expect(new Set(xs).size).toBe(1);
  });
  test(`${platform}: text RefreshButton names itself with its visible text`,async({page})=>{
    await openFixture(page,platform,'','visual-contract');
    await expect(page.getByTestId('refresh-text').getByRole('button')).toHaveAccessibleName('주문 다시 불러오기');
  });
  test(`${platform}: a Table column with a non-function format renders the raw value and warns once`,async({page})=>{
    const warnings:string[]=[];
    page.on('console',message=>{ if(message.type()==='warning') warnings.push(message.text()); });
    await openFixture(page,platform,'','visual-contract');
    await expect(page.getByTestId('table-format').getByText('0.25',{exact:true}).first()).toBeVisible();
    expect(warnings.filter(text=>text.includes('KJUN Table: rate'))).toHaveLength(1);
  });
  test(`${platform}: choosing a menu item inside a Popover keeps the Popover open`,async({page})=>{
    await openFixture(page,platform,'','visual-contract');
    await page.getByRole('button',{name:'메뉴 묶음 열기'}).click();
    await page.getByRole('button',{name:'하위 메뉴'}).click();
    await page.getByRole('menuitem',{name:'하위 항목'}).click();
    await expect(page.getByTestId('state')).toContainText('"pick":"하위 항목"');
    await expect(page.getByTestId('state')).toContainText('"menuOpen":true');
    await expect(page.getByRole('button',{name:'하위 메뉴'})).toBeVisible();
  });
  test(`${platform}: Escape inside a Popover closes only its open menu`,async({page})=>{
    await openFixture(page,platform,'','visual-contract');
    await page.getByRole('button',{name:'메뉴 묶음 열기'}).click();
    await page.getByRole('button',{name:'하위 메뉴'}).click();
    await expect(page.getByRole('menuitem',{name:'하위 항목'})).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page.getByRole('menuitem',{name:'하위 항목'})).toHaveCount(0);
    await expect(page.getByTestId('state')).toContainText('"menuOpen":true');
  });
  test(`${platform}: DataState marks its status slot, loading block, error and content`,async({page})=>{
    test.skip(platform==='native','class markers are a web styling contract');
    await openFixture(page,platform,'','visual-contract');
    const refresh=page.getByTestId('refresh-error');
    await expect(refresh.locator('.kjun-data-content')).toContainText('유지한 데이터');
    await expect(refresh.locator('.kjun-data-status-slot')).toHaveCount(1);
    await expect(page.getByTestId('error').locator('.kjun-data-error')).toContainText('목록을 불러오지 못했습니다');
    await expect(page.getByTestId('loading-state').locator('.kjun-data-loading-block')).toHaveCount(1);
  });
  test(`${platform}: Popover returnFocus sends focus to the chosen element when it closes`,async({page})=>{
    test.skip(platform==='native','Native returns accessibility focus itself');
    await openFixture(page,platform,'','visual-contract');
    await page.getByRole('button',{name:'초점 시험 열기'}).click();
    await expect(page.getByText('초점 팝오버 내용')).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page.getByText('초점 팝오버 내용')).toHaveCount(0);
    await expect(page.getByRole('button',{name:'초점 받을 버튼'})).toBeFocused();
  });
  test(`${platform}: Popover returnFocus falls back to the trigger when its target is removed during the close`,async({page})=>{
    test.skip(platform==='native','Native returns accessibility focus itself');
    await openFixture(page,platform,'','visual-contract');
    await page.getByRole('button',{name:'초점 시험 열기'}).click();
    await page.getByRole('button',{name:'대상 지우고 닫기'}).click();
    await expect(page.getByText('초점 팝오버 내용')).toHaveCount(0);
    await expect(page.getByRole('button',{name:'초점 받을 버튼'})).toHaveCount(0);
    await expect(page.getByRole('button',{name:'초점 시험 열기'})).toBeFocused();
  });
  test(`${platform}: Popover returnFocus set after mount is used`,async({page})=>{
    test.skip(platform==='native','Native returns accessibility focus itself');
    await openFixture(page,platform,'?late-return','visual-contract');
    await page.getByRole('button',{name:'복귀 켜기'}).click();
    await page.getByRole('button',{name:'초점 시험 열기'}).click();
    await expect(page.getByText('초점 팝오버 내용')).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page.getByRole('button',{name:'초점 받을 버튼'})).toBeFocused();
  });
  test(`${platform}: pressing a tooltipped button outside an open Popover closes it`,async({page})=>{
    // React and Native make the page outside a modal popover inert, so only Vue lets a tooltip show outside it.
    test.skip(platform!=='vue3','only Vue shows tooltips outside an open popover');
    await openFixture(page,platform,'','visual-contract');
    await page.getByRole('button',{name:'메뉴 묶음 열기'}).click();
    await expect(page.getByRole('button',{name:'하위 메뉴'})).toBeVisible();
    await page.getByRole('button',{name:'도움말 버튼'}).hover();
    await expect(page.getByRole('tooltip')).toContainText('바깥 도움말');
    await page.getByRole('button',{name:'도움말 버튼'}).click();
    await expect(page.getByTestId('state')).toContainText('"menuOpen":false');
  });
  test(`${platform}: Vue Popover returnFocus accepts a Vue ref`,async({page})=>{
    test.skip(platform!=='vue3','Vue refs are a Vue 3 prop shape');
    await openFixture(page,platform,'','visual-contract');
    await page.getByRole('button',{name:'ref 시험 열기'}).click();
    await expect(page.getByText('ref 팝오버 내용')).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page.getByRole('button',{name:'ref 대상 버튼'})).toBeFocused();
  });
  test(`${platform}: Popover header stays put while only the body scrolls`,async({page})=>{
    // Reduced motion removes the opening slide so the header's resting position is measured.
    await page.emulateMedia({reducedMotion:'reduce'});
    await openFixture(page,platform,'','visual-contract');
    await page.getByRole('button',{name:'머리글 시험 열기'}).click();
    const header=page.getByText('주문 필터',{exact:true}), item=page.getByText('필터 항목 3',{exact:true});
    const before=await box(header), itemBefore=await box(item);
    await item.hover(); await page.mouse.wheel(0,200);
    await expect.poll(async()=>(await box(item)).y).toBeLessThan(itemBefore.y);
    expect(Math.abs((await box(header)).y-before.y)).toBeLessThanOrEqual(1);
    if(platform!=='native'){
      const dialog=page.getByRole('dialog',{name:'주문 필터'});
      await expect(dialog).toBeVisible();
      const scrollers=await dialog.evaluate(el=>{ const panel=el.closest('.kjun-floating')!;
        return [panel,...panel.querySelectorAll('*')].filter(n=>n.scrollHeight>n.clientHeight+1&&/auto|scroll/.test(getComputedStyle(n).overflowY)).map(n=>(n as HTMLElement).className); });
      expect(scrollers).toEqual(['kjun-popover-body']);
    } else {
      const panelBottom=await page.getByText('필터 항목 1',{exact:true}).evaluate(el=>{ let n:HTMLElement|null=el as HTMLElement; while(n&&!n.style.position.includes('absolute')) n=n.parentElement; return n!.getBoundingClientRect().bottom; });
      expect(panelBottom).toBeLessThanOrEqual(page.viewportSize()!.height);
    }
  });
  test(`${platform}: Popover header keeps its padding with noPadding`,async({page})=>{
    test.skip(platform==='native','class hooks are a web contract');
    await openFixture(page,platform,'?header-no-padding','visual-contract');
    await page.getByRole('button',{name:'머리글 시험 열기'}).click();
    await expect(page.locator('.kjun-popover-header')).toHaveCSS('padding-top',`${tokens.extensions.popover.padding}px`);
    await expect(page.locator('.kjun-popover-header')).toHaveCSS('padding-bottom',`${(tokens.extensions.popover as any).headerPaddingBottom}px`);
    await expect(page.locator('.kjun-popover-content')).toHaveCSS('padding-top','0px');
  });
  test(`${platform}: Popover with a header near the viewport bottom shrinks the body, not the header`,async({page})=>{
    await page.setViewportSize({width:800,height:360});
    await openFixture(page,platform,'','visual-contract');
    await page.getByRole('button',{name:'머리글 시험 열기'}).scrollIntoViewIfNeeded();
    await page.getByRole('button',{name:'머리글 시험 열기'}).click();
    const header=await box(page.getByText('주문 필터',{exact:true}));
    expect(header.y).toBeGreaterThanOrEqual(0);
    expect(header.y+header.height).toBeLessThanOrEqual(360);
  });
  test(`${platform}: non-modal Popover leaves the page usable and lets Tab leave`,async({page})=>{
    test.skip(platform==='native','keyboard and page interaction are web behaviors');
    await openFixture(page,platform,'','visual-contract');
    const open=page.getByRole('button',{name:'비모달 열기'}), dialog=page.getByRole('dialog',{name:'비모달 시험'});
    await open.click(); await expect(dialog).toBeVisible();
    await expect(dialog).not.toHaveAttribute('aria-modal','true');
    await page.getByRole('textbox',{name:'바깥 입력'}).fill('가');
    await expect(page.getByTestId('state')).toContainText('"typed":"가"');
    await expect(page.getByTestId('state')).toContainText('"nmOpen":false');
    await open.click(); await expect(dialog).toBeVisible(); await page.getByRole('button',{name:'비모달 끝 버튼'}).focus(); await page.keyboard.press('Tab');
    await expect(page.getByRole('button',{name:'트리거 다음 버튼'})).toBeFocused();
    await expect(dialog).toHaveCount(0);
    await open.click(); await expect(dialog).toBeVisible(); await page.getByRole('button',{name:'비모달 첫 버튼'}).focus(); await page.keyboard.press('Shift+Tab');
    await expect(open).toBeFocused(); await expect(dialog).toBeVisible();
    await page.keyboard.press('Escape'); await expect(dialog).toHaveCount(0); await expect(open).toBeFocused();
  });
  test(`${platform}: non-modal Popover closes on an outside press without pulling focus back`,async({page})=>{
    test.skip(platform==='native','focus is a web behavior');
    await openFixture(page,platform,'','visual-contract');
    const open=page.getByRole('button',{name:'비모달 열기'}), dialog=page.getByRole('dialog',{name:'비모달 시험'});
    await open.click(); await page.getByRole('textbox',{name:'바깥 입력'}).click();
    await expect(dialog).toHaveCount(0); await page.waitForTimeout(200);
    await expect(page.getByRole('textbox',{name:'바깥 입력'})).toBeFocused();
    await open.click(); await expect(dialog).toBeVisible(); await page.getByText('빈 영역 문단').click();
    await expect(dialog).toHaveCount(0);
    // react-aria's overlay focus scope returns focus to the trigger when focus fell to the body; Vue leaves it there.
    if(platform==='vue3'){ await page.waitForTimeout(200); await expect(open).not.toBeFocused(); }
  });
  test(`${platform}: non-modal Popover leaves focus on the trigger when it opens`,async({page})=>{
    test.skip(platform==='native','focus is a web behavior');
    await openFixture(page,platform,'','visual-contract');
    const open=page.getByRole('button',{name:'비모달 열기'});
    await open.click();
    await expect(page.getByRole('dialog',{name:'비모달 시험'})).toBeVisible();
    await page.waitForTimeout(200);
    await expect(open).toBeFocused();
  });
  test(`${platform}: a menu opened inside a non-modal Popover keeps it open`,async({page})=>{
    await openFixture(page,platform,'','visual-contract');
    await page.getByRole('button',{name:'비모달 열기'}).click();
    await page.getByRole('button',{name:'비모달 메뉴'}).click();
    await page.getByRole('menuitem',{name:'비모달 항목'}).click();
    await expect(page.getByTestId('state')).toContainText('"pick":"비모달 항목"');
    await expect(page.getByTestId('state')).toContainText('"nmOpen":true');
  });
  test(`${platform}: non-modal Native Popover does not trap screen readers`,async({page})=>{
    test.skip(platform!=='native','Native modal flag');
    await openFixture(page,platform,'','visual-contract');
    await page.getByRole('button',{name:'비모달 열기'}).click();
    await expect(page.getByRole('button',{name:'비모달 끝 버튼'})).toBeVisible();
    // React Native Web's Modal always marks its own container aria-modal; the panel inside must not.
    await expect(page.getByRole('dialog').locator('[aria-modal="true"]')).toHaveCount(0);
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
  test(`${platform}: the table selection bar is a labelled group, not a toolbar`,async({page})=>{
    await openFixture(page,platform,'','visual-contract');
    await page.getByTestId('table-select').getByRole('checkbox',{name:'행 선택'}).first().click();
    await expect(page.getByRole('group',{name:'선택 작업'})).toBeVisible();
    await expect(page.getByRole('toolbar')).toHaveCount(0);
  });
  test(`${platform}: a wrapping button stays inside a narrow column and short ones keep their height`,async({page})=>{
    await openFixture(page,platform,'','visual-contract');
    const section=await box(page.getByTestId('button-wrap'));
    const long=page.getByRole('button',{name:'아주 긴 라벨이 있는 버튼이 좁은 칸에서 줄바꿈되는지 확인'});
    const longBox=await box(long);
    expect(longBox.x+longBox.width).toBeLessThanOrEqual(section.x+section.width+1);
    expect(longBox.height).toBeGreaterThan(tokens.button.heights.md);
    const shortWrap=await box(page.getByRole('button',{name:'짧은 줄바꿈'})), base=await box(page.getByRole('button',{name:'짧은 기준'}));
    expect(Math.abs(shortWrap.height-base.height)).toBeLessThanOrEqual(1);
  });
  test(`${platform}: Alert live overrides the announcement role`,async({page})=>{
    await openFixture(page,platform,'','visual-contract');
    const section=page.getByTestId('alert-live');
    await expect(section.getByRole('alert').filter({hasText:'경고 즉시'})).toHaveCount(1);
    await expect(section.getByRole('status').filter({hasText:'기본 경고'})).toHaveCount(1);
    await expect(section.getByRole('alert').filter({hasText:'조용한 안내'})).toHaveCount(0);
    await expect(section.getByRole('status').filter({hasText:'조용한 안내'})).toHaveCount(0);
  });
  test(`${platform}: a controlled Tooltip follows its open prop`,async({page})=>{
    await openFixture(page,platform,'','visual-contract');
    await page.getByRole('button',{name:'툴팁 열기'}).click();
    await expect(page.getByRole('tooltip').filter({hasText:'제어 툴팁 내용'})).toBeVisible();
    await openFixture(page,platform,'?tip-frozen','visual-contract');
    await page.getByRole('button',{name:'제어 툴팁 대상'}).hover();
    await page.waitForTimeout(400);
    await expect(page.getByRole('tooltip').filter({hasText:'제어 툴팁 내용'})).toHaveCount(0);
  });
  test(`${platform}: FormGroup keeps the hint with an error and describes the field once each`,async({page})=>{
    await openFixture(page,platform,'','visual-contract');
    const group=page.getByTestId('form-hint-error');
    await expect(group.getByText('공백은 유지됩니다',{exact:true})).toBeVisible();
    await expect(group.getByText('이름이 필요합니다',{exact:true})).toBeVisible();
    if(platform==='native') return;
    const ids=(await group.getByRole('textbox',{name:'이름'}).getAttribute('aria-describedby'))!.split(/\s+/).sort();
    expect(ids).toEqual(['tyve-name-error','tyve-name-hint']);
  });
  test(`${platform}: FormGroup labelHidden still names the field`,async({page})=>{
    await openFixture(page,platform,'','visual-contract');
    const group=page.getByTestId('form-hidden-label');
    await expect(group.getByRole('textbox',{name:'숨긴 라벨'})).toHaveCount(1);
    if(platform==='native') { await expect(group.getByText('숨긴 라벨',{exact:true})).toHaveCount(0); return; }
    const label=await box(group.getByText('숨긴 라벨',{exact:true}));
    expect(label.width).toBeLessThanOrEqual(1);
  });
  test(`${platform}: Select takes an id so an outside label names it`,async({page})=>{
    test.skip(platform==='native','label for is a web association');
    await openFixture(page,platform,'','visual-contract');
    await expect(page.getByTestId('select-outside').getByRole('button',{name:'외부 라벨'})).toHaveCount(1);
  });
  test(`${platform}: a Checkbox in a FormGroup is described by its hint and error`,async({page})=>{
    test.skip(platform==='native','aria-describedby is a web association');
    await openFixture(page,platform,'','visual-contract');
    const box_=page.getByTestId('check-in-group').getByRole('checkbox',{name:'약관 동의'});
    const ids=(await box_.getAttribute('aria-describedby'))?.split(/\s+/).sort();
    expect(ids).toEqual(['tyve-agree-error','tyve-agree-hint']);
    await expect(box_).toHaveAttribute('aria-invalid','true');
  });
  test(`${platform}: a required FormGroup marks Checkbox and Switch without blocking native submit`,async({page})=>{
    test.skip(platform==='native','aria-required and native validity are web semantics');
    await openFixture(page,platform,'','visual-contract');
    const box_=page.getByTestId('check-in-group').getByRole('checkbox',{name:'약관 동의'});
    const toggle=page.getByTestId('switch-in-group').getByRole('switch',{name:'알림 받기'});
    for(const control of [box_,toggle]) {
      await expect(control).toHaveAttribute('aria-required','true');
      await expect(control).toHaveAttribute('aria-invalid','true');
      expect(await control.evaluate(el=>(el as HTMLInputElement).checkValidity())).toBe(true);
    }
    const ids=(await toggle.getAttribute('aria-describedby'))?.split(/\s+/).sort();
    expect(ids).toEqual(['tyve-notify-error','tyve-notify-hint']);
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
}

// Market, skeleton, Empty and menu geometry
const open = (page: any, platform: string, query = '') => openFixture(page, platform, query, 'visual-reaudit');
async function openSelect(page: any) {
  const trigger = page.getByTestId('select').locator('button').first();
  // Vue dismisses on page scroll. Finish the runner's auto-scroll before opening the menu.
  await trigger.scrollIntoViewIfNeeded();
  await page.evaluate(() => new Promise<void>(resolve => requestAnimationFrame(() => requestAnimationFrame(() => resolve()))));
  await trigger.click();
}
const geometry = (node: Locator) => node.evaluate(root => {
  const table = root.querySelector('table');
  const title = [...root.querySelectorAll('*')].find(el => el.textContent === '자산' && !el.children.length)!;
  const header = table ? table.querySelector('thead tr')! : title.parentElement!.parentElement!;
  const body = table ? [...table.querySelectorAll('tbody tr')] : [...header.parentElement!.children].slice(1);
  const rect = (el: Element) => { const r = el.getBoundingClientRect(); return { x: r.x - header.getBoundingClientRect().x, width: r.width, height: r.height }; };
  return { header: rect(header), columns: [...header.children].map(rect), rows: body.slice(0, 2).map(rect) };
});
const sameGeometry = (a: Awaited<ReturnType<typeof geometry>>, b: Awaited<ReturnType<typeof geometry>>) => {
  expect(a.columns.length).toBe(b.columns.length);
  for (const [index, col] of a.columns.entries()) {
    expect(Math.abs(col.width - b.columns[index].width)).toBeLessThanOrEqual(1);
    expect(Math.abs(col.x - b.columns[index].x)).toBeLessThanOrEqual(1);
  }
  expect(Math.abs(a.header.height - b.header.height)).toBeLessThanOrEqual(1);
  for (const [index, row] of a.rows.entries()) expect(Math.abs(row.height - b.rows[index].height)).toBeLessThanOrEqual(1);
};

for (const platform of ['react', 'vue3', 'native']) {
  test(`${platform}: market loading and completion retain row and column geometry`, async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    for (const width of [320, 375, 768, 1280]) for (const query of ['', '?fixed', '?no-actions', ...(platform === 'native' ? [] : ['?css', '?legacy'])]) {
      await page.setViewportSize({ width, height: 1000 });
      await open(page, platform, query);
      await expect(page.getByTestId('loaded').getByText('한빛테크', { exact: true })).toBeVisible();
      // Native onLayout first observes the containing width after mounting.
      await expect.poll(async () => (await geometry(page.getByTestId('loading'))).header.width).toBeGreaterThanOrEqual(400);
      const loading = await geometry(page.getByTestId('loading')), loaded = await geometry(page.getByTestId('loaded'));
      sameGeometry(loading, loaded);
      expect(loaded.header.height).toBeCloseTo(44, 0);
      for (const row of loaded.rows) expect(row.height).toBeCloseTo(70, 0);
      const before = await geometry(page.getByTestId('transition'));
      await page.getByRole('button', { name: '조회 완료' }).click();
      await expect(page.getByTestId('transition').getByText('한빛테크', { exact: true })).toBeVisible();
      sameGeometry(before, await geometry(page.getByTestId('transition')));
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
    }
  });

  test(`${platform}: input skeleton sizes and explicit overrides match the input contract`, async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' }); await open(page, platform);
    // Three 24px lines, 12px vertical padding and 2px borders make 100px.
    for (const [id, height, radius] of [['sm', 32, 10], ['md', 40, 12], ['lg', 48, 14], ['override', 40, 14], ['multiline', 100, 12]] as const) {
      const shape = page.getByTestId('form-' + id).locator(platform === 'native' ? ':scope > div > div > div:last-child' : '.kjun-skeleton-block, .kjun-skeleton-block');
      expect((await box(shape)).height).toBe(height);
      expect((await box(shape)).width).toBeCloseTo((await box(page.getByTestId('form-' + id))).width, 0);
      await expect(shape).toHaveCSS('border-radius', radius + 'px');
    }
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
      await page.screenshot({ path: `artifacts/component-visual-fixes-20260915/${platform}-${mode ? 'dark' : 'light'}-375.png`, fullPage: true });
    }
    await page.setViewportSize({ width: 320, height: 1000 }); await open(page, platform, '?identifier');
    expect(await page.getByTestId('navigation').evaluate(el => el.scrollWidth <= el.clientWidth + 1)).toBe(true);
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
    await page.screenshot({ path: `artifacts/component-visual-fixes-20260915/${platform}-select-open.png` });
    await page.getByRole(role, { name: '체리', exact: true }).click();
    await expect(page.getByTestId('state')).toContainText('"selected":"c"'); await expect(apple).toHaveCount(0);
    await page.getByRole('button', { name: '메뉴 열기', exact: true }).click();
    const item = page.getByRole('menuitem', { name: '메뉴 항목', exact: true }); await expect(item).toBeVisible();
    expect((await box(item)).height).toBeGreaterThanOrEqual(44);
    await page.keyboard.press('Escape'); await expect(item).toHaveCount(0);
    await expect(page.getByRole('button', { name: '메뉴 열기', exact: true })).toBeFocused();
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

// TimePicker, Pagination, BottomNavigation and quantity refinements
const platforms = ['react', 'vue3', 'native'];
const output = 'artifacts/visual-refinement-20260928';
async function configure(page: Page, name: string, settings: object = {}, values: object = {}, palette = 'default') {
  const defaults = presetConfig(name);
  const revision = await page.evaluate(() => ((window as any).visualRevision = ((window as any).visualRevision || 0) + 1));
  await page.evaluate(config => window.postMessage({ type: 'kjun:catalog-configure', config }, location.origin), {
    settings: { ...defaults.settings, ...settings }, values, palette, revision, reset: revision,
  });
  await expect.poll(() => page.evaluate(() => (window as any).visualSnapshot?.revision)).toBe(revision);
}
async function visit(page: Page, platform: string, name: string) {
  await page.addInitScript(() => window.addEventListener('message', event => {
    if (event.data?.type === 'kjun:catalog-snapshot') (window as any).visualSnapshot = event.data;
  }));
  await openFixture(page, platform, `?component=${name}`, 'catalog');
  await expect.poll(() => page.evaluate(() => !!(window as any).visualSnapshot)).toBe(true);
  await page.evaluate(() => document.fonts.ready);
}
const state = (page: Page) => page.evaluate(() => (window as any).visualSnapshot.values);
const timePart = (page: Page, platform: string, name: string) => page.getByRole('button', { name: `알림 시각 ${name}`, exact: true });
const option = (page: Page, platform: string, name: string) => page.getByRole(platform === 'native' ? 'radio' : 'option', { name, exact: true });

for (const platform of platforms) {
  test(`${platform}: compact time segments fit 240px and clear returns focus`, async ({ page }) => {
    await page.setViewportSize({ width: 288, height: 560 });
    await visit(page, platform, 'KjunTimePicker');
    for (const palette of ['default', 'dark']) for (const size of ['sm', 'md', 'lg']) {
      await configure(page, 'KjunTimePicker', { precision: 'second', size }, { time: '09:30:15' }, palette);
      const root = page.locator('[aria-label="알림 시각"]').first();
      const bounds = (await root.boundingBox())!;
      expect(bounds.width).toBeLessThanOrEqual(240);
      const first = (await timePart(page, platform, '시').boundingBox())!;
      const last = (await timePart(page, platform, '초').boundingBox())!;
      const clear = (await page.getByRole('button', { name: '알림 시각 지우기' }).boundingBox())!;
      expect(Math.abs(first.y - last.y)).toBeLessThan(1);
      expect(clear.x).toBeGreaterThanOrEqual(last.x + last.width - 1);
      expect(clear.x + clear.width).toBeLessThanOrEqual(bounds.x + bounds.width + 1);
      expect(clear.width).toBeGreaterThanOrEqual(44);
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(288);
      await page.screenshot({ path: `${output}/${platform}-time-${palette}-${size}.png` });
    }
    await page.setViewportSize({ width: 390, height: 560 });
    await configure(page, 'KjunTimePicker', { precision: 'second', size: 'md' }, { time: '09:30:15' });
    await page.locator('[aria-label="알림 시각"]').first().screenshot({ path: `${output}/${platform}-time-wide.png` });
    await timePart(page, platform, '시').click();
    await option(page, platform, '10').click();
    await expect.poll(async () => (await state(page)).time).toBe('10:30:15');
    await page.getByRole('button', { name: '알림 시각 지우기' }).click();
    await expect.poll(async () => (await state(page)).time).toBe(null);
    await expect(timePart(page, platform, '시')).toBeFocused();
    await expect(page.getByRole('button', { name: '알림 시각 지우기' })).toHaveCount(0);
    await configure(page, 'KjunTimePicker', { precision: 'second', disabled: true, error: true }, { time: '09:30:15' });
    for (const part of ['시', '분', '초']) await expect(timePart(page, platform, part)).toBeDisabled();
    await page.screenshot({ path: `${output}/${platform}-time-disabled-error.png` });
  });

  test(`${platform}: pagination size selector resets the page and compact controls fit`, async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 650 });
    await visit(page, platform, 'KjunPagination');
    await configure(page, 'KjunPagination', {}, { page: 4, pageSize: 20 });
    const size = page.getByRole('button', { name: '페이지당 항목 수', exact: true });
    await size.click();
    await option(page, platform, '50개씩').click();
    await expect.poll(async () => (await state(page)).pageSize).toBe(50);
    await expect.poll(async () => (await state(page)).page).toBe(1);
    const previous = page.getByRole('button', { name: '이전 페이지', exact: true }).filter({ visible: true });
    const next = page.getByRole('button', { name: '다음 페이지', exact: true }).filter({ visible: true });
    await expect(previous).toBeDisabled();
    await next.click();
    await expect.poll(async () => (await state(page)).page).toBe(2);
    for (const width of [320, 390, 1280]) {
      await page.setViewportSize({ width, height: 650 });
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
      const prevBox = (await previous.boundingBox())!, nextBox = (await next.boundingBox())!;
      expect(Math.abs(prevBox.y - nextBox.y)).toBeLessThan(1);
      await page.screenshot({ path: `${output}/${platform}-pagination-${width}.png` });
    }
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
    await page.screenshot({ path: `${output}/${platform}-bottom-long.png` });
    // CSS zoom exercises the same layout at twice its visual scale.
    await page.setViewportSize({ width: 780, height: 800 });
    await page.evaluate(() => { document.documentElement.style.zoom = '2'; });
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(780);
    await page.screenshot({ path: `${output}/${platform}-bottom-zoom200.png` });
  });

  test(`${platform}: quantity shares an error boundary while preserving input and bounds`, async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 650 });
    await openFixture(page, platform, '', 'input-design');
    const input = page.getByTestId('quantity').getByRole('spinbutton');
    const root = page.getByTestId('quantity').locator(':scope > div').first();
    await input.fill('19'); await input.press('Enter');
    await page.getByRole('button', { name: '수량 늘리기' }).click();
    await expect(input).toHaveValue('20');
    await expect(page.getByRole('button', { name: '수량 늘리기' })).toBeDisabled();
    await input.focus();
    await expect(input).toHaveCSS('border-radius', '0px');
    await page.evaluate(() => (window as any).configureInputDesign({ error: true }));
    await expect(input).toHaveAttribute('aria-invalid', 'true');
    const boundary = platform === 'native' ? root.locator(':scope > [aria-hidden="true"]').last() : root;
    if (platform === 'native') await expect(boundary).toHaveCSS('border-top-color', 'rgb(197, 47, 59)');
    else await expect.poll(() => root.evaluate(el => getComputedStyle(el, '::after').borderTopColor)).toBe('rgb(197, 47, 59)');
    await root.screenshot({ path: `${output}/${platform}-quantity-error.png` });
    await page.evaluate(() => (window as any).configureInputDesign({ disabled: true }));
    await expect(input).not.toBeEditable();
    if (platform === 'native') await expect(boundary).toHaveCSS('border-top-color', 'rgb(197, 47, 59)');
    else await expect.poll(() => root.evaluate(el => getComputedStyle(el, '::after').borderTopColor)).toBe('rgb(197, 47, 59)');
  });
}
