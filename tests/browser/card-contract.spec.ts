import { test, expect } from '@playwright/test';
import { tokens } from '../../packages/tokens/dist/index.js';
import { openFixture } from './packed-fixture';
import { cardOutline } from './card-outline';

for (const platform of ['vue2','react','native']) {
  test(`${platform}: Card sections, surfaces and header actions compose independently`, async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.setViewportSize({ width: 320, height: 1000 });
    await openFixture(page, platform, '', 'card-contract');
    const card = page.getByTestId('contract-card').locator(':scope > *').first();
    const update = async (options: Record<string, unknown>, parts = {}) => {
      await page.evaluate(({ options, parts }) => (window as any).setCardContract(options, parts), { options, parts });
    };
    const body = () => platform === 'native' ? card.getByText('카드 본문', { exact: true }).locator('..') : card.locator(':scope > .kjun-card-body');
    const footer = () => platform === 'native' ? card.getByText('카드 푸터', { exact: true }).locator('..') : card.locator(':scope > .kjun-card-footer');
    await expect.poll(() => cardOutline(card, platform)).toBe('none');
    const before = await card.boundingBox();
    const bodyBefore = await body().boundingBox();
    await update({ border: true });
    await expect.poll(() => cardOutline(card, platform)).toContain('0.5px');
    expect(await card.boundingBox()).toEqual(before);
    expect(await body().boundingBox()).toEqual(bodyBefore);
    await card.getByRole('button', { name: '실행' }).click();
    await expect(page.getByTestId('actions')).toHaveText('1');
    await update({}, { title: false });
    await card.getByRole('button', { name: '실행' }).click();
    await expect(page.getByTestId('actions')).toHaveText('2');
    await update({}, { custom: true });
    await expect(card.getByText('사용자 헤더')).toBeVisible();
    await card.getByRole('button', { name: '실행' }).press('Enter');
    await expect(page.getByTestId('actions')).toHaveText('3');
    for (const surface of Object.keys(tokens.cardSurfaces)) {
      for (const border of [false, true]) {
        await update({ surface, border, radius: 'lg', padding: 'sm' });
        await expect(card).toHaveCSS('border-top-width', '0px');
        if (border) await expect.poll(() => cardOutline(card, platform)).toContain('0.5px');
        else await expect.poll(() => cardOutline(card, platform)).toBe('none');
        await expect(card).toHaveCSS('border-top-left-radius', tokens.card.radii.lg + 'px');
        await expect(body()).toHaveCSS('padding-left', tokens.card.padding.sm + 'px');
      }
    }
    for (const padding of ['none','sm','md','lg'] as const) {
      await update({ padding, radius: padding, dividers: true }, { title: true, custom: false });
      await expect(card).toHaveCSS('border-top-left-radius', tokens.card.radii[padding] + 'px');
      await expect(body()).toHaveCSS('padding-left', tokens.card.padding[padding] + 'px');
      await expect(body()).toHaveCSS('padding-top', tokens.card.padding[padding] + 'px');
      await expect(footer()).toHaveCSS('padding-left', tokens.card.padding[padding] + 'px');
      await expect(footer()).toHaveCSS('border-top-width', '1px');
    }
    await update({ padding: 'md', bodyPadding: 'none', dividers: false }, { media: true });
    await expect(body()).toHaveCSS('padding-left', '0px');
    await expect(footer()).toHaveCSS('padding-left', tokens.card.padding.md + 'px');
    await expect(footer()).toHaveCSS('padding-top', tokens.card.padding.md + 'px');
    await expect(card.getByRole('img', { name: '카드 이미지' })).toBeVisible();
    await expect.poll(() => card.evaluate(el => el.scrollWidth <= el.clientWidth + 1)).toBe(true);
    expect(await card.evaluate(el => getComputedStyle(el).overflow)).not.toBe('hidden');
    expect(errors).toEqual([]);
  });
}
