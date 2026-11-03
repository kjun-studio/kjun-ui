import { expect, test } from '@playwright/test';
import { openFixture } from './packed-fixture';
import { captureReview } from './review-captures';

const configure = (page: import('@playwright/test').Page, values: object) => page.evaluate(values => (window as any).configureTableGroups(values), values);

for (const platform of ['react', 'vue3', 'native']) {
  test(`${platform}: groups collapse, each one closes with a subtotal and the table with a total`, async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await openFixture(page, platform, '', 'table-groups');
    // Groups follow the first appearance of each status and carry the app's label and a count.
    await expect(page.getByText('상태: 진행 중', { exact: true })).toBeVisible();
    await expect(page.getByText('2개', { exact: true })).toBeVisible();
    const order = await Promise.all(['상태: 진행 중', '상태: 검토 대기', '상태: 완료'].map(async t => (await page.getByText(t, { exact: true }).boundingBox())!.y));
    expect(order).toEqual([...order].sort((a, b) => a - b));
    // Subtotals use the column's format; the total sums every row.
    await expect(page.getByText('7,200,000원', { exact: true })).toBeVisible();
    await expect(page.getByText('12,000,000원', { exact: true })).toBeVisible();
    // One-row groups skip their subtotal, which would only repeat the row.
    await expect(page.getByText('소계', { exact: true })).toHaveCount(1);
    await expect(page.getByText('합계', { exact: true })).toHaveCount(1);
    // Collapsing a group hides its rows but keeps its header and subtotal.
    const toggle = page.getByRole('button', { name: '진행 중 묶음 접기' });
    await toggle.click();
    await expect(page.getByText('브랜드 웹사이트', { exact: true })).toHaveCount(0);
    await expect(page.getByText('7,200,000원', { exact: true })).toBeVisible();
    await page.getByRole('button', { name: '진행 중 묶음 펼치기' }).click();
    await expect(page.getByText('브랜드 웹사이트', { exact: true })).toBeVisible();
    if (platform !== 'native') {
      await expect(page.getByRole('button', { name: '진행 중 묶음 접기' })).toHaveAttribute('aria-expanded', 'true');
      // Each group is a row group headed by a rowgroup header; the total sits in the table foot.
      await expect(page.locator('table > tbody')).toHaveCount(3);
      await expect(page.locator('th[scope="rowgroup"]')).toHaveCount(3);
      await expect(page.locator('tfoot')).toContainText('12,000,000원');
    }
  });

  test(`${platform}: external group values control expansion and rejected requests do not change it`, async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', error => errors.push(error.message));
    await openFixture(page, platform, '', 'table-groups');
    await configure(page, { expandedGroups: ['진행 중', '다른 페이지'], accept: false, expandedRows: ['p1'], expandable: true });
    await expect(page.getByText('상세 p1', { exact: true })).toBeVisible();
    await expect(page.getByText('고객센터 개편', { exact: true })).toHaveCount(0);
    const close = page.getByRole('button', { name: '진행 중 묶음 접기', exact: true });
    await close.click();
    await expect(page.getByTestId('group-changes')).toHaveText('[["다른 페이지"]]');
    await expect(close).toHaveAttribute('aria-expanded', 'true');
    await expect(page.getByText('상세 p1', { exact: true })).toBeVisible();
    await configure(page, { expandedGroups: [] });
    await expect(page.getByRole('button', { name: /묶음 펼치기$/ })).toHaveCount(3);
    await expect(page.getByText('브랜드 웹사이트', { exact: true })).toHaveCount(0);
    await expect(page.getByTestId('group-changes')).toHaveText('[["다른 페이지"]]');
    await configure(page, { accept: true });
    await page.getByRole('button', { name: '진행 중 묶음 펼치기', exact: true }).press('Enter');
    await expect(page.getByTestId('group-changes')).toHaveText('[["다른 페이지"],["진행 중"]]');
    await expect(page.getByText('상세 p1', { exact: true })).toBeVisible();
    await configure(page, { expandedGroups: ['진행 중', '검토 대기', '완료'] });
    await expect(page.getByRole('button', { name: /묶음 접기$/ })).toHaveCount(3);
    await configure(page, { data: [{ id: 'new', name: '새 프로젝트', status: '신규', amount: 10 }] });
    await expect(page.getByRole('button', { name: '신규 묶음 펼치기', exact: true })).toHaveAttribute('aria-expanded', 'false');
    await configure(page, { expandedGroups: ['신규'] });
    await expect(page.getByText('새 프로젝트', { exact: true })).toBeVisible();
    await expect(page.getByTestId('group-changes')).toHaveText('[["다른 페이지"],["진행 중"]]');
    expect(errors).toEqual([]);
  });

  for (const presentation of ['stacked', 'rows', 'tiles', 'list']) {
    test(`${platform}: ${presentation} groups share controlled state through narrow and wide layouts`, async ({ page }) => {
      await openFixture(page, platform, '', 'table-groups');
      await configure(page, { expandedGroups: ['진행 중'], responsive: presentation === 'list' ? 'list' : 'card', cardLayout: presentation === 'list' ? 'stacked' : presentation });
      await page.setViewportSize({ width: 320, height: 1000 });
      await expect(page.getByText('고객센터 개편', { exact: true })).toHaveCount(0);
      await expect(page.getByText('브랜드 웹사이트', { exact: true })).toBeVisible();
      if (presentation === 'stacked') await captureReview(page, { path: `artifacts/table-groups-controlled-${platform}-320.png` });
      await page.getByRole('button', { name: '진행 중 묶음 접기', exact: true }).click();
      await expect(page.getByText('브랜드 웹사이트', { exact: true })).toHaveCount(0);
      await expect(page.getByTestId('group-changes')).toHaveText('[[]]');
      await expect(page.getByText('7,200,000원', { exact: true })).toBeVisible();
      await expect(page.getByText('12,000,000원', { exact: true })).toBeVisible();
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      await page.setViewportSize({ width: 1100, height: 1000 });
      await expect(page.getByRole('button', { name: '진행 중 묶음 펼치기', exact: true })).toHaveAttribute('aria-expanded', 'false');
      await expect(page.getByText('브랜드 웹사이트', { exact: true })).toHaveCount(0);
      await page.getByRole('button', { name: '진행 중 묶음 펼치기', exact: true }).click();
      await page.setViewportSize({ width: 375, height: 1000 });
      await expect(page.getByText('브랜드 웹사이트', { exact: true })).toBeVisible();
      await expect(page.getByTestId('group-changes')).toHaveText('[[],["진행 중"]]');
    });
  }

  test(`${platform}: uncontrolled groups survive data replacement and reset for a different groupBy field`, async ({ page }) => {
    await openFixture(page, platform, '', 'table-groups');
    await page.getByRole('button', { name: '진행 중 묶음 접기', exact: true }).click();
    await expect(page.getByTestId('group-changes')).toHaveText('[["검토 대기","완료"]]');
    const data = [{ id: 'new', name: '새 프로젝트', status: '진행 중', amount: 10 }];
    await configure(page, { data });
    await expect(page.getByText('새 프로젝트', { exact: true })).toHaveCount(0);
    await configure(page, { groupBy: 'name' });
    await expect(page.getByRole('button', { name: '새 프로젝트 묶음 접기', exact: true })).toHaveAttribute('aria-expanded', 'true');
    await expect(page.getByTestId('group-changes')).toHaveText('[["검토 대기","완료"]]');
  });
}
