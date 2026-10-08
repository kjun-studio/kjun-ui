import { expect, test, type Page, type Locator } from '@playwright/test';
import { openFixture } from './packed-fixture';
const long = 'Save changes and continue to next step';
const configure = async (page: Page, next: object) => {
  await page.evaluate(next => (window as any).configureActions(next), next);
  await expect.poll(async () => JSON.parse((await page.getByTestId('config').textContent())!)).toMatchObject(next);
};
const buttons = (page: Page) => page.getByTestId('container').getByRole('button');
const rect = (node: Locator) => node.evaluate(el => { const b = el.getBoundingClientRect(); return { x: b.x, y: b.y, width: b.width, height: b.height }; });
const assertContained = async (container: Locator) => {
  await expect.poll(() => container.evaluate(el => {
    const r = el.getBoundingClientRect();
    return [...el.querySelectorAll('button,[role="button"]')].every(button => {
      const b = button.getBoundingClientRect();
      return b.left >= r.left - 1 && b.right <= r.right + 1 && button.scrollWidth <= button.clientWidth + 1;
    });
  })).toBe(true);
};

for (const platform of ['react', 'vue2', 'native']) {
  test(`${platform}: FormActions retains Button geometry and row spacing at each size`, async ({ page }) => {
    await openFixture(page, platform, '', 'form-actions');
    for (const [size, height, radius] of [['sm', 32, 10], ['md', 40, 12], ['lg', 48, 14]] as const) {
      await configure(page, { size });
      await expect(buttons(page).nth(1)).toHaveCSS('height', `${height}px`);
      await expect(buttons(page).nth(1)).toHaveCSS('border-radius', `${radius}px`);
      const first = await rect(buttons(page).nth(0)), second = await rect(buttons(page).nth(1));
      expect(first.y).toBe(second.y);
      expect(second.x - first.x - first.width).toBeCloseTo(8, 0);
      expect(second.width).toBe((await rect(page.getByTestId('reference').getByRole('button'))).width);
    }
  });

  test(`${platform}: FormActions stacks by content and returns to a row after resize or label change`, async ({ page }) => {
    await openFixture(page, platform, '', 'form-actions');
    await configure(page, { width: 288, cancelText: 'Cancel', confirmText: long });
    await expect(buttons(page).nth(0)).toHaveCSS('width', '288px');
    await expect(buttons(page).nth(1)).toHaveCSS('width', '288px');
    await expect.poll(async () => (await rect(buttons(page).nth(1))).height).toBeGreaterThan(48);
    const a = await rect(buttons(page).nth(0)), b = await rect(buttons(page).nth(1));
    expect(b.y - a.y - a.height).toBeCloseTo(8, 0);
    await assertContained(page.getByTestId('container'));
    await configure(page, { width: 800 });
    await expect.poll(async () => (await rect(buttons(page).nth(0))).y === (await rect(buttons(page).nth(1))).y).toBe(true);
    await expect(buttons(page).nth(1)).toHaveCSS('height', '48px');
    await configure(page, { width: 200, confirmText: '변경 사항 저장', cancelText: '취소' });
    await expect(buttons(page).nth(0)).toHaveCSS('width', '200px');
    await configure(page, { confirmText: '저장' });
    await expect.poll(async () => (await rect(buttons(page).nth(0))).y === (await rect(buttons(page).nth(1))).y).toBe(true);
  });

  test(`${platform}: FormActions contains unbroken text and single actions`, async ({ page }) => {
    await openFixture(page, platform, '', 'form-actions');
    await configure(page, { width: 200, cancelText: 'PreviousStepWithoutAnySpacesAtAll', confirmText: 'SaveAndContinueWithoutAnySpacesAtAll' });
    await expect(buttons(page).nth(1)).toHaveCSS('width', '200px');
    await assertContained(page.getByTestId('container'));
    await configure(page, { showCancel: false });
    await expect(buttons(page)).toHaveCount(1);
    await assertContained(page.getByTestId('container'));
    await configure(page, { showConfirm: false });
    await expect(buttons(page)).toHaveCount(0);
    await configure(page, { showCancel: true, showConfirm: true, cancelText: '취소', confirmText: '저장' });
    await expect(buttons(page)).toHaveCount(2);
    await expect.poll(async () => (await rect(buttons(page).nth(0))).y === (await rect(buttons(page).nth(1))).y).toBe(true);
  });

  test(`${platform}: FormActions loading preserves wrapped bounds and keyboard actions`, async ({ page }) => {
    await page.clock.install({ time: new Date('2026-09-26T00:00:00Z') });
    await page.clock.pauseAt(new Date('2026-09-26T00:00:01Z'));
    await openFixture(page, platform, '', 'form-actions');
    await configure(page, { width: 288, cancelText: 'Cancel', confirmText: long });
    await page.clock.runFor(50);
    await expect(buttons(page).nth(1)).toHaveCSS('width', '288px');
    const before = await rect(buttons(page).nth(1));
    await configure(page, { loading: true });
    await expect(buttons(page).nth(1)).toBeDisabled();
    await expect(buttons(page).nth(1)).toHaveAccessibleName(long);
    await expect(buttons(page).nth(1)).toHaveCSS('opacity', '1');
    expect(await rect(buttons(page).nth(1))).toEqual(before);
    await buttons(page).nth(0).focus();
    await page.keyboard.press('Enter');
    await expect(page.getByTestId('events')).toHaveText('cancel');
    await configure(page, { loading: false });
    await page.clock.runFor(390);
    await expect(buttons(page).nth(1)).toBeDisabled();
    await page.clock.runFor(20);
    await expect(buttons(page).nth(1)).toBeEnabled();
    await buttons(page).nth(1).focus();
    await page.keyboard.press('Space');
    await expect(page.getByTestId('events')).toHaveText('cancel,confirm');
    await configure(page, { cancelDisabled: true, confirmDisabled: true });
    for (const button of await buttons(page).all()) { await expect(button).toBeDisabled(); await expect(button).toHaveCSS('opacity', '1'); }
  });

  test(`${platform}: FormActions adapts inside BottomActionBar and Modal`, async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 800 });
    await openFixture(page, platform, '', 'form-actions');
    await configure(page, { context: 'bar', width: 288, cancelText: 'Cancel', confirmText: long });
    await assertContained(page.getByTestId('container'));
    await expect.poll(async () => (await rect(buttons(page).nth(1))).height).toBeGreaterThan(48);
    await page.setViewportSize({ width: 1000, height: 800 });
    await configure(page, { width: 720 });
    await assertContained(page.getByTestId('container'));
    await expect.poll(async () => (await rect(buttons(page).nth(0))).y === (await rect(buttons(page).nth(1))).y).toBe(true);
    expect((await rect(page.getByText('변경 사항을 저장하세요.', { exact: true }))).width).toBeGreaterThan(80);
    await page.setViewportSize({ width: 360, height: 800 });
    await configure(page, { context: 'modal' });
    const dialog = page.getByRole('dialog', { name: '작업 확인' });
    await expect(dialog).toBeVisible();
    await assertContained(dialog);
    const confirm = dialog.getByRole('button', { name: long, exact: true });
    await expect.poll(async () => (await rect(confirm)).height).toBeGreaterThan(48);
    await confirm.click();
    await expect(page.getByTestId('events')).toHaveText('confirm');
  });

  test(`${platform}: FormActions documentation renders comparisons and narrow presets from packed packages`, async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', error => errors.push(error.message));
    await openFixture(page, platform, '?component=DsFormActions', 'catalog');
    const controls = page.getByRole('button');
    await expect(controls).toHaveCount(2);
    let revision = 0;
    const settings = async (settings: object) => {
      await page.evaluate(config => window.postMessage({ type: 'kjun:catalog-configure', config }, location.origin), { settings, revision: ++revision, reset: revision });
    };
    await settings({ comparison: '크기' });
    await expect.poll(() => controls.evaluateAll(nodes => nodes.map(node => node.getBoundingClientRect().height))).toEqual([32, 32, 40, 40, 48, 48]);
    await settings({ comparison: '변형' });
    await expect(controls).toHaveText(['취소', '저장', '취소', '삭제', '취소', '완료']);
    await settings({ comparison: '표시' });
    await expect(controls).toHaveText(['취소', '저장', '저장', '취소']);
    await settings({ exampleWidth: '288', cancelText: 'Cancel', confirmText: long });
    await expect(controls).toHaveCount(2);
    await expect(controls.nth(1)).toHaveCSS('width', '288px');
    await expect.poll(async () => (await rect(controls.nth(1))).height).toBeGreaterThan(48);
    await controls.nth(1).click();
    await expect(page.getByText('확인', { exact: true })).toBeVisible();
    expect(errors).toEqual([]);
  });
}
