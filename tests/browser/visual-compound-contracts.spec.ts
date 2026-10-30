import { captureReview } from './review-captures';
import { test, expect } from '@playwright/test';
import { openFixture } from './packed-fixture';
import { box, middle, geometry, output, configure, visit, state, timePart, option } from './visual-contract-helpers';

for (const platform of ['react', 'vue3', 'native']) {
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
      await captureReview(page, { path: `${output}/${platform}-time-${palette}-${size}.png` });
    }
    await page.setViewportSize({ width: 390, height: 560 });
    await configure(page, 'KjunTimePicker', { precision: 'second', size: 'md' }, { time: '09:30:15' });
    await captureReview(page.locator('[aria-label="알림 시각"]').first(), { path: `${output}/${platform}-time-wide.png` });
    await timePart(page, platform, '시').click();
    await option(page, platform, '10').click();
    await expect.poll(async () => (await state(page)).time).toBe('10:30:15');
    await page.getByRole('button', { name: '알림 시각 지우기' }).click();
    await expect.poll(async () => (await state(page)).time).toBe(null);
    await expect(timePart(page, platform, '시')).toBeFocused();
    await expect(page.getByRole('button', { name: '알림 시각 지우기' })).toHaveCount(0);
    await configure(page, 'KjunTimePicker', { precision: 'second', disabled: true, error: true }, { time: '09:30:15' });
    for (const part of ['시', '분', '초']) await expect(timePart(page, platform, part)).toBeDisabled();
    await captureReview(page, { path: `${output}/${platform}-time-disabled-error.png` });
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
    await captureReview(root, { path: `${output}/${platform}-quantity-error.png` });
    await page.evaluate(() => (window as any).configureInputDesign({ disabled: true }));
    await expect(input).not.toBeEditable();
    if (platform === 'native') await expect(boundary).toHaveCSS('border-top-color', 'rgb(197, 47, 59)');
    else await expect.poll(() => root.evaluate(el => getComputedStyle(el, '::after').borderTopColor)).toBe('rgb(197, 47, 59)');
  });
}
