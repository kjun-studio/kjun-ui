import { expect, test, type Page } from '@playwright/test';
import { openFixture } from './packed-fixture';

// KjunFileUpload: an empty card is one wide pick button; with files it folds into a list, a head and an add row.
// The fixture's fake uploader moves files one step per press of "<id>-advance" and logs callbacks as JSON.
const MB = 1024 * 1024;
const section = (page: Page, id: string) => page.getByTestId(id);
const log = async (page: Page, id: string) => JSON.parse(await page.getByTestId(id + '-log').textContent() || '[]');
const card = (page: Page, id: string) => section(page, id).locator('.kjun-file-upload');
const file = (name: string, size: number, mimeType: string) => ({ name, mimeType, buffer: Buffer.alloc(size) });

/** Fires drag events at an element with real File items (Chromium fills DataTransfer.items from them). */
async function drag(page: Page, id: string, target: string, type: 'dragenter' | 'dragover' | 'dragleave' | 'drop', files: { name: string; type: string; size?: number }[]) {
  await card(page, id).locator(target).first().evaluate((el, { type, files }) => {
    const data = new DataTransfer();
    for (const f of files) data.items.add(new File([new Uint8Array(f.size ?? 1)], f.name, { type: f.type }));
    el.dispatchEvent(new DragEvent(type, { bubbles: true, cancelable: true, dataTransfer: data }));
  }, { type, files });
}

for (const platform of ['react', 'vue3', 'native']) {
  test.describe(platform, () => {
    const web = platform !== 'native';
    test.beforeEach(async ({ page }) => {
      await page.setViewportSize({ width: 1024, height: 1400 });
      await openFixture(page, platform, '', 'file-upload');
    });

    test('empty state is one button named by its title and described by the hint', async ({ page }) => {
      const zone = section(page, 'fu-basic').getByRole('button', { name: web ? '파일을 끌어다 놓거나 눌러서 선택' : '파일 선택' });
      await expect(zone).toBeVisible();
      if (web) await expect(zone).toHaveAccessibleDescription('PDF, XLSX, 이미지 · 파일당 20MB · 5개까지');
      else await expect(section(page, 'fu-basic')).toContainText('PDF, XLSX, 이미지 · 파일당 20MB · 5개까지');
      await expect(section(page, 'fu-basic').getByRole('list')).toHaveCount(0);
    });

    test('choosing files through the hidden input reports accepted and rejected files', async ({ page }) => {
      test.skip(!web, 'Native picks through onPick');
      await card(page, 'fu-basic').locator('input[type=file]').setInputFiles([file('a.pdf', 1024, 'application/pdf'), file('b.hwp', 10, 'application/x-hwp'), file('c.pdf', 21 * MB, 'application/pdf')]);
      expect(await log(page, 'fu-basic')).toEqual([{ select: { accepted: ['a.pdf'], rejected: [['b.hwp', 'type'], ['c.pdf', 'size']] } }]);
      const notice = card(page, 'fu-basic').locator('.kjun-file-upload-notice');
      await expect(notice).toContainText('b.hwp: 올릴 수 없는 형식이라 추가하지 않았어요');
      await expect(notice).toContainText('c.pdf: 20MB를 넘어 추가하지 않았어요');
      await expect(section(page, 'fu-basic').getByRole('listitem')).toHaveCount(1);
      await notice.getByRole('button', { name: '닫기' }).click();
      await expect(notice).toHaveCount(0);
    });

    test('choosing the same file twice calls onSelect twice', async ({ page }) => {
      test.skip(!web, 'Native picks through onPick');
      const input = card(page, 'fu-basic').locator('input[type=file]');
      await input.setInputFiles([file('a.pdf', 1024, 'application/pdf')]);
      await input.setInputFiles([file('a.pdf', 1024, 'application/pdf')]);
      expect((await log(page, 'fu-basic')).length).toBe(2);
    });

    test('rows show the status in words and colour only the status text', async ({ page }) => {
      const rows = section(page, 'fu-filled').getByRole('listitem');
      await expect(rows).toHaveCount(4);
      const doneRow = rows.nth(1), failRow = rows.nth(2);
      await expect(doneRow).toContainText('18.6MB');
      await expect(doneRow).toContainText('올렸어요');
      await expect(failRow).toContainText('올리지 못했어요');
      await expect(rows.nth(3)).toContainText('대기 중');
      await expect(rows.nth(0)).toContainText('2.7MB / 4.2MB');
      await expect(rows.nth(0)).toContainText('64%');
      if (!web) return;
      const colours = await doneRow.evaluate(row => {
        const c = (sel: string) => getComputedStyle(row.querySelector(sel)!).color;
        const probe = document.createElement('span');
        probe.style.color = 'var(--_kjun-color-success)'; row.appendChild(probe);
        const success = getComputedStyle(probe).color; probe.remove();
        return { status: c('.kjun-file-upload-status'), size: c('.kjun-file-upload-num'), success };
      });
      expect(colours.status).toBe(colours.success);
      expect(colours.size).not.toBe(colours.success);
      await expect(failRow.locator('.kjun-file-upload-thumb')).toHaveText('PDF');
    });

    test('a long name keeps its last four characters and extension visible', async ({ page }) => {
      test.skip(!web, 'Native draws the same two text runs without DOM classes');
      const row = section(page, 'fu-filled').getByRole('listitem').nth(1);
      const tail = row.locator('.kjun-file-upload-name-tail');
      await expect(tail).toHaveText('본_최종.pdf');
      const [t, r] = await Promise.all([tail.boundingBox(), row.boundingBox()]);
      expect(t!.x + t!.width).toBeLessThanOrEqual(r!.x + r!.width);
    });

    test('every row ends with one remove button and failed rows add retry', async ({ page }) => {
      const s = section(page, 'fu-filled');
      await expect(s.getByRole('button', { name: '사업자등록증.pdf 삭제' })).toBeVisible();
      await expect(s.getByRole('button', { name: '사업자등록증.pdf 다시 시도' })).toBeVisible();
      await expect(s.getByRole('button', { name: /다시 시도$/ })).toHaveCount(1);
      await s.getByRole('button', { name: '실패한 파일 다시 시도' }).click();
      expect(await log(page, 'fu-filled')).toEqual([{ retry: 'fail' }]);
    });

    test('removing a row moves focus to the next row, then the previous, then the add button', async ({ page }) => {
      test.skip(!web, 'Native leaves focus to the platform');
      const s = section(page, 'fu-filled');
      await s.getByRole('button', { name: '사업자등록증.pdf 삭제' }).click();
      await expect(s.getByRole('button', { name: '거래처_목록.xlsx 삭제' })).toBeFocused();
      await s.getByRole('button', { name: '거래처_목록.xlsx 삭제' }).click();
      await expect(s.getByRole('button', { name: /최종\.pdf 삭제$/ })).toBeFocused();
      const single = section(page, 'fu-single');
      await single.getByRole('button', { name: '계약서.pdf 삭제' }).click();
      await expect(single.getByRole('button', { name: '파일을 끌어다 놓거나 눌러서 선택' })).toBeFocused();
    });

    test('dragging files over the card shows the veil and survives moving over rows', async ({ page }) => {
      test.skip(!web, 'Native has no drag and drop');
      const files = [{ name: 'x.pdf', type: 'application/pdf' }];
      await drag(page, 'fu-filled', '.kjun-file-upload-list', 'dragenter', files);
      await drag(page, 'fu-filled', '.kjun-file-upload-row', 'dragenter', files);
      await drag(page, 'fu-filled', '.kjun-file-upload-list', 'dragleave', files);
      await expect(card(page, 'fu-filled')).toHaveAttribute('data-drag', 'over');
      await expect(card(page, 'fu-filled').locator('.kjun-file-upload-veil')).toContainText('여기에 놓으세요');
      await drag(page, 'fu-filled', '.kjun-file-upload-row', 'dragleave', files);
      await expect(card(page, 'fu-filled')).toHaveAttribute('data-drag', 'none');
    });

    test('a drag of a blocked type marks the card blocked; a missing MIME stays neutral', async ({ page }) => {
      test.skip(!web, 'Native has no drag and drop');
      // fu-basic accepts ".pdf,image/*,.xlsx": extension rules cannot be read from a drag, so nothing is blocked early.
      await drag(page, 'fu-basic', '.kjun-file-upload-zone', 'dragenter', [{ name: 'x.hwp', type: 'application/x-hwp' }]);
      await expect(card(page, 'fu-basic')).toHaveAttribute('data-drag', 'over');
      await drag(page, 'fu-basic', '.kjun-file-upload-zone', 'drop', [{ name: 'x.hwp', type: 'application/x-hwp' }]);
      expect(await log(page, 'fu-basic')).toEqual([{ select: { accepted: [], rejected: [['x.hwp', 'type']] } }]);
    });

    test('dropping onto a full field rejects everything as count', async ({ page }) => {
      test.skip(!web, 'Native has no drag and drop');
      const add = section(page, 'fu-full').getByRole('button', { name: '2개를 모두 추가했어요' });
      await expect(add).toHaveAttribute('aria-disabled', 'true');
      await drag(page, 'fu-full', '.kjun-file-upload-list', 'dragenter', [{ name: '3.pdf', type: 'application/pdf' }]);
      await expect(card(page, 'fu-full')).toHaveAttribute('data-drag', 'blocked');
      await drag(page, 'fu-full', '.kjun-file-upload-list', 'drop', [{ name: '3.pdf', type: 'application/pdf' }]);
      expect(await log(page, 'fu-full')).toEqual([{ select: { accepted: [], rejected: [['3.pdf', 'count']] } }]);
    });

    test('the live region speaks only completion and failure', async ({ page }) => {
      test.skip(!web, 'picks below go through the hidden input');
      const s = section(page, 'fu-basic'), live = card(page, 'fu-basic').locator('[aria-live=polite]');
      await card(page, 'fu-basic').locator('input[type=file]').setInputFiles([file('a.pdf', 1024, 'application/pdf'), file('fail.pdf', 1024, 'application/pdf')]);
      await s.getByTestId('fu-basic-advance').click();
      await expect(live).toHaveText('');
      await s.getByTestId('fu-basic-advance').click();
      await expect(live).toHaveText('a.pdf 올렸어요 fail.pdf 올리지 못했어요');
    });

    test('progress without a value is indeterminate and out-of-range values clamp', async ({ page }) => {
      const bars = section(page, 'fu-progress').getByRole('progressbar');
      await expect(bars.nth(0)).not.toHaveAttribute('aria-valuenow');
      await expect(bars.nth(1)).toHaveAttribute('aria-valuenow', '0');
      await expect(bars.nth(2)).toHaveAttribute('aria-valuenow', '100');
      await expect(bars.nth(0)).toHaveAccessibleName('none.pdf 업로드 진행률');
    });

    test('single mode shows Replace instead of the add row', async ({ page }) => {
      const s = section(page, 'fu-single');
      await expect(s.getByRole('button', { name: '계약서.pdf 바꾸기' })).toBeVisible();
      await expect(s.getByRole('button', { name: /파일 추가/ })).toHaveCount(0);
    });

    test('disabled ignores drops and disables row actions', async ({ page }) => {
      await expect(section(page, 'fu-disabled').getByRole('button', { name: '결재본.pdf 삭제' })).toBeDisabled();
      if (!web) return;
      await drag(page, 'fu-disabled', '.kjun-file-upload-list', 'dragenter', [{ name: 'x.pdf', type: 'application/pdf' }]);
      await expect(card(page, 'fu-disabled')).toHaveAttribute('data-drag', 'none');
    });

    test('FormGroup label names the field and its error describes it', async ({ page }) => {
      const group = section(page, 'fu-form').getByRole('group', { name: /증빙 자료/ });
      await expect(group).toBeVisible();
      if (web) await expect(group).toHaveAccessibleDescription(/필수 항목이에요/);
    });

    test('no horizontal overflow at 360px', async ({ page }) => {
      await page.setViewportSize({ width: 360, height: 1400 });
      const overflow = await section(page, 'fu-filled').evaluate(el => el.scrollWidth - el.clientWidth);
      expect(overflow).toBeLessThanOrEqual(0);
    });
    test('picking calls onPick and screens the result', async ({ page }) => {
      test.skip(web, 'Web picks through the hidden input');
      await section(page, 'fu-basic').getByRole('button', { name: '파일 선택' }).click();
      await expect.poll(() => log(page, 'fu-basic')).toEqual([{ select: { accepted: ['a.pdf'], rejected: [['b.hwp', 'type'], ['big.pdf', 'size']] } }]);
      await expect(section(page, 'fu-basic')).toContainText('big.pdf: 20MB를 넘어 추가하지 않았어요');
      await expect(section(page, 'fu-basic').getByRole('button', { name: '파일 추가' })).toBeVisible();
    });

    test('a cancelled pick (null) changes nothing', async ({ page }) => {
      test.skip(web, 'Web picks through the hidden input');
      await section(page, 'fu-cancel').getByRole('button', { name: '파일 선택' }).click();
      await page.waitForTimeout(200);
      expect(await log(page, 'fu-cancel')).toEqual([]);
      await expect(section(page, 'fu-cancel').getByRole('listitem')).toHaveCount(0);
    });
  });
}
