import { expect, test } from '@playwright/test';
import { openFixture } from './packed-fixture';

// react-aria's Focusable checks in development that its child is focusable and counts one under a hidden ancestor as not
// focusable; KjunTooltip holds a trigger drawn hidden until it has a box, so no warning appears and it works once shown.
test('react: a Tooltip trigger first drawn in a hidden section does not warn and opens once shown', async ({ page }) => {
  const warnings: string[] = [];
  page.on('console', message => { if (/Focusable/.test(message.text())) warnings.push(message.text()); });
  await openFixture(page, 'react', '', 'tooltip-hidden', 'development');
  await expect(page.getByTestId('section')).toBeHidden();
  await page.evaluate(() => (window as any).showHiddenSection());
  const trigger = page.getByTestId('trigger');
  await expect(trigger).toBeVisible();
  // The trigger takes its handlers back in the frame after it gets a box; Focusable's tabIndex shows that it has.
  await expect(trigger).toHaveAttribute('tabindex', '0');
  await trigger.hover();
  await expect(page.locator('[role="tooltip"]')).toHaveText('숨김 설명');
  await page.mouse.move(800, 600);
  await expect(page.locator('[role="tooltip"]')).toHaveCount(0);
  const refresh = page.getByTestId('refresh').getByRole('button');
  await refresh.focus();
  await page.keyboard.press('Shift+Tab');
  await page.keyboard.press('Tab');
  await expect(refresh).toBeFocused();
  await expect(page.locator('[role="tooltip"]')).toHaveText('목록 새로고침');
  expect(warnings).toEqual([]);
});
