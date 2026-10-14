import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import { join } from 'node:path';
import postcss from 'postcss';
import tailwind from 'tailwindcss';
import { createVueStyleTheme } from '../packages/vue2/style-theme.mjs';

async function sources(dir, out = []) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) await sources(path, out);
    else if (/\.(vue|js)$/.test(entry.name)) out.push([path, await readFile(path, 'utf8')]);
  }
  return out;
}

// Class strings in Vue templates and scripts must use kj- utilities so they never match app classes.
test('Vue class strings use only kj- prefixed utilities', async () => {
  const tokens = JSON.parse(await readFile('packages/tokens/src/tokens.json', 'utf8'));
  const utilities = JSON.parse(await readFile('packages/vue2/style-utilities.json', 'utf8'));
  const files = await sources('packages/vue2/src');
  // The kjun utility vocabulary: what Tailwind would generate if the kj- prefix were dropped.
  const raw = files.map(([, text]) => text).join('\n').replace(/\bkj-/g, '');
  const css = (await postcss([tailwind({ content: [{ raw, extension: 'html' }], corePlugins: { preflight: false },
    theme: createVueStyleTheme(tokens, utilities) })]).process('@tailwind utilities;', { from: undefined })).css;
  const names = new Set();
  postcss.parse(css).walkRules(rule => { for (const selector of rule.selectors) {
    const match = selector.match(/^\.((?:\\.|[^\s.:,>+~\[\]()])+)/);
    if (match) names.add(match[1].replace(/\\(.)/g, '$1').split(':').pop().replace(/^-/, ''));
  } });
  // Variant prefixes end at the last colon outside an arbitrary value, e.g. hover:kj-text-[length:var(--x)].
  const base = token => token.split(/:(?![^\[]*\])/).pop();
  const utility = token => names.has(base(token).replace(/^!?-?/, ''));
  const owned = token => /^(!?-?kj-|kjun-|ds-)/.test(base(token)) || token === 'num';
  const classLike = list => list.length > 0 && list.every(t => utility(t) || owned(t)) && (list.length > 1 || /[-:]/.test(list[0]));
  const bare = [];
  for (const [file, text] of files) {
    const check = (value, where) => {
      const list = value.replace(/\$\{[^}]*\}/g, ' ').trim().split(/\s+/).filter(Boolean);
      if (classLike(list)) for (const t of list) if (utility(t) && !owned(t)) bare.push(`${file} ${where}: ${t}`);
    };
    for (const m of text.matchAll(/\s(?:class|[\w-]*-class)="([^"]*)"/g)) check(m[1], 'class');
    for (const m of text.matchAll(/\s:class="([^"]*)"/g)) for (const s of m[1].matchAll(/'([^']*)'|`([^`]*)`/g)) check(s[1] ?? s[2], ':class');
    // Object keys in :class bindings, quoted or bare: { invisible: cond, 'opacity-50': x }.
    for (const m of text.matchAll(/\s:class="([^"]*)"/g)) for (const k of m[1].matchAll(/(?:^|[{,]\s*)(?:'([^']+)'|([A-Za-z][\w-]*))\s*:/g)) {
      const key = k[1] ?? k[2];
      if (utility(key) && !owned(key)) bare.push(`${file} :class key: ${key}`);
    }
    const script = file.endsWith('.vue') ? text.slice(text.indexOf('<script')) : text;
    for (const m of script.matchAll(/'([^'\n]*)'|"([^"\n]*)"|`([^`]*)`/g)) check(m[1] ?? m[2] ?? m[3], 'script');
  }
  assert.deepEqual(bare, []);
});

// Tailwind turns "_" in arbitrary values into spaces, so var(--_kjun-x) there compiles to var(-- kjun-x).
test('Vue arbitrary utilities do not read --_kjun- variables', async () => {
  const offenders = (await sources('packages/vue2/src'))
    .flatMap(([path, text]) => [...text.matchAll(/kj-[\w:-]*\[[^\]\s"'`]*--_kjun-[^\]\s"'`]*\]/g)].map(match => path + ': ' + match[0]));
  assert.deepEqual(offenders, []);
});
