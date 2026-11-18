import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import {
  clampOverflows, dividerVariant, flexLayout, interleave, isResponsive, responsiveSteps, stackGapCss, stackGapName, stackGapSteps, stepAt,
} from '../shared/package-runtime/layout-primitives.ts';

const tokens = JSON.parse(await readFile(new URL('../packages/tokens/src/tokens.json', import.meta.url), 'utf8'));
const breakpoints = { compact: 640, medium: 768, wide: 1024 };

test('smMd is the 12px stack step between sm and md', () => {
  const { stack } = tokens.space;
  assert.equal(stack.smMd, 12);
  assert.ok(stack.sm < stack.smMd && stack.smMd < stack.md);
  assert.equal(stackGapCss('smMd'), 'var(--_kjun-geometry-space-stack-sm-md)');
});

test('section steps use camelCase names and the old kebab spelling still resolves', () => {
  assert.equal(stackGapCss('sectionLg'), 'var(--_kjun-geometry-space-section-lg)');
  assert.equal(stackGapName('section-md'), 'sectionMd');
  assert.deepEqual(stackGapSteps({ base: 'section-sm', wide: 'section-lg' }), { base: 'sectionSm', wide: 'sectionLg' });
  assert.deepEqual(stackGapSteps(undefined), { base: 'md' });
});

test('the strong divider band has its own token', () => {
  assert.equal(tokens.border.dividerStrongWidth, 8);
});

test('a responsive value picks the widest breakpoint the width reaches', () => {
  const steps = responsiveSteps({ base: 'column', medium: 'row' }, 'column');
  assert.equal(stepAt(steps, 500, breakpoints), 'column');
  assert.equal(stepAt(steps, 768, breakpoints), 'row');
  assert.equal(stepAt(steps, 2000, breakpoints), 'row');
  assert.deepEqual(responsiveSteps('row', 'column'), { base: 'row' });
});

test('web layout names each step and passes its token variable', () => {
  const { attrs, vars } = flexLayout({ kind: 'stack', gap: { base: 'sm', medium: 'lg' }, direction: { base: 'column', wide: 'row' }, padding: 'md', paddingX: 'lg' });
  assert.equal(attrs['data-gap'], 'sm');
  assert.equal(attrs['data-gap-medium'], 'lg');
  assert.equal(attrs['data-direction'], 'column');
  assert.equal(attrs['data-direction-wide'], 'row');
  assert.equal(attrs['data-padding'], '');
  assert.equal(vars['--_kjun-flex-gap-base'], 'var(--_kjun-geometry-space-stack-sm)');
  assert.equal(vars['--_kjun-flex-gap-medium'], 'var(--_kjun-geometry-space-stack-lg)');
  assert.equal(vars['--_kjun-flex-px-base'], 'var(--_kjun-geometry-space-inset-lg)');
  assert.equal(vars['--_kjun-flex-py-base'], 'var(--_kjun-geometry-space-inset-md)');
});

test('without padding no padding variables or attribute are written, so app padding stays', () => {
  const { attrs, vars } = flexLayout({ kind: 'inline' });
  assert.equal(attrs['data-padding'], undefined);
  assert.equal(vars['--_kjun-flex-px-base'], undefined);
  assert.equal(attrs['data-gap'], 'sm');
  assert.equal(attrs['data-direction'], 'row');
  assert.equal(vars['--_kjun-flex-gap-base'], 'var(--_kjun-geometry-space-inline-sm)');
});

test('container mode resolves every responsive value to one step at the measured width', () => {
  const { attrs, vars } = flexLayout({ kind: 'stack', gap: { base: 'xs', wide: 'lg' }, direction: { base: 'column', medium: 'row' }, width: 320, breakpoints });
  assert.equal(attrs['data-gap'], 'xs');
  assert.equal(attrs['data-gap-wide'], undefined);
  assert.equal(attrs['data-direction'], 'column');
  assert.equal(attrs['data-direction-medium'], undefined);
  assert.equal(vars['--_kjun-flex-gap-base'], 'var(--_kjun-geometry-space-stack-xs)');
  assert.equal(flexLayout({ kind: 'stack', gap: { base: 'xs', wide: 'lg' }, width: 1100, breakpoints }).attrs['data-gap'], 'lg');
  assert.ok(isResponsive('md', { base: 'sm' }));
  assert.ok(!isResponsive('md', undefined));
});

test('dividers go between children but not next to a spacer', () => {
  const spacer = 'S';
  const result = interleave(['a', 'b', spacer, 'c', 'd'], item => item === spacer, index => '|' + index);
  assert.deepEqual(result, ['a', '|1', 'b', spacer, 'c', '|4', 'd']);
  assert.deepEqual(interleave([], () => false, () => '|'), []);
  assert.equal(dividerVariant(true), 'full');
  assert.equal(dividerVariant('strong'), 'strong');
  assert.equal(dividerVariant(false), undefined);
});

test('align and justify name their base and write a variable per breakpoint', () => {
  const { attrs, vars } = flexLayout({ kind: 'stack', align: { base: 'stretch', medium: 'center' }, justify: { medium: 'between' } });
  assert.equal(attrs['data-align'], 'stretch');
  assert.equal(attrs['data-align-medium'], 'center');
  assert.equal(vars['--_kjun-flex-align-medium'], 'center');
  // A content-width control keeps its own width under stretch and follows the parent otherwise.
  assert.equal(vars['--_kjun-flex-self-medium'], 'auto');
  assert.equal(attrs['data-justify'], undefined);
  assert.equal(attrs['data-justify-medium'], 'between');
  assert.equal(vars['--_kjun-flex-justify-medium'], 'space-between');
  assert.equal(flexLayout({ kind: 'inline' }).attrs['data-align'], 'center');
  assert.equal(flexLayout({ kind: 'stack', justify: 'end' }).attrs['data-justify'], 'end');
  const measured = flexLayout({ kind: 'stack', align: { base: 'stretch', medium: 'center' }, width: 900, breakpoints });
  assert.equal(measured.attrs['data-align'], 'center');
  assert.equal(measured.attrs['data-align-medium'], undefined);
});

test('an inline rowGap takes space.stack steps and keeps the gap where it has no base', () => {
  const { attrs, vars } = flexLayout({ kind: 'inline', rowGap: 'smMd' });
  assert.equal(attrs['data-row-gap'], 'smMd');
  assert.equal(vars['--_kjun-flex-row-gap-base'], 'var(--_kjun-geometry-space-stack-sm-md)');
  const later = flexLayout({ kind: 'inline', rowGap: { medium: 'md' } });
  assert.equal(later.attrs['data-row-gap'], '');
  assert.equal(later.vars['--_kjun-flex-row-gap-base'], 'var(--_kjun-flex-gap)');
  assert.equal(later.vars['--_kjun-flex-row-gap-medium'], 'var(--_kjun-geometry-space-stack-md)');
  assert.equal(flexLayout({ kind: 'inline' }).attrs['data-row-gap'], undefined);
  assert.equal(flexLayout({ kind: 'stack', rowGap: 'md' }).attrs['data-row-gap'], undefined);
});

test('a clamped text overflows only when its content is taller than the box', () => {
  assert.ok(clampOverflows({ scrollHeight: 72, clientHeight: 48 }));
  assert.ok(!clampOverflows({ scrollHeight: 48.5, clientHeight: 48 }));
});
