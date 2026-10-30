import { test, expect } from '@playwright/test';
import { tokens } from '../../packages/tokens/dist/index.js';
import { openFixture } from './packed-fixture';
import { box, open, state } from './visual-contract-helpers';

for (const platform of ['react', 'vue3', 'native']) {
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
}
