import { test, expect } from '@playwright/test';
import { open, configure, events, reset } from './adoption-fixture';

for (const component of ['dropdown', 'menu-button']) {
  test(`vue3 ${component} controlled visibility follows the parent, closes by Escape and restores focus`, async ({ page }) => {
    await open(page, component, true);
    const trigger = page.getByRole('button', { name: 'Actions', exact: true });
    await configure(page, { accept: false });
    await trigger.click();
    await expect(page.getByRole('menu')).toHaveCount(0);
    expect(await events(page)).toEqual([['request', true]]);
    await configure(page, { open: true });
    await expect(page.getByRole('menuitem', { name: 'First action', exact: true })).toBeFocused();
    await expect(trigger).toHaveAttribute('aria-expanded', 'true');
    await page.keyboard.press('Escape');
    await expect(page.getByRole('menu')).toBeVisible();
    expect(await events(page)).toEqual([['request', true], ['open', null], ['request', false]]);
    await configure(page, { open: false });
    await expect(page.getByRole('menu')).toHaveCount(0);
    await expect(trigger).toBeFocused();
    expect((await events(page)).filter(([name]: string[]) => name === 'close')).toHaveLength(1);
  });

  test(`vue3 ${component} handles programmatic reopen during exit and unavailable triggers`, async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await open(page, component, true);
    await configure(page, { open: true });
    await page.keyboard.press('End');
    await expect(page.getByRole('menuitem', { name: 'Last action', exact: true })).toBeFocused();
    await page.evaluate(() => (window as any).reopen());
    await expect(page.getByRole('menuitem', { name: 'First action', exact: true })).toBeFocused();
    await configure(page, { disabled: true });
    await expect(page.getByRole('menu')).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Actions', exact: true })).toBeDisabled();
    await configure(page, { disabled: false, loading: true, open: true });
    await expect(page.getByRole('menu')).toHaveCount(0);
    await configure(page, { loading: false, open: false });
    await expect(page.getByRole('button', { name: 'Actions', exact: true })).toBeEnabled();
    await configure(page, { open: true });
    await expect(page.getByRole('menu')).toBeVisible();
  });

  for (const activation of ['click', 'Enter', 'Space']) test(`vue3 ${component} forwards ${activation} events and supports stop modifiers without duplicate activation`, async ({ page }) => {
    await open(page, component);
    await page.getByRole('button', { name: 'Actions', exact: true }).press('ArrowDown');
    const first = page.getByRole('menuitem', { name: 'First action', exact: true });
    await expect(first).toBeFocused();
    await reset(page);
    if (activation === 'click') await first.click();
    else await first.press(activation);
    await expect(page.getByRole('menu')).toHaveCount(0);
    expect(await events(page)).toEqual([
      ['item', { type: activation === 'click' ? 'click' : 'keydown', key: activation === 'click' ? null : activation === 'Space' ? ' ' : 'Enter' }],
      ['request', false], ['close', null],
    ]);
  });
}

test('vue3 disabled DropdownItem emits no activation, and keyboard navigation skips it', async ({ page }) => {
  await open(page, 'dropdown');
  await page.getByRole('button', { name: 'Actions', exact: true }).click();
  await reset(page);
  const disabled = page.getByRole('menuitem', { name: 'Disabled action', exact: true });
  await disabled.dispatchEvent('click');
  await disabled.dispatchEvent('keydown', { key: 'Enter' });
  expect((await events(page)).filter(([name]: string[]) => name === 'item')).toEqual([]);
  await expect(page.getByRole('menu')).toBeVisible();
  await page.keyboard.press('ArrowDown');
  await expect(page.getByRole('menuitem', { name: 'Last action', exact: true })).toBeFocused();
});

