import { test, expect } from '@playwright/test';
import { tokens } from '../../packages/tokens/dist/index.js';
import { openFixture } from './packed-fixture';
import { box } from './visual-contract-helpers';

for (const platform of ['react', 'vue3', 'native']) {
  test(`${platform}: text RefreshButton names itself with its visible text`,async({page})=>{
    await openFixture(page,platform,'','visual-contract');
    await expect(page.getByTestId('refresh-text').getByRole('button')).toHaveAccessibleName('주문 다시 불러오기');
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
}
