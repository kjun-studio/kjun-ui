import { expect, test as base, type Page } from '@playwright/test';
import { openFixture } from './packed-fixture';

const test = base.extend<{ browserErrors: string[] }>({
  browserErrors: [async ({ page }, use) => {
    const errors: string[] = [];
    page.on('pageerror', error => errors.push(error.message));
    page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
    await use(errors);
    expect(errors).toEqual([]);
  }, { auto: true }],
});
const configure = (page: Page, next: object) => page.evaluate(next => (window as any).configureMenuRegression(next), next);
const settleFocus = (page: Page) => page.evaluate(() => new Promise<void>(resolve => requestAnimationFrame(() => requestAnimationFrame(() => resolve()))));

test('vue3: a compiled trigger restores native and ARIA disabled state after parent toggles', async ({ page }) => {
  await openFixture(page, 'vue3', '', 'dropdown-regressions');
  for (let cycle = 0; cycle < 2; cycle++) {
    await configure(page, { disabled: true });
    for (const kind of ['implicit', 'explicit', 'wrapped', 'own']) {
      const button = page.getByTestId(kind).getByRole('button');
      await expect(button).toBeDisabled();
      await expect(button).toHaveAttribute('aria-disabled', 'true');
    }
    await configure(page, { disabled: false });
    for (const kind of ['implicit', 'explicit', 'wrapped']) {
      const button = page.getByTestId(kind).getByRole('button');
      await expect(button).toBeEnabled();
      await expect(button).not.toHaveAttribute('aria-disabled');
      await button.press('ArrowDown');
      await expect(page.getByRole('menuitem', { name: 'Action', exact: true })).toBeFocused();
      await page.keyboard.press('Escape');
      await expect(button).toBeFocused();
    }
    await expect(page.getByTestId('own').getByRole('button')).toBeDisabled();
    await expect(page.getByTestId('own').getByRole('button')).toHaveAttribute('aria-disabled', 'true');
  }
  await configure(page, { ownDisabled: false });
  await expect(page.getByTestId('own').getByRole('button')).toBeEnabled();
  await expect(page.getByTestId('own').getByRole('button')).not.toHaveAttribute('aria-disabled');
});

for (const motion of ['reduce', 'no-preference'] as const) {
  for (const official of [false, true]) {
    test(`vue3: restored menu focus suppresses Tooltip but later Tab and hover still open it (${official ? 'MenuButton' : 'wrapped'}, ${motion})`, async ({ page }) => {
      await page.emulateMedia({ reducedMotion: motion });
      await openFixture(page, 'vue3', '', 'dropdown-regressions');
      await configure(page, { official });
      await page.getByRole('button', { name: 'Open focus window', exact: true }).click();
      const dialog = page.getByRole('dialog', { name: 'Focus window', exact: true });
      const trigger = dialog.getByRole('button', { name: 'Focus menu', exact: true });
      const tip = page.getByRole('tooltip');
      await page.mouse.move(1100, 700);
      await page.getByTestId('before').focus();
      await page.keyboard.press('Tab');
      await expect(trigger).toBeFocused();
      await expect(tip).toHaveText('Menu hint');
      await trigger.press('ArrowDown');
      await expect(page.getByRole('menuitem', { name: 'Run action' })).toBeFocused();
      await page.keyboard.press('Escape');
      await expect(trigger).toBeFocused();
      await settleFocus(page);
      await expect(tip).toHaveCount(0);
      // The restored-focus mark must not suppress a later deliberate keyboard visit.
      await page.keyboard.press('Tab');
      await expect(page.getByTestId('after')).toBeFocused();
      await page.keyboard.press('Shift+Tab');
      await expect(tip).toHaveText('Menu hint');
      await page.keyboard.press('Escape');
      await expect(tip).toHaveCount(0);
      await expect(dialog).toBeVisible();
      await page.getByTestId('after').focus();
      await trigger.hover();
      await expect(tip).toHaveText('Menu hint');
      await page.mouse.move(1100, 700);
      await expect(tip).toHaveCount(0);
      await trigger.press('ArrowDown');
      await expect(page.getByRole('menuitem', { name: 'Run action' })).toBeFocused();
      await page.keyboard.press('Escape');
      await expect(trigger).toBeFocused();
      await settleFocus(page);
      await expect(tip).toHaveCount(0);
      await page.keyboard.press('Escape');
      await expect(dialog).toHaveCount(0);
    });
  }
}

for (const key of ['Enter', 'Space']) {
  for (const remove of [false, true]) {
    test(`vue3: ${key} executes once when its menu ${remove ? 'unmounts' : 'closes'}`, async ({ page }) => {
      await page.emulateMedia({ reducedMotion: 'reduce' });
      await openFixture(page, 'vue3', '', 'dropdown-regressions');
      if (!remove) await page.getByRole('button', { name: 'Open focus window', exact: true }).click();
      const trigger = page.getByRole('button', { name: remove ? 'Removal menu' : 'Focus menu', exact: true });
      await trigger.press('ArrowDown');
      const item = page.getByRole('menuitem', { name: remove ? 'Remove menu' : 'Run action', exact: true });
      await expect(item).toBeFocused();
      await item.press(key);
      await expect(page.getByTestId('actions')).toHaveText('1');
      await expect(page.getByRole('menu')).toHaveCount(0);
      if (remove) await expect(trigger).toHaveCount(0);
      else await expect(trigger).toBeFocused();
    });
  }
}
