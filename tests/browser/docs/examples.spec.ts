import { openExampleSettings } from './example-settings';
import { test, expect, type Page } from '@playwright/test';
const platforms = { vue2: 'Vue 2', react: 'React', native: 'React Native' } as const;
async function choose(page: Page, label: string, option: string) {
  await page.getByRole('button', { name: label, exact: true }).click();
  await page.getByRole('option', { name: option, exact: true }).click();
  // The closing selector restores focus; wait before editing inside the iframe.
  await expect(page.getByRole('button', { name: label, exact: true })).toBeFocused();
  await expect(page.locator('.playground')).toHaveAttribute('data-ready', 'true');
}
async function visit(page: Page, name: string, platform: keyof typeof platforms) {
  await page.goto(name === 'feedback' ? '/feedback' : '/components/' + name);
  await expect(page.locator('.playground')).toHaveAttribute('data-ready', 'true');
  await choose(page, '문서 플랫폼', platforms[platform]);
  await expect(page.locator('.playground')).toHaveAttribute('data-ready', 'true');
  await openExampleSettings(page);
  return page.frameLocator('.playground iframe');
}
async function copy(page: Page) {
  await page.evaluate(() => { (window as any).__copied = null; Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText: async (text: string) => { (window as any).__copied = text; } } }); });
  await page.locator('#usage .code-block').getByRole('button', { name: '기본 코드 복사' }).click();
  await expect.poll(() => page.evaluate(() => (window as any).__copied)).toBeTruthy();
  return page.evaluate(() => (window as any).__copied as string);
}
for (const platform of Object.keys(platforms) as (keyof typeof platforms)[]) {
  test(`${platform} Select preserves value through settings and wide view`, async ({ page, context }) => {
    const frame = await visit(page, 'select', platform);
    // Fixed popups stay in the iframe viewport; bring that viewport on screen before pointer selection.
    await page.locator('.playground iframe').scrollIntoViewIfNeeded();
    await frame.getByRole(platform === 'vue2' ? 'combobox' : 'button', { name: '공개 범위', exact: true }).click();
    const apple = frame.getByRole(platform === 'native' ? 'radio' : 'option', { name: '나만 보기', exact: true });
    if (platform === 'native') await apple.focus();
    else await frame.getByRole('textbox', { name: '선택 항목 검색', exact: true }).press('ArrowDown');
    await apple.press('Enter');
    await expect(frame.getByRole(platform === 'vue2' ? 'combobox' : 'button', { name: '공개 범위', exact: true })).toContainText('나만 보기');
    await page.getByRole('switch', { name: '검색', exact: true }).locator('xpath=ancestor::label').click();
    await page.getByRole('switch', { name: '지우기', exact: true }).locator('xpath=ancestor::label').click();
    const code = await copy(page);
    expect(code).toMatch(/searchable(?:=\{true\}|="true")/); expect(code).toMatch(/clearable(?:=\{true\}|="true")/);
    await page.getByRole('button', { name: '넓게 보기', exact: true }).click();
    await expect(page.getByRole('dialog')).toBeVisible();
    await expect(page.getByRole('dialog').frameLocator('iframe').getByRole(platform === 'vue2' ? 'combobox' : 'button', { name: '공개 범위', exact: true })).toContainText('나만 보기');
    await page.getByRole('dialog').getByRole('button', { name: '닫기', exact: true }).click();
    await expect(page.getByRole('button', { name: '넓게 보기', exact: true })).toBeFocused();
    await expect(page.frameLocator('.playground iframe').getByRole(platform === 'vue2' ? 'combobox' : 'button', { name: '공개 범위', exact: true })).toContainText('나만 보기');
    await choose(page, '프리셋', '복수 선택');
    await expect(page.getByRole('switch', { name: '복수 선택', exact: true })).toBeChecked();
    await expect(page.locator('#usage .code-block')).not.toContainText('"select": [');
    await choose(page, '프리셋', '빈 옵션');
    await page.frameLocator('.playground iframe').getByRole(platform === 'vue2' ? 'combobox' : 'button', { name: '공개 범위', exact: true }).press('Enter');
    await expect(page.frameLocator('.playground iframe').getByText('결과가 없습니다')).toBeVisible();
  });
  test(`${platform} SearchInput mock responses, live text, cancellation and events`, async ({ page, context }) => {
    let frame = await visit(page, 'search-input', platform);
    await frame.getByRole(platform === 'native' ? 'textbox' : 'combobox', { name: '자산 검색', exact: true }).last().fill('AAA');
    await expect(frame.getByRole(platform === 'native' ? 'radio' : 'option').first()).toBeVisible();
    const code = await copy(page);
    await choose(page, '프리셋', '느린 응답');
    frame = page.frameLocator('.playground iframe');
    await frame.getByRole(platform === 'native' ? 'textbox' : 'combobox', { name: '자산 검색', exact: true }).last().fill('A');
    await expect(frame.getByText(/검색 중|조회 중|불러오는/).first()).toBeVisible();
    await expect(page.locator('.example-events')).toContainText('DsSearchInput.loadOptions');
    await frame.getByRole(platform === 'native' ? 'textbox' : 'combobox', { name: '자산 검색', exact: true }).last().fill('AAA');
    await expect(page.locator('.example-events')).toContainText('취소');
    await openExampleSettings(page);
    await page.locator('.example-events > summary').click();
    await choose(page, '프리셋', '요청 실패');
    await page.frameLocator('.playground iframe').getByRole(platform === 'native' ? 'textbox' : 'combobox', { name: '자산 검색', exact: true }).last().fill('AAA');
    await expect(page.locator('.example-events')).toContainText('실패');
    await expect(page.locator('.example-events')).toContainText(platform === 'vue2' ? 'search-error' : 'onSearchError');
    await page.getByRole('button', { name: '기록 비우기' }).click();
    await expect(page.locator('.example-events summary')).toContainText('(0)');
  });
  test(`${platform} FormGroup labels and validation preserve live input`, async ({ page, context }) => {
    const frame = await visit(page, 'form-group', platform);
    await expect(page.getByRole('switch', { name: '로딩', exact: true })).toHaveCount(0);
    await frame.getByRole('textbox', { name: '내용', exact: true }).fill('저장할 내용');
    const code = await copy(page);
    await choose(page, '프리셋', '검증 오류');
    await expect(page.frameLocator('.playground iframe').getByRole('textbox', { name: '내용', exact: true })).toHaveAttribute('aria-invalid', 'true');
    await expect(page.frameLocator('.playground iframe').getByRole('alert')).toContainText('내용을 입력해 주세요.');
    await choose(page, '프리셋', '긴 라벨·도움말');
    await page.setViewportSize({ width: 390, height: 844 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  });
  test(`${platform} Table selection, expansion and responsive presets remain interactive`, async ({ page, context }) => {
    await page.setViewportSize({ width: 1400, height: 1000 });
    const frame = await visit(page, 'table', platform);
    await frame.getByRole('checkbox').nth(1).click();
    await frame.getByRole('button', { name: /행 확장|상세 보기/ }).first().click();
    const code = await copy(page);
    await page.getByRole('switch', { name: '정렬 허용', exact: true }).locator('xpath=ancestor::label').click();
    expect(await copy(page)).toMatch(/sortable(?:=\{true\}|="true")/);
    await choose(page, '프리셋', '좁은 화면');
    await expect(page.locator('.playground iframe')).toHaveCSS('width', '375px');
    await expect(page.frameLocator('.playground iframe').getByRole('table')).not.toBeVisible();
    await choose(page, '프리셋', '빈 데이터');
    await expect(page.frameLocator('.playground iframe').getByText(/없습니다/).first()).toBeVisible();
  });
  test(`${platform} Modal opening leaves basic usage closed`, async ({ page, context }) => {
    const frame = await visit(page, 'modal', platform);
    await frame.getByRole('button', { name: '모달 열기', exact: true }).click();
    await expect(frame.getByRole('dialog', { name: '변경 사항 저장', exact: true })).toBeVisible();
    const code = await copy(page);
    expect(code).toContain('"open": false');

  });
  test(`${platform} DataState and feedback presets expose real contracts`, async ({ page }) => {
    let frame = await visit(page, 'data-state', platform);
    await choose(page, '프리셋', '동일 조건 갱신');
    await expect(frame.getByText('조회 결과', { exact: true })).toBeVisible();
    await choose(page, '프리셋', '조건 변경');
    await expect(frame.getByText('조회 결과', { exact: true })).not.toBeVisible();
    await frame.getByRole('button', { name: '조회 완료' }).click();
    await expect(frame.getByText('조회 결과', { exact: true })).toBeVisible();
    expect(await copy(page)).not.toContain('"resultKey": "b"');
    frame = await visit(page, 'feedback', platform);
    const requestConfirm = async () => {
      const trigger = frame.getByRole('button', { name: 'Confirm 요청' });
      // Focus scrolls the outer document; place the focused preview below its sticky header before mouse-down/up.
      await trigger.focus(); await expect(trigger).toBeFocused();
      await page.locator('.playground iframe').evaluate(iframe => {
        const header = document.querySelector('.document-shortcuts')?.getBoundingClientRect().bottom || 0;
        window.scrollBy({ top: iframe.getBoundingClientRect().top - header - 24, behavior: 'instant' });
      });
      await trigger.click();
    };
    await expect(page.getByRole('switch', { name: '비활성', exact: true })).toHaveCount(0);
    await choose(page, '프리셋', '확인·취소');
    await requestConfirm();
    await frame.getByRole('dialog').getByRole('button', { name: '취소', exact: true }).click();
    await openExampleSettings(page);
    await page.locator('.example-events > summary').click();
    await expect(page.locator('.example-events')).toContainText('false');
    await choose(page, '프리셋', '비동기 실패');
    await requestConfirm();
    await frame.getByRole('dialog').getByRole('button', { name: '확인', exact: true }).click();
    await expect(page.locator('.example-events')).toContainText('실패');
  });
}
test('compact canvas, unsupported controls, failure fallback, IME, and event history cap', async ({ page }) => {
  test.setTimeout(120000); // Includes a deliberate preview failure (30s in test builds) and several document loads.
  await visit(page, 'badge', 'react');
  expect(await page.locator('.playground iframe').evaluate(frame => frame.getBoundingClientRect().height)).toBeLessThan(260);
  await expect(page.getByRole('switch')).toHaveCount(0);
  await openExampleSettings(page);
  await page.locator('.example-events > summary').click();
  await expect(page.locator('.example-events')).toContainText('기록할 이벤트가 없습니다');
  await page.route('**/previews/catalog-*.js', route => route.abort());
  await page.goto('/components/checkbox');
  // Start the failure expectation after the client has mounted the preview.
  await expect(page.locator('.playground iframe')).toBeAttached({ timeout: 30000 });
  await expect(page.locator('.preview-loading')).toContainText('불러오지 못했습니다', { timeout: 45000 });
  await expect(page.locator('#usage .code-block')).toContainText('DsCheckbox');
  expect(await copy(page)).toContain('DsCheckbox');
  await page.unroute('**/previews/catalog-*.js');
  await page.getByRole('button', { name: '다시 시도', exact: true }).click();
  await expect(page.locator('.playground')).toHaveAttribute('data-ready', 'true');
  const frame = await visit(page, 'input', 'react');
  const input = frame.getByRole('textbox', { name: '목록 이름', exact: true });
  await input.dispatchEvent('compositionstart'); await input.fill('한글 입력'); await input.dispatchEvent('compositionend', { data: '한글 입력' });
  expect(await copy(page)).not.toContain('한글 입력');
  await page.screenshot({ path: 'artifacts/example-input.png', fullPage: true });
  const buttonFrame = await visit(page, 'button', 'react');
  await buttonFrame.getByRole('button', { name: '계속하기', exact: true }).evaluate(button => { for (let i = 0; i < 105; i++) (button as HTMLButtonElement).click(); });
  await expect(page.locator('.example-events summary')).toContainText('(100)');

});

test('unused source failure does not block preview or basic usage', async ({ page }) => {
  await page.route('**/previews/sources/DsSelect.json', route => route.abort());
  const frame = await visit(page, 'select', 'react');
  // Fixed option panels must remain inside the visible iframe before selecting.
  await page.locator('.playground iframe').scrollIntoViewIfNeeded();
  const trigger = frame.getByRole('button', { name: '공개 범위', exact: true });
  await trigger.focus();
  await trigger.press('Enter');
  const option = frame.getByRole('option', { name: '나만 보기', exact: true });
  await option.focus();
  await option.press('Enter');
  await expect(trigger).toContainText('나만 보기');
  await openExampleSettings(page);
  await expect(page.locator('#preview .code-block')).toHaveCount(0);
  expect(await copy(page)).toContain('DsSelect');
  await expect(trigger).toContainText('나만 보기');
});

for (const platform of ['react', 'vue2', 'native']) test(`${platform}: financial detail examples show the same complete units as the gallery`, async ({ page }) => {
  for (const slug of ['market-cards', 'market-table']) {
    await page.goto('/components/' + slug + '?platform=' + platform);
    await expect(page.locator('.playground')).toHaveAttribute('data-ready', 'true');
    const frame = page.frameLocator('.playground iframe');
    await expect(frame.getByText('1,234,567원', { exact: true }).first()).toBeVisible();
    if (slug === 'market-cards') await frame.getByRole('button', { name: /변동/ }).click();
    for (const value of ['+2.35%', '-1.25%', '0.00%']) await expect(frame.getByText(value, { exact: true }).first()).toBeVisible();
    await expect(frame.locator('body')).not.toContainText('정렬 change');
  }
});
