import { mkdtemp, mkdir, writeFile, rm } from 'node:fs/promises';
import { test, expect, chromium, type Locator, type Page } from '@playwright/test';
import { presetConfig } from '../../shared/example-registry';
import { openFixture } from './packed-fixture';
const box = async (node:Locator) => (await node.boundingBox())!;
const middle = (r:{y:number;height:number}) => r.y + r.height/2;
for(const platform of ['react','vue2','native']) {
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
    for(const kind of ['line','grid','bar','donut','candle','matrix']) {
      await openFixture(page,platform,'?kind='+kind,'visual-contract');
      await expect(page.getByTestId('chart').getByText('차트를 불러오는 중',{exact:true})).toBeVisible();
    }
    await openFixture(page,platform,'?no-text','visual-contract');
    await expect(page.getByTestId('chart').getByText('차트를 불러오는 중',{exact:true})).toHaveCount(0);
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

for (const platform of ['react', 'vue2', 'native']) {
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
      const shape = page.getByTestId('form-' + id).locator(platform === 'native' ? ':scope > div > div > div:last-child' : '.kjun-skeleton-block, .ds-skeleton-block');
      expect((await box(shape)).height).toBe(height);
      expect((await box(shape)).width).toBeCloseTo((await box(page.getByTestId('form-' + id))).width, 0);
      await expect(shape).toHaveCSS('border-radius', radius + 'px');
    }
  });

  test(`${platform}: skeleton roles, Empty hierarchy and narrow titles remain legible`, async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    for (const mode of ['', '&dark']) {
      await page.setViewportSize({ width: 375, height: 1000 }); await open(page, platform, '?roles' + mode);
      const field = page.getByTestId('form-md').locator(platform === 'native' ? ':scope > div > div > div:last-child' : '.kjun-skeleton-block, .ds-skeleton-block');
      expect((await box(field)).width).toBeCloseTo((await box(page.getByTestId('form-md'))).width, 0);
      const shape = page.getByTestId('skeleton').locator(platform === 'native' ? ':scope > div > div' : '.kjun-skeleton-block, .ds-skeleton-block');
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
    for (const platform of ['react', 'vue2', 'native']) {
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
const platforms = ['react', 'vue2', 'native'];
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
const timePart = (page: Page, platform: string, name: string) => page.getByRole(platform === 'vue2' ? 'combobox' : 'button', { name: `알림 시각 ${name}`, exact: true });
const option = (page: Page, platform: string, name: string) => page.getByRole(platform === 'native' ? 'radio' : 'option', { name, exact: true });

for (const platform of platforms) {
  test(`${platform}: compact time segments fit 240px and clear returns focus`, async ({ page }) => {
    await page.setViewportSize({ width: 288, height: 560 });
    await visit(page, platform, 'DsTimePicker');
    for (const palette of ['default', 'dark']) for (const size of ['sm', 'md', 'lg']) {
      await configure(page, 'DsTimePicker', { precision: 'second', size }, { time: '09:30:15' }, palette);
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
    await configure(page, 'DsTimePicker', { precision: 'second', size: 'md' }, { time: '09:30:15' });
    await page.locator('[aria-label="알림 시각"]').first().screenshot({ path: `${output}/${platform}-time-wide.png` });
    await timePart(page, platform, '시').click();
    await option(page, platform, '10').click();
    await expect.poll(async () => (await state(page)).time).toBe('10:30:15');
    await page.getByRole('button', { name: '알림 시각 지우기' }).click();
    await expect.poll(async () => (await state(page)).time).toBe(null);
    await expect(timePart(page, platform, '시')).toBeFocused();
    await expect(page.getByRole('button', { name: '알림 시각 지우기' })).toHaveCount(0);
    await configure(page, 'DsTimePicker', { precision: 'second', disabled: true, error: true }, { time: '09:30:15' });
    for (const part of ['시', '분', '초']) await expect(timePart(page, platform, part)).toBeDisabled();
    await page.screenshot({ path: `${output}/${platform}-time-disabled-error.png` });
  });

  test(`${platform}: pagination size selector resets the page and compact controls fit`, async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 650 });
    await visit(page, platform, 'DsPagination');
    await configure(page, 'DsPagination', {}, { page: 4, pageSize: 20 });
    const size = page.getByRole(platform === 'vue2' ? 'combobox' : 'button', { name: '페이지당 항목 수', exact: true });
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
    await visit(page, platform, 'DsBottomNavigation');
    await configure(page, 'DsBottomNavigation', { long: true });
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
