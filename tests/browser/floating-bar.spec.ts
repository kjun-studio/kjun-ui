import { expect, test, type Page } from '@playwright/test';
import { openFixture } from './packed-fixture';

// KjunBottomActionBar variant="floating": a capsule with KjunFloatingNavigation's offset (16), padding (6) and lg pill buttons.
const measure = (page: Page) => page.evaluate(() => {
  const screen = document.querySelector('[data-testid="screen"]')!.getBoundingClientRect();
  const buttons = Array.from(document.querySelectorAll<HTMLElement>('[role="button"], button')).filter(el => el.getBoundingClientRect().width > 0);
  const boxes = buttons.map(el => ({ ...el.getBoundingClientRect().toJSON(), radius: parseFloat(getComputedStyle(el).borderTopLeftRadius) }));
  // The capsule is the nearest ancestor of the buttons that paints a background and is wider than both of them.
  let capsule: HTMLElement | null = buttons[0].parentElement;
  while (capsule && (getComputedStyle(capsule).backgroundColor === 'rgba(0, 0, 0, 0)' || capsule.getBoundingClientRect().width <= boxes[0].width + boxes[1].width)) capsule = capsule.parentElement;
  const c = capsule!.getBoundingClientRect(), style = getComputedStyle(capsule!);
  return { screen: screen.toJSON(), capsule: c.toJSON(), radius: parseFloat(style.borderTopLeftRadius), shadow: style.boxShadow, buttons: boxes };
});
for (const platform of ['react', 'vue3', 'native']) {
  test(`${platform}: a floating BottomActionBar is a capsule off the screen edges with lg pill buttons on one line`, async ({ page }) => {
    await openFixture(page, platform, '', 'floating-bar');
    const m = await measure(page);
    expect(Math.abs(m.capsule.left - m.screen.left - 16)).toBeLessThan(1.5);
    expect(Math.abs(m.screen.right - m.capsule.right - 16)).toBeLessThan(1.5);
    expect(Math.abs(m.screen.bottom - m.capsule.bottom - 16)).toBeLessThan(1.5);
    // Padding 6 around lg (48) buttons: 60 tall, and round enough to be a capsule.
    expect(Math.abs(m.capsule.height - 60)).toBeLessThan(1.5);
    expect(m.radius).toBeGreaterThanOrEqual(30);
    expect(m.shadow).not.toBe('none');
    for (const button of m.buttons) {
      expect(button.height).toBe(48);
      expect(button.radius).toBeGreaterThanOrEqual(24);
      expect(Math.abs(button.top - m.capsule.top - 6)).toBeLessThan(1.5);
    }
    expect(m.buttons[0].top).toBe(m.buttons[1].top);
    await expect(page.getByText('3장 선택')).toBeVisible();
  });

  test(`${platform}: a floating BottomActionBar keeps one line with a long description and fills its width without one`, async ({ page }) => {
    await openFixture(page, platform, '?long', 'floating-bar');
    const long = await measure(page);
    expect(Math.abs(long.capsule.height - 60)).toBeLessThan(1.5);
    expect(long.buttons[1].right).toBeLessThanOrEqual(long.capsule.right);
    expect(long.buttons[0].top).toBe(long.buttons[1].top);
    await openFixture(page, platform, '?plain', 'floating-bar');
    const plain = await measure(page);
    expect(Math.abs(plain.capsule.height - 60)).toBeLessThan(1.5);
    // Two labelled buttons share the capsule: equal widths, from one padded edge to the other.
    expect(Math.abs(plain.buttons[0].width - plain.buttons[1].width)).toBeLessThan(1.5);
    expect(Math.abs(plain.buttons[0].left - plain.capsule.left - 6)).toBeLessThan(1.5);
    expect(Math.abs(plain.capsule.right - plain.buttons[1].right - 6)).toBeLessThan(1.5);
  });

  test(`${platform}: the docked BottomActionBar is unchanged by the new variant`, async ({ page }) => {
    await openFixture(page, platform, '?docked', 'floating-bar');
    const m = await measure(page);
    // The band reaches both screen edges and its buttons keep the default size and corners.
    expect(Math.abs(m.capsule.left - m.screen.left)).toBeLessThan(1);
    expect(Math.abs(m.capsule.right - m.screen.right)).toBeLessThan(1);
    for (const button of m.buttons) { expect(button.height).toBe(40); expect(button.radius).toBeLessThan(20); }
  });
}
