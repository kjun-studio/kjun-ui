import { test, expect } from '@playwright/test';
import { open, configure, events, reset } from './adoption-fixture';

test('vue3 Fragment attrs reach the documented elements and preserve handlers and descriptions', async ({ page }) => {
  const warnings: string[] = [];
  page.on('console', message => { if (message.type() === 'warning') warnings.push(message.text()); });
  await open(page, 'attrs');
  const select = page.getByRole('button', { name: 'Custom select', exact: true });
  await expect(page.locator('.kjun-select-shell.custom-select')).toHaveCSS('width', '180px');
  await expect(select).toHaveAttribute('data-owner', 'select');
  await expect(select).toHaveAttribute('aria-describedby', 'extra-description');
  await select.click(); await expect(page.getByRole('listbox')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.locator('.custom-popover-trigger')).toHaveCSS('margin-top', '7px');
  await page.getByRole('button', { name: 'Popover', exact: true }).click();
  await expect(page.locator('.kjun-popover-dialog.custom-popover-panel')).toHaveCSS('width', '210px');
  await page.keyboard.press('Escape');
  // The popover returns focus to its trigger after the exit motion; moving on earlier races that return.
  await expect(page.getByRole('button', { name: 'Popover', exact: true })).toBeFocused();
  const tooltip = page.getByRole('button', { name: 'Tooltip', exact: true });
  await expect(tooltip).toHaveClass(/original-trigger/);
  await expect(tooltip).toHaveClass(/custom-tooltip-trigger/);
  await expect(tooltip).toHaveCSS('margin-left', '11px');
  await tooltip.focus(); await tooltip.hover();
  await expect(page.locator('[role="tooltip"].custom-tooltip-panel')).toBeVisible();
  await expect(tooltip).toHaveAttribute('aria-describedby', /extra-description .*kjun-tooltip/);
  await page.getByTestId('outside').click();
  await expect(tooltip).toHaveAttribute('aria-describedby', 'extra-description');
  const copy = page.getByRole('button', { name: 'Copy', exact: true });
  await expect(copy).toHaveClass(/custom-copy/);
  await expect(copy).toHaveCSS('width', '190px');
  await configure(page, { prevent: true }); await copy.click();
  expect((await events(page)).filter(([name]: string[]) => name === 'copied')).toHaveLength(0);
  await configure(page, { prevent: false }); await copy.click();
  expect((await events(page)).filter(([name]: string[]) => name === 'copied')).toEqual([['copied', 'copy me']]);
  expect((await events(page)).some(([name]: string[]) => name === 'select-focus')).toBe(true);
  expect((await events(page)).some(([name]: string[]) => name === 'tooltip-focus')).toBe(true);
  await configure(page, { styled: false });
  expect(warnings.filter(text => /Extraneous|Invalid prop/.test(text))).toEqual([]);
});

test('vue3 anchored Popover without a trigger sends attrs and listeners to its dialog', async ({ page }) => {
  await open(page, 'anchor', true);
  await configure(page, { open: true });
  const dialog = page.getByRole('dialog', { name: 'Anchored', exact: true });
  await expect(dialog).toHaveClass(/custom-anchor-panel/);
  await expect(dialog).toHaveCSS('width', '220px');
  await expect(dialog).toHaveAttribute('data-owner', 'anchor');
  await dialog.press('Tab');
  await expect(page.getByRole('button', { name: 'Inside anchor' })).toBeFocused();
  expect(await events(page)).toEqual([['anchor-key', null]]);
});

