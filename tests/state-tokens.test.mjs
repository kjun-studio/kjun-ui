import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import postcss from 'postcss';
import { auditStateScript } from '../scripts/style-token-audit.mjs';

test('all package disabled and focus styles use shared state roles', async () => {
  const issues = [];
  for (const pkg of ['tokens', 'react', 'native', 'vue2']) {
    const directory = `packages/${pkg}/src`;
    for (const entry of await readdir(directory, { recursive: true })) {
      if (!/\.(ts|tsx|js|css|vue)$/.test(entry) || ['index.ts', 'bindings.css'].includes(entry)) continue;
      const file = directory + '/' + entry, source = await readFile(file, 'utf8');
      const sheets = entry.endsWith('.css') ? [source] : [...source.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/g)].map(m => m[1]);
      for (const sheet of sheets) postcss.parse(sheet).walkDecls(d => {
        if (d.prop === 'outline' && /^\d+px/.test(d.value) || d.prop === 'outline-offset' && /^-?[1-9]/.test(d.value))
          issues.push(`${file}: literal ${d.prop} ${d.value}`);
        if (d.prop === 'opacity' && /disabled/.test(d.parent.selector ?? '') && /^(?:0?\.[1-9])/.test(d.value))
          issues.push(`${file}: literal disabled opacity`);
      });
      if (entry.endsWith('.vue')) {
        for (const match of source.matchAll(/<script[^>]*>([\s\S]*?)<\/script>/g)) issues.push(...auditStateScript(match[1], file));
        for (const match of source.matchAll(/(?::style|v-bind:style)="([^"]*)"/g)) issues.push(...auditStateScript('const style = (' + match[1] + ');', file + ' template'));
      }
      else if (!entry.endsWith('.css')) issues.push(...auditStateScript(source, file));
      if (pkg === 'vue2') assert.doesNotMatch(source, /opacity-(?:40|50)\b/);
    }
  }
  assert.deepEqual(issues, []);
});

test('state audit detects literal branches without treating chart ratios as disabled state', () => {
  assert.equal(auditStateScript('const style = { opacity: disabled ? .5 : 1, outlineWidth: focused ? 2 : 0 };', 'new.tsx').length, 2);
  assert.deepEqual(auditStateScript('const style = { opacity: ratio > .5 ? .8 : .2 };', 'chart.tsx'), []);
});
