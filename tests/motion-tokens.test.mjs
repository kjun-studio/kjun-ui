import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { auditMotion, auditMotionCss, auditMotionScript } from '../scripts/motion-token-audit.mjs';
const root = new URL('..', import.meta.url).pathname;

test('package motion uses token durations and token easing roles on every platform', async () => {
  assert.deepEqual(await auditMotion(root), []);
});

test('motion audit rejects keyword easing, all, literal durations and utility timing', () => {
  for (const css of [
    '.a { transition: opacity var(--motion-quick) ease; }',
    '.a { transition: all var(--motion-control) var(--ease-out); }',
    '.a { transition: color 150ms var(--ease-out); }',
    '.a { transition: color var(--motion-control); }',
    '.a { animation: x var(--motion-fast) cubic-bezier(0.16, 1, 0.3, 1); }',
    '.a { transition: color var(--motion-quick) var(--ease-out); }',
  ]) assert.notDeepEqual(auditMotionCss(css, 'x.css'), [], css);
  assert.deepEqual(auditMotionCss('.a { transition: opacity var(--motion-fade-exit) var(--ease-linear), translate var(--motion-popup-exit) var(--ease-in); }', 'x.css'), []);
  assert.deepEqual(auditMotionCss('.a { animation: s var(--motion-shimmer) ease-in-out infinite; }', 'x.css'), []);
  assert.notDeepEqual(auditMotionScript(`const c = 'h-full transition-all duration-300';`, 'x.js'), []);
  assert.notDeepEqual(auditMotionScript(`el.animate(k, { easing: 'ease-out' });`, 'x.js'), []);
  assert.deepEqual(auditMotionScript(`el.animate(k, { easing: tokens.motion.easeOut });`, 'x.js'), []);
  assert.notDeepEqual(auditMotionScript(`el.animate(k, { duration: tokens.motion.fast });`, 'x.js'), []);
});

test('easing roles separate small moves, edge panels and exit fades', async () => {
  const { motion } = JSON.parse(await readFile(root + 'packages/tokens/src/tokens.json', 'utf8'));
  assert.notEqual(motion.easeOut, motion.easeEmphasized, 'small moves must not reuse the edge-panel curve');
  assert.equal(motion.easeLinear, 'cubic-bezier(0, 0, 1, 1)');
  assert.ok(motion.fadeExit < motion.popupExit && motion.backdropExit < motion.layerExit, 'exit fades end before the movement');
  for (const removed of ['slow', 'emphasis', 'easeBounce']) assert.equal(motion[removed], undefined, removed);
  const css = await readFile(root + 'packages/tokens/src/motion.css', 'utf8');
  assert.match(css, /\.kjun-drawer \{ transform: none; transition: transform var\(--motion-layer-enter\) var\(--ease-emphasized\)/);
});
