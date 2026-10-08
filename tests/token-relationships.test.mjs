import test from 'node:test';
import assert from 'node:assert/strict';
import { readTokenDefinitions, compileTokens, extensionGeometryCss } from '../scripts/token-model.mjs';

const source = await readTokenDefinitions(new URL('..', import.meta.url).pathname);

test('control dimensions reject empty controls and content that cannot fit', () => {
  for (const [edit, message] of [
    [t => { t.button.heights.md = 0; }, /positive dimension: button.heights.md/],
    [t => { t.button.heights.sm = 16; }, /Button content exceeds height/],
    [t => { t.input.md.height = 20; }, /Input content exceeds inner height/],
    [t => { t.modal.widths.sm = 0; }, /positive dimension: modal.widths.sm/],
    [t => { t.extensions.checkbox.iconSizes.sm = 40; }, /Invalid choice geometry/],
    [t => { t.border.controlWidth = 4; }, /Invalid choice geometry/],
    [t => { t.extensions.radio.dot = 18; }, /Radio dot exceeds inner size/],
    [t => { t.extensions.chip.removeSize = 0; }, /positive dimension/],
    [t => { t.extensions.chip.nativeRemoveSize = 24; }, /Native Chip removal target/],
    [t => { t.extensions.toast.minWidth = 500; }, /Toast minWidth exceeds maxWidth/],
    [t => { t.extensions.toast.progressHeight = 0; }, /positive dimension/],
    [t => { t.extensions.slider.thumb = 0; }, /positive dimension/],
    [t => { t.extensions.pagination.itemSize = 0; }, /positive dimension/],
    [t => { t.extensions.spinner.sizes.md = 0; }, /positive dimension/],
    [t => { t.extensions.progress.heights.md = 0; }, /positive dimension/],
    [t => { t.buttonGroup.padding.md = { $ref: 'dimension.value24' }; }, /ButtonGroup content exceeds/],
  ]) {
    const changed = structuredClone(source); edit(changed);
    assert.throws(() => compileTokens(changed), message);
  }
});

test('layer and breakpoint roles reject ties as well as reversed ordering', () => {
  for (const [edit, message] of [
    [t => { t.layers.page.content = 30; }, /Page layer order/],
    [t => { t.layers.page.sticky = 20; }, /Page layer order/],
    [t => { t.breakpoints.compact = 900; }, /Breakpoint order/],
    [t => { t.breakpoints.medium = 1024; }, /Breakpoint order/],
  ]) {
    const changed = structuredClone(source); edit(changed);
    assert.throws(() => compileTokens(changed), message);
  }
  const changed = structuredClone(source);
  changed.layers.page = { content: 0, sticky: 15, navigation: 30 };
  changed.breakpoints.compact = 700; changed.breakpoints.medium = 820;
  changed.responsive.kpiHero = 680;
  assert.equal(compileTokens(changed).responsive.kpiHero, 680, 'component-specific thresholds stay independent');
});

test('valid boundary geometry and intentional zero resets remain supported', () => {
  const changed = structuredClone(source);
  changed.extensions.checkbox.iconSizes.sm = 16; // 20 - 2 * 2 border
  changed.extensions.radio.dot = 16; // 20 - 2 * 2 border
  changed.extensions.toast.minWidth = 420;
  changed.button.heights.xs = 16; // exactly the label and icon content
  changed.buttonGroup.padding.xs = 0; // the shared height leaves no room for an inset
  changed.input.sm.height = 28; // 24px text plus two 2px borders
  changed.motion.fast = 0;
  const tokens = compileTokens(changed);
  assert.equal(tokens.button.heights.xs, 16);
  assert.equal(tokens.card.padding.none, 0);
  assert.equal(tokens.card.radii.none, 0);
  assert.equal(tokens.motion.control, 0);
});

test('Chip composite typography preserves roles and CSS units through aliases', () => {
  const changed = structuredClone(source);
  changed.extensions.chip.typography.sm = { $ref: 'typography.meta' };
  changed.extensions.chip.typography.md = { $ref: 'button.typography.md' };
  const tokens = compileTokens(changed), css = extensionGeometryCss(tokens, changed);
  assert.deepEqual(tokens.extensions.chip.typography.sm, tokens.typography.meta);
  assert.match(css, /--extension-chip-typography-sm-font-size-px: 0.75rem;/);
  assert.match(css, /--extension-chip-typography-sm-font-weight: 500;/);
  assert.match(css, /--extension-chip-typography-md-line-height-px: 1.25rem;/);
  changed.extensions.chip.typography.md = { $ref: 'dimension.value16' };
  assert.throws(() => compileTokens(changed), /Invalid typography reference/);
});
