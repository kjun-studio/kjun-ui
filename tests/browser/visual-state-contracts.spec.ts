import { test, expect } from '@playwright/test';
import { openFixture } from './packed-fixture';
import { state } from './visual-contract-helpers';

for (const platform of ['react', 'vue3', 'native']) {
  test(`${platform}: DataState marks its status slot, loading block, error and content`,async({page})=>{
    test.skip(platform==='native','class markers are a web styling contract');
    await openFixture(page,platform,'','visual-contract');
    const refresh=page.getByTestId('refresh-error');
    await expect(refresh.locator('.kjun-data-content')).toContainText('유지한 데이터');
    await expect(refresh.locator('.kjun-data-status-slot')).toHaveCount(1);
    await expect(page.getByTestId('error').locator('.kjun-data-error')).toContainText('목록을 불러오지 못했습니다');
    await expect(page.getByTestId('loading-state').locator('.kjun-data-loading-block')).toHaveCount(1);
  });

  test(`${platform}: Alert live overrides the announcement role`,async({page})=>{
    await openFixture(page,platform,'','visual-contract');
    const section=page.getByTestId('alert-live');
    await expect(section.getByRole('alert').filter({hasText:'경고 즉시'})).toHaveCount(1);
    await expect(section.getByRole('status').filter({hasText:'기본 경고'})).toHaveCount(1);
    await expect(section.getByRole('alert').filter({hasText:'조용한 안내'})).toHaveCount(0);
    await expect(section.getByRole('status').filter({hasText:'조용한 안내'})).toHaveCount(0);
  });
}
