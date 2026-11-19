import { expect, test, type Page } from '@playwright/test';
import { openFixture } from './packed-fixture';

const platforms = ['react', 'vue3', 'native'] as const;
const open = async (page: Page, name: string | RegExp) => {
  await page.getByRole('button', { name: '열기' }).click();
  const dialog = page.getByRole('dialog', typeof name === 'string' ? { name, exact: true } : { name });
  await expect(dialog).toBeVisible();
  await page.waitForTimeout(400);
  return dialog;
};

for (const platform of platforms) {
  test(`${platform}: a Modal without a title keeps only the close button at the end of the header`, async ({ page }) => {
    await openFixture(page, platform, '?bare', 'modal-header');
    const dialog = await open(page, '대화상자');
    await expect(dialog.getByRole('heading')).toHaveCount(0);
    const close = (await dialog.getByRole('button', { name: '닫기' }).boundingBox())!;
    const box = (await dialog.boundingBox())!;
    expect(box.x + box.width - (close.x + close.width)).toBeCloseTo(20, 0);
    if (platform !== 'native') {
      const header = dialog.locator('.kjun-modal-header');
      await expect(header).toHaveAttribute('data-bare', '');
      await expect(header).toHaveCSS('border-bottom-width', '0px');
      await expect(dialog.locator('.kjun-modal-body')).toHaveCSS('padding-top', '8px');
    }
  });

  test(`${platform}: while loading the Modal cannot be dismissed`, async ({ page }) => {
    await openFixture(page, platform, '', 'modal-header');
    const dialog = await open(page, '편집');
    await dialog.getByRole('button', { name: '저장' }).click();
    await expect(dialog.getByRole('button', { name: '저장' })).toHaveAttribute('aria-busy', 'true');
    if (platform !== 'native') {
      await expect(dialog.getByRole('button', { name: '취소' })).toBeDisabled();
      await expect(dialog.getByRole('button', { name: '닫기' })).toBeDisabled();
    }
    await page.keyboard.press('Escape');
    await page.mouse.click(5, 5);
    await dialog.getByRole('button', { name: '취소' }).click({ force: true });
    await page.waitForTimeout(300);
    await expect(page.getByTestId('state')).toHaveText('open');
    await dialog.getByRole('button', { name: '진행 끝' }).click();
    await dialog.getByRole('button', { name: '닫기' }).click();
    await expect(page.getByTestId('state')).toHaveText('closed');
  });

  test(`${platform}: on a phone a long Modal scrolls its body and keeps the header and footer in view`, async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 720 });
    await openFixture(page, platform, '?long', 'modal-header');
    const dialog = await open(page, '편집');
    const body = (await dialog.getByText('본문 10', { exact: true }).boundingBox())!;
    await page.mouse.move(body.x + 10, body.y);
    await page.mouse.wheel(0, 4000);
    await page.waitForTimeout(400);
    await expect(dialog.getByText('본문 40', { exact: true })).toBeInViewport();
    await expect(dialog.getByRole('button', { name: '닫기' })).toBeInViewport();
    await expect(dialog.getByRole('button', { name: '저장' })).toBeInViewport();
    const close = (await dialog.getByRole('button', { name: '닫기' }).boundingBox())!, box = (await dialog.boundingBox())!;
    expect(close.y - box.y).toBeLessThan(20);
  });
}

test('native: ariaDescribedBy reaches the web dialog', async ({ page }) => {
  await openFixture(page, 'native', '', 'modal-header');
  const dialog = await open(page, '편집');
  await expect(dialog).toHaveAttribute('aria-describedby', 'modal-desc');
});

for (const platform of ['react', 'vue3'] as const) {
  test(`${platform}: a header slot is a labelled box, not a heading, so it can hold a button`, async ({ page }) => {
    await openFixture(page, platform, '?custom', 'modal-header');
    const dialog = await open(page, /^맞춤 제목/);
    await expect(dialog.getByRole('heading')).toHaveCount(0);
    await dialog.getByRole('button', { name: '이름 바꾸기' }).click();
    await expect(page.getByTestId('edits')).toHaveText('1');
  });

  test(`${platform}: the close button is a KjunButton with the focus ring`, async ({ page }) => {
    await openFixture(page, platform, '', 'modal-header');
    const dialog = await open(page, '편집');
    const close = dialog.getByRole('button', { name: '닫기' });
    await expect(close).toHaveClass(/kjun-button/);
    await expect(close).toHaveCSS('width', '32px');
    await close.focus();
    await page.keyboard.press('Shift+Tab');
    await page.keyboard.press('Tab');
    await expect(close).toBeFocused();
    expect(await close.evaluate(node => getComputedStyle(node).outlineStyle)).toBe('solid');
  });
}

for (const platform of platforms) {
  test(`${platform}: no dividers, and on a phone the footer buttons share the row`, async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 720 });
    await openFixture(page, platform, '', 'modal-header');
    const dialog = await open(page, '편집');
    const cancel = (await dialog.getByRole('button', { name: '취소' }).boundingBox())!;
    const save = (await dialog.getByRole('button', { name: '저장' }).boundingBox())!;
    expect(Math.abs(cancel.width - save.width)).toBeLessThan(2);
    expect(save.x - (cancel.x + cancel.width)).toBeCloseTo(8, 0);
    expect(cancel.width).toBeGreaterThan(140);
    const title = (await dialog.getByRole('heading', { name: '편집' }).boundingBox())!;
    const first = (await (platform === 'native' ? dialog.getByText('이름을 바꿉니다.') : dialog.getByRole('button', { name: '진행 끝' })).boundingBox())!;
    // The header's 16px bottom padding, plus 2px from centring the 28px title line on the 32px close button.
    expect(first.y - (title.y + title.height)).toBeCloseTo(18, 0);
    if (platform !== 'native') {
      await expect(dialog.locator('.kjun-modal-header')).toHaveCSS('border-bottom-width', '0px');
      await expect(dialog.locator('.kjun-modal-footer')).toHaveCSS('border-top-width', '0px');
    }
  });
}

test('native: an icon inside a ghost button takes the button ink, as currentColor on the web', async ({ page }) => {
  await openFixture(page, 'native', '', 'modal-header');
  const dialog = await open(page, '편집');
  const stroke = await dialog.getByRole('button', { name: '닫기' }).locator('svg').first()
    .evaluate(svg => getComputedStyle(svg.querySelector('path, line, polyline') ?? svg).stroke);
  const title = await dialog.getByRole('heading', { name: '편집' }).evaluate(node => getComputedStyle(node).color);
  // At rest a ghost button's ink is text-secondary, not the title's text colour.
  expect(stroke).toMatch(/^rgb/);
  expect(stroke).not.toBe(title);
});

for (const platform of platforms) {
  test(`${platform}: a single wrapper in the footer takes the full row, as on Drawer`, async ({ page }) => {
    await openFixture(page, platform, '?wrap', 'modal-header');
    const dialog = await open(page, '편집');
    const wrap = (await dialog.getByTestId('wrap').boundingBox())!, box = (await dialog.boundingBox())!;
    // The footer's 20px side padding on each side.
    expect(wrap.width).toBeCloseTo(box.width - 40, 0);
  });

  test(`${platform}: on a short phone the Modal stays clear of the safe areas`, async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 600 });
    await openFixture(page, platform, '?long', 'modal-header');
    if (platform === 'native') return;
    await page.addStyleTag({ content: ':root { --_kjun-safe-top: 100px; --_kjun-safe-bottom: 100px; }' });
    const dialog = await open(page, '편집');
    const box = (await dialog.boundingBox())!;
    // 85dvh would be 510px; the safe areas and the 16px insets leave 368px.
    expect(box.height).toBeLessThanOrEqual(368.5);
    expect(box.y).toBeGreaterThanOrEqual(116 - 0.5);
  });
}
