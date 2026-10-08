import { test, expect, type Page } from '@playwright/test';
import { openFixture } from './packed-fixture';

const configure = (page: Page, value: object) => page.evaluate(value => (window as any).configureReview(value), value);
async function openEditor(page: Page, platform: string, value: object = {}) {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await openFixture(page, platform, '', 'review-contract');
  await configure(page, value);
  await page.getByRole('button', { name: 'Open', exact: true }).click();
  return page.getByRole('spinbutton');
}

for (const platform of ['react', 'vue2', 'native']) {
  for (const layerKind of ['modal', 'drawer']) for (const closeOnEsc of [true, false]) {
    test(`${platform}: ${layerKind} lets an editor cancel before dismissal (closeOnEsc=${closeOnEsc})`, async ({ page }) => {
      const input = await openEditor(page, platform, { layerKind, closeOnEsc });
      await input.fill('9');
      await input.press('Escape');
      await expect(input).toHaveValue('2');
      await expect(input).toBeFocused();
      await expect(page.getByTestId('events')).toHaveText('[]');
      await expect(page.getByRole('dialog', { name: 'Editor', exact: true })).toBeVisible();
      if (!closeOnEsc) {
        await input.press('Escape');
        await expect(input).toBeFocused();
        await configure(page, { closeOnEsc: true });
        // Layer Escape is a document listener, so let the prop change render before pressing again.
        await page.evaluate(() => new Promise<void>(resolve => requestAnimationFrame(() => requestAnimationFrame(() => resolve()))));
      }
      await input.press('Escape');
      await expect(page.getByRole('dialog')).toHaveCount(0);
      await expect(page.getByRole('button', { name: 'Open', exact: true })).toBeFocused();
      await expect(page.getByTestId('events')).toHaveText('[]');
    });
  }

  test(`${platform}: an editor can prevent Escape without stopping propagation, and receives keyup`, async ({ page }) => {
    await openEditor(page, platform);
    const control = page.getByRole('button', { name: 'Other field', exact: true });
    await control.evaluate(el => {
      Object.assign(window, { editorKeyups: 0, parentEscapes: 0 });
      el.addEventListener('keydown', event => { if ((event as KeyboardEvent).key === 'Escape') event.preventDefault(); });
      el.addEventListener('keyup', event => { if ((event as KeyboardEvent).key === 'Escape') (window as any).editorKeyups++; });
      window.addEventListener('keydown', event => { if (event.key === 'Escape') (window as any).parentEscapes++; });
    });
    await control.press('Escape');
    await expect(control).toBeFocused();
    expect(await page.evaluate(() => [(window as any).editorKeyups, (window as any).parentEscapes])).toEqual([1, 0]);
    await page.getByRole('spinbutton').press('Escape');
    await expect(page.getByRole('dialog')).toHaveCount(0);
    expect(await page.evaluate(() => (window as any).parentEscapes)).toBe(0);
  });

  test(`${platform}: composing and repeated Escape preserve the editor and its window`, async ({ page }) => {
    const input = await openEditor(page, platform);
    await input.fill('9');
    await input.dispatchEvent('compositionstart');
    await input.press('Escape');
    await expect(input).toHaveValue('9');
    await input.dispatchEvent('compositionend', { data: '9' });
    await input.dispatchEvent('keydown', { key: 'Escape', repeat: true });
    await input.dispatchEvent('keyup', { key: 'Escape' });
    await expect(input).toHaveValue('9');
    await expect(page.getByTestId('events')).toHaveText('[]');
    await input.press('Escape');
    await expect(input).toHaveValue('2');
    await input.press('Escape');
    await expect(page.getByRole('dialog')).toHaveCount(0);
  });
}

for (const platform of ['react', 'vue2', 'native']) {
  test(`${platform}: Modal keeps its accessible name when the header is hidden`, async ({ page }) => {
    await openEditor(page, platform, { showHeader: false });
    await expect(page.getByRole('dialog', { name: 'Editor', exact: true })).toBeVisible();
    await configure(page, { dialogLabel: 'Explicit name' });
    await expect(page.getByRole('dialog', { name: 'Explicit name', exact: true })).toBeVisible();
    await configure(page, { dialogLabel: undefined, dialogTitle: '' });
    await expect(page.getByRole('dialog', { name: '대화상자', exact: true })).toBeVisible();
  });
}

test('vue2: Modal names custom headers and gives explicit names priority', async ({ page }) => {
  await openEditor(page, 'vue2', { customHeader: true });
  await expect(page.getByRole('dialog', { name: 'Custom heading', exact: true })).toBeVisible();
  await configure(page, { dialogLabel: 'Explicit name' });
  await expect(page.getByRole('dialog', { name: 'Explicit name', exact: true })).toBeVisible();
  await configure(page, { dialogLabel: undefined, showHeader: false });
  await expect(page.getByRole('dialog', { name: 'Editor', exact: true })).toBeVisible();
  await configure(page, { customHeader: false, showHeader: true, dialogTitle: '' });
  await expect(page.getByRole('dialog', { name: '대화상자', exact: true })).toBeVisible();
  await configure(page, { customHeader: true });
  await expect(page.getByRole('dialog', { name: 'Custom heading', exact: true })).toBeVisible();
  await configure(page, { customHeader: false });
  await expect(page.getByRole('dialog', { name: '대화상자', exact: true })).toBeVisible();
});

test('native: Drawer exposes its title, explicit name and fallback as a dialog', async ({ page }) => {
  await openEditor(page, 'native', { layerKind: 'drawer' });
  await expect(page.getByRole('dialog', { name: 'Editor', exact: true })).toHaveAttribute('aria-modal', 'true');
  await configure(page, { dialogLabel: 'Explicit name' });
  await expect(page.getByRole('dialog', { name: 'Explicit name', exact: true })).toBeVisible();
  await configure(page, { dialogLabel: undefined, dialogTitle: '' });
  await expect(page.getByRole('dialog', { name: '패널', exact: true })).toBeVisible();
});

for (const layerKind of ['modal', 'drawer']) test(`react: ${layerKind} retains editor cancellation and dismissal without a Provider`, async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await openFixture(page, 'react', '?unscoped', 'review-contract');
  await configure(page, { layerKind });
  await page.getByRole('button', { name: 'Open', exact: true }).click();
  const input = page.getByRole('spinbutton');
  await input.fill('9');
  await input.press('Escape');
  await expect(input).toHaveValue('2');
  await expect(input).toBeFocused();
  await input.press('Escape');
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Open', exact: true })).toBeFocused();
});
