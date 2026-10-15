import test from 'node:test';
import assert from 'node:assert/strict';
import { auditPackageSizes, auditSizeScript, auditSizeCss } from '../scripts/size-token-audit.mjs';

test('every authored package is free of unclassified absolute component sizes', async () => {
  assert.deepEqual(await auditPackageSizes(new URL('..', import.meta.url).pathname), []);
});

test('size audit catches JSX, defaults, fallbacks, helper calls and aliases', () => {
  const script = `const sides = { sm: 12, md: 24 };
    function Icon({ size = 16 }) { return <svg width={sides[size]} height={size} />; }
    const bar = { width: measured || 80, maxHeight: "min(60vh, 480px)" };
    const view = <KjunSkeleton height={12} width="48px" />;
    const fallback = block(40, 40);`;
  assert.ok(auditSizeScript(script, 'new.tsx').length >= 8);
  assert.equal(auditSizeCss('.a { min-width:calc(100% - 16px); height:40px; border:2px solid; }', 'new.css').length, 3);
  assert.ok(auditSizeScript('const props = { width: { type: Number, default: 80 } };', 'new.js').length);
  assert.ok(auditSizeScript('const minimum = 200; const style = { minWidth: `${minimum}px` };', 'new.ts').length);
  assert.ok(auditSizeScript('const props = { width: { default: () => "0.5rem" } };', 'new.js').length);
});

test('relative dimensions, viewBox drawing and runtime measurements remain valid', () => {
  assert.deepEqual(auditSizeScript(`const x = <svg width={tokens.extensions.spinner.sizes.md} viewBox="0 0 24 24"><rect width={12} height={8}/></svg>;
    const styles = { height: measuredHeight, width: percent + "%", maxWidth: "100%", borderRadius: diameter / 2 };
    const line = <KjunSkeleton width="5ch" height="1lh" />;`, 'valid.tsx'), []);
});
