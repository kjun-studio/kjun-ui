import { test, expect, chromium, type Page } from '@playwright/test';
import { mkdtemp, mkdir, writeFile, rm } from 'node:fs/promises';
import { componentSpecs } from '../../../apps/docs/components/docs/token-component-specs';
import { tokens } from '../../../packages/tokens/dist/index.js';

const sections = ['spacing', 'radius', 'sizes', 'typography', 'responsive', 'motion', 'usage'];
const labels = ['간격', '모서리', '컴포넌트 치수', '타이포그래피', '반응형 전환', '모션', '토큰 사용'];
const shortcuts = (page: Page) => page.getByRole('navigation', { name: '상세 문서 바로가기' });
async function ready(page: Page) {
  await expect(page.getByRole('button', { name: '문서 플랫폼', exact: true })).toBeEnabled();
}
async function aligned(page: Page, id: string) {
  await expect.poll(() => page.locator('#' + id).evaluate(element => {
    const bar = document.querySelector('.document-shortcuts')!;
    const bounds = element.getBoundingClientRect();
    const gap = bounds.top - bar.getBoundingClientRect().bottom;
    // A short final section is fully visible when native scrolling reaches the page end.
    const atEnd = scrollY + innerHeight >= document.documentElement.scrollHeight - 2;
    return gap >= -1 && (gap < 40 || atEnd && bounds.bottom <= innerHeight);
  })).toBe(true);
}
async function noClipping(page: Page) {
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  const overflow = await page.locator('.tokens-content .token-table, .token-spacing-samples, .token-spacing-samples code, .token-radius-samples, .token-type-samples, .token-type-samples dd, .token-related a, .token-table td, .token-table .kjun-table-card-value').evaluateAll(elements =>
    elements.filter(element => element.getBoundingClientRect().width > 0 && element.scrollWidth > element.clientWidth + 1).map(element => element.textContent));
  expect(overflow).toEqual([]);
}

for (const platform of ['vue2', 'react', 'native']) {
  test(`tokens: ${platform} anchors, history and component destinations`, async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 1000 });
    await page.goto('/tokens?platform=' + platform + '#spacing');
    await ready(page);
    await expect(shortcuts(page).getByRole('link')).toHaveText(labels);
    expect(await page.locator('.tokens-content > section').evaluateAll(elements => elements.map(element => element.id))).toEqual(sections);
    await aligned(page, 'spacing');
    await shortcuts(page).getByRole('link', { name: '모서리', exact: true }).click();
    await aligned(page, 'radius');
    await expect(shortcuts(page).locator('[aria-current]')).toHaveText('모서리');
    await shortcuts(page).getByRole('link', { name: '컴포넌트 치수', exact: true }).click();
    await aligned(page, 'sizes');
    await page.goBack(); await aligned(page, 'radius');
    await page.goForward(); await aligned(page, 'sizes');
    const links = page.locator('#sizes .token-related a');
    expect(await links.evaluateAll(elements => elements.map(element => element.getAttribute('href'))))
      .toEqual(['button', 'input'].map(name => `/components/${name}?platform=${platform}#states`));
    expect(await page.locator('.token-related').evaluateAll(groups => groups.every(group => group.querySelectorAll('a').length <= 2))).toBe(true);
    expect(await page.locator('.token-related a').evaluateAll(elements => elements.map(element => element.getAttribute('href'))))
      .toEqual(expect.arrayContaining([`/layout?platform=${platform}`, `/motion?platform=${platform}`]));
    await expect(page.locator('.token-component-directory')).toHaveCount(0);
    await expect(page.locator('.tokens-content')).not.toContainText('extensions.');
    // Each section shows its values: a role type scale, breakpoint table and motion durations.
    await expect(page.locator('.token-index li')).toHaveCount(10);
    await expect(page.locator('#typography tbody tr')).toHaveCount(10);
    await expect(page.locator('#typography iframe')).toHaveCount(0);
    await expect(page.locator('#responsive tbody tr')).toHaveCount(Object.keys(tokens.breakpoints).length);
    await expect(page.locator('#motion .token-motion-scale code')).toHaveText(['motion.instant', 'motion.quick', 'motion.fast', 'motion.normal']);
    const body = page.locator('#typography .token-type-sample').filter({ hasText: '주문한 상품은' });
    await expect(body).toHaveCSS('font-size', tokens.typography.body.fontSizePx + 'px');
    await expect(page.locator('#usage')).toContainText('tokens.space.stack.md');
    await expect(page.locator('#spacing tbody tr').first()).toContainText('space.inline.xs');
    await links.filter({ hasText: 'Button' }).click();
    await expect(page).toHaveURL(new RegExp('/components/button\\?platform=' + platform + '#states$'));
    await expect(page.locator('#states .component-dimensions')).toContainText('xs 8px · sm 10px · md 12px · lg 14px · xl 16px');
    await expect(page.locator('#states')).not.toContainText('높이의 25%');
    await aligned(page, 'states');
  });
}

test('tokens: every relocated specification has an owner at states', async ({ page }) => {
  test.setTimeout(240000);
  for (const spec of componentSpecs) {
    await page.goto(spec.path + '?platform=react#states');
    await ready(page);
    const destination = page.locator('#states .component-dimensions');
    await expect(destination).toHaveAttribute('data-component', spec.name);
    for (const [label, value] of spec.rows) {
      await expect(destination).toContainText(label);
      await expect(destination).toContainText(value);
    }
  }
});

for (const width of [1280, 1440, 390]) {
  test(`tokens: reading, samples and packed tables at ${width}px`, async ({ page }, testInfo) => {
    await page.setViewportSize({ width, height: 1000 });
    await page.goto('/tokens?platform=react#spacing'); await ready(page);
    const text = await page.locator('#spacing > .body-copy').first().evaluate(element => {
      const style = getComputedStyle(element), rect = element.getBoundingClientRect();
      return { size: style.fontSize, line: style.lineHeight, width: rect.width, left: rect.left };
    });
    expect(text.size).toBe('16px'); expect(text.line).toBe('28px'); expect(text.width).toBeLessThanOrEqual(720);
    expect(await page.locator('#usage .code-block code').evaluate(element => {
      const style = getComputedStyle(element);
      return [style.fontSize, style.lineHeight];
    })).toEqual(['14px', '22px']);
    expect(await page.locator('#usage pre').evaluate(element => element.scrollWidth <= element.clientWidth)).toBe(true);
    const table = await page.locator('#sizes .token-table').boundingBox();
    expect(table!.x).toBe(text.left); expect(table!.width).toBe(text.width);
    const sampleGaps = await page.locator('#spacing > .token-spacing-samples .token-gap-sample').evaluateAll(elements => elements.map(element => {
      const [first, second] = Array.from(element.children).map(child => child.getBoundingClientRect());
      return second.left - first.right;
    }));
    expect(sampleGaps).toEqual([4, 8, 12, 16, 20, 24, 32]);
    await expect(page.locator('#spacing > .token-spacing-samples code')).toHaveText(
      [4, 8, 12, 16, 20, 24, 32].map(value => 'dimension.value' + value),
    );
    // Control radii are shown on shapes of the real control heights.
    expect(await page.locator('.token-radius-control').evaluateAll(elements => elements.map(element => element.getBoundingClientRect().height)))
      .toEqual((['sm', 'md', 'lg'] as const).map(size => tokens.input[size].height));
    await page.locator('#radius summary').click();
    expect(await page.locator('.token-radius-shape').evaluateAll(elements => elements.every(element => {
      const rect = element.getBoundingClientRect(); return rect.width === 40 && rect.height === 40;
    }))).toBe(true);
    // The size specification stays a table on phones so sizes can be compared across columns.
    await expect(page.locator('#sizes table')).toBeVisible();
    const sizeRows = page.locator('#sizes tbody tr');
    await expect(sizeRows.first()).toBeVisible();
    // Every row compares one item across the five control sizes.
    expect(await sizeRows.evaluateAll(rows => rows.every(row => row.children.length === 6))).toBe(true);
    if (width !== 390) {
      const style = await page.locator('#sizes td').first().evaluate(element => {
        const td = getComputedStyle(element), th = getComputedStyle(document.querySelector('#sizes th')!);
        return { body: [td.fontSize, td.lineHeight], header: [th.fontSize, th.lineHeight],
          padding: [td.paddingTop, td.paddingLeft], packedPadding: [td.getPropertyValue('--_kjun-geometry-table-cell-padding-regular-y').trim(), td.getPropertyValue('--_kjun-geometry-table-cell-padding-regular-x').trim()] };
      });
      expect(style.body).toEqual(['14px', '20px']); expect(style.header).toEqual(['14px', '20px']);
      expect(style.padding).toEqual(style.packedPadding);
    }
    await page.locator('#spacing summary').click();
    await noClipping(page);
    for (const [index, id] of sections.entries()) {
      const link = shortcuts(page).getByRole('link', { name: labels[index], exact: true });
      await link.focus(); await page.keyboard.press('Enter');
      await expect(page.locator('#' + id)).toBeFocused();
      await expect(link).toHaveAttribute('aria-current', 'location');
      await noClipping(page);
    }
    await shortcuts(page).getByRole('link', { name: '모서리', exact: true }).click();
    await page.screenshot({ path: testInfo.outputPath(`tokens-${width}.png`), fullPage: true });
  });
}

test('tokens: existing bookmarks resolve; other document tables keep their presentation', async ({ page }) => {
  test.setTimeout(120000);
  for (const id of sections) {
    await page.goto('/tokens?platform=react#' + id); await ready(page);
    await aligned(page, id);
    await expect(shortcuts(page).locator('[aria-current]')).toHaveAttribute('href', '#' + id);
  }
  await page.goto('/elevation?platform=react#shadows'); await ready(page);
  const styles = await page.locator('#shadows .docs-table').evaluate(element => {
    const th = getComputedStyle(element.querySelector('th')!), td = getComputedStyle(element.querySelector('td:nth-child(2)')!);
    return { header: th.fontSize, cell: td.fontSize, padding: td.padding };
  });
  expect(styles).toEqual({ header: '12px', cell: '14px', padding: '14px 12px' });
});

test('tokens: actual 200% browser zoom keeps content and navigation usable', async ({}, testInfo) => {
  const directory = await mkdtemp('/tmp/kjun-tokens-zoom-');
  await mkdir(directory + '/Default');
  await writeFile(directory + '/Default/Preferences', JSON.stringify({ partition: { default_zoom_level: { x: Math.log(2) / Math.log(1.2) } } }));
  const context = await chromium.launchPersistentContext(directory, {
    channel: 'chromium', headless: true, viewport: null,
    baseURL: process.env.KJUN_TEST_URL || 'http://127.0.0.1:4173', args: ['--window-size=1440,1600'],
  });
  try {
    const page = context.pages()[0];
    await page.goto('/tokens?platform=react'); await ready(page);
    expect(await page.evaluate(() => ({ ratio: devicePixelRatio, width: innerWidth }))).toEqual({ ratio: 2, width: 720 });
    await page.locator('#spacing summary').click();
    for (const [index, id] of sections.entries()) {
      const link = shortcuts(page).getByRole('link', { name: labels[index], exact: true });
      await link.focus(); await page.keyboard.press('Enter');
      await expect(page.locator('#' + id)).toBeFocused();
      await noClipping(page);
    }
    // Capture the zoomed viewport directly; Playwright's CSS-sized clip can be blank at 200%.
    const cdp = await context.newCDPSession(page);
    const screenshot = await cdp.send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false });
    await mkdir(testInfo.outputDir, { recursive: true });
    await writeFile(testInfo.outputPath('tokens-zoom-200.png'), Buffer.from(screenshot.data, 'base64'));
    await cdp.detach();
  } finally { await context.close(); await rm(directory, { recursive: true, force: true }); }
});
