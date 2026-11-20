import { expect, test, type Locator } from '@playwright/test';
import { openFixture } from './packed-fixture';

const box = (node: Locator) => node.evaluate(el => { const r = el.getBoundingClientRect(); return { top: r.top, bottom: r.bottom }; });

for (const platform of ['react', 'vue3'] as const) {
  test(`${platform}: FormGroup as="fieldset" names the choices with a legend spaced like a label`, async ({ page }) => {
    await openFixture(page, platform, '', 'form-group-fieldset');
    const group = page.getByRole('group', { name: '반복 요일' });
    await expect(group).toHaveJSProperty('tagName', 'FIELDSET');
    await expect(group).toHaveCSS('border-top-width', '0px');
    await expect(group).toHaveCSS('padding-top', '0px');
    await expect(group).toHaveAttribute('aria-describedby', 'weekdays-hint');
    const legend = group.locator('> legend');
    await expect(legend).toHaveText('반복 요일');
    // The legend keeps the label's gap to its choices, as the plain field's label does to its input.
    const legendGap = (await box(page.getByRole('checkbox', { name: '월' }).locator('xpath=ancestor::label[1]'))).top - (await box(legend)).bottom;
    const labelGap = (await box(page.locator('#name'))).top - (await box(page.locator('#name-label'))).bottom;
    expect(legendGap).toBeCloseTo(labelGap, 0);
    // The plain field still links its label by for/id.
    await expect(page.getByRole('textbox', { name: '이름' })).toHaveAttribute('id', 'name');
  });

  test(`${platform}: FormGroup as="fieldset" hands its id to the first enabled choice and reports the error`, async ({ page }) => {
    await openFixture(page, platform, '', 'form-group-fieldset');
    await expect(page.locator('#weekdays')).toHaveAttribute('type', 'checkbox');
    await expect(page.getByRole('checkbox', { name: '월' })).toHaveAttribute('id', 'weekdays');
    await expect(page.locator('[id="weekdays"]')).toHaveCount(1);
    await page.getByRole('button', { name: '저장' }).click();
    const group = page.getByRole('group', { name: '반복 요일' });
    await expect(group).toHaveAttribute('aria-describedby', 'weekdays-error');
    await expect(page.locator('#weekdays-error')).toHaveText('요일을 하나 이상 고르세요');
    await expect(page.getByRole('checkbox', { name: '월' })).toBeFocused();
    for (const day of ['월', '화', '수']) await expect(page.getByRole('checkbox', { name: day })).toHaveAttribute('aria-invalid', 'true');
    // FilterGroup: the disabled first option is skipped.
    await expect(page.getByRole('button', { name: '플러그' })).toHaveAttribute('id', 'rooms');
    await expect(page.getByRole('button', { name: '조명' })).not.toHaveAttribute('id', 'rooms');
  });

  test(`${platform}: FormGroup as="fieldset" with labelEnd reads the legend and draws one label`, async ({ page }) => {
    await openFixture(page, platform, '', 'form-group-fieldset');
    const group = page.getByRole('group', { name: '기기', exact: true });
    await expect(group).toHaveJSProperty('tagName', 'FIELDSET');
    await expect(group.locator('> legend')).toHaveClass(/kjun-sr-only/);
    const row = group.locator('.kjun-form-label-row');
    await expect(row.locator('.kjun-form-label')).toHaveAttribute('aria-hidden', 'true');
    await expect(row.locator('.kjun-form-label')).toBeVisible();
    await expect(row.locator('.kjun-form-label-end')).toHaveText('0/2');
  });
}

test('native: FormGroup as="fieldset" names a group view and describes it on the web (React Native Web only)', async ({ page }) => {
  await openFixture(page, 'native', '', 'form-group-fieldset');
  const group = page.getByRole('group', { name: '반복 요일' });
  await expect(group).toBeVisible();
  await expect(group).toHaveAttribute('aria-describedby', 'weekdays-hint');
  await expect(group.getByRole('checkbox', { name: '월' })).toBeVisible();
  await page.getByRole('button', { name: '저장' }).click();
  await expect(group).toHaveAttribute('aria-describedby', 'weekdays-error');
});
