import { test, expect } from '@playwright/test';
import { openFixture } from './packed-fixture';

for (const keyboard of [false, true]) {
  test(`react: mixed Checkbox announces partial selection and selects all (${keyboard ? 'keyboard' : 'pointer'})`, async ({ page }) => {
    await openFixture(page, 'react', '?mode=checkbox', 'adoption-controls');
    const input = page.getByRole('checkbox', { name: '전체 선택' });
    await expect(input).toBeChecked({ indeterminate: true });
    await expect(input).toMatchAriaSnapshot('- checkbox "전체 선택" [checked=mixed]');
    await expect(page.locator('.kjun-checkbox')).toHaveClass(/kjun-checkbox--checked/);
    await expect(page.locator('.kjun-checkbox svg path')).toHaveAttribute('d', 'M5 12l14 0');
    if (keyboard) await input.press('Space'); else await page.getByText('전체 선택', { exact: true }).click();
    await expect(input).toBeChecked();
    await expect(input).toHaveJSProperty('indeterminate', false);
    await expect(page.getByTestId('changes')).toHaveText('[true]');
    await input.press('Space');
    await expect(input).not.toBeChecked();
    await expect(page.getByTestId('changes')).toHaveText('[true,false]');
  });
}

test('react: mixed Checkbox preserves disabled, controlled rejection and array contracts', async ({ page }) => {
  await openFixture(page, 'react', '?mode=checkbox', 'adoption-controls');
  const input = page.getByRole('checkbox', { name: '전체 선택' });
  await page.evaluate(() => (window as any).configureAdoptionControls({ disabled: true }));
  await expect(input).toBeDisabled();
  const label = (await page.getByText('전체 선택', { exact: true }).boundingBox())!;
  await page.mouse.click(label.x + label.width / 2, label.y + label.height / 2);
  await expect(input).toHaveJSProperty('indeterminate', true);
  await expect(page.getByTestId('changes')).toHaveText('[]');
  await page.evaluate(() => (window as any).configureAdoptionControls({ disabled: false, accept: false }));
  await expect(input).toBeEnabled();
  await input.press('Space');
  await expect(input).toHaveJSProperty('checked', false);
  await expect(input).toHaveJSProperty('indeterminate', true);
  await expect(page.getByTestId('changes')).toHaveText('[true]');
  await page.evaluate(() => (window as any).configureAdoptionControls({ accept: true, value: ['two'] }));
  await input.press('Space');
  await expect(page.getByTestId('changes')).toHaveText('[true,["two","one"]]');
  await input.press('Space');
  await expect(page.getByTestId('changes')).toHaveText('[true,["two","one"],["two"]]');
});
