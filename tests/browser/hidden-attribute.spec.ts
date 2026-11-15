import { expect, test } from '@playwright/test';
import { openFixture } from './packed-fixture';

// Component rules that set display share the reset's specificity and come later in the bundle,
// so the hidden attribute has to win on its own (0.21.0 showed <KjunButton hidden>).
for (const platform of ['react', 'vue3']) {
  test(`${platform}: the hidden attribute hides every KJUN class`, async ({ page }) => {
    await openFixture(page, platform);
    const result = await page.evaluate(() => {
      const names = new Set<string>();
      const collect = (rules: CSSRuleList) => {
        for (const rule of Array.from(rules)) {
          const selector = (rule as CSSStyleRule).selectorText;
          if (selector) for (const name of selector.match(/\.kjun-[a-z0-9-]+/g) ?? []) names.add(name.slice(1));
          const nested = (rule as CSSGroupingRule).cssRules;
          if (nested) collect(nested);
        }
      };
      for (const sheet of Array.from(document.styleSheets)) collect(sheet.cssRules);
      names.delete('kjun-scope');
      const scope = document.createElement('div');
      scope.className = 'kjun-scope';
      document.body.append(scope);
      const shown: string[] = [];
      for (const tag of ['div', 'button', 'span']) for (const name of names) {
        const el = document.createElement(tag);
        el.className = name; el.hidden = true; scope.append(el);
        if (getComputedStyle(el).display !== 'none') shown.push(tag + '.' + name);
        el.remove();
      }
      // until-found content stays in the layout so the browser's find-in-page can reveal it.
      const found = document.createElement('div');
      found.className = 'kjun-button'; found.setAttribute('hidden', 'until-found'); scope.append(found);
      const untilFound = getComputedStyle(found).display;
      scope.remove();
      return { classes: names.size, shown, untilFound };
    });
    expect(result.classes).toBeGreaterThan(300);
    expect(result.shown).toEqual([]);
    expect(result.untilFound).not.toBe('none');
  });
}
