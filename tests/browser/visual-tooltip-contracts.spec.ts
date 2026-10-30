import { test, expect } from '@playwright/test';
import { openFixture } from './packed-fixture';
import { open, state } from './visual-contract-helpers';

for (const platform of ['react', 'vue3', 'native']) {
  test(`${platform}: a controlled Tooltip follows its open prop`,async({page})=>{
    await openFixture(page,platform,'','visual-contract');
    await page.getByRole('button',{name:'툴팁 열기'}).click();
    await expect(page.getByRole('tooltip').filter({hasText:'제어 툴팁 내용'})).toBeVisible();
    await openFixture(page,platform,'?tip-frozen','visual-contract');
    await page.getByRole('button',{name:'제어 툴팁 대상'}).hover();
    await page.waitForTimeout(400);
    await expect(page.getByRole('tooltip').filter({hasText:'제어 툴팁 내용'})).toHaveCount(0);
  });

  test(`${platform}: a controlled Tooltip reports only real open changes`,async({page})=>{
    await openFixture(page,platform,'','visual-contract');
    const target=page.getByRole('button',{name:'횟수 툴팁 대상'});
    await target.click();
    await page.getByRole('button',{name:'도움말 버튼'}).hover();
    await page.waitForTimeout(300);
    // Hovering before the click may really open it (no delay); what must not appear is a repeated value.
    const log=JSON.parse(await page.getByTestId('state').textContent() || '{}').tcLog as string;
    expect(log).toMatch(/^(10)*1?$/);
  });
}
