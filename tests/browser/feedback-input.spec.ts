import { test, expect, type Page } from '@playwright/test';
import { openFixture } from './packed-fixture';

async function start(page: Page, platform: string) {
  await openFixture(page, platform, '?scenario=feedback', 'api-contracts');
  await expect(page.getByRole('button', { name: '서비스 준비' })).toBeVisible();
  await page.evaluate(() => { (window as any).feedbackResults = []; });
}
const results = (page: Page) => page.evaluate(() => (window as any).feedbackResults);

for (const platform of ['react', 'vue3', 'native']) {
  test(`${platform}: prompt is a small labelled dialog that selects its start text and gates a required value`, async ({ page }) => {
    await page.setViewportSize({ width: 1024, height: 800 });
    await start(page, platform);
    await page.evaluate(() => {
      const w = window as any;
      w.feedbackContract.prompt({ title: '목록 삭제', message: '항목 32개가 사라집니다.', type: 'danger', label: '목록 이름', maxLength: 20,
        requiredValue: '주말 장보기', initialValue: '주말', confirmText: '삭제' }).then((value: unknown) => w.feedbackResults.push(value));
    });
    const dialog = page.getByRole('dialog', { name: '목록 삭제' });
    await expect(dialog).toBeVisible();
    // 400px, no close button; the start text opens selected.
    expect(Math.round((await dialog.boundingBox())!.width)).toBe(400);
    await expect(dialog.getByRole('button', { name: /닫기/ })).toHaveCount(0);
    const input = dialog.getByRole('textbox');
    await expect(input).toBeFocused();
    expect(await input.evaluate((el: any) => el.selectionStart === 0 && el.selectionEnd === el.value.length)).toBe(true);
    // The required name gates confirm; the message describes the field.
    const confirm = dialog.getByRole('button', { name: '삭제' });
    await expect(confirm).toBeDisabled();
    await input.fill('주말 장보기');
    await expect(confirm).toBeEnabled();
    await expect(dialog.getByText('6 / 20')).toBeVisible();
    if (platform !== 'native') await expect(input).toHaveAccessibleDescription('항목 32개가 사라집니다.');
    await confirm.click();
    await expect.poll(() => results(page)).toEqual(['주말 장보기']);
  });

  test(`${platform}: a prompt onConfirm failure stays in the dialog as the field error`, async ({ page }) => {
    await start(page, platform);
    await page.evaluate(() => {
      const w = window as any;
      w.feedbackContract.prompt({ title: '이름 변경', onConfirm: async (value: string) => { if (value !== '새 이름') throw new Error('이미 있는 이름입니다'); } })
        .then((value: unknown) => w.feedbackResults.push(value));
    });
    const input = page.getByRole('textbox', { name: '이름 변경' });
    await input.fill('중복');
    await input.press('Enter');
    await expect(page.getByText('이미 있는 이름입니다')).toBeVisible();
    await input.fill('새 이름');
    await input.press('Enter');
    await expect.poll(() => results(page)).toEqual(['새 이름']);
  });

  test(`${platform}: prompt focuses its input, describes validation errors and clears their reference`, async ({ page }) => {
    await start(page, platform);
    const trigger = page.getByRole('button', { name: '서비스 준비' });
    await trigger.focus();
    await page.evaluate(() => {
      const w = window as any;
      w.feedbackContract.prompt({ title: '이름 입력', validator: (value: string) => value.length >= 2 || '두 글자 이상 입력하세요' })
        .then((value: unknown) => w.feedbackResults.push(value));
    });
    const input = page.getByRole('textbox', { name: '이름 입력' });
    await expect(input).toBeFocused();
    await input.press('Enter');
    await expect(input).toHaveAttribute('aria-invalid', 'true');
    await expect(input).toHaveAccessibleDescription('두 글자 이상 입력하세요');
    await input.fill('수정');
    await expect(input).not.toHaveAttribute('aria-invalid', 'true');
    await expect(input).toHaveAccessibleDescription('');
    await input.press('Enter');
    await expect.poll(() => results(page)).toEqual(['수정']);
    await expect(trigger).toBeFocused();
  });

  test(`${platform}: composition Enter cannot submit a prompt`, async ({ page }) => {
    await start(page, platform);
    await page.evaluate(() => {
      const w = window as any;
      w.feedbackContract.prompt({ title: '한글 입력', initialValue: '한글' })
        .then((value: unknown) => w.feedbackResults.push(value));
    });
    const input = page.getByRole('textbox');
    await input.dispatchEvent('keydown', { key: 'Enter', keyCode: 13, isComposing: true });
    expect(await results(page)).toEqual([]);
    await input.dispatchEvent('compositionstart');
    await input.dispatchEvent('keydown', { key: 'Enter', keyCode: 13, isComposing: platform === 'native' });
    expect(await results(page)).toEqual([]);
    await input.dispatchEvent('compositionend');
    await input.dispatchEvent('keydown', { key: 'Enter', keyCode: 229 });
    expect(await results(page)).toEqual([]);
    await input.press('Enter');
    await expect.poll(() => results(page)).toEqual(['한글']);
  });

  for (const reducedMotion of ['no-preference', 'reduce'] as const) {
    for (const action of ['확인', '취소']) {
      test(`${platform}: duplicate prompt ${action} stays bound to its rendered request (${reducedMotion})`, async ({ page }) => {
        await page.emulateMedia({ reducedMotion });
        await start(page, platform);
        await page.evaluate(() => {
          const w = window as any;
          for (const [title, initialValue] of [['첫 입력', 'first'], ['다음 입력', 'second']])
            w.feedbackContract.prompt({ title, initialValue }).then((value: unknown) => w.feedbackResults.push(value));
        });
        await page.getByRole('dialog', { name: '첫 입력' }).getByRole('button', { name: action, exact: true }).evaluate(element => {
          element.dispatchEvent(new MouseEvent('click', { bubbles: true }));
          element.dispatchEvent(new MouseEvent('click', { bubbles: true }));
        });
        const first = action === '확인' ? 'first' : null;
        expect(await results(page)).toEqual([first]);
        const input = page.getByRole('dialog', { name: '다음 입력' }).getByRole('textbox');
        await expect(input).toHaveValue('second');
        await expect(input).toBeFocused();
        await input.press('Enter');
        await expect.poll(() => results(page)).toEqual([first, 'second']);
      });
    }
  }
}
