import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import postcss from 'postcss';

// Apps (notably the one kjun was extracted from) use the same ds-* class names, so every .ds-* rule must be
// tied to kjun-owned markup: a kjun- marker on the element or an ancestor, or Vue's data-v-kjun scope attribute.
// ds-form-layout is a documented CSS-only helper that apps put on their own wrapper (deprecated for kjun-form-layout).
test('built styles tie every .ds-* rule to kjun-owned markup', async () => {
  const css = await readFile('packages/tokens/dist/styles.css', 'utf8');
  const loose = [];
  postcss.parse(css).walkRules(rule => {
    if (rule.parent.type === 'atrule' && /keyframes/.test(rule.parent.name)) return;
    for (const selector of rule.selectors) {
      if (!/\.ds-/.test(selector) || selector.trim() === '.ds-form-layout') continue;
      if (!/\[class\*="kjun-"\]|\.kjun-(?!scope\b)|data-v-kjun-/.test(selector)) loose.push(selector.replace(/\s+/g, ' '));
    }
  });
  assert.deepEqual(loose, []);
});
