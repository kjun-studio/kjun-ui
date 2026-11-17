import { expect, test, type Locator, type Page } from '@playwright/test';
import { openFixture } from './packed-fixture';

// KjunAvatarGroup: the same overlap, ring, "+N" and button on every platform. Native is React Native Web only.
const platforms = ['react', 'vue3', 'native'] as const;
const items = (group: Locator) => group.locator(':scope > *');
const xs = async (group: Locator) => {
  const boxes = await items(group).evaluateAll(els => els.map(el => el.getBoundingClientRect()));
  return boxes.map(b => b.x + b.width / 2);
};
const style = (el: Locator, prop: string) => el.evaluate((e, p) => getComputedStyle(e).getPropertyValue(p), prop);
const group = (page: Page, id: string) => page.getByTestId(id).locator(':scope > *').first();

for (const platform of platforms) {
  test.describe(platform, () => {
    test.beforeEach(async ({ page }) => { await openFixture(page, platform, '', 'avatar-group'); });

    test(`${platform}: the group is read by one name and its avatars are hidden`, async ({ page }) => {
      const five = page.getByRole('img', { name: '참여자 5명' });
      await expect(five).toBeVisible();
      await expect(items(five)).toHaveCount(5);
      await expect(items(five).last()).toHaveText('+1');
      for (const el of await items(five).all()) await expect(el).toHaveAttribute('aria-hidden', 'true');
    });

    test(`${platform}: circle centres are the side minus the overlap apart, the first on top`, async ({ page }) => {
      const centres = await xs(group(page, 'five'));
      for (let i = 1; i < centres.length; i++) expect(centres[i] - centres[i - 1]).toBeCloseTo(40 - 12, 0);
      const z = await items(group(page, 'five')).evaluateAll(els => els.map(el => Number(getComputedStyle(el).zIndex)));
      expect(z[0]).toBeGreaterThan(z[1]);
      expect(z.at(-1)).toBe(0);
    });

    test(`${platform}: "+N" stops at +99 and centres its number in the visible part`, async ({ page }) => {
      const chip = items(group(page, 'total')).last();
      await expect(chip).toHaveText('+99');
      await expect(group(page, 'total')).toHaveAccessibleName('128명');
      // The number sits right of the chip's middle, in the part the avatar in front leaves visible.
      const [box, text] = await chip.evaluate(el => {
        // Measure the text node itself: on Native the number sits in an inner View the size of the chip.
        const node = document.createTreeWalker(el, NodeFilter.SHOW_TEXT).nextNode()!;
        const range = document.createRange(); range.selectNodeContents(node);
        const b = el.getBoundingClientRect(), t = range.getBoundingClientRect();
        return [b.x + b.width / 2, t.x + t.width / 2];
      });
      expect(text - box).toBeGreaterThan(4);
    });

    test(`${platform}: squares sit apart`, async ({ page }) => {
      const centres = await xs(group(page, 'square'));
      for (let i = 1; i < centres.length; i++) expect(centres[i] - centres[i - 1]).toBeCloseTo(40 + 4, 0);
    });

    test(`${platform}: a pressable group is one button; disabled skips presses and focus`, async ({ page }) => {
      const button = page.getByRole('button', { name: '참여자 목록 열기' });
      await button.click();
      await button.focus();
      await page.keyboard.press('Enter');
      await page.keyboard.press('Space');
      await expect(page.getByTestId('presses')).toHaveText('3');
      const locked = page.getByRole('button', { name: '잠긴 목록' });
      await expect(locked).toBeDisabled();
      await locked.click({ force: true });
      await expect(page.getByTestId('presses')).toHaveText('3');
    });

    test(`${platform}: a group that is not pressable takes no focus`, async ({ page }) => {
      await page.getByTestId('five').click();
      for (let i = 0; i < 3; i++) {
        await page.keyboard.press('Tab');
        const inside = await page.getByTestId('five').evaluate(el => el.contains(document.activeElement));
        expect(inside).toBe(false);
      }
    });

    test(`${platform}: an empty group shows only the total and a broken image keeps its initial`, async ({ page }) => {
      await expect(items(group(page, 'empty'))).toHaveCount(1);
      await expect(items(group(page, 'empty'))).toHaveText('+4');
      await expect(group(page, 'empty')).toHaveAccessibleName('4명');
      await expect(items(group(page, 'broken')).first()).toContainText('한');
    });
  });
}

// The ring is a box-shadow on the web packages and a painted wrapper on Native.
for (const platform of ['react', 'vue3'] as const) {
  test(`${platform}: the ring is a 2px shadow in the colour behind the group`, async ({ page }) => {
    await openFixture(page, platform, '', 'avatar-group');
    expect(await style(items(group(page, 'five')).first(), 'box-shadow')).toContain('0px 0px 0px 2px');
    expect(await style(items(group(page, 'ring')).first(), 'box-shadow')).toContain('rgb(230, 241, 251)');
    expect(await style(items(group(page, 'square')).first(), 'box-shadow')).toBe('none');
    expect(await style(items(group(page, 'total')).last(), 'padding-left')).toBe('12px');
    expect(await style(items(group(page, 'rtl')).last(), 'padding-right')).toBe('12px');
  });
  // Native RTL follows I18nManager (start/end styles), which a dir="rtl" element on React Native Web does not set.
  test(`${platform}: right-to-left groups overlap the other way`, async ({ page }) => {
    await openFixture(page, platform, '', 'avatar-group');
    const centres = await xs(group(page, 'rtl'));
    expect(centres[1]).toBeLessThan(centres[0]);
    expect(centres[0] - centres[1]).toBeCloseTo(40 - 12, 0);
  });
}
test('native: the ring is a wrapper painted in the colour behind the group', async ({ page }) => {
  await openFixture(page, 'native', '', 'avatar-group');
  expect(await style(items(group(page, 'ring')).first(), 'background-color')).toBe('rgb(230, 241, 251)');
});
test('react and vue3 draw the same DOM', async ({ page }) => {
  const shape = async (platform: string) => {
    await openFixture(page, platform, '', 'avatar-group');
    return page.getByTestId('press').evaluate(function walk(el: Element): unknown {
      const attrs = Array.from(el.attributes).filter(a => a.name !== 'style').map(a => `${a.name}=${a.value}`).sort();
      return { tag: el.tagName, attrs, children: Array.from(el.children).map(walk) };
    });
  };
  expect(await shape('vue3')).toEqual(await shape('react'));
});
