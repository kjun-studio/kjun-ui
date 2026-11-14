import { test, expect } from '@playwright/test';

test('Vue field contracts retain null and IconToggle documents standard accessible names', async ({ page }) => {
  for (const slug of ['input', 'textarea', 'date-picker']) {
    await page.goto(`/components/${slug}?platform=vue3`);
    const row = page.locator('#api').getByRole('table', { name: '속성', exact: true }).getByRole('row').filter({
      has: page.locator('code.api-member-anchor', { hasText: /^modelValue$/ }),
    });
    await expect(row).toContainText('null');
    await expect(row).toContainText('부모 값을 바꾸거나');
    await expect(row).toContainText('빈 문자열');
  }
  await page.goto('/components/icon-toggle?platform=vue3');
  const label = page.locator('#api').getByRole('table', { name: '속성', exact: true }).getByRole('row').filter({
    has: page.locator('code.api-member-anchor', { hasText: /^ariaLabel$/ }),
  });
  await expect(label).toContainText('aria-label');
  await expect(label).toContainText('aria-labelledby');
  // Every row carries the column's own label ("필수"); the value beside it says whether the prop is required.
  await expect(label.locator('.api-member-required > span:not(.api-cell-label)')).toHaveText('선택');
});

test('Modal documents live returnFocus targets on React and Vue only', async ({ page }) => {
  for (const platform of ['react', 'vue3', 'native']) {
    await page.goto(`/components/modal?platform=${platform}`);
    const api = page.locator('#api');
    await expect(api.locator('.api-platform')).toContainText('@kjun-ui/' + platform);
    const row = api.getByRole('table', { name: '속성', exact: true }).getByRole('row').filter({
      has: page.locator('code.api-member-anchor', { hasText: /^returnFocus$/ }),
    });
    await expect(row).toHaveCount(platform === 'native' ? 0 : 1);
    if (platform !== 'native') {
      await expect(row).toContainText('요소·ref·요소를 돌려주는 함수');
      await expect(row).toContainText('닫힐 때 최신 값');
    }
  }
});

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
