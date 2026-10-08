import { createRequire } from 'node:module';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';
import { koreanCatalog } from '../shared/icon-language/catalog.mjs';
const root = resolve(import.meta.dirname, '..');
// Documentation assets come only from the installed tarball consumer.
const packed = createRequire(resolve(root, 'apps/docs/package.json'));
const { iconMetadata } = packed('@kjun/icons/metadata');
const { allIcons } = packed('@kjun/icons/all');
const { tablerVersion } = packed('@kjun/icons');
const catalog = koreanCatalog(iconMetadata);
const directory = resolve(root, 'apps/docs/public/previews/icons', tablerVersion);
const check = process.argv.includes('--check');
if (!check) await mkdir(directory, { recursive: true });
const save = async (name, data) => {
  const file = resolve(directory, name + '.json'), text = JSON.stringify(data) + '\n';
  if (check) {
    if (await readFile(file, 'utf8').catch(() => null) !== text) throw Error('Stale packed icon asset: ' + name);
  } else await writeFile(file, text);
};
await save('catalog', catalog);
for (let i = 0; i < catalog.length; i += 64) await Promise.all(catalog.slice(i, i + 64).map(({ name }) => save(name, allIcons[name])));
console.log(`Verified Korean names/search terms and packed static data for ${catalog.length} icons (${tablerVersion}).`);
