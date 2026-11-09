import { expect, test, type Locator } from '@playwright/test';
import { openFixture } from './packed-fixture';

const box = async (l: Locator) => (await l.boundingBox())!;
const color = (l: Locator) => l.evaluate(el => getComputedStyle(el).color);

for (const platform of ['react', 'vue3', 'native']) {
  const web = platform !== 'native';
  test(`${platform}: values read quieter, icons stay by the title, danger and disabled cover the whole row`, async ({ page }) => {
    await openFixture(page, platform, '', 'list-design');
    const title = page.getByText('비밀번호', { exact: true }), value = page.getByText('3개월 전 변경', { exact: true });
    expect(await color(value)).not.toBe(await color(title));
    // A long described row keeps its icon beside the first lines rather than its vertical middle.
    const long = page.getByText('모든 기기에서 함께 사용할 프로필 사진과 계정 표시 이름', { exact: true });
    const longBox = await box(long);
    expect(longBox.height).toBeGreaterThan(24);
    if (web) {
      expect(await long.evaluate(el => getComputedStyle(el).wordBreak)).toBe('keep-all');
      const icon = await box(page.locator('.kjun-list-row', { hasText: '모든 기기에서' }).locator('.kjun-list-icon'));
      expect(icon.y).toBeLessThan(longBox.y + 30);
      const danger = await color(page.getByText('계정 삭제', { exact: true }));
      expect(await page.locator('.kjun-list-row', { hasText: '계정 삭제' }).locator('.kjun-list-icon').evaluate(el => getComputedStyle(el).color)).toBe(danger);
      expect(Number(await page.locator('.kjun-list-row', { hasText: '업무 알림' }).locator('.kjun-list-main').evaluate(el => getComputedStyle(el).opacity))).toBeLessThan(1);
    }
    // The section title is a label because the app asked for one, not because it lacks a description.
    const heading = await box(page.getByText('계정', { exact: true })), label = await box(page.getByText('언어', { exact: true }));
    expect(label.height).toBeLessThan(heading.height);
  });

  test(`${platform}: a switch row toggles on any press and a choice list marks its selection`, async ({ page }) => {
    await openFixture(page, platform, '', 'list-design');
    const row = page.getByRole('switch', { name: /알림 받기/ });
    await expect(row).toHaveAttribute('aria-checked', 'true');
    await page.getByText('알림 받기', { exact: true }).click();
    await expect(page.getByTestId('state')).toContainText('"on":false');
    await expect(row).toHaveAttribute('aria-checked', 'false');
    await page.getByText('English', { exact: true }).click();
    await expect(page.getByTestId('state')).toContainText('"lang":"en"');
    // Every platform reads a choice row as a radio, checked when selected.
    await expect(page.getByRole('radio', { name: 'English' })).toHaveAttribute('aria-checked', 'true');
    await expect(page.getByRole('radio', { name: '한국어' })).toHaveAttribute('aria-checked', 'false');
    // The switch drawn in a switch row is decoration: one switch control per row, and one tab stop.
    await expect(page.getByRole('switch')).toHaveCount(await page.locator('[role="switch"]').count());
    await expect(page.locator('[role="switch"] [role="switch"], [role="switch"] [tabindex="0"]')).toHaveCount(0);
  });
}

// Visual review (0.21.0). A row is the element around its pressable part: the li on the web, the row View on Native.
const rowOf = (l: Locator) => l.locator('xpath=..');
const fill = (l: Locator) => l.evaluate(el => getComputedStyle(el).backgroundColor);
const clear = 'rgba(0, 0, 0, 0)';
for (const platform of ['react', 'vue3', 'native']) {
  const web = platform !== 'native';
  test(`${platform}: one-line rows keep their minimum height, described rows center their ends and the whole row takes the hover`, async ({ page }) => {
    await openFixture(page, platform, '', 'list-design');
    const height = async (l: Locator) => Math.round((await box(rowOf(l))).height);
    // A 32px icon background or a switch reaches into the padding instead of growing a one-line row.
    expect(await height(page.getByRole('button', { name: /비밀번호 행/ }))).toBe(56);
    expect(await height(page.getByRole('switch', { name: /다크 모드 행/ }))).toBe(56);
    expect(await height(page.getByRole('switch', { name: /와이파이 행/ }))).toBe(44);
    expect(await height(page.getByRole('button', { name: /영수증 행/ }))).toBe(44);
    // Row titles are one weight below section titles.
    expect(await page.getByText('비밀번호 행', { exact: true }).evaluate(el => getComputedStyle(el).fontWeight)).toBe('500');
    // A described row's value centers on the band of the title and first description line, like its icon.
    const title = await box(page.getByText('11월 카드 결제 예정 금액과 할부 내역 전체 보기', { exact: true }));
    const value = await box(page.getByText('1,234,567원', { exact: true }));
    expect(Math.abs(value.y + value.height / 2 - (title.y + (20 + 4 + 16) / 2))).toBeLessThanOrEqual(2);
    // A value that wraps keeps the row's end line.
    const wrapped = page.getByText('내 파일 / 다운로드 / 문서 보관함', { exact: true });
    expect((await box(wrapped)).height).toBeGreaterThan(24);
    expect(['end', 'right']).toContain(await wrapped.evaluate(el => getComputedStyle(el).textAlign));
    // Hovering a row with a button fills the whole row, the button's part too.
    const profile = rowOf(page.getByRole('button', { name: /프로필 행/ }));
    await expect(profile.getByRole('button', { name: '공유' })).toHaveCount(1);
    expect(await fill(profile)).toBe(clear);
    await page.getByText('프로필 행', { exact: true }).hover();
    await expect.poll(() => fill(profile)).not.toBe(clear);
    if (web) expect(await page.locator('.kjun-list-main').first().evaluate(el => getComputedStyle(el).backgroundColor)).toBe(clear);
    // An app's own avatar, with no leadingSize, keeps a one-line row at 56 too.
    expect(await height(page.getByRole('button', { name: /아바타 행/ }))).toBe(56);
    // A busy switch row reads as busy and ignores presses.
    const saving = page.getByRole('switch', { name: /저장 중 행/ });
    await expect(saving).toHaveAttribute('aria-busy', 'true');
    await page.getByText('저장 중 행', { exact: true }).click();
    await expect(page.getByTestId('open-state')).toContainText('"presses":0');
    await expect(saving).toHaveAttribute('aria-checked', 'true');
    // A default multiple-choice list shows every row can be picked.
    const blue = page.getByRole('checkbox', { name: /파랑 태그/ });
    await expect(blue).toHaveAttribute('aria-checked', 'false');
    if (web) await expect(page.locator('.kjun-list-row', { hasText: '파랑 태그' }).locator('.kjun-list-mark')).toHaveCount(1);
    await page.getByText('파랑 태그', { exact: true }).click();
    await expect(page.getByTestId('open-state')).toContainText('"plain":["red","blue"]');
  });

  test(`${platform}: an open list draws larger rows with marks for its choices and fills the chosen row`, async ({ page }) => {
    await openFixture(page, platform, '', 'list-design');
    const light = page.getByRole('radio', { name: /밝게/ }), dark = page.getByRole('radio', { name: /어둡게/ });
    await expect(light).toHaveAttribute('aria-checked', 'true');
    expect(await fill(rowOf(light))).not.toBe(clear);
    expect(await fill(rowOf(dark))).toBe(clear);
    expect(Math.round((await box(rowOf(dark))).height)).toBe(64);
    expect(await page.getByText('어둡게', { exact: true }).evaluate(el => getComputedStyle(el).fontSize)).toBe('16px');
    // Rows sit 4px in from the section's edges, rounded.
    expect(await rowOf(dark).evaluate(el => getComputedStyle(el).borderTopLeftRadius)).toBe('16px');
    await page.getByText('어둡게', { exact: true }).click();
    await expect(page.getByTestId('open-state')).toContainText('"theme":"dark"');
    await expect(dark).toHaveAttribute('aria-checked', 'true');
    await expect.poll(() => fill(rowOf(light))).toBe(clear);
    const trip = page.getByRole('checkbox', { name: /여행 태그/ });
    await expect(trip).toHaveAttribute('aria-checked', 'false');
    await page.getByText('여행 태그', { exact: true }).click();
    await expect(page.getByTestId('open-state')).toContainText('"tags":["work","trip"]');
    await expect(trip).toHaveAttribute('aria-checked', 'true');
    // A disabled chosen row keeps its fill, and a list item's text starts where the rows' text does.
    expect(await fill(rowOf(page.getByRole('radio', { name: /잠긴 선택/ })))).not.toBe(clear);
    expect(Math.round((await box(page.getByText('안내 항목', { exact: true }))).x)).toBe(Math.round((await box(page.getByText('업무 태그', { exact: true }))).x));
    if (web) {
      // A row skeleton in an open section's loading slot takes the open row's shape: a described open row is 72 tall.
      const skeleton = page.locator('.kjun-list-skeleton-row[data-open]');
      expect(Math.round((await box(skeleton)).height)).toBe(12 + 24 + 4 + 20 + 12);
      expect(Math.round((await box(skeleton.locator('.kjun-list-skeleton-leading'))).width)).toBe(40);
      // Every choice draws a mark (rounded squares for multiple choice), filled when chosen; the open list has no dividers.
      await expect(page.locator('.kjun-list-mark')).toHaveCount(8);
      await expect(page.locator('.kjun-list-mark[data-checked]')).toHaveCount(5);
      expect(await page.locator('.kjun-list-mark[data-kind="checkbox"]').first().evaluate(el => getComputedStyle(el).borderRadius)).toBe('6px');
      expect(await rowOf(dark).evaluate(el => getComputedStyle(el, '::after').content)).toBe('none');
      // A built-in icon sits on a 40px rounded square, in the danger fill on a destructive row.
      const tile = page.locator('.kjun-list-row', { hasText: '어둡게' }).locator('.kjun-list-icon-background');
      expect(Math.round((await box(tile)).width)).toBe(40);
      expect(await tile.evaluate(el => getComputedStyle(el).borderRadius)).toBe('12px');
      const danger = page.locator('.kjun-list-row', { hasText: '탈퇴하기 행' }).locator('.kjun-list-icon-background');
      expect(await fill(danger)).not.toBe(await fill(tile));
      // The default variant keeps its end check.
      await expect(page.locator('.kjun-list-row', { hasText: 'English' }).locator('.kjun-list-mark')).toHaveCount(0);
    }
  });

  test(`${platform}: busy rows spin and ignore presses, compact skeletons keep the row height and badges follow the title`, async ({ page }) => {
    await openFixture(page, platform, '', 'list-design');
    // A busy button row spins in place of its chevron, ignores presses and takes no pressed fill.
    const sending = page.getByRole('button', { name: /보내는 중 행/ });
    await expect(sending).toHaveAttribute('aria-busy', 'true');
    await page.getByText('보내는 중 행', { exact: true }).hover();
    if (web) {
      await expect(rowOf(sending).locator('.kjun-list-busy')).toHaveCount(1);
      await expect(rowOf(sending).locator('.kjun-list-chevron')).toHaveCount(0);
      expect(await fill(rowOf(sending))).toBe(clear);
    }
    await page.mouse.down();
    expect(await fill(rowOf(sending))).toBe(clear);
    await page.mouse.up();
    await expect(page.getByTestId('open-state')).toContainText('"presses":0');
    // A busy link row does not navigate.
    await page.getByText('이동 중 행', { exact: true }).click();
    expect(new URL(page.url()).hash).toBe('');
    // A compact section's loading row skeleton is as tall as its compact rows.
    if (web) expect(Math.round((await box(page.locator('.kjun-list-skeleton-row[data-density="compact"]'))).height)).toBe(44);
    // A badge sits after the title, centered on its first line; the row is named by its title, badge and value, and
    // described by its description (Native reads a text badge only).
    const badge = await box(page.getByText('새 기능', { exact: true })), title = await box(page.getByText('배지 행', { exact: true }));
    expect(badge.x).toBeGreaterThan(title.x + title.width);
    expect(Math.abs(badge.y + badge.height / 2 - (title.y + title.height / 2))).toBeLessThanOrEqual(1);
    if (web) {
      const row = page.getByRole('button', { name: '배지 행 새 기능 3개', exact: true });
      await expect(row).toHaveAccessibleDescription('배지 설명');
    } else await expect(page.getByRole('button', { name: '배지 행, 배지 설명, 3개', exact: true })).toHaveCount(1);
  });
}
