import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { readFile } from 'node:fs/promises';
import { iconSource } from '../scripts/icon-build.mjs';
import { parseTerms } from '../shared/icon-language/terms.mjs';
import { koreanCatalog } from '../shared/icon-language/catalog.mjs';
import { searchIcons } from '../shared/icon-catalog.ts';
import { mergeIcons, resolveIcon } from '../shared/package-runtime/icon-registry.ts';
const require = createRequire(import.meta.url);
const source = await iconSource();
const { allIcons } = await import('@kjun-ui/icons/all');
const { icons, filledIcons, defaultIcons } = await import('@kjun-ui/icons/defaults');
const { iconMetadata } = await import('@kjun-ui/icons/metadata');

test('every pinned official node, name and variant is identical in ESM and CommonJS', async () => {
  assert.deepEqual(Object.keys(allIcons), source.names);
  assert.equal(source.names.length, 5166);
  assert.equal(Object.values(allIcons).filter(icon => icon.filled).length, 1054);
  const commonjs = require('@kjun-ui/icons/all').allIcons;
  const officialMetadata = JSON.parse(await readFile('node_modules/@tabler/icons/icons.json', 'utf8'));
  assert.deepEqual(Object.keys(officialMetadata).sort(), source.names);
  for (const name of source.names) {
    assert.deepEqual(allIcons[name].outline, source.outline[name], name);
    assert.deepEqual(allIcons[name].filled, source.filled[name], name);
    assert.deepEqual(commonjs[name], allIcons[name], name);
    assert.equal(Object.hasOwn(officialMetadata[name].styles, 'filled'), !!allIcons[name].filled, name);
    assert.ok(Object.hasOwn(officialMetadata[name].styles, 'outline'), name);
  }
  assert.deepEqual(iconMetadata, source.metadata);
  assert.ok(iconMetadata.every(entry => !('outline' in entry) && typeof entry.filled === 'boolean'));
  assert.deepEqual(Object.keys(await import('@kjun-ui/icons')), ['tablerVersion']);
  assert.equal(await readFile('packages/icons/dist/Tabler-LICENSE', 'utf8'), source.license);
});
test('legacy names and exports are preserved with pinned Tabler geometry', async () => {
  assert.equal(Object.keys(icons).length, 153);
  assert.deepEqual(Object.keys(filledIcons), ['heart', 'star']);
  const compatibility = await import('@kjun-ui/tokens/icons');
  assert.strictEqual(compatibility.icons, icons);
  assert.strictEqual(compatibility.filledIcons, filledIcons);
  for (const [name, nodes] of Object.entries(icons)) assert.deepEqual(nodes, source.outline[name]);
  for (const name of ['refresh', 'server']) assert.deepEqual(icons[name], source.outline[name]);
  assert.strictEqual(resolveIcon(defaultIcons, 'missing', true).nodes, icons['help-circle']);
  assert.strictEqual(resolveIcon(defaultIcons, 'search', true).nodes, icons.search);
  assert.strictEqual(resolveIcon(defaultIcons, 'constructor').nodes, icons['help-circle']);
});
test('registries merge per shape without mutating defaults, parents or siblings', () => {
  const parent = mergeIcons(defaultIcons, { alien: allIcons.alien, heart: allIcons.alien });
  const child = mergeIcons(parent, { heart: { outline: allIcons.rocket.outline } });
  assert.strictEqual(resolveIcon(child, 'heart').nodes, allIcons.rocket.outline);
  assert.strictEqual(resolveIcon(child, 'heart', true).nodes, allIcons.alien.filled);
  assert.strictEqual(resolveIcon(parent, 'heart').nodes, allIcons.alien.outline);
  assert.strictEqual(resolveIcon(defaultIcons, 'heart').nodes, icons.heart);
  assert.strictEqual(resolveIcon(child, 'alien').nodes, allIcons.alien.outline);
  assert.strictEqual(resolveIcon(mergeIcons(parent, { heart: { outline: allIcons.rocket.outline, filled: undefined } }), 'heart', true).nodes, allIcons.alien.filled);
  assert.strictEqual(resolveIcon(mergeIcons(parent, { 'help-circle': allIcons.alien }), 'missing').nodes, allIcons.alien.outline);
  assert.strictEqual(resolveIcon(defaultIcons, 'alien').nodes, icons['help-circle']);
});
test('all Korean names and search terms cover the official list deterministically', () => {
  const catalog = koreanCatalog(iconMetadata);
  assert.equal(catalog.length, 5166);
  assert.deepEqual(catalog, koreanCatalog(iconMetadata));
  assert.deepEqual(catalog.map(entry => entry.name), source.names);
  assert.equal(new Set(catalog.map(entry => entry.label)).size, catalog.length);
  for (const entry of catalog) {
    assert.match(entry.label, /[가-힣]/u, entry.name);
    assert.ok(entry.aliases.length > 0 && entry.aliases.every(term => term.trim() && /[가-힣]/u.test(term)), entry.name);
    assert.equal(new Set(entry.aliases).size, entry.aliases.length, entry.name);
  }
  assert.throws(() => parseTerms('name=이름|name=중복'));
  assert.throws(() => parseTerms('name='));
  assert.throws(() => parseTerms('name=English'));
  assert.throws(() => koreanCatalog(iconMetadata.slice(1)));
  assert.throws(() => koreanCatalog([...iconMetadata, iconMetadata[0]]));
  for (const [query, name] of [['외계인', 'alien'], ['로켓', 'rocket'], ['github', 'brand-github'], ['깃허브', 'brand-github'], ['즐겨찾기', 'star'], ['ARROW LEFT', 'arrow-left']])
    assert.ok(searchIcons(catalog, query).some(entry => entry.name === name), query);
  assert.ok(searchIcons(catalog, source.metadata.find(entry => entry.name === 'alien').tags[0]).some(entry => entry.name === 'alien'));
});
