import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import { auditGeometryScript, auditGeometryCss } from '../scripts/style-token-audit.mjs';
import { createVueStyleTheme } from '../packages/vue2/style-theme.mjs';
import { readTokenDefinitions, compileTokens, mergeTokenDefinitions, extensionGeometryCss } from '../scripts/token-model.mjs';
const root = new URL('..', import.meta.url).pathname;
const definitions = await readTokenDefinitions(root);
const data = compileTokens(definitions);

test('component geometry resolves from the shared scales with additive paths', () => {
  assert.equal(data.extensions.badge.radius, 6);
  assert.equal(data.extensions.badge.padding.xs.y, 0);
  assert.equal(data.extensions.chip.radius, data.radius.radius9999);
  assert.equal(data.extensions.drawer.bottomRadius, 16);
  assert.equal(data.extensions.kpiHero.md.secondaryMargin, 24);
  assert.equal(data.extensions.kpiHero.md.secondaryPadding, 16);
  const altered = structuredClone(definitions);
  altered.extensions.navigation.padding = { $ref: 'dimension.value24' };
  altered.extensions.list.padding = { $ref: 'dimension.value24' };
  altered.card.padding.md = { $ref: 'dimension.value24' };
  altered.radius.radius12 = 20;
  const value = compileTokens(altered);
  assert.equal(value.extensions.navigation.padding, 24);
  assert.equal(value.extensions.list.padding, 24);
  assert.equal(value.extensions.tableCard.radius, value.card.radii.md);
  assert.equal(value.extensions.skeleton.padding, value.card.padding.md);
  assert.equal(value.extensions.kpiRow.badgeRadius, value.extensions.badge.radius);
  const css = extensionGeometryCss(value, altered);
  assert.match(css, /--extension-badge-padding-xs-y: 0px;/);
  assert.match(css, /--extension-menu-option-font-size: 0.875rem;/);
  assert.doesNotMatch(css, /\[object Object\]/);
  const theme = createVueStyleTheme(value, {});
  assert.equal(theme.extend.spacing['badge-padding-xs-x'], '4px');
  assert.equal(theme.extend.borderRadius['drawer-bottom-radius'], '16px');
  assert.equal(theme.extend.spacing['card-padding-md'], '24px');
});

test('definition fragments reject collisions and recursive aliases', () => {
  assert.throws(() => mergeTokenDefinitions({ x: { y: 1 } }, { x: { y: 2 } }), /Duplicate token definition: x.y/);
  const cyclic = structuredClone(definitions);
  cyclic.extensions.badge.radius = { $ref: 'extensions.kpiRow.badgeRadius' };
  assert.throws(() => compileTokens(cyclic), /Cyclic token reference/);
  const literal = structuredClone(definitions);
  literal.extensions.kpiHero.md.secondaryMargin = 22;
  assert.throws(() => compileTokens(literal), /Geometry role must reference a shared scale/);
  const nested = structuredClone(definitions);
  nested.extensions.badge.padding.xs.x = 6;
  assert.throws(() => compileTokens(nested), /Geometry role must reference a shared scale/);
  const missing = structuredClone(definitions);
  missing.extensions.chip.radius = { $ref: 'radius.missing' };
  assert.throws(() => compileTokens(missing), /Unknown token reference/);
  const invalid = structuredClone(definitions);
  invalid.dimension.value16 = -1;
  assert.throws(() => compileTokens(invalid), /Invalid dimension scale/);
});

test('extension CSS preserves typography units through scalar and composite aliases', () => {
  for (const ref of ['typography.control.fontSizePx', 'button.fontSizes.md', 'button.typography.md.fontSizePx']) {
    const altered = structuredClone(definitions);
    altered.extensions.menu.optionFontSize = { $ref: ref };
    altered.extensions.menu.optionLineHeight = { $ref: 'button.typography.md.lineHeightPx' };
    const css = extensionGeometryCss(compileTokens(altered), altered);
    assert.match(css, /--extension-menu-option-font-size: 0\.875rem;/, ref);
    assert.match(css, /--extension-menu-option-line-height: 1\.25rem;/, ref);
    assert.match(css, /--extension-list-actions-padding: 16px;/, 'geometry aliases retain px');
  }
});

test('all package geometry styles consume shared tokens', async () => {
  const binding = await readFile(root + '/packages/tokens/src/bindings.css', 'utf8');
  const declared = new Set([...binding.matchAll(/(--[\w-]+)\s*:/g)].map(m => m[1]));
  const issues = [];
  for (const name of ['tokens', 'react', 'native', 'vue2']) {
    const directory = `packages/${name}/src`;
    for (const entry of await readdir(root + '/' + directory, { recursive: true })) {
      if (!/\.(?:ts|tsx|js|vue|css)$/.test(entry) || ['bindings.css', 'typography.css'].includes(entry) || name === 'tokens' && entry === 'index.ts') continue;
      const file = directory + '/' + entry, source = await readFile(root + '/' + file, 'utf8');
      if (file.endsWith('.css')) issues.push(...auditGeometryCss(source, file, declared));
      else if (file.endsWith('.vue')) {
        for (const match of source.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/g)) issues.push(...auditGeometryCss(match[1], file, declared));
        for (const match of source.matchAll(/<script[^>]*>([\s\S]*?)<\/script>/g)) issues.push(...auditGeometryScript(match[1], file));
        for (const match of source.matchAll(/(?::style|v-bind:style)="([^"]*)"/g)) issues.push(...auditGeometryScript('const style = (' + match[1] + ');', file + ' template'));
      } else issues.push(...auditGeometryScript(source, file));
      assert.doesNotMatch(source, /(?:p[xytrbl]?|m[xytrbl]?|gap|rounded)-\[\d+(?:px|rem)\]/, `${file}: arbitrary utility bypasses geometry`);
    }
  }
  assert.deepEqual(issues, []);
});

test('geometry audit catches new files, conditional values, size maps and logical properties', () => {
  const source = 'const style = { marginInline: 12, gap: active ? 4 : 0, borderRadius: { sm: 5, md: 6 }[size], padding: { sm: "2px", md: "4px 8px" }[size] };';
  assert.equal(auditGeometryScript(source, 'new-component.tsx').length, 6);
  assert.equal(auditGeometryCss('.new { padding-inline: 12px; border-radius: 6px; }', 'new.css').length, 2);
  assert.equal(auditGeometryScript('const style = { padding: `4px ${inset}px` };', 'template.tsx').length, 1);
  assert.deepEqual(auditGeometryScript('const style = { borderRadius: diameter / 2, marginLeft: -width / 2, paddingBottom: gap + safeArea };', 'computed.tsx'), []);
});
