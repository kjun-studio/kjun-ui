import { expect, test, type Locator } from '@playwright/test';
import { openFixture } from './packed-fixture';

// KjunPressable has no shape of its own: the app's style gives the corners, KJUN the press layer, ring and role.
// Native Web only; a device's touch target (hitSlop) and press timing are not covered here.
const layer = (area: Locator) => area.evaluate(el => {
  const last = el.lastElementChild as HTMLElement | null;
  if (!last || getComputedStyle(last).position !== 'absolute') return null;
  const s = getComputedStyle(last);
  return { opacity: Number(s.opacity), radius: s.borderTopLeftRadius, events: s.pointerEvents };
});
test('native: KjunPressable lays a tint over its content on hover and press', async ({ page }) => {
  await openFixture(page, 'native', '', 'pressable');
  const map = page.getByRole('button', { name: '추억 지도에서 보기' });
  expect(await layer(map)).toBeNull();
  await map.hover();
  await expect.poll(() => layer(map)).toEqual({ opacity: 0.08, radius: '16px', events: 'none' });
  await page.mouse.down();
  await expect.poll(async () => (await layer(map))?.opacity).toBe(0.16);
  await page.mouse.up();
  await expect(page.getByTestId('presses')).toHaveText('1');
  await page.mouse.move(0, 0);
  await expect.poll(() => layer(map)).toBeNull();
});

test('native: KjunPressable without an effect, disabled, and focused by keyboard', async ({ page }) => {
  await openFixture(page, 'native', '', 'pressable');
  // A bare string child is drawn as text and names the button.
  const plain = page.getByRole('button', { name: '표시 없는 영역' });
  await plain.hover();
  await page.mouse.down();
  expect(await layer(plain)).toBeNull();
  await page.mouse.up();
  await expect(page.getByTestId('presses')).toHaveText('1');
  const locked = page.getByRole('button', { name: '잠긴 영역' });
  await expect(locked).toHaveAttribute('aria-disabled', 'true');
  await expect(locked).toHaveCSS('opacity', '0.5');
  await locked.click({ force: true });
  expect(await layer(locked)).toBeNull();
  await expect(page.getByTestId('presses')).toHaveText('1');
  // The ring follows the corners the app gave; an inset ring stays inside an area that reaches the edge.
  await page.mouse.move(0, 0);
  await page.keyboard.press('Tab');
  const map = page.getByRole('button', { name: '추억 지도에서 보기' });
  await expect(map).toBeFocused();
  await expect(map).toHaveCSS('outline-style', 'solid');
  await expect(map).toHaveCSS('outline-offset', '2px');
  await expect(map).toHaveCSS('border-top-left-radius', '16px');
  await page.keyboard.press('Enter');
  await expect(page.getByTestId('presses')).toHaveText('2');
  const full = page.getByRole('button', { name: '꽉 찬 영역' });
  await full.focus();
  await expect(full).toHaveCSS('outline-style', 'solid');
  expect(parseFloat(await full.evaluate(el => getComputedStyle(el).outlineOffset))).toBeLessThan(0);
});
