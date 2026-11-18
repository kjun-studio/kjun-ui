import { expect, test } from '@playwright/test';
import { openFixture } from './packed-fixture';
// Table review r1: expanded panel span, rowSelectable, uncontrolled selection, client search, summary labels, list rows.

for (const platform of ['react', 'vue3', 'native']) {
  test(`${platform}: locked rows, internal selection, a client search and the total's name`, async ({ page }) => {
    await openFixture(page, platform, '', 'table-review');
    const table = page.getByTestId('locked');
    // rowSelectable: the locked row's box is off and select all takes only the open rows.
    await expect(table.getByRole('checkbox', { name: '행 선택 고객센터 개편' })).toBeDisabled();
    const all = table.getByRole('checkbox', { name: '전체 선택', exact: true });
    await all.click();
    // Without a selected prop the table keeps the selection itself.
    await expect(table.getByText('2개 선택', { exact: true })).toBeVisible();
    await expect(all).toBeChecked();
    await table.getByRole('button', { name: '선택 해제', exact: true }).click();
    await expect(table.getByText('2개 선택', { exact: true })).toHaveCount(0);
    // The total row names itself even when its first column has a value of its own (a count).
    await expect(table.getByText(/합계\s*3/)).toBeVisible();
    // searchMode="client": the table filters by name and owner as the query is typed.
    await table.getByRole('textbox', { name: '표 검색' }).fill('박하린');
    await expect(table.getByRole('checkbox', { name: '행 선택 결제 화면 개선' })).toBeVisible();
    await expect(table.getByRole('checkbox', { name: '행 선택 고객센터 개편' })).toHaveCount(0);
  });

  if (platform !== 'native') test(`${platform}: an expanded panel spans the whole row`, async ({ page }) => {
    await openFixture(page, platform, '', 'table-review');
    const table = page.getByTestId('expanded');
    const header = await table.locator('thead tr').first().locator('th').count();
    await expect(table.locator('.kjun-table-expanded > td')).toHaveAttribute('colspan', String(header));
    // Each toggle is named by its row, and the utility header says what its column holds.
    await expect(table.getByRole('button', { name: '행 확장 브랜드 웹사이트', exact: true })).toBeVisible();
    await expect(table.getByRole('columnheader', { name: '상세 보기' })).toHaveCount(1);
  });

  test(`${platform}: a narrow list with checkboxes keeps them reachable and is a list of rows`, async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 900 });
    await openFixture(page, platform, '', 'table-review');
    const table = page.getByTestId('list');
    await expect(table.getByRole('list', { name: '목록 표' }).getByRole('listitem')).toHaveCount(3);
    // A row with a checkbox is not one button that would swallow it on a device.
    await expect(table.getByRole('button', { name: '브랜드 웹사이트', exact: true })).toHaveCount(0);
    await table.getByRole('checkbox', { name: '행 선택 브랜드 웹사이트' }).click();
    await expect(table.getByText('1개 선택', { exact: true })).toBeVisible();
  });
}
