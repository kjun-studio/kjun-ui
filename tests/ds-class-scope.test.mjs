import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import postcss from 'postcss';
import selectorParser from 'postcss-selector-parser';

// Apps (notably the one kjun was extracted from) use the same ds-* class names, so every .ds-* rule must be
// tied to kjun-owned markup. A selector is tied only when a compound it must pass through requires a kjun-
// class (other than the kjun-scope boundary), Vue's data-v-kjun scope attribute, or the kjun markup marker.
// A kjun- class offered as one alternative inside :is()/:where() does not tie it.
// ds-form-layout is a documented CSS-only helper that apps put on their own wrapper (deprecated for kjun-form-layout).
const marker = '[class*="kjun-"]';
const tied = selector => {
  let found = false;
  selectorParser(root => root.first.nodes.forEach(node => {
    if (node.type === 'class' && node.value.startsWith('kjun-') && node.value !== 'kjun-scope') found = true;
    if (node.type === 'attribute' && node.attribute.startsWith('data-v-kjun-')) found = true;
    if (node.type === 'pseudo' && node.value === ':where' && node.toString().includes(marker)) found = true;
  })).processSync(selector);
  return found;
};

test('built styles tie every .ds-* rule to kjun-owned markup', async () => {
  const css = await readFile('packages/tokens/dist/styles.css', 'utf8');
  const loose = [];
  postcss.parse(css).walkRules(rule => {
    if (rule.parent.type === 'atrule' && /keyframes/.test(rule.parent.name)) return;
    for (const selector of rule.selectors) {
      if (!/\.ds-/.test(selector.replace(/:not\([^)]*\)/g, '')) || selector.trim() === '.ds-form-layout') continue;
      if (!tied(selector)) loose.push(selector.replace(/\s+/g, ' '));
    }
  });
  assert.deepEqual(loose, []);
});
