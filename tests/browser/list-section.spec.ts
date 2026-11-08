import { expect, test, type Locator } from '@playwright/test';
import { openFixture } from './packed-fixture';

const box = async (l: Locator) => (await l.boundingBox())!;

for (const platform of ['react', 'vue3', 'native']) {
  const web = platform !== 'native';
  test(`${platform}: a list group rounds its sections, keeps labels and footers outside and shows empty content`, async ({ page }) => {
    await openFixture(page, platform, '', 'list-section');
    // Heading actions sit on the title line rather than between the title and its description.
    const title = await box(page.getByText('최근 문서', { exact: true })), action = await box(page.getByRole('button', { name: '전체 보기' }));
    expect(Math.abs((action.y + action.height / 2) - (title.y + title.height / 2))).toBeLessThanOrEqual(1);
    // The button sits at the end, its label ending on the rows' end line, and the title keeps the rest of the width.
    const chevronEnd = await page.getByText('회의 메모', { exact: true }).evaluate(el => { const row = el.closest('button, [role=button]')!; const r = row.getBoundingClientRect(); return r.x + r.width; });
    const actionLabel = await box(page.getByRole('button', { name: '전체 보기' }).getByText('전체 보기'));
    expect(actionLabel.x + actionLabel.width).toBeCloseTo(chevronEnd - 16, 0);
    // A title with a description sits outside the card as well, right above the rows.
    const titled = await box(page.getByText('지난 7일 동안 수정한 문서', { exact: true })), firstRow = await box(page.getByText('회의 메모', { exact: true }));
    expect(firstRow.y - (titled.y + titled.height)).toBeLessThanOrEqual(8 + 18 + 1);
    // The label sits above the rounded card and the footer below it: neither is inside the card.
    const label = await box(page.getByText('알림', { exact: true })), row = await box(page.getByText('푸시 알림', { exact: true }));
    const footer = await box(page.getByText('푸시 알림은 이 기기에서만 적용됩니다.', { exact: true }));
    expect(label.y).toBeLessThan(row.y); expect(footer.y).toBeGreaterThan(row.y + row.height);
    if (web) {
      const card = page.locator('.kjun-list-section', { hasText: '푸시 알림' }).locator('.kjun-list-panel');
      expect(await card.evaluate(el => getComputedStyle(el).borderTopLeftRadius)).toBe('16px');
      const panel = await box(card);
      expect(label.y + label.height).toBeLessThanOrEqual(panel.y);
      expect(footer.y).toBeGreaterThanOrEqual(panel.y + panel.height);
      await expect(page.getByRole('heading', { level: 2, name: '최근 문서' })).toBeVisible();
      // Sections are not landmarks; the list is named by the title instead.
      await expect(page.getByRole('region')).toHaveCount(0);
      await expect(page.getByRole('list', { name: '최근 문서' })).toBeVisible();
    } else {
      // Native Web headings carry the level too.
      await expect(page.getByRole('heading', { name: '최근 문서' })).toHaveAttribute('aria-level', /\d/);
    }
    // A section without rows shows the app's empty content in their place.
    const empty = page.getByText('아직 즐겨찾기한 문서가 없습니다', { exact: true });
    await expect(empty).toBeVisible();
    // It stays lighter than the rows: secondary body type.
    await expect(empty).toHaveCSS('font-size', '14px');
    await expect(empty).toHaveCSS('font-weight', '400');
    // The card clips its rows, so a row's keyboard focus ring draws inside and follows the card's corner.
    const rowButton = page.getByRole('button', { name: '회의 메모' });
    await page.getByRole('button', { name: '전체 보기' }).focus();
    await page.keyboard.press('Tab');
    await expect(rowButton).toBeFocused();
    await expect(rowButton).toHaveCSS('outline-offset', '-2px');
    await expect(rowButton).toHaveCSS('border-top-left-radius', '16px');
    // Sections in an inset group are 24px apart.
    const first = await box(page.getByText('회의 메모', { exact: true }));
    expect(label.y - (first.y + first.height)).toBeGreaterThan(24);
  });
}

for (const platform of ['react', 'vue3', 'native']) {
  const web = platform !== 'native';
  test(`${platform}: heading buttons keep clear of the rows, choice sections are radio groups and loading replaces the rows`, async ({ page }) => {
    await openFixture(page, platform, '', 'list-section');
    // A button taller than the label line still centers on it, and grows the heading instead of covering the first row.
    const label = await box(page.getByText('계정', { exact: true })), edit = await box(page.getByRole('button', { name: '편집' }));
    const profile = await box(page.getByRole('button', { name: '프로필' }));
    expect(Math.abs((edit.y + edit.height / 2) - (label.y + label.height / 2))).toBeLessThanOrEqual(1);
    expect(edit.y + edit.height).toBeLessThanOrEqual(profile.y - 8 + 0.5);
    // Several heading buttons sit side by side, 8px apart.
    const invite = await box(page.getByRole('button', { name: '초대' })), link = await box(page.getByRole('button', { name: '링크' }));
    expect(Math.abs(invite.y - link.y)).toBeLessThanOrEqual(0.5);
    expect(link.x - (invite.x + invite.width)).toBeCloseTo(8, 0);
    // An icon-only ghost button ends its glyph on the rows' end line.
    const glyph = await box(page.getByRole('button', { name: '태그 추가' }).locator('svg').first()), tagRow = await box(page.getByRole('button', { name: '업무' }));
    expect(glyph.x + glyph.width).toBeCloseTo(tagRow.x + tagRow.width - 16, 0);
    // Korean headings wrap between words.
    await expect(page.getByText('함께 보는 사람', { exact: true })).toHaveCSS('word-break', 'keep-all');
    // A single-choice section is a radio group named and described by its heading, with one Tab stop and arrow keys.
    const group = page.getByRole('radiogroup', { name: '테마' });
    await expect(group).toHaveAccessibleDescription('화면 색을 고릅니다');
    await expect(group.getByRole('listitem')).toHaveCount(0);
    const light = page.getByRole('radio', { name: '밝게' }), dark = page.getByRole('radio', { name: '어둡게' });
    await expect(light).toHaveAttribute('tabindex', '0');
    await expect(dark).toHaveAttribute('tabindex', '-1');
    await light.focus();
    await page.keyboard.press('ArrowDown');
    await expect(dark).toBeFocused();
    // Loading content replaces the rows and runs edge to edge like them.
    await expect(page.getByText('불러온 행', { exact: true })).toHaveCount(0);
    if (web) {
      const skeleton = await box(page.locator('.kjun-list-skeleton-row').first());
      expect(skeleton.x).toBeCloseTo(profile.x, 0);
      expect(skeleton.width).toBeCloseTo(profile.width, 0);
    }
    // A compact section's empty note is one compact row tall.
    const emptyHeight = await page.getByText('보관한 문서가 없습니다', { exact: true }).evaluate(el => {
      let node: HTMLElement | null = el as HTMLElement;
      while (node && node.getBoundingClientRect().height < 44) node = node.parentElement;
      return node?.getBoundingClientRect().height;
    });
    expect(emptyHeight).toBeCloseTo(44, 0);
    // Rows in sibling fragments all render.
    for (const name of ['묶음 1', '묶음 2', '묶음 3']) await expect(page.getByText(name, { exact: true })).toBeVisible();
  });
}

test('native: rows in sibling fragments keep unique keys', async ({ page }) => {
  const errors: string[] = [];
  page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
  await openFixture(page, 'native', '', 'list-section', 'development');
  await expect(page.getByText('묶음 3', { exact: true })).toBeVisible();
  expect(errors.filter(text => text.includes('same key'))).toEqual([]);
});
