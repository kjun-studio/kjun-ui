import { test, expect } from '@playwright/test';

test('React adoption API documents mixed selection and numeric value formatting at 320px', async ({ page }) => {
  test.setTimeout(120000);
  await page.setViewportSize({ width: 320, height: 800 });
  for (const [slug, name, description] of [
    ['checkbox', 'indeterminate', 'mixed'], ['slider', 'formatValue', 'aria-valuetext'],
    ['range-slider', 'formatValue', 'onChangeCommit'], ['popover', 'trigger', '실제 트리거'],
    ['tabs', 'actions', 'Select·Dropdown'],
  ]) {
    await page.goto(`/components/${slug}?platform=react`);
    const api = page.locator('#api');
    await expect(api.locator('.api-platform')).toContainText('@kjun-ui/react');
    const row = api.getByRole('table', { name: '속성', exact: true }).getByRole('row').filter({
      has: page.locator('code.api-member-anchor', { hasText: new RegExp(`^${name}$`) }),
    });
    await expect(row).toHaveCount(1);
    if (name === 'formatValue') {
      await row.getByRole('button', { name: 'formatValue 사용 계약', exact: true }).click();
      await expect(api.locator('.api-member-details')).toContainText(description);
    } else await expect(row).toContainText(description);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  }
});

test('Vue adoption API documents controlled menus, missing values and display options at 320px', async ({ page }) => {
  test.setTimeout(180000);
  await page.setViewportSize({ width: 320, height: 800 });
  const contracts: [string, string[]][] = [
    ['tabs', ['stickyHeader', 'stickyOffset']],
    ['slider', ['showValue', 'formatValue']],
    ['range-slider', ['showValue', 'formatValue']],
    ['dropdown', ['open']], ['menu-button', ['open']],
    ['progress', ['indeterminate']],
    ['tooltip', ['panelClass', 'panelStyle']], ['popover', ['panelClass', 'panelStyle']],
  ];
  for (const [slug, props] of contracts) {
    await page.goto(`/components/${slug}?platform=vue3`);
    const api = page.locator('#api');
    await expect(api.locator('.api-platform')).toContainText('@kjun-ui/vue3');
    const table = api.getByRole('table', { name: '속성', exact: true });
    for (const name of props) await expect(table.getByRole('row').filter({ has: page.locator('code.api-member-anchor', { hasText: new RegExp(`^${name}$`) }) })).toHaveCount(1);
    if (slug === 'progress') {
      const value = table.getByRole('row').filter({ has: page.locator('code.api-member-anchor', { hasText: /^value$/ }) });
      await expect(value).toContainText('number | null');
      await expect(value).toContainText('0%로 바꾸지 않습니다');
    }
    if (slug === 'dropdown' || slug === 'menu-button') await expect(api.getByRole('table', { name: '이벤트', exact: true })).toContainText('update:open');
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  }
});
