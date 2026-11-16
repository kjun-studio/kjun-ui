import { expect, test, type Locator } from '@playwright/test';
import { openFixture } from './packed-fixture';

// A plain field is text edited in place (a document title, a note body): no surface, side border or side inset.
const clear = 'rgba(0, 0, 0, 0)';
const paint = (field: Locator) => field.evaluate(el => {
  const s = getComputedStyle(el);
  return { background: s.backgroundColor, left: s.borderLeftWidth, right: s.borderRightWidth, top: s.borderTopColor, side: s.paddingLeft, outline: s.outlineStyle, offset: s.outlineOffset };
});
for (const platform of ['react', 'vue3', 'native']) {
  test(`${platform}: a plain Input has no surface and starts where the surrounding text does`, async ({ page }) => {
    await openFixture(page, platform, '', 'input-plain');
    const title = page.getByRole('textbox', { name: '제목', exact: true }), basic = page.getByRole('textbox', { name: '기본', exact: true });
    const guide = await page.getByTestId('guide').boundingBox(), box = await title.boundingBox(), basicBox = await basic.boundingBox();
    expect(await paint(title)).toMatchObject({ background: clear, left: '0px', right: '0px', top: clear, side: '0px' });
    expect(box!.x).toBe(guide!.x);
    // The size still sets the height.
    expect(box!.height).toBe(basicBox!.height);
    await title.hover();
    expect((await paint(title)).background).toBe(clear);
    // An error is carried by the message under the field, not by a border that would appear around the text.
    const empty = page.getByRole('textbox', { name: '빈 제목', exact: true });
    await expect(empty).toHaveAttribute('aria-invalid', 'true');
    expect(await paint(empty)).toMatchObject({ background: clear, top: clear });
    await expect(page.getByText('제목을 입력해 주세요.')).toBeVisible();
    expect((await paint(page.getByRole('textbox', { name: '잠긴 제목', exact: true }))).background).toBe(clear);
    // Keyboard focus keeps a ring, set off from the text.
    await page.keyboard.press('Tab');
    await expect(title).toBeFocused();
    expect(await paint(title)).toMatchObject({ background: clear, top: clear, outline: 'solid', offset: '2px' });
    // An affix sits at the edge and the text follows it.
    const search = page.getByRole('textbox', { name: '검색', exact: true });
    expect(parseFloat((await paint(search)).side)).toBeGreaterThan(0);
    expect((await paint(basic)).background).not.toBe(clear);
  });

  test(`${platform}: a plain Textarea has no surface, with or without its bar`, async ({ page }) => {
    await openFixture(page, platform, '', 'input-plain');
    const guide = await page.getByTestId('guide').boundingBox();
    for (const name of ['본문', '보낼 글']) {
      const field = page.getByRole('textbox', { name, exact: true });
      expect(await paint(field)).toMatchObject({ background: clear, side: '0px' });
      expect((await field.boundingBox())!.x).toBe(guide!.x);
    }
    // The bar's surface is the wrapper, which is plain too; the count and the submit button stay.
    const wrapper = page.getByRole('textbox', { name: '보낼 글', exact: true }).locator('xpath=..');
    expect(await paint(wrapper)).toMatchObject({ background: clear, left: '0px', top: clear });
    await expect(page.getByText('4/100')).toBeVisible();
    await expect(page.getByRole('button', { name: '보내기' })).toBeVisible();
  });
}
for (const platform of ['react', 'vue3']) {
  test(`${platform}: a pointer focus on a plain Input shows the caret alone`, async ({ page }) => {
    await openFixture(page, platform, '', 'input-plain');
    const title = page.getByRole('textbox', { name: '제목', exact: true });
    await title.click();
    await expect(title).toBeFocused();
    expect(await paint(title)).toMatchObject({ background: clear, top: clear });
  });
}
