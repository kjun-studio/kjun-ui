import { test, expect, type Page } from '@playwright/test';
import { openFixture } from './packed-fixture';
const platforms = ['vue2', 'react', 'native'] as const;
const events = (page: Page) => page.evaluate(() => (window as any).contractEvents as { name: string; value?: any }[]);
const clear = (page: Page) => page.evaluate(() => { (window as any).contractEvents = []; });
const configure = (page: Page, props: object) => page.evaluate(props => (window as any).configureContract(props), props);
const fixture = (page: Page, platform: string, scenario: string) => openFixture(page, platform, '?scenario=' + scenario, 'api-contracts');

for (const platform of platforms) {
  test(`${platform} packed Select exposes actual open ownership and ordered value/clear payloads`, async ({ page }) => {
    await fixture(page, platform, 'select-fixed');
    await page.getByRole(platform === 'vue2' ? 'combobox' : 'button', { name: '계약 선택', exact: true }).click();
    await expect.poll(() => events(page)).toContainEqual({ name: 'open', value: true });
    await expect(page.getByRole(platform === 'native' ? 'radio' : 'option')).toHaveCount(0);
    await expect(page.getByRole(platform === 'vue2' ? 'combobox' : 'button', { name: '계약 선택', exact: true })).toHaveAttribute('aria-expanded', 'false');
    for (const scenario of ['select', 'select-multiple']) {
      await fixture(page, platform, scenario);
      await page.getByRole(platform === 'vue2' ? 'combobox' : 'button', { name: '계약 선택', exact: true }).click(); await clear(page);
      await page.getByRole(platform === 'native' ? (scenario === 'select-multiple' ? 'checkbox' : 'radio') : 'option', { name: 'Alpha' }).click();
      const value = scenario === 'select' ? 'a' : ['a'];
      await expect.poll(async () => (await events(page)).slice(0, 2)).toEqual([{ name: 'value', value }, { name: 'change', value }]);
      if (scenario === 'select') await expect.poll(() => events(page)).toContainEqual({ name: 'open', value: false });
      else {
        const selected = await page.evaluate(() => (window as any).selectedSlot);
        if (platform === 'vue2') expect(selected).toBeNull(); else expect(selected.value).toBe('a');
        await page.mouse.click(1200, 700);
      }
      await page.getByRole('button', { name: '선택 지우기', exact: true }).click();
      await expect.poll(async () => (await events(page)).filter(e => ['value', 'change', 'clear'].includes(e.name)).slice(-3)).toEqual([{ name: 'value', value: scenario === 'select' ? null : [] }, { name: 'change', value: scenario === 'select' ? null : [] }, { name: 'clear', value: undefined }]);
    }
    await fixture(page, platform, 'select-defaults'); await page.getByRole(platform === 'vue2' ? 'combobox' : 'button', { name: '계약 선택' }).click();
    await expect(page.getByRole('textbox')).toHaveCount(0); await page.getByRole(platform === 'native' ? 'radio' : 'option', { name: 'Alpha' }).click();
    await expect(page.getByRole('button', { name: '선택 지우기' })).toHaveCount(0);
    await fixture(page, platform, 'select-search');
    await page.getByRole(platform === 'vue2' ? 'combobox' : 'button', { name: '계약 선택', exact: true }).click();
    await page.getByRole('textbox', { name: '선택 항목 검색' }).fill('BTC');
    if (platform === 'vue2') await expect(page.getByRole('option', { name: 'Alpha' })).toBeVisible();
    else await expect(page.getByText('결과가 없습니다', { exact: true })).toBeVisible();
  });
  test(`${platform} packed Table distinguishes row objects, keys, empty controlled expansion and sort payloads`, async ({ page }) => {
    await page.setViewportSize({ width: 1300, height: 900 }); await fixture(page, platform, 'table');
    await page.getByRole('checkbox').nth(1).click();
    await expect.poll(async () => (await events(page)).find(e => e.name === 'selected')?.value).toEqual([{ id: 'a', name: 'Alpha', amount: 20 }]);
    await expect(page.getByText('1개 선택 계약')).toBeVisible();
    await page.getByRole('button', { name: /행 확장|상세 보기/ }).first().click();
    await expect.poll(async () => (await events(page)).find(e => e.name === 'expanded')?.value).toEqual(['a']);
    await expect(page.getByText('상세 a')).toHaveCount(0);
    const cell = await page.evaluate(() => (window as any).cellContract);
    expect(cell.row).toHaveProperty('id'); expect(typeof cell.index).toBe('number');
    // The complete sort cycle lives in table-sort.test.mjs and table-contracts.spec.ts.
    await page.getByRole(platform === 'vue2' ? 'columnheader' : 'button', { name: /금액/ }).click();
    await expect.poll(async () => (await events(page)).filter(e => e.name === 'sort')).toEqual([
      { name: 'sort', value: { key: 'amount', order: 'asc' } },
    ]);
    await page.getByRole('textbox').fill('no-match');
    await expect.poll(() => events(page)).toContainEqual({ name: 'search', value: 'no-match' });
    await expect(page.getByText('Alpha', { exact: true })).toBeVisible();
  });
  test(`${platform} packed SearchInput remote delay is independent of debounce and suppresses stale failures`, async ({ page }) => {
    await fixture(page, platform, 'search');
    let input = page.getByRole(platform === 'native' ? 'textbox' : 'combobox').first();
    if (platform === 'native') { await input.click(); input = page.getByRole('dialog').getByRole('textbox'); }
    await input.fill('slow');
    await expect.poll(() => events(page), { timeout: 2000 }).toContainEqual({ name: 'request', value: 'slow' });
    await input.fill('fast');
    await expect(page.getByRole(platform === 'native' ? 'radio' : 'option', { name: /fast result/ })).toBeVisible();
    await expect.poll(() => events(page)).toContainEqual({ name: 'abort', value: 'slow' });
    await input.fill('fail');
    await expect.poll(() => events(page)).toContainEqual({ name: 'error', value: 'request failed' });
    await expect(page.getByRole(platform === 'native' ? 'radio' : 'option', { name: /slow result/ })).toHaveCount(0);
  });
  test(`${platform} packed field ownership and DataState result transitions match the written contract`, async ({ page }) => {
    await fixture(page, platform, 'form');
    const input = page.getByRole('textbox'); await input.fill('보존할 값');
    await expect(page.getByText('필드 도움말', { exact: true })).toBeVisible();
    await configure(page, { error: '검증 오류' });
    await expect(page.getByText('필드 도움말', { exact: true })).toHaveCount(0); await expect(input).toHaveValue('보존할 값');
    await expect(input).toBeEnabled(); await expect(input).toHaveAttribute('aria-invalid', 'true');
    await fixture(page, platform, 'data-state');
    await expect(page.getByText('현재 결과', { exact: true })).toHaveCount(0);
    await configure(page, { resultKey: 'a', loading: false }); await expect(page.getByText('현재 결과', { exact: true })).toBeVisible();
    await configure(page, { loading: true }); await expect(page.getByText('현재 결과', { exact: true })).toBeVisible();
    await configure(page, { loading: false, error: '갱신 실패' }); await expect(page.getByText('현재 결과', { exact: true })).toBeVisible();
    await page.getByRole('button', { name: '다시 시도', exact: true }).click(); await expect.poll(() => events(page)).toContainEqual({ name: 'retry', value: undefined });
    await configure(page, { queryKey: 'b', loading: true, error: null }); await expect(page.getByText('현재 결과', { exact: true })).not.toBeVisible();
    await configure(page, { loading: false, error: '새 조건 실패' }); await expect(page.getByText('현재 결과', { exact: true })).not.toBeVisible();
    if (platform === 'vue2') expect(await page.evaluate(() => (window as any).errorSlotContract)).toEqual({ error: '새 조건 실패', retryType: 'function' });
    await configure(page, { resultKey: 'b', error: null }); await expect(page.getByText('현재 결과', { exact: true })).toBeVisible();
  });
  test(`${platform} packed feedback returns typed cancellation and failure, validates prompts, and disposes FIFO requests`, async ({ page }) => {
    await fixture(page, platform, 'feedback'); await expect(page.getByRole('button', { name: '서비스 준비' })).toBeVisible();
    await page.evaluate(() => {
      const w = window as any; w.results = [];
      w.feedbackContract.confirm({ title: '실패 확인', onConfirm: async () => { throw new Error('저장 실패'); } }).catch((e: Error) => w.results.push(e.message));
      w.feedbackContract.prompt({ title: '입력 검증', validator: (v: string) => v.length > 1 || '두 글자 이상' }).then((v: unknown) => w.results.push(v));
    });
    await page.getByRole('dialog').getByRole('button', { name: '확인', exact: true }).click();
    await expect(page.getByRole('dialog', { name: '입력 검증', exact: true })).toBeVisible();
    await page.getByRole('dialog').getByRole('button', { name: '확인', exact: true }).click(); await expect(page.getByText('두 글자 이상', { exact: true })).toBeVisible();
    await page.getByRole('dialog').getByRole('textbox').fill('완료'); await page.getByRole('dialog').getByRole('button', { name: '확인', exact: true }).click();
    await expect.poll(() => page.evaluate(() => (window as any).results)).toEqual(['저장 실패', '완료']);
    await page.evaluate(() => {
      const w = window as any, f = w.feedbackContract; w.results = [];
      f.confirm('대기 확인').then((v: unknown) => w.results.push(v)); f.prompt('대기 입력').then((v: unknown) => w.results.push(v));
      w.toastId = f.toast.success('직접 종료 알림', { duration: 0 });
    });
    expect(await page.evaluate(() => (window as any).toastId)).toBeGreaterThan(0);
    await page.evaluate(() => (window as any).unmountContract());
    await expect.poll(() => page.evaluate(() => (window as any).results)).toEqual([false, null]);
    expect(await page.evaluate(() => (window as any).feedbackContract.toast.info('해제 후'))).toBe(-1);
  });
}
