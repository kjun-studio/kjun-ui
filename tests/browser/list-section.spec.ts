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

for (const platform of ['react', 'vue3', 'native']) {
  const web = platform !== 'native';
  test(`${platform}: a section owns single and multiple selections and gives back Tab when choice ends`, async ({ page }) => {
    await openFixture(page, platform, '', 'list-section');
    // Single: the section's value picks the row, and the footer joins the description.
    const fruits = page.getByRole('radiogroup', { name: '과일 고르기' });
    await expect(fruits).toHaveAccessibleDescription('하나를 고릅니다 고른 과일은 오늘만 적용됩니다.');
    const apple = page.getByRole('radio', { name: '사과' }), pear = page.getByRole('radio', { name: '배' });
    await expect(apple).toBeChecked(); await expect(pear).not.toBeChecked();
    await pear.click();
    await expect(pear).toBeChecked(); await expect(apple).not.toBeChecked();
    // Multiple: each row is a checkbox that adds or removes its value.
    const work = page.getByRole('checkbox', { name: '업무 태그' }), home = page.getByRole('checkbox', { name: '개인 태그' });
    await expect(work).toBeChecked(); await expect(home).not.toBeChecked();
    await home.click(); await expect(home).toBeChecked(); await expect(work).toBeChecked();
    await work.click(); await expect(work).not.toBeChecked(); await expect(home).toBeChecked();
    // Ending the single choice gives every row its Tab stop back.
    const byName = page.getByRole('radio', { name: '이름순' }), byDate = page.getByRole('radio', { name: '날짜순' });
    await expect(byDate).toHaveAttribute('tabindex', '-1');
    await page.getByRole('button', { name: '선택 모드 전환' }).click();
    await expect(page.getByRole('radiogroup', { name: '정렬' })).toHaveCount(0);
    await expect(byDate).not.toHaveAttribute('tabindex', '-1');
    await expect(page.getByRole('list', { name: '정렬' })).not.toHaveAttribute('tabindex', '-1');
    await page.getByRole('button', { name: '선택 모드 전환' }).click();
    // A list drawn again after loading still moves by arrow keys.
    const reload = page.getByRole('button', { name: '다시 불러오기' });
    await reload.click(); await expect(byName).toHaveCount(0);
    await reload.click(); await expect(byName).toBeVisible();
    await byName.focus(); await page.keyboard.press('ArrowDown');
    await expect(byDate).toBeFocused();
    if (web) {
      // Any heading control, not only a KjunButton, centers on the title line and keeps clear of the rows.
      const title = await box(page.getByRole('heading', { name: '동기화' })), action = await box(page.getByRole('button', { name: '설정' }));
      const row = await box(page.getByRole('button', { name: '동기화 기록' }));
      expect(action.height).toBeCloseTo(48, 0);
      expect(Math.abs((action.y + action.height / 2) - (title.y + title.height / 2))).toBeLessThanOrEqual(1);
      expect(action.y + action.height).toBeLessThanOrEqual(row.y + 0.5);
    }
  });
}

test('native: rows in sibling fragments keep unique keys', async ({ page }) => {
  const errors: string[] = [];
  page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
  await openFixture(page, 'native', '', 'list-section', 'development');
  await expect(page.getByText('묶음 3', { exact: true })).toBeVisible();
  expect(errors.filter(text => text.includes('same key'))).toEqual([]);
});

for (const platform of ['react', 'vue3', 'native']) {
  const web = platform !== 'native';
  test(`${platform}: a section badge sits on the title line and names the list, roots take id/class/style, and the reorder note stacks on the footer`, async ({ page }) => {
    await openFixture(page, platform, '', 'list-section');
    // The badge follows the title by the row badge gap and centers on its line, for the small label and the 16px title.
    for (const [title, count] of [['최근 거래', '12'], ['예약 거래', '3']]) {
      // Native draws the count as text inside the badge View, so the badge is its parent.
      const t = await box(page.getByText(title, { exact: true })), count_ = page.getByText(count, { exact: true }), b = await box(web ? count_ : count_.locator('xpath=..'));
      expect(Math.round(b.x - (t.x + t.width))).toBe(6);
      expect(Math.abs((b.y + b.height / 2) - (t.y + t.height / 2))).toBeLessThanOrEqual(1);
    }
    // The list is named by its title and the badge, so the count is heard with it.
    await expect(page.getByRole('list', { name: web ? '최근 거래 12' : '최근 거래, 12', exact: true })).toBeVisible();
    // The heading itself stays the title alone.
    await expect(page.getByRole('heading', { name: '최근 거래', exact: true })).toBeVisible();
    // id, class and style reach the roots (Native: testID and style).
    for (const id of ['tx-group', 'tx-label']) {
      const root = web ? page.locator('#' + id) : page.getByTestId(id);
      await expect(root).toHaveCSS('margin-top', '4px');
      if (web) await expect(root).toHaveClass(new RegExp('app-' + id));
    }
    if (web) await expect(page.locator('#tx-label')).toHaveClass(/kjun-list-section/);
    // Without a card, the reorder note and the footer are 8px apart, like Native, and the move buttons are described by the note.
    // Line boxes: on the web the caption element without its padding, on Native the text element.
    const line = async (text: string) => {
      const el = page.getByText(text, { exact: true });
      const r = await box(el);
      if (!web) return { top: r.y, bottom: r.y + r.height };
      const [top, bottom] = await el.evaluate(e => { const c = getComputedStyle(e); return [parseFloat(c.paddingTop), parseFloat(c.paddingBottom)]; });
      return { top: r.y + top, bottom: r.y + r.height - bottom };
    };
    const note = await line('가격순으로 정렬하는 동안은 옮길 수 없습니다.'), footer = await line('순서는 이 기기에만 저장됩니다.');
    const gap = Math.round(footer.top - note.bottom);
    expect(gap).toBe(8);
    await expect(page.getByRole('button', { name: /종목 가/ }).first()).toHaveAccessibleDescription('가격순으로 정렬하는 동안은 옮길 수 없습니다.');
  });
}
