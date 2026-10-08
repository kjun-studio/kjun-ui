import { test, expect, type Locator, type Page } from '@playwright/test';
import { readdir, readFile } from 'node:fs/promises';
import coverage from '../../../apps/docs/lib/generated/coverage.json' with { type: 'json' };

test.use({ reducedMotion: 'reduce' });
const captureStyle = '.topbar, .document-shortcuts, .skip-link { visibility: hidden !important; }';
const ready = (page: Page) => expect(page.getByRole('button', { name: '문서 검색', exact: true })).toBeEnabled();
const contained = async (page: Page) => expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
async function mutedCard(card: Locator) {
  await expect(card).toHaveAttribute('data-border', 'false');
  await expect(card).toHaveAttribute('data-surface', 'muted');
  expect(await card.evaluate(node => getComputedStyle(node).backgroundColor !== getComputedStyle(document.body).backgroundColor)).toBe(true);
  expect(await card.evaluate(node => getComputedStyle(node, '::after').boxShadow)).toBe('none');
}

test('every docs spacing and radius reference resolves through the packed provider', async ({ page }) => {
  const directory = new URL('../../../apps/docs/app/', import.meta.url);
  const sources = await Promise.all((await readdir(directory)).filter(file => file.endsWith('.css')).map(file => readFile(new URL(file, directory), 'utf8')));
  const references = [...new Set(sources.flatMap(source => [...source.matchAll(/var\((--docs-(?:space|value|radius)\d+)/g)].map(match => match[1])))];
  expect(references.length).toBeGreaterThan(5);
  await page.goto('/components/card?platform=react'); await ready(page);
  const missing = await page.locator('.docs-kjun').first().evaluate((node, names) => {
    const style = getComputedStyle(node);
    return names.filter(name => !style.getPropertyValue(name).trim());
  }, references);
  expect(missing, 'CSS custom property names are not checked by TypeScript').toEqual([]);
});

for (const width of [1440, 390, 320]) test(`${width}: accessibility cards separate heading, responsibilities and evidence links`, async ({ page }) => {
  await page.setViewportSize({ width, height: 1000 });
  await page.goto('/components/card?platform=react'); await ready(page);
  const section = page.locator('#accessibility'), cards = section.locator('.accessibility-item');
  await expect(cards).toHaveCount(3);
  for (const card of await cards.all()) {
    await mutedCard(card);
    await expect(card.locator('.accessibility-description')).toHaveCSS('row-gap', '16px');
    const separation = await card.locator('.accessibility-description').evaluate(node => {
      const [behavior, responsibility] = [...node.children].map(child => child.getBoundingClientRect());
      return responsibility.top - behavior.bottom;
    });
    expect(separation).toBeGreaterThanOrEqual(16);
    await expect(card.locator('.kjun-card-header h3')).toBeVisible();
    await expect(card.locator('.kjun-card-footer .accessibility-record-link')).toBeVisible();
    expect(await card.evaluate(node => [...node.querySelectorAll('h3, p, a, .accessibility-status')].every(child => {
      const outer = node.getBoundingClientRect(), inner = child.getBoundingClientRect();
      return inner.left >= outer.left && inner.right <= outer.right + 1;
    }))).toBe(true);
  }
  await expect(section.locator('.accessibility-results-note')).toHaveCount(1);
  await contained(page);
  await cards.first().scrollIntoViewIfNeeded();
  await section.locator('.accessibility-items').screenshot({ path: `artifacts/accessibility-card-fix/cards-${width}.png`, style: captureStyle });
  const link = cards.first().getByRole('link', { name: '키보드 동작 · 검증 기록 보기', exact: true });
  await link.focus(); await page.keyboard.press('Enter');
  await expect(page).toHaveURL(url => url.pathname === '/verification' && url.searchParams.get('component') === 'DsCard' && url.hash === '#keyboard');
});

for (const width of [1440, 390]) test(`${width}: related coverage and verification cards keep spacing and controls`, async ({ page }) => {
  await page.setViewportSize({ width, height: 1000 });
  await page.goto('/catalog?q=DsCard&platform=react'); await ready(page);
  const cards = page.locator('.coverage-page .kjun-card:visible');
  expect(await cards.count()).toBeGreaterThan(3);
  for (const card of await cards.all()) {
    await mutedCard(card);
    await expect(card.locator(':scope > .kjun-card-body')).toHaveCSS('row-gap', '12px');
  }
  await page.getByRole('button', { name: 'Card 플랫폼 차이·근거 펼치기', exact: true }).click();
  await expect(page.getByRole('link', { name: 'Card React 검증 기록 보기', exact: true }).filter({ visible: true })).toBeVisible();
  await contained(page);
  await page.locator('#support-summary').screenshot({ path: `artifacts/accessibility-card-fix/coverage-${width}.png`, style: captureStyle });

  await page.goto('/verification?component=DsCard&platform=react'); await ready(page);
  for (const card of await page.locator('.verification-check').all()) {
    await mutedCard(card);
    await expect(card.locator(':scope > .kjun-card-body')).toHaveCSS('row-gap', '12px');
  }
  await page.locator('#verification-environment summary').click();
  await expect(page.locator('.verification-packages')).toBeVisible();
  await contained(page);
  await page.locator('#keyboard').screenshot({ path: `artifacts/accessibility-card-fix/verification-${width}.png`, style: captureStyle });

  await page.goto(`/verification?component=DsCard&platform=react&record=${coverage.records[0].id}`); await ready(page);
  const legacy = page.locator('.verification-legacy');
  await mutedCard(legacy);
  await expect(legacy.locator(':scope > .kjun-card-body')).toHaveCSS('row-gap', '12px');
  await legacy.locator('summary').click();
  await expect(legacy.locator('pre')).not.toContainText('원문을 불러오는 중');
  await expect(legacy.locator('pre')).toBeVisible();
  await contained(page);
});

for (const width of [1440, 390]) test(`${width}: search, navigation and expanded example retain restored spacing`, async ({ page }) => {
  await page.setViewportSize({ width, height: 1000 });
  await page.goto('/components/card?platform=react'); await ready(page);
  if (width < 768) await page.getByRole('button', { name: '탐색 메뉴', exact: true }).click();
  await expect(page.locator('.docs-sidebar-scroll')).toHaveCSS('padding-bottom', '48px');
  await expect(page.locator('.nav-category-trigger .kjun-button-label').first()).toHaveCSS('column-gap', '8px');
  if (width < 768) {
    await page.keyboard.press('Escape');
    await expect(page.getByRole('dialog', { name: '문서 탐색', exact: true })).toBeHidden();
  }
  const search = page.getByRole('button', { name: '문서 검색', exact: true });
  await search.click();
  const dialog = page.getByRole('dialog', { name: '문서 검색', exact: true });
  await expect(dialog.locator('.docs-search-dialog')).toHaveCSS('row-gap', '12px');
  await expect(dialog.locator('.docs-search-empty')).toHaveCSS('padding-top', '20px');
  await dialog.getByRole('combobox', { name: '문서 검색어', exact: true }).fill('Card');
  const option = dialog.getByRole('option').first();
  await expect(option).toBeVisible();
  await expect(option).toHaveCSS('padding-top', '12px');
  await expect(option).toHaveCSS('border-top-left-radius', '8px');
  await dialog.screenshot({ path: `artifacts/accessibility-card-fix/search-${width}.png` });
  await page.keyboard.press('Escape'); await expect(search).toBeFocused();
  await page.locator('#preview').getByRole('button', { name: '넓게 보기', exact: true }).click();
  await expect(page.locator('.docs-dialog-content')).toHaveCSS('row-gap', '16px');
  await page.getByRole('dialog').screenshot({ path: `artifacts/accessibility-card-fix/expanded-${width}.png` });
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await contained(page);
});
