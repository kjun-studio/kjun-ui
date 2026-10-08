import { test, expect, type Locator } from '@playwright/test';
import { openFixture } from './packed-fixture';

test.use({ reducedMotion: 'reduce' });

async function expectOnlyListScroll(list: Locator) {
  const geometry = await list.evaluate(element => {
    const panel = element.closest('.kjun-floating')!;
    const ancestors = [];
    for (let current = element.parentElement; current; current = current.parentElement) {
      ancestors.push({ overflow: current.scrollHeight - current.clientHeight, top: current.scrollTop });
      if (current === panel) break;
    }
    const bounds = panel.getBoundingClientRect();
    return { ancestors, listOverflow: element.scrollHeight - element.clientHeight, top: bounds.top, bottom: bounds.bottom,
      width: bounds.width, height: bounds.height, viewportHeight: innerHeight, viewportWidth: innerWidth };
  });
  expect(geometry.listOverflow).toBeGreaterThan(1);
  for (const ancestor of geometry.ancestors) {
    expect(ancestor.overflow).toBeLessThanOrEqual(1);
    expect(ancestor.top).toBe(0);
  }
  expect(geometry.top).toBeGreaterThanOrEqual(0);
  expect(geometry.bottom).toBeLessThanOrEqual(geometry.viewportHeight);
  expect(geometry.width).toBeLessThanOrEqual(geometry.viewportWidth);
  expect(geometry.height).toBeLessThanOrEqual(240);
}

async function expectOptionInsideList(option: Locator, list: Locator) {
  // Keyboard focus scrolls the list after the focus change is committed.
  await expect.poll(async () => {
    const row = (await option.boundingBox())!, bounds = (await list.boundingBox())!;
    return row.y >= bounds.y - 1 && row.y + row.height <= bounds.y + bounds.height + 1;
  }).toBe(true);
}

for (const viewport of [{ width: 1280, height: 800 }, { width: 375, height: 320 }, { width: 320, height: 320 }]) {
  test(`Select has one scroll owner and reaches the last option at ${viewport.width}x${viewport.height}`, async ({ page }) => {
    await page.setViewportSize(viewport);
    await openFixture(page, 'react', viewport.height === 320 ? '?low' : '', 'select-scroll');
    const trigger = page.getByRole('button', { name: '검사 선택', exact: true });
    await trigger.click();
    const list = page.getByRole('listbox');
    await expect(list).toBeVisible();
    await expectOnlyListScroll(list);
    await page.getByRole('option').first().press('End');
    const last = page.getByRole('option', { name: '항목 24', exact: true });
    await expect(last).toBeFocused();
    await expectOptionInsideList(last, list);
    await expectOnlyListScroll(list);
    await last.press('Enter');
    await expect(list).toBeHidden();
    await expect(trigger).toBeFocused();
    await expect(page.getByTestId('selection')).toHaveText('"24"');
    await trigger.click();
    await page.keyboard.press('Escape');
    await expect(list).toBeHidden();
    await expect(trigger).toBeFocused();
  });
}

test('Select keeps search, header and more action fixed while paging and selecting multiple values', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 400 });
  await openFixture(page, 'react', '?search&paged&multiple&low', 'select-scroll');
  await page.getByRole('button', { name: '검사 선택', exact: true }).click();
  const list = page.getByRole('listbox');
  const search = page.getByRole('textbox', { name: '선택 항목 검색' });
  const header = page.getByTestId('menu-header');
  const more = page.getByRole('button', { name: '더 보기', exact: true });
  await expect(search).toBeFocused();
  await expect(page.getByRole('option')).toHaveCount(8);
  const fixed = await Promise.all([search.boundingBox(), header.boundingBox(), more.boundingBox()]);
  await search.press('ArrowDown');
  await page.getByRole('option').first().press('End');
  await expectOptionInsideList(page.getByRole('option').last(), list);
  await expectOnlyListScroll(list);
  expect(await Promise.all([search.boundingBox(), header.boundingBox(), more.boundingBox()])).toEqual(fixed);
  await more.click();
  await expect(page.getByRole('option')).toHaveCount(16);
  await page.getByRole('option').first().press('End');
  await page.getByRole('option').last().press('Enter');
  await expect(list).toBeVisible();
  await expect(page.getByTestId('selection')).toHaveText('["16"]');
  await search.fill('07');
  await expect(page.getByRole('option')).toHaveCount(1);
  await page.getByRole('option').click();
  await expect(page.getByTestId('selection')).toHaveText('["16","7"]');
  await expect(more).toBeHidden();
});

test('Select wraps long options and wheel scroll stays inside the list', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 640 });
  await openFixture(page, 'react', '?long', 'select-scroll');
  await page.getByRole('button', { name: '검사 선택', exact: true }).click();
  const list = page.getByRole('listbox');
  await list.hover();
  await page.mouse.wheel(0, 300);
  await expect.poll(() => list.evaluate(el => el.scrollTop)).toBeGreaterThan(0);
  await expectOnlyListScroll(list);
  expect(await list.evaluate(el => el.scrollWidth - el.clientWidth)).toBeLessThanOrEqual(1);
  await page.getByRole('option').first().press('End');
  await expectOptionInsideList(page.getByRole('option').last(), list);
});

test('Short, empty and loading Select menus do not acquire an unnecessary scrollbar', async ({ page }) => {
  for (const query of ['?short', '?empty&search', '?loading&search']) {
    await openFixture(page, 'react', query, 'select-scroll');
    await page.getByRole('button', { name: '검사 선택', exact: true }).click();
    const panel = page.locator('.kjun-select-options-panel');
    await expect(panel).toBeVisible();
    expect(await panel.evaluate(el => [el, ...el.querySelectorAll('*')].filter(item => {
      const style = getComputedStyle(item);
      return /auto|scroll/.test(style.overflowY) && item.scrollHeight > item.clientHeight + 1;
    }).length)).toBe(0);
    if (query.includes('empty')) await expect(page.getByText('결과가 없습니다')).toBeVisible();
    if (query.includes('loading')) await expect(page.getByText('검색 중...')).toBeVisible();
  }
});

test('The shared Combobox popup retains its existing scroll and keyboard selection', async ({ page }) => {
  await openFixture(page, 'react', '?combobox', 'select-scroll');
  const input = page.getByRole('combobox');
  await input.click();
  await input.press('End');
  const last = page.getByRole('option', { name: '항목 24', exact: true });
  await expect(last).toBeInViewport();
  await input.press('Enter');
  await expect(page.getByTestId('selection')).toHaveText('"24"');
});
