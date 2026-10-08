import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import { readTokenDefinitions, compileTokens, typographyCss, shadowCss } from '../scripts/token-model.mjs';
const source = await readTokenDefinitions(new URL('..', import.meta.url).pathname);

test('typography, geometry and shadows resolve from their author-owned definitions', () => {
  const s = structuredClone(source);
  s.typography.body.fontSizePx = 16; s.typography.body.lineHeightPx = 24;
  s.typography.control.fontSizePx = 16; s.typography.control.lineHeightPx = 24;
  s.radius.radius12 = 16; s.card.padding.md = { $ref: 'dimension.value20' };
  s.shadowScale.contact[0].blurRadius = 30;
  const t = compileTokens(s);
  assert.equal(t.button.fontSizes.md, 16);
  assert.equal(t.card.radii.md, 16);
  assert.equal(t.card.padding.md, 20);
  assert.equal(t.extensions.menu.optionFontSize, 16);
  assert.match(typographyCss(t), /--_kjun-type-body-size: 1rem/);
  assert.match(shadowCss(t.card.elevation.raised), /30px/);
  assert.equal(t.input.sm.fontSize, t.input.sm.placeholderSize);
  s.button.typography.md = { $ref: 'typography.controlLarge' };
  assert.equal(compileTokens(s).button.fontSizes.md, 16);
});

test('button group inset and item corners follow shared geometry changes', () => {
  const s = structuredClone(source);
  s.radius.radius10 = 12;
  s.buttonGroup.padding.md = { $ref: 'dimension.value6' };
  const group = compileTokens(s).buttonGroup;
  assert.equal(group.padding.md, 6);
  assert.equal(group.radii.md, 12);
  assert.equal(group.itemRadii.md, 6);
  s.radius.radius10 = 4;
  assert.equal(compileTokens(s).buttonGroup.itemRadii.md, 0);
});

test('dimension selection and motion changes reach table density and semantic transitions', () => {
  const s = structuredClone(source);
  s.table.headerPadding.x = { $ref: 'dimension.value24' };
  s.table.cellPadding.regular.x = { $ref: 'dimension.value24' };
  s.table.cellPadding.compact.y = { $ref: 'dimension.value8' };
  s.motion.fast = 260;
  s.motion.normal = 360;
  const t = compileTokens(s);
  assert.equal(t.table.headerPadding.x, 24);
  assert.equal(t.table.cellPadding.regular.x, 24);
  assert.equal(t.table.cellPadding.compact.y, 8);
  assert.equal(t.motion.control, 260);
  assert.equal(t.motion.popupEnter, 260);
  assert.equal(t.motion.progress, 360);
  assert.equal(t.motion.layerEnter, 360);
});

test('invalid references and dimensional typography fail before code generation', () => {
  for (const mutate of [
    s => { s.card.radii.md = { $ref: 'missing.radius' }; },
    s => { s.card.radii.md = { $ref: 'typography.body' }; },
    s => { s.input.md.height = -1; },
    s => { s.input.md.height = '40px'; },
    s => { s.motion.fast = -1; },
    s => { s.motion.easeOut = 'cubic-bezier(2, 0, 1, 1)'; },
    s => { s.buttonGroup.padding.sm = 3; },
    s => { s.cardSurfaces.brand.text = 'missing'; },
    s => { s.radius.radius12 = { $ref: 'card.radii.md' }; },
    s => { s.button.typography.md = { $ref: 'button.fontSizes' }; },
    s => { s.typography.body.fontSizePx = 13; },
    s => { s.typography.body.lineHeightPx = 10; },
    s => { s.typography.body.lineHeightPx = 17; },
    s => { s.typography.body.fontSizePx = '14px'; },
    s => { s.typography.body.letterSpacingEm = '0px'; },
    s => { s.colorRoleFallbacks.onBrand = 'missing'; },
    s => { s.colorRoleFallbacks.onBrand = 'onBrand'; },
  ]) { const s = structuredClone(source); mutate(s); assert.throws(() => compileTokens(s)); }
});

test('numeric references retain length, duration, weight and layer contracts', () => {
  for (const [path, ref] of [
    ['card.radii.md', 'motion.fast'], ['motion.control', 'dimension.value16'],
    ['card.padding.md', 'typography.body.fontWeight'], ['button.weight', 'dimension.value16'],
    ['button.loadingMinimum', 'button.heights.md'], ['layers.page.navigation', 'dimension.value20'],
  ]) {
    const s = structuredClone(source), keys = path.split('.');
    keys.slice(0, -1).reduce((v, key) => v[key], s)[keys.at(-1)] = { $ref: ref };
    assert.throws(() => compileTokens(s), /Token kind mismatch/, path);
  }
  const s = structuredClone(source);
  s.button.paddingX.xs = { $ref: 'dimension.value12' };
  assert.equal(compileTokens(s).card.glassBlur, 10, 'spacing does not control glass blur');
});

test('inline and aliased component shadows validate every layer', () => {
  for (const mutate of [
    layer => { layer.blurRadius = -8; }, layer => { layer.colorRole = 'missingRole'; },
    layer => { layer.offsetX = Infinity; }, layer => { layer.inset = 'false'; },
    layer => { delete layer.spreadDistance; }, layer => { layer.extra = 1; },
  ]) for (const inline of [true, false]) {
    const s = structuredClone(source), layer = structuredClone(s.shadowScale.ambient[0]);
    mutate(layer);
    if (inline) s.modal.elevation = [layer];
    else {
      s.extensions.tooltip.elevation = [layer];
      s.modal.elevation = { $ref: 'extensions.tooltip.elevation' };
    }
    assert.throws(() => compileTokens(s), /Invalid shadow geometry/);
  }
  const s = structuredClone(source);
  s.modal.elevation = [{ ...s.shadowScale.ambient[0], offsetX: -2, spreadDistance: -1 }];
  assert.equal(compileTokens(s).modal.elevation[0].offsetX, -2);
});

test('state opacity, focus offsets and layer ordering use their numeric contracts', () => {
  for (const mutate of [
    s => { s.states.opacity.disabled = 1.1; }, s => { s.states.opacity.pending = -0.1; },
    s => { s.states.opacity.disabled = { $ref: 'dimension.value4' }; },
    s => { s.card.radii.md = { $ref: 'states.opacity.disabled' }; },
    s => { s.layers.page.navigation = 1.5; },
    s => { s.states.focus.width = -2; },
  ]) { const s = structuredClone(source); mutate(s); assert.throws(() => compileTokens(s)); }
  const s = structuredClone(source);
  s.states.focus.insetOffset = -4;
  assert.equal(compileTokens(s).states.focus.insetOffset, -4);
});

test('choice geometry rejects nonpositive targets and impossible switch thumbs', () => {
  for (const mutate of [
    s => { s.native.minimumTouchTarget = 0; },
    s => { s.extensions.checkbox.sizes.sm = 0; },
    s => { s.extensions.switch.widths.md = 20; },
    s => { s.extensions.switch.heights.md = 6; },
  ]) { const s = structuredClone(source); mutate(s); assert.throws(() => compileTokens(s), /Invalid choice/); }
});

test('current package source has no retired typography or numeric brand APIs', async () => {
  const root = new URL('..', import.meta.url).pathname;
  const retired = /numericTypography|\.typo-|brand(?:50|100|200|300|400|800|900)\b|font-size\s*:\s*(?:9|10|11|13|15|17|18|22|26|28|44)px\b|fontSize\s*:\s*(?:9|10|11|13|15|17|18|22|26|28|44)\b/;
  for (const name of ['tokens','react','vue2','native']) {
    const directory = `${root}/packages/${name}/src`;
    for (const file of await readdir(directory, { recursive: true })) {
      if (!/\.(?:ts|tsx|js|vue|css|json)$/.test(file)) continue;
      assert.doesNotMatch(await readFile(`${directory}/${file}`, 'utf8'), retired, `${name}/${file}`);
    }
  }
});

test('v0.3 has semantic brand colors and separate foreground overrides', async () => {
  const { tokens, resolveKjunColors } = await import('../packages/tokens/dist/index.js');
  const core = Object.fromEntries(tokens.coreColorRoles.map(r => [r, `app-${r}`]));
  const native = { dynamic: { light: 'app-light', dark: 'app-dark' } };
  const resolved = resolveKjunColors({ ...core, onWarning: native });
  assert.equal(resolved.onWarning, native);
  assert.equal(resolved.onBrand, core.inverse);
  assert.equal(resolved.brandSubtleBg, core.secondary);
  assert.equal(resolved.selectedBg, core.active);
  assert.ok(tokens.colorRoles.every(r => !/^brand\d+$/.test(r)));
  assert.equal('numericTypography' in tokens, false);
  assert.equal(Array.isArray(tokens.dimension), false);
});
