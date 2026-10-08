import { openExampleSettings } from './example-settings';
import { test, expect } from '@playwright/test';
import { tokens } from '../../../packages/tokens/dist/index.js';

test('the docs shell renders packed KJUN geometry and keeps platform previews independent', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('/components/button?platform=vue2');
  const search = page.getByRole('button', { name: '문서 검색', exact: true });
  await expect(search).toBeEnabled();
  await expect(search).toHaveClass(/kjun-button/);
  await expect(search).toHaveCSS('height', `${tokens.button.heights.sm}px`);
  await expect(search).toHaveCSS('border-radius', `${tokens.button.radii.sm}px`);
  const platform = page.getByRole('button', { name: '문서 플랫폼', exact: true });
  await expect(platform).toHaveClass(/kjun-select-trigger/);
  await expect(platform).toHaveCSS('height', `${tokens.input.sm.height}px`);
  await expect(page.locator('.catalog-playground iframe')).toHaveAttribute('src', /catalog-vue2/);
  await platform.click();
  await page.getByRole('option', { name: 'React', exact: true }).click();
  await expect(page.locator('.catalog-playground iframe')).toHaveAttribute('src', /catalog-react/);
  await expect(search).toHaveCSS('border-radius', `${tokens.button.radii.sm}px`);
  await openExampleSettings(page);
  const disabled = page.getByRole('switch', { name: '비활성', exact: true });
  await disabled.locator('xpath=ancestor::label').click();
  await expect(disabled).toBeChecked();
  await expect(page.frameLocator('.catalog-playground iframe').getByRole('button', { name: '계속하기', exact: true })).toBeDisabled();
  await disabled.focus();
  await page.keyboard.press('Space');
  await expect(disabled).not.toBeChecked();
  await search.click();
  const dialog = page.getByRole('dialog', { name: '문서 검색', exact: true });
  await expect(dialog).toHaveClass(/kjun-modal-dialog/);
  await expect(dialog.getByRole('combobox')).toHaveClass(/kjun-input/);
  await page.keyboard.press('Escape');
  await expect(search).toBeFocused();
  expect(errors).toEqual([]);
});

test('mobile navigation uses KJUN Drawer and restores focus after closing', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/components?platform=react');
  await expect(page.getByRole('button', { name: '문서 검색', exact: true })).toBeEnabled();
  const trigger = page.getByRole('button', { name: '탐색 메뉴', exact: true });
  await trigger.click();
  const drawer = page.getByRole('dialog', { name: '문서 탐색', exact: true });
  await expect(drawer).toHaveClass(/kjun-drawer-dialog/);
  await expect(drawer.getByRole('navigation', { name: '문서 탐색' })).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(drawer).not.toBeVisible();
  await expect(trigger).toBeFocused();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

test('changing a search query reveals the newly selected first result', async ({ page }) => {
  await page.goto('/components?platform=react');
  await page.getByRole('button', { name: '문서 검색', exact: true }).click();
  const input = page.getByRole('combobox', { name: '문서 검색어' });
  const results = page.getByRole('listbox', { name: '문서 검색 결과' });
  await input.fill('a');
  const box = (await results.boundingBox())!;
  await results.hover({ position: { x: box.width - 2, y: 2 } });
  await page.mouse.wheel(0, 450);
  await expect.poll(() => results.evaluate(node => node.scrollTop)).toBeGreaterThan(300);
  await expect(results.getByRole('option').first()).toHaveAttribute('aria-selected', 'true');
  await input.fill('b');
  await expect(results.getByRole('option').first()).toHaveAttribute('aria-selected', 'true');
  await expect(results.getByRole('option').first()).toBeInViewport({ ratio: 1 });
  await expect.poll(() => results.evaluate(node => node.scrollTop)).toBe(0);
});

test('search opened above the mobile drawer accepts typing and restores the drawer focus', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/components?platform=react');
  await expect(page.getByRole('button', { name: '문서 검색', exact: true })).toBeEnabled();
  const menu = page.getByRole('button', { name: '탐색 메뉴', exact: true });
  await menu.click();
  const drawer = page.getByRole('dialog', { name: '문서 탐색', exact: true });
  const closeDrawer = drawer.getByRole('button', { name: '닫기', exact: true });
  await closeDrawer.focus();
  const input = page.getByRole('combobox', { name: '문서 검색어' });
  for (const shortcut of ['Control+k', 'Meta+k']) {
    await page.keyboard.press(shortcut);
    await expect(input).toBeFocused();
    await page.keyboard.type('Button');
    await expect(input).toHaveValue('Button');
    await page.keyboard.press('Tab');
    await expect(page.getByRole('button', { name: '검색 닫기' })).toBeFocused();
    await page.keyboard.press('Escape');
    await expect(input).not.toBeVisible();
    await expect(closeDrawer).toBeFocused();
  }
  await page.keyboard.press('Escape');
  await expect(drawer).not.toBeVisible();
  await expect(menu).toBeFocused();
});

test('the platform popup closes on Escape before autofocus finishes', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/components?platform=react');
  await expect(page.getByRole('button', { name: '문서 검색', exact: true })).toBeEnabled();
  const trigger = page.getByRole('button', { name: '문서 플랫폼', exact: true });
  for (let attempt = 0; attempt < 3; attempt++) {
    await trigger.press('Enter');
    await page.getByRole('listbox', { name: '문서 플랫폼', exact: true }).waitFor();
    // Do not wait for popup focus: Escape must also work during the opening transition.
    await page.keyboard.press('Escape');
    await expect(trigger).toHaveAttribute('aria-expanded', 'false');
    await expect(page.getByRole('listbox', { name: '문서 플랫폼', exact: true })).not.toBeVisible();
    await expect(trigger).toBeFocused();
    await expect(trigger).toContainText('React');
  }
});

test("styling documentation starts with core roles and lists optional connections", async ({ page }) => {
  await page.goto("/styling");
  const web = await page.locator("#web code").first().innerText();
  expect(web.match(/--kjun-[\w-]+:/g)).toHaveLength(tokens.coreColorRoles.length + 1); // Core colors plus the app font.
  const native = await page.locator("#native code").first().innerText();
  expect(native.match(/: colors\./g)).toHaveLength(tokens.coreColorRoles.length);
  await expect(page.locator("#optional-colors tbody tr")).toHaveCount(tokens.colorRoles.length - tokens.coreColorRoles.length);
  await page.goto("/styling#optional-colors");
  await expect(page.locator("#optional-colors h2")).toBeInViewport();
});
