import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import postcss from 'postcss';
import { auditTypographyScript, auditTypographyCss, auditControlDimensionsScript,
  auditControlDimensionsCss, auditTouchTargetScript, auditTouchTargetCss } from '../scripts/typography-token-audit.mjs';
import { createVueStyleTheme } from '../packages/vue2/style-theme.mjs';
import { readTokenDefinitions, compileTokens } from '../scripts/token-model.mjs';

test('package typography and touch targets do not bypass their token roles', async () => {
  const issues = [];
  for (const pkg of ['tokens', 'react', 'native', 'vue2']) {
    const directory = `packages/${pkg}/src`;
    for (const entry of await readdir(directory, { recursive: true })) {
      if (!/\.(?:ts|tsx|js|vue|css)$/.test(entry) || ['index.ts', 'typography.css', 'bindings.css'].includes(entry)) continue;
      const file = `${directory}/${entry}`, source = await readFile(file, 'utf8');
      const scripts = entry.endsWith('.vue')
        ? [...source.matchAll(/<script[^>]*>([\s\S]*?)<\/script>/g)].map(m => m[1]).concat(
          [...source.matchAll(/(?::style|v-bind:style)="([^"]*)"/g)].map(m => `const style = (${m[1]});`))
        : entry.endsWith('.css') ? [] : [source];
      const sheets = entry.endsWith('.css') ? [source] : [...source.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/g)].map(m => m[1]);
      for (const script of scripts) {
        issues.push(...auditTypographyScript(script, file), ...auditTouchTargetScript(script, file));
        if (/native\/src\/(?:choice-controls|chip|toast)\.tsx$|react\/src\/controls\.tsx$|\/form\/(Checkbox|Switch)\.vue$/.test(file))
          issues.push(...auditControlDimensionsScript(script, file));
      }
      for (const sheet of sheets) {
        issues.push(...auditTypographyCss(sheet, file), ...auditTouchTargetCss(sheet, file));
        if (file.endsWith('styles/forms.css') || file.endsWith('/toast.css'))
          issues.push(...auditControlDimensionsCss(sheet, file));
        if (file.endsWith('/extensions.css')) postcss.parse(sheet).walkRules(rule => {
          if (rule.selector.startsWith('.kjun-chip')) issues.push(...auditControlDimensionsCss(rule.toString(), file));
        });
      }
    }
  }
  assert.deepEqual(issues, []);
});

test('typography audit detects overrides, state branches and local constants', () => {
  assert.equal(auditTypographyCss('.title { font-weight:var(--title); font-weight:600; letter-spacing:0; }', 'new.css').length, 2);
  assert.equal(auditTypographyScript('const weight = 600; const styles = { fontWeight: selected ? weight : "500", letterSpacing: 0 };', 'new.tsx').length, 3);
  assert.deepEqual(auditTypographyScript('const style = { fontWeight: role.fontWeight, letterSpacing: spec.fontSizePx * spec.letterSpacingEm };', 'valid.tsx'), []);
  assert.equal(auditTypographyCss('.market { font-size:14px; line-height:21px; }', 'market.css').length, 2);
  assert.equal(auditTypographyScript('const height = 21; const style = { fontSize: 14, lineHeight: height };', 'market.tsx').length, 2);
  assert.deepEqual(auditTypographyCss('.icon { line-height:1; } .text { font-size:inherit; line-height:var(--body-line); }', 'valid.css'), []);
});

test('choice dimension audit follows maps and touch target aliases', () => {
  assert.equal(auditControlDimensionsScript('const sizes = { sm: 18, md: 22 }; const side = sizes[size]; const style = { width: side, height: side, minHeight: 44 };', 'new.tsx').length, 5);
  assert.equal(auditControlDimensionsCss('.choice { width:18px; height:22px; min-height:44px; }', 'new.css').length, 3);
  assert.equal(auditTouchTargetScript('const minimum = 44; const style = { minHeight: minimum };', 'new.tsx').length, 1);
  assert.equal(auditControlDimensionsScript('const width = 18, height = 22; const style = { width, height };', 'new.tsx').length, 2);
  assert.deepEqual(auditControlDimensionsScript('const width = measuredWidth; const style = { width, height: width / 2, minHeight: tokens.native.minimumTouchTarget };', 'valid.tsx'), []);
});

test('Vue weight utilities follow semantic roles instead of Tailwind defaults', async () => {
  const data = compileTokens(await readTokenDefinitions(new URL('..', import.meta.url).pathname));
  const theme = createVueStyleTheme(data, {});
  assert.deepEqual(theme.fontWeight, { normal: 'var(--_kjun-type-body-weight)', medium: 'var(--_kjun-type-label-weight)', semibold: 'var(--_kjun-type-control-weight)', bold: 'var(--_kjun-type-number-lg-weight)' });
  assert.equal(theme.extend.fontSize['4xl'][1].letterSpacing, data.typography.displayLg.letterSpacingEm + 'em');
});
