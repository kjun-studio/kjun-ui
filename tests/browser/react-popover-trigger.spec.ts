import { test, expect } from '@playwright/test';
import { openFixture } from './packed-fixture';

for (const kind of ['native', 'kjun', 'custom', 'tooltip', 'wrapped', 'function']) {
  test(`react: Popover puts expanded and controls on its ${kind} trigger`, async ({ page }) => {
    await openFixture(page, 'react', '?mode=popover&kind=' + kind, 'adoption-controls');
    const button = page.getByRole('button', { name: '열기', exact: true });
    await expect(button).toHaveAttribute('aria-haspopup', 'dialog');
    await expect(button).toHaveAttribute('aria-expanded', 'false');
    await expect(button).not.toHaveAttribute('aria-controls');
    await expect(button).toHaveAttribute('id', 'original-trigger');
    expect(await button.evaluate(el => el === (window as any).adoptionTriggerRef.current)).toBe(true);
    await expect(page.locator('.kjun-layer-trigger[aria-expanded]')).toHaveCount(0);
    await button.press('Enter');
    const dialog = page.getByRole('dialog', { name: '상세 정보' });
    await expect(dialog).toBeVisible();
    await expect(button).toHaveAttribute('aria-expanded', 'true');
    await expect(button).toHaveAttribute('aria-controls', (await dialog.getAttribute('id'))!);
    await expect(page.getByTestId('clicks')).toHaveText('1');
    await page.keyboard.press('Escape');
    await expect(dialog).toHaveCount(0);
    await expect(button).toHaveAttribute('aria-expanded', 'false');
    await expect(button).not.toHaveAttribute('aria-controls');
    await expect(button).toBeFocused();
    await button.press('Space');
    await expect(dialog).toBeVisible();
    await dialog.getByRole('button', { name: '닫기' }).click();
    await expect(button).toHaveAttribute('aria-expanded', 'false');
    await expect(button).toBeFocused();
  });
}

test('react: Popover manual control updates trigger ARIA and disabled buttons cannot open it', async ({ page }) => {
  await openFixture(page, 'react', '?mode=popover&kind=kjun', 'adoption-controls');
  const button = page.getByRole('button', { name: '열기', exact: true });
  await page.evaluate(() => (window as any).configureAdoptionControls({ controlled: true, manual: true, open: true }));
  await expect(button).toHaveAttribute('aria-expanded', 'true');
  await page.evaluate(() => (window as any).configureAdoptionControls({ open: false, disabled: true, manual: false }));
  await expect(button).toBeDisabled();
  await button.dispatchEvent('click');
  await expect(button).toHaveAttribute('aria-expanded', 'false');
  await expect(page.getByTestId('changes')).toHaveText('[]');
});
