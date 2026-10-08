import { test, expect, type Page } from '@playwright/test';
import { openFixture } from './packed-fixture';

const results = (page: Page) => page.evaluate(() => (window as any).feedbackResults);
async function start(page: Page, platform: string) {
  await openFixture(page, platform, '?scenario=feedback', 'api-contracts');
  await expect(page.getByRole('button', { name: '서비스 준비' })).toBeVisible();
  await page.evaluate(() => {
    const w = window as any;
    w.feedbackResults = []; w.confirmCalls = 0;
    w.feedbackContract.confirm({ title: '저장 확인', onConfirm: () => {
      w.confirmCalls++;
      return new Promise<void>(resolve => { w.finishConfirm = resolve; });
    } }).then((value: boolean) => w.feedbackResults.push(value));
    w.feedbackContract.prompt({ title: '다음 입력', initialValue: '초기값',
      validator: (value: string) => value.length >= 2 || '두 글자 이상',
    }).then((value: string | null) => w.feedbackResults.push(value));
  });
}

for (const platform of ['react', 'vue2', 'native']) {
  test(`${platform} feedback prevents duplicate async submission and resets dialog state for the next request`, async ({ page }) => {
    await start(page, platform);
    const confirm = page.getByRole('dialog', { name: '저장 확인', exact: true });
    const button = confirm.getByRole('button', { name: '확인', exact: true });
    // Same-tick events exercise the guard before the framework commits the busy render.
    await button.evaluate(element => {
      element.dispatchEvent(new MouseEvent('click', { bubbles: true }));
      element.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });
    await expect.poll(() => page.evaluate(() => (window as any).confirmCalls)).toBe(1);
    await expect(button).toBeDisabled();
    await page.keyboard.press('Escape');
    await expect(confirm).toBeVisible();
    expect(await results(page)).toEqual([]);
    await page.evaluate(() => (window as any).finishConfirm());
    const prompt = page.getByRole('dialog', { name: '다음 입력', exact: true });
    await expect(prompt.getByRole('textbox')).toHaveValue('초기값');
    await expect(prompt.getByRole('button', { name: '확인', exact: true })).toBeEnabled();
    await prompt.getByRole('textbox').fill('a');
    await prompt.getByRole('button', { name: '확인', exact: true }).click();
    await expect(prompt.getByText('두 글자 이상', { exact: true })).toBeVisible();
    await prompt.getByRole('textbox').fill('완료');
    await expect(prompt.getByText('두 글자 이상', { exact: true })).toHaveCount(0);
    await prompt.getByRole('button', { name: '확인', exact: true }).click();
    await expect.poll(() => results(page)).toEqual([true, '완료']);
  });

  test(`${platform} feedback ignores late confirmation completion after provider disposal`, async ({ page }) => {
    await start(page, platform);
    await page.getByRole('dialog', { name: '저장 확인', exact: true })
      .getByRole('button', { name: '확인', exact: true }).click();
    await expect.poll(() => page.evaluate(() => (window as any).confirmCalls)).toBe(1);
    await page.evaluate(() => (window as any).unmountContract());
    await expect.poll(() => results(page)).toEqual([false, null]);
    await page.evaluate(async () => { (window as any).finishConfirm(); await Promise.resolve(); });
    expect(await results(page)).toEqual([false, null]);
    await expect(page.getByRole('dialog')).toHaveCount(0);
  });
}
