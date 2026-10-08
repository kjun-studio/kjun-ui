import { openExampleSettings } from './example-settings';
import { test, expect, type Page } from '@playwright/test';
import { guideTopics } from '../../../shared/document-navigation';

const shortcuts = (page: Page) => page.getByRole('navigation', { name: '상세 문서 바로가기' });
async function ready(page: Page) {
  await expect(page.locator('#preview .playground')).toHaveAttribute('data-ready', 'true', { timeout: 30000 });
}
async function aligned(page: Page, id: string) {
  await expect.poll(() => page.locator('#' + id).evaluate(element => {
    const bar = document.querySelector('.document-shortcuts') || document.querySelector('.topbar')!;
    const gap = element.getBoundingClientRect().top - bar.getBoundingClientRect().bottom;
    return gap >= 0 && gap < 40;
  })).toBe(true);
}

for (const platform of ['vue2', 'react', 'native']) {
  test(`${platform}: preview focus releases anchor correction while later content settles`, async ({ page }) => {
    await page.goto('/usage-guide/forms?platform=' + platform + '#selection');
    const card = page.locator('#selection [data-guide-case="choose-DsSelect"]');
    await expect(card.locator('.guide-running')).toHaveAttribute('data-ready', 'true');
    await page.evaluate(() => {
      window.addEventListener('message', event => {
        if (event.data?.type === 'kjun:catalog-focus' && event.data.component === 'DsSelect') (window as any).__previewFocused = true;
      });
      window.scrollBy({ top: 250, behavior: 'instant' });
    });
    await card.frameLocator('iframe').getByRole(platform === 'vue2' ? 'combobox' : 'button', { name: platform === 'native' ? '자산 선택' : '공개 범위', exact: true }).focus();
    await page.waitForFunction(() => (window as any).__previewFocused);
    const before = await page.evaluate(() => scrollY);
    // A late block below the reader resizes main without moving their content.
    // The pending hash correction must not pull them back to the section start.
    const after = await page.evaluate(async () => {
      document.querySelector<HTMLElement>('.doc-footer')!.style.minHeight = '300px';
      for (let i = 0; i < 5; i++) await new Promise(requestAnimationFrame);
      return scrollY;
    });
    expect(Math.abs(after - before)).toBeLessThanOrEqual(1);
  });

  test(`${platform}: detail anchors share current position and preserve live input and fixed basic code`, async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 1000 });
    await page.goto('/components/input?platform=' + platform);
    await ready(page);
    await expect(shortcuts(page).getByRole('link')).toHaveText(['사용법', '디자인', 'API', '접근성']);
    const input = page.frameLocator('#preview iframe').getByRole('textbox', { name: '목록 이름', exact: true });
    await input.fill('문서 이동 후에도 유지');
    const original = await page.locator('#usage pre').innerText();
    await shortcuts(page).getByRole('link', { name: 'API', exact: true }).click();
    await expect(page).toHaveURL(new RegExp('platform=' + platform + '#api$'));
    await aligned(page, 'api');
    await expect(page.locator('#api')).toBeFocused();
    await expect(shortcuts(page).locator('[aria-current]')).toHaveText('API');
    await shortcuts(page).getByRole('link', { name: '디자인', exact: true }).click();
    await aligned(page, 'anatomy');
    await page.goBack(); await aligned(page, 'api');
    await page.goForward(); await aligned(page, 'anatomy');
    const comparison = page.locator('main [id^="design-"]').first();
    const id = await comparison.getAttribute('id');
    await page.goto('/components/input?platform=' + platform + '#' + id);
    await aligned(page, id!);
    await expect(shortcuts(page).locator('[aria-current]')).toHaveText('디자인');
    await shortcuts(page).getByRole('link', { name: '사용법', exact: true }).click();
    await aligned(page, 'preview');
    await expect(input).toHaveValue('문서 이동 후에도 유지');
    await expect(page.locator('#usage pre')).toHaveText(original);
    await page.goto('/components/input?platform=' + platform + '#usage');
    await aligned(page, 'usage');
    await expect(shortcuts(page).locator('[aria-current]')).toHaveText('사용법');
    await page.evaluate(() => Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText: async (text: string) => { (window as any).__navigationCopy = text; } } }));
    for (const label of ['기본 코드 복사']) {
      await page.evaluate(() => { (window as any).__navigationCopy = ''; });
      await page.getByRole('button', { name: label, exact: true }).click();
      await expect.poll(() => page.evaluate(() => (window as any).__navigationCopy)).not.toContain('문서 이동 후에도 유지');
    }
    await shortcuts(page).getByRole('link', { name: 'API', exact: true }).click();
    await aligned(page, 'api');
    await page.mouse.wheel(0, -30000);
    await expect(shortcuts(page).locator('[aria-current]')).toHaveText('사용법');
    await expect(page).toHaveURL(/#api$/);
  });

  test(`${platform}: every topic contains only its assigned guide sections and opens its parent navigation`, async ({ page }) => {
    for (const topic of guideTopics) {
      await page.goto(topic.path + '?platform=' + platform);
      await expect(page.getByRole('button', { name: '문서 플랫폼', exact: true })).toBeEnabled();
      await expect(page.getByRole('heading', { level: 1 })).toHaveText(topic.title);
      await expect(page.locator('main section[id]')).toHaveCount(topic.sections.length);
      expect(await page.locator('main section[id]').evaluateAll(elements => elements.map(element => element.id))).toEqual(topic.sections.map(([id]) => id));
      await expect(page.getByRole('button', { name: '사용 가이드 주제', exact: true })).toHaveAttribute('aria-expanded', 'true');
      await expect(page.locator('.doc-nav a[aria-current="page"]')).toHaveText(topic.title);
      await expect(page.locator('.breadcrumbs')).toContainText('사용 가이드');
      await expect(shortcuts(page)).toHaveCount(0);
    }
  });
}

test('guide overview, topic search and history retain canonical destinations', async ({ page }) => {
  test.setTimeout(120000);
  await page.goto('/usage-guide?platform=react');
  await expect(page.getByRole('button', { name: '문서 플랫폼', exact: true })).toBeEnabled();
  await expect(page.locator('.guide-topic-index section')).toHaveCount(4);
  await expect(page.locator('main iframe')).toHaveCount(0);
  const topics = page.locator('.guide-topic-index');
  await topics.getByRole('link', { name: '모바일 배치', exact: true }).click();
  await expect(page).toHaveURL(/\/usage-guide\/mobile\?platform=react$/);
  await page.goBack();
  await expect(page).toHaveURL(/\/usage-guide\?platform=react$/);
  await page.getByRole('button', { name: '문서 검색', exact: true }).click();
  const search = page.getByRole('dialog', { name: '문서 검색' }).getByRole('combobox');
  await search.fill('데이터 조회'); await search.press('Enter');
  await expect(page).toHaveURL(/\/usage-guide\/data\?platform=react$/);
  await page.goto('/components/button?platform=react');
  await page.goto('/usage-guide?platform=react#form');
  await expect(page).toHaveURL(/\/usage-guide\/forms\?platform=react#form$/);
  await page.goBack();
  await expect(page).toHaveURL(/\/components\/button\?platform=react$/);
  await page.goto('/usage-guide?platform=react#unknown');
  await expect(page.locator('.guide-topic-index')).toBeVisible();
  await expect(page).toHaveURL(/\/usage-guide\?platform=react#unknown$/);
});

for (const topic of guideTopics) test(`${topic.id}: old bookmarks retain canonical destinations and query values`, async ({ page }) => {
  test.setTimeout(120000);
  for (const [id] of topic.sections) {
    await page.goto('/usage-guide?platform=native&note=%ED%95%9C%EA%B8%80#' + id);
    await expect(page).toHaveURL(new RegExp(topic.path + '\\?platform=native&note=%ED%95%9C%EA%B8%80#' + id + '$'));
    await expect(page.locator('#' + id)).toBeAttached();
  }
});

test('keyboard shortcuts stay visible at mobile and desktop sizes, and platform changes keep the target', async ({ page }) => {
  for (const width of [390, 1440]) {
    await page.setViewportSize({ width, height: 1000 });
    await page.goto('/components/button?platform=react');
    await ready(page);
    for (const [label, id] of [['디자인', 'anatomy'], ['API', 'api'], ['접근성', 'accessibility'], ['사용법', 'preview']]) {
      const link = shortcuts(page).getByRole('link', { name: label, exact: true });
      await link.focus(); await page.keyboard.press('Enter');
      await expect(page.locator('#' + id)).toBeFocused();
      // The final section may be shorter than the viewport; it must still be unobscured.
      if (id !== 'accessibility') await aligned(page, id);
      else await expect(page.locator('#accessibility h2')).toBeInViewport();
      await expect(link).toHaveAttribute('aria-current', 'location');
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    }
    await shortcuts(page).getByRole('link', { name: 'API', exact: true }).click();
    await page.getByRole('button', { name: '문서 플랫폼', exact: true }).click();
    await page.getByRole('option', { name: 'Vue 2', exact: true }).click();
    await expect(page).toHaveURL(/platform=vue2#api$/);
    await expect(page.locator('#api .api-platform')).toContainText('Vue 2');
    await shortcuts(page).getByRole('link', { name: 'API', exact: true }).click();
    await aligned(page, 'api');
    await page.screenshot({ path: `artifacts/document-navigation-${width}.png` });
  }
});

test('Button, Modal, Table and feedback expose all four real destinations', async ({ page }) => {
  for (const path of ['/components/button', '/components/modal', '/components/table', '/feedback']) {
    await page.goto(path + '?platform=react');
    await ready(page);
    for (const id of ['preview', 'anatomy', 'api', 'accessibility']) await expect(page.locator('#' + id)).toHaveCount(1);
    const design = path === '/components/table' ? 'table-designs' : 'anatomy';
    expect(await shortcuts(page).getByRole('link').evaluateAll(elements => elements.map(element => element.getAttribute('href')))).toEqual(['#preview', '#' + design, '#api', '#accessibility']);
    await shortcuts(page).getByRole('link', { name: '디자인', exact: true }).click();
    await expect(page.locator('#' + design)).toBeFocused();
    const order = await page.locator('main > section[id]').evaluateAll(elements => elements.map(element => element.id));
    expect(order.indexOf('guidelines')).toBeLessThan(order.indexOf('anatomy'));
  }
});
