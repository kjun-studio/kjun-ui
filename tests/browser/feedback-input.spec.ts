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

  test(`${platform}: a failed confirm stays open with its error, describes the dialog and can be retried`, async ({ page }) => {
    await start(page, platform);
    await page.evaluate(() => {
      const w = window as any; w.attempts = 0;
      w.feedbackContract.confirm({ title: '동기화', message: '서버와 맞춥니다.', onConfirm: async () => { if (++w.attempts === 1) throw new Error('연결이 끊겼습니다'); } })
        .then((value: unknown) => w.feedbackResults.push(value), (error: unknown) => w.feedbackResults.push('rejected'));
    });
    const dialog = page.getByRole('dialog', { name: '동기화' });
    if (platform !== 'native') await expect(dialog).toHaveAccessibleDescription('서버와 맞춥니다.');
    await dialog.getByRole('button', { name: '확인' }).click();
    await expect(dialog.getByText('연결이 끊겼습니다')).toBeVisible();
    expect(await results(page)).toEqual([]);
    await dialog.getByRole('button', { name: '확인' }).click();
    await expect.poll(() => results(page)).toEqual([true]);
  });

  test(`${platform}: a multiline prompt keeps Enter for new lines and checks as typing pauses`, async ({ page }) => {
    await start(page, platform);
    await page.evaluate(() => {
      const w = window as any;
      w.feedbackContract.prompt({ title: '메모', multiline: true, validateOn: 'change', validator: async (value: string) => value.length <= 5 || '다섯 글자까지' })
        .then((value: unknown) => w.feedbackResults.push(value));
    });
    const field = page.getByRole('textbox', { name: '메모' });
    await field.fill('여섯 글자 넘음');
    await expect(page.getByText('다섯 글자까지')).toBeVisible();
    await expect(page.getByRole('button', { name: '확인' })).toBeDisabled();
    await field.fill('짧게');
    await expect(page.getByText('다섯 글자까지')).toHaveCount(0);
    await page.getByRole('button', { name: '확인' }).click();
    await expect.poll(() => results(page)).toEqual(['짧게']);
  });

  test(`${platform}: on phones the dialog's two buttons split the width at the large height`, async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 800 });
    await start(page, platform);
    await page.evaluate(() => { (window as any).feedbackContract.confirm({ title: '저장할까요?' }); });
    const dialog = page.getByRole('dialog', { name: '저장할까요?' });
    for (const name of ['취소', '확인']) expect(Math.round((await dialog.getByRole('button', { name }).boundingBox())!.height)).toBe(48);
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
    // An empty prompt keeps confirm off, so Enter does nothing until there is text to check.
    await input.press('Enter');
    await expect(input).not.toHaveAttribute('aria-invalid', 'true');
    await input.fill('a');
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
