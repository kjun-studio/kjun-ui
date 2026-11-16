import { expect, test } from '@playwright/test';
import { openFixture } from './packed-fixture';

// Apps place these in their own grid with a class on the root instead of a wrapping div.
const roots = ['kjun-form-group', 'kjun-filter-group', 'kjun-alert', 'kjun-card'];
for (const platform of ['react', 'vue3']) {
  test(`${platform}: an app class lands on the component root beside the KJUN class`, async ({ page }) => {
    const warnings: string[] = [];
    page.on('console', message => { if (message.type() === 'warning') warnings.push(message.text()); });
    await openFixture(page, platform, '', 'root-class');
    await expect(page.locator('.app-slot')).toHaveCount(roots.length);
    for (const root of roots) {
      const el = page.locator(`.${root}.app-slot`);
      await expect(el).toHaveCount(1);
      await expect(el).toHaveClass(new RegExp(`^${root}\\b`));
      await expect(el).toHaveCSS('margin-top', '13px');
    }
    // A closed alert renders nothing, so its class leaves with it.
    await page.locator('.kjun-alert button').click();
    await expect(page.locator('.kjun-alert')).toHaveCount(0);
    await expect(page.locator('.app-slot')).toHaveCount(roots.length - 1);
    expect(warnings.filter(text => /Extraneous|Invalid prop/.test(text))).toEqual([]);
  });
}
