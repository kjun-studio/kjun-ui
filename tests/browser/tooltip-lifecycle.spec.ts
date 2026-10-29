import { expect, test, type Page } from '@playwright/test';
import { openFixture } from './packed-fixture';

const configure = async (page: Page, next: object, family = 'Refresh') => {
  await page.evaluate(({ next, family }) => (window as any)['configure' + family](next), { next, family });
  await expect.poll(async () => JSON.parse((await page.getByTestId('config').textContent())!)).toMatchObject(next);
};
const panel = (page: Page) => page.locator('[role="tooltip"]');

async function warmRefresh(page: Page) {
  const button = page.getByTestId('icon').getByRole('button');
  await page.mouse.move(800, 600);
  await button.hover();
  await expect(panel(page)).toHaveText('목록 새로고침');
  await page.mouse.move(800, 600);
  await expect(panel(page)).toHaveCount(0);
  await button.focus();
  await page.keyboard.press('Tab');
  await page.keyboard.press('Shift+Tab');
  await expect(panel(page)).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(panel(page)).toHaveCount(0);
  await page.getByTestId('outside').focus();
  await page.getByTestId('text').getByRole('button').hover();
  await configure(page, { tooltip: '최신 목록 가져오기', tooltipPlacement: 'bottom' });
  await page.mouse.move(800, 600);
  await button.hover();
  await expect(panel(page)).toHaveText('최신 목록 가져오기');
  return button;
}

for (const motion of ['no-preference', 'reduce'] as const) {
  for (const [reason, value] of [['loading', { loading: true }], ['disabled', { disabled: true }], ['empty', { tooltip: '' }]] as const) {
    test(`react: warm Tooltip is removed on ${reason} and can reopen (${motion})`, async ({ page }) => {
      await page.emulateMedia({ reducedMotion: motion });
      await openFixture(page, 'react', '', 'refresh-button');
      const button = await warmRefresh(page);
      await configure(page, value);
      await expect(panel(page)).toHaveCount(0);
      await expect(button).not.toHaveAttribute('aria-describedby');
      await page.mouse.move(800, 600);
      await configure(page, { loading: false, disabled: false, tooltip: '복구된 설명' });
      await expect(button).toBeEnabled();
      await expect(panel(page)).toHaveCount(0);
      await button.hover();
      await expect(panel(page)).toHaveText('복구된 설명');
      await page.mouse.move(800, 600);
      await expect(panel(page)).toHaveCount(0);
    });
  }

  test(`react: switching warm Tooltips does not revive a closed panel (${motion})`, async ({ page }) => {
    await page.emulateMedia({ reducedMotion: motion });
    await openFixture(page, 'react', '', 'tooltip-lifecycle');
    const a = page.getByTestId('a'), b = page.getByTestId('b');
    await page.mouse.click(800, 600);
    await a.hover();
    await expect(panel(page)).toHaveText('A 설명');
    await page.keyboard.press('Tab');
    await expect(b).toBeFocused();
    await expect(panel(page)).toHaveText('B 설명');
    await page.mouse.move(800, 600);
    await expect(panel(page)).toHaveCount(1);
    await expect(panel(page)).toHaveText('B 설명');
    await page.keyboard.press('Escape');
    await expect(panel(page)).toHaveCount(0);
    await expect(b).toBeFocused();
    await page.getByTestId('outside').focus();
    // Establish pointer modality outside the trigger after the keyboard dismissal.
    await page.mouse.move(790, 600);
    await a.hover();
    await expect(panel(page)).toHaveText('A 설명');
    await page.mouse.move(800, 600);
    await expect(panel(page)).toHaveCount(0);
  });
}

test('react: a normal controlled Tooltip exit animates, can reopen, and preserves the trigger', async ({ page }) => {
  await openFixture(page, 'react', '', 'tooltip-lifecycle');
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.addStyleTag({ content: '.kjun-tooltip { --_kjun-motion-tooltip-exit: 1s; }' });
  const target = page.getByTestId('controlled');
  const original = await target.elementHandle();
  await configure(page, { open: true }, 'TooltipLifecycle');
  await expect(panel(page)).toHaveText('제어 설명');
  await configure(page, { open: false }, 'TooltipLifecycle');
  await expect(panel(page)).toHaveAttribute('data-exiting', 'true');
  await expect.poll(() => panel(page).evaluate(el => el.getAnimations().length)).toBeGreaterThan(0);
  await configure(page, { open: true }, 'TooltipLifecycle');
  await expect(panel(page)).not.toHaveAttribute('data-exiting');
  await configure(page, { open: false }, 'TooltipLifecycle');
  await expect(panel(page)).toHaveCount(0);
  expect(await target.evaluate((el, first) => el === first, original)).toBe(true);
  await expect(page.getByTestId('changes')).toHaveText('[]');
});

test('react: content removal clears an uncontrolled request while title-only controlled content still opens', async ({ page }) => {
  await openFixture(page, 'react', '', 'tooltip-lifecycle');
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await configure(page, { controlled: false }, 'TooltipLifecycle');
  const target = page.getByTestId('controlled');
  await page.mouse.move(800, 600);
  await target.hover();
  await expect(panel(page)).toBeVisible();
  await configure(page, { content: '' }, 'TooltipLifecycle');
  await expect(panel(page)).toHaveCount(0);
  await expect(target).not.toHaveAttribute('aria-describedby');
  await configure(page, { content: '새 설명' }, 'TooltipLifecycle');
  await expect(panel(page)).toHaveCount(0);
  await page.mouse.move(800, 600);
  await target.hover();
  await expect(panel(page)).toHaveText('새 설명');
  await configure(page, { controlled: true, open: true, title: '제목만', content: '' }, 'TooltipLifecycle');
  await expect(panel(page)).toHaveText('제목만');
  await configure(page, { title: '' }, 'TooltipLifecycle');
  await expect(panel(page)).toHaveCount(0);
  await configure(page, { title: '제어 복구' }, 'TooltipLifecycle');
  await expect(panel(page)).toHaveText('제어 복구');
});
