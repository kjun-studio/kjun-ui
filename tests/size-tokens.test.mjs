import test from 'node:test';
import assert from 'node:assert/strict';
import { auditPackageSizes, auditSizeScript, auditSizeCss, auditSizeVue } from '../scripts/size-token-audit.mjs';
import { readTokenDefinitions, compileTokens } from '../scripts/token-model.mjs';
import { createVueStyleTheme } from '../packages/vue2/style-theme.mjs';

test('every authored package is free of unclassified absolute component sizes', async () => {
  assert.deepEqual(await auditPackageSizes(new URL('..', import.meta.url).pathname), []);
});

test('size audit catches JSX, defaults, fallbacks, helper calls, aliases and Vue utilities', () => {
  const script = `const sides = { sm: 12, md: 24 };
    function Icon({ size = 16 }) { return <svg width={sides[size]} height={size} />; }
    const bar = { width: measured || 80, maxHeight: "min(60vh, 480px)" };
    const view = <DsSkeleton height={12} width="48px" />;
    const fallback = block(40, 40);`;
  assert.ok(auditSizeScript(script, 'new.tsx').length >= 8);
  assert.equal(auditSizeCss('.a { min-width:calc(100% - 16px); height:40px; border:2px solid; }', 'new.css').length, 3);
  assert.equal(auditSizeVue('<DsIcon size="16" /><DsSparkline :width="72" /><div class="w-4 h-8" />', 'new.vue').length, 4);
  assert.ok(auditSizeScript('const props = { width: { type: Number, default: 80 } };', 'new.js').length);
  assert.ok(auditSizeScript('const minimum = 200; const style = { minWidth: `${minimum}px` };', 'new.ts').length);
  assert.ok(auditSizeScript('const props = { width: { default: () => "0.5rem" } };', 'new.js').length);
  assert.equal(auditSizeVue('<div style="height: .5rem" /><DsPanel :min-width="0.5" />', 'new.vue').length, 2);
});

test('relative dimensions, viewBox drawing and runtime measurements remain valid', () => {
  assert.deepEqual(auditSizeScript(`const x = <svg width={tokens.extensions.spinner.sizes.md} viewBox="0 0 24 24"><rect width={12} height={8}/></svg>;
    const styles = { height: measuredHeight, width: percent + "%", maxWidth: "100%", borderRadius: diameter / 2 };
    const line = <DsSkeleton width="5ch" height="1lh" />;`, 'valid.tsx'), []);
  assert.deepEqual(auditSizeVue('<rect width="36" height="22" /><DsSkeleton width="70%" height="1lh" />', 'valid.vue'), []);
});

test('component size roles remain independent of spacing utilities across Vue generation', async () => {
  const source = await readTokenDefinitions(new URL('..', import.meta.url).pathname);
  source.dimension.value18 = 18;
  source.extensions.spinner.sizes.sm = 22;
  source.extensions.progress.heights.md = 10;
  const tokens = compileTokens(source), theme = createVueStyleTheme(tokens, {});
  assert.equal(tokens.extensions.spinner.sizes.sm, 22);
  assert.equal(theme.extend.spacing['spinner-sizes-sm'], '22px');
  assert.equal(theme.extend.spacing['progress-heights-md'], '10px');
  assert.equal(theme.extend.spacing['button-heights-sm'], tokens.button.heights.sm + 'px');
  assert.equal(theme.extend.spacing['4'], '16px');
  assert.equal(theme.extend.spacing['4.5'], '18px');
});
