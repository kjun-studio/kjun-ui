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
const configure = (page: Page, next: object) => page.evaluate(next => (window as any).configureFocus(next), next);
const editor = (page: Page) => page.getByRole('dialog', { name: 'Editor', exact: true });
const settleFocus = (page: Page) => page.evaluate(() => new Promise<void>(resolve => requestAnimationFrame(() => requestAnimationFrame(() => resolve()))));

test('vue3: a redirected Modal return suppresses Tooltip while later Tab still opens it', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await openFixture(page, 'vue3', '?target=ref&replace-on-close&hint', 'modal-return-focus');
  await page.getByTestId('opener').press('Enter');
  await expect(editor(page)).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByTestId('target')).toHaveText('Return 1');
  await expect(page.getByTestId('target')).toBeFocused();
  await settleFocus(page);
  await expect(page.getByRole('tooltip')).toHaveCount(0);
  await page.keyboard.press('Shift+Tab');
  await expect(page.getByTestId('opener')).toBeFocused();
  await expect(page.getByRole('tooltip')).toHaveText('Opener hint');
  await page.keyboard.press('Tab');
  await expect(page.getByRole('tooltip')).toHaveText('Return hint');
});

for (const platform of ['react', 'vue3']) {
  for (const motion of ['reduce', 'no-preference'] as const) {
    for (const kind of ['element', 'ref', 'function']) {
      test(`${platform}: Modal returnFocus accepts ${kind} after its exit (${motion})`, async ({ page }) => {
        await page.emulateMedia({ reducedMotion: motion });
        await openFixture(page, platform, '?target=' + kind, 'modal-return-focus');
        await page.getByTestId('opener').click();
        await expect(editor(page)).toBeVisible();
        await page.keyboard.press('Escape');
        await expect(editor(page)).toHaveCount(0);
        await expect(page.getByTestId('target')).toBeFocused();
        await expect(page.getByTestId('after-close')).toHaveText('1');
      });
    }
  }
  for (const motion of ['reduce', 'no-preference'] as const) for (const kind of ['ref', 'function']) {
    test(`${platform}: Modal resolves a replacement header button using ${kind} (${motion})`, async ({ page }) => {
      await page.emulateMedia({ reducedMotion: motion });
      await openFixture(page, platform, '?target=' + kind + '&menu&replace-on-close', 'modal-return-focus');
      await page.getByRole('button', { name: 'Actions', exact: true }).press('ArrowDown');
      await page.getByRole('menuitem', { name: 'Edit', exact: true }).press('Enter');
      await expect(editor(page)).toBeVisible();
      await configure(page, { generation: 1, opener: false });
      await page.getByRole('button', { name: 'Finish', exact: true }).click();
      await expect(editor(page)).toHaveCount(0);
      await expect(page.getByTestId('target')).toHaveText('Return 2');
      await expect(page.getByTestId('target')).toBeFocused();
    });
  }
  test(`${platform}: Modal reads returnFocus added and removed after opening`, async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await openFixture(page, platform, '?target=default', 'modal-return-focus');
    await page.getByTestId('opener').click();
    await configure(page, { custom: true });
    await page.keyboard.press('Escape');
    await expect(page.getByTestId('target')).toBeFocused();
    await page.getByTestId('opener').click();
    await configure(page, { custom: false });
    await page.keyboard.press('Escape');
    await expect(page.getByTestId('opener')).toBeFocused();
  });
  test(`${platform}: a missing Modal returnFocus falls back to its opener or parent window`, async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await openFixture(page, platform, '?nested', 'modal-return-focus');
    await page.getByRole('button', { name: 'Open parent' }).click();
    await page.getByTestId('opener').click();
    await configure(page, { target: false });
    await page.keyboard.press('Escape');
    await expect(page.getByTestId('opener')).toBeFocused();
    await page.getByTestId('opener').click();
    await configure(page, { opener: false });
    await page.keyboard.press('Escape');
    await expect(page.getByRole('dialog', { name: 'Parent', exact: true })).toBeFocused();
  });
  for (const motion of ['reduce', 'no-preference'] as const) test(`${platform}: a menu-opened Modal keeps its default trigger return (${motion})`, async ({ page }) => {
    await page.emulateMedia({ reducedMotion: motion });
    await openFixture(page, platform, '?target=default&menu', 'modal-return-focus');
    const trigger = page.getByRole('button', { name: 'Actions', exact: true });
    await trigger.press('ArrowDown');
    await page.getByRole('menuitem', { name: 'Edit', exact: true }).press('Enter');
    await expect(editor(page)).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(trigger).toBeFocused();
  });
  test(`${platform}: unmounting Modal restores its chosen target`, async ({ page }) => {
    await openFixture(page, platform, '', 'modal-return-focus');
    await page.getByTestId('opener').click();
    await expect(editor(page)).toBeVisible();
    await configure(page, { mounted: false });
    await expect(page.getByTestId('target')).toBeFocused();
  });
  test(`${platform}: reopening Modal during exit retains focus until the final close`, async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await openFixture(page, platform, '', 'modal-return-focus');
    await page.getByTestId('opener').click();
    await expect(editor(page)).toBeVisible();
    await page.keyboard.press('Escape');
    await configure(page, { open: true });
    await settleFocus(page);
    await expect(editor(page)).toBeVisible();
    await expect(page.getByTestId('after-close')).toHaveText('0');
    await expect(page.getByTestId('target')).not.toBeFocused();
    await page.keyboard.press('Escape');
    await expect(page.getByTestId('target')).toBeFocused();
    await expect(page.getByTestId('after-close')).toHaveText('1');
  });
}
