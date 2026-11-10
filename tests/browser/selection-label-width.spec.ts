import { expect, test, type Locator, type Page } from '@playwright/test';
import { openFixture } from './packed-fixture';
import { captureReview } from './review-captures';

async function weightFaces(page: Page, platform: string) {
  if (platform === 'native') return; // The Native fixture supplies a per-weight Provider map.
  await page.addStyleTag({ content: `
    @font-face { font-family: SelectionFaces; src: local('FreeMono'); font-weight: 500; }
    @font-face { font-family: SelectionFaces; src: local('FreeSerif'); font-weight: 600 700; }
    :root { --kjun-font: SelectionFaces !important; }
  ` });
  await page.evaluate(async () => {
    await Promise.all([500, 600, 700].map(weight => document.fonts.load(`${weight} 14px SelectionFaces`)));
  });
}

const widths = (nodes: Locator) => nodes.evaluateAll(all => all.map(node => node.getBoundingClientRect().width));
async function readable(nodes: Locator, intrinsic = false) {
  const labels = await nodes.evaluateAll(all => all.flatMap(node => {
    const walker = document.createTreeWalker(node, NodeFilter.SHOW_TEXT), result = [];
    while (walker.nextNode()) {
      const text = walker.currentNode, el = text.parentElement!;
      if (!text.textContent?.trim() || el.closest('[aria-hidden="true"]')) continue;
      let hidden = false;
      for (let parent: Element | null = el; parent; parent = parent.parentElement) {
        const style = getComputedStyle(parent);
        if (style.opacity === '0' || style.visibility === 'hidden') hidden = true;
      }
      if (hidden) continue;
      const rect = el.getBoundingClientRect(), style = getComputedStyle(el), range = document.createRange();
      range.selectNode(text);
      result.push({ text: text.textContent, height: range.getBoundingClientRect().height, line: parseFloat(style.lineHeight),
        textWidth: range.getBoundingClientRect().width, width: rect.width });
    }
    return result;
  }));
  expect(labels.length).toBeGreaterThanOrEqual(2);
  for (const label of labels) {
    expect.soft(label.height, label.text!).toBeLessThanOrEqual(label.line + 1);
    expect.soft(label.width + 1, label.text!).toBeGreaterThanOrEqual(label.textWidth);
    if (intrinsic) expect.soft(Math.abs(label.width - label.textWidth), label.text!).toBeLessThan(1);
  }
}

for (const platform of ['react', 'vue3', 'native']) for (const viewport of [320, 1280]) {
  for (const faces of [false, true]) {
    const suffix = `${platform} ${viewport}px ${faces ? 'per-weight faces' : 'default font'}`;
    test(`Tabs reserve both label weights: ${suffix}`, async ({ page }, info) => {
      await page.setViewportSize({ width: viewport, height: 800 });
      await page.emulateMedia({ reducedMotion: 'reduce' });
      await openFixture(page, platform, faces ? '?weight-faces' : '', 'tabs-design');
      if (faces) await weightFaces(page, platform);
      await page.evaluate(() => (window as any).configureTabs({ items: [
        { name: 'one', label: 'Wishlist 3' }, { name: 'two', label: 'Activities 1' },
      ] }));
      const tabs = page.getByRole('tab');
      for (const variant of ['underline', 'pills']) {
        await page.evaluate(variant => (window as any).configureTabs({ variant, value: 'one' }), variant);
        await expect(tabs.first()).toHaveAttribute('aria-selected', 'true');
        const before = await widths(tabs);
        await readable(tabs, platform === 'native');
        await tabs.nth(1).click();
        await expect(tabs.nth(1)).toHaveAttribute('aria-selected', 'true');
        const after = await widths(tabs);
        await info.attach(variant + '-widths', { body: JSON.stringify({ before, after }), contentType: 'application/json' });
        expect.soft(after).toEqual(before);
        await readable(tabs, platform === 'native');
        await captureReview(page, { path: info.outputPath(variant + '.png') });
      }
    });

    test(`MarketCards reserve label and sort-arrow widths: ${suffix}`, async ({ page }, info) => {
      await page.setViewportSize({ width: viewport, height: 800 });
      await page.emulateMedia({ reducedMotion: 'reduce' });
      await openFixture(page, platform, faces ? '?weight-faces' : '', 'runtime-market');
      if (faces) await weightFaces(page, platform);
      const pills = page.getByRole('button', { name: /Price|Change|Volume/ });
      const before = await widths(pills);
      await pills.first().click();
      await expect(pills.first()).toHaveAttribute('aria-pressed', 'true');
      const after = await widths(pills);
      await info.attach('pill-widths', { body: JSON.stringify({ before, after }), contentType: 'application/json' });
      expect.soft(after).toEqual(before);
      await readable(pills);
      // Sortable and non-sortable metrics, repeated selection, and an externally hidden arrow.
      await pills.last().click();
      expect.soft(await widths(pills)).toEqual(before);
      await captureReview(page, { path: info.outputPath('market-pills.png') });
      await pills.first().click();
      await pills.first().click();
      await page.evaluate(() => (window as any).configureMarket({ emit: false, sortKey: 'change' }));
      await expect(pills.first()).toHaveAttribute('aria-pressed', 'true');
      expect.soft(await widths(pills)).toEqual(before);
    });
  }
}
