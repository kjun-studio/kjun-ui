import { test, expect } from '@playwright/test';
import { openFixture } from './packed-fixture';
import { box, open } from './visual-contract-helpers';

for (const platform of ['react', 'vue3', 'native']) {
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

  test(`${platform}: a FormGroup label follows a Select's own id`,async({page})=>{
    test.skip(platform==='native','label for is a web association');
    await openFixture(page,platform,'','visual-contract');
    const label=page.getByTestId('select-own-id').locator('label');
    await expect(label).toHaveAttribute('for','tyve-own-sel');
    await expect(page.locator('#tyve-own-sel')).toHaveCount(1);
  });

  test(`${platform}: hidden FormGroup labels leave no dangling references on other fields`,async({page})=>{
    await openFixture(page,platform,'','visual-contract');
    const root=page.getByTestId('hidden-label-others');
    await expect(root.getByRole('textbox',{name:'숨긴 메모'})).toHaveCount(1);
    const dangling=await root.evaluate(el=>[...el.querySelectorAll('[aria-labelledby]')].flatMap(node=>
      node.getAttribute('aria-labelledby')!.split(/\s+/).filter(id=>!document.getElementById(id))));
    expect(dangling).toEqual([]);
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
}
