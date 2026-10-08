import { readFile, writeFile, mkdir, rm, copyFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { resolve } from 'node:path';
import { build } from 'esbuild';

const root = resolve(import.meta.dirname, '..');
const json = async path => JSON.parse(await readFile(resolve(root, path), 'utf8'));
export async function iconSource() {
  const pin = await json('packages/icons/src/upstream.json');
  const lock = await json('package-lock.json');
  const installed = lock.packages['node_modules/@tabler/icons'];
  if (installed?.version !== pin.version || installed.integrity !== pin.integrity) throw Error('Tabler lock does not match the pinned source');
  const files = {};
  for (const [file, hash] of Object.entries(pin.hashes)) {
    const bytes = await readFile(resolve(root, 'node_modules/@tabler/icons', file));
    if (createHash('sha256').update(bytes).digest('hex') !== hash) throw Error('Changed Tabler source: ' + file);
    files[file] = bytes.toString();
  }
  const outline = JSON.parse(files['tabler-nodes-outline.json']), filled = JSON.parse(files['tabler-nodes-filled.json']);
  const sourceMetadata = JSON.parse(files['icons.json']);
  const names = Object.keys(outline).sort();
  if (names.length !== 5166 || Object.keys(filled).length !== 1054 ||
      names.some(name => !sourceMetadata[name]) || Object.keys(filled).some(name => !outline[name])) throw Error('Incomplete Tabler 3.48.0 source');
  for (const nodes of [...Object.values(outline), ...Object.values(filled)]) for (const [tag, attrs] of nodes) {
    if (tag !== 'path' || Object.keys(attrs).some(key => !['d', 'fill', 'stroke', 'opacity'].includes(key)) ||
        Object.values(attrs).some(value => typeof value !== 'string')) throw Error('Unsupported Tabler node');
  }
  const metadata = names.map(name => ({ name, category: sourceMetadata[name].category,
    tags: sourceMetadata[name].tags.map(String), filled: !!filled[name] }));
  return { outline, filled, metadata, names, license: files.LICENSE, version: pin.version };
}

export async function buildIcons() {
  const source = await iconSource();
  const directory = resolve(root, 'packages/icons/dist');
  await rm(directory, { recursive: true, force: true });
  await mkdir(directory + '/icons', { recursive: true });
  const defaults = await json('packages/icons/src/default-names.json');
  const icons = Object.fromEntries(defaults.outline.map(name => [name, source.outline[name]]));
  const filledIcons = Object.fromEntries(defaults.filled.map(name => [name, source.filled[name]]));
  if (Object.values(icons).some(value => !value) || Object.values(filledIcons).some(value => !value)) throw Error('Missing legacy icon name');
  const definition = name => ({ outline: source.outline[name], ...(source.filled[name] ? { filled: source.filled[name] } : {}) });
  const rootTypes = (await readFile(resolve(root, 'packages/icons/src/index.ts'), 'utf8'))
    .replace("export const tablerVersion = '3.48.0' as const;", "export declare const tablerVersion: '3.48.0';");
  for (const format of ['esm', 'cjs']) {
    const ext = format === 'esm' ? 'js' : 'cjs', typeExt = format === 'esm' ? 'd.ts' : 'd.cts';
    await build({ entryPoints: [resolve(root, 'packages/icons/src/index.ts')], outfile: `${directory}/index.${ext}`, format, target: 'es2018' });
    await writeFile(`${directory}/index.${typeExt}`, rootTypes);
    await writeFile(`${directory}/definition.${typeExt}`, format === 'esm'
      ? `import type { KjunIconDefinition } from './index.js';\ndeclare const icon: KjunIconDefinition;\nexport default icon;\n`
      : `import type { KjunIconDefinition } from './index.cjs';\ndeclare const icon: KjunIconDefinition;\nexport = icon;\n`);
    const header = '// Generated from @tabler/icons ' + source.version + '. MIT.\n';
    // Direct per-icon modules work with both ESM tree shaking and CJS/Metro resolution.
    for (let i = 0; i < source.names.length; i += 64) await Promise.all(source.names.slice(i, i + 64).map(async name => {
      await writeFile(`${directory}/icons/${name}.${ext}`, header + (format === 'esm' ? 'export default ' : 'module.exports = ') + JSON.stringify(definition(name)) + ';\n');
      await writeFile(`${directory}/icons/${name}.${typeExt}`, format === 'esm'
        ? "export { default } from '../definition.js';\n"
        : "import icon = require('../definition.cjs');\nexport = icon;\n");
    }));
    const assign = (name, expression) => format === 'esm' ? `export const ${name} = ${expression};\n` : `const ${name} = exports.${name} = ${expression};\n`;
    await writeFile(`${directory}/defaults.${ext}`, header + assign('icons', JSON.stringify(icons)) + assign('filledIcons', JSON.stringify(filledIcons)) +
      assign('defaultIcons', `Object.fromEntries(Object.entries(icons).map(([name, outline]) => [name, { outline, ...(filledIcons[name] ? { filled: filledIcons[name] } : {}) }]))`));
    await writeFile(`${directory}/defaults.${typeExt}`, `import type { IconNode, KjunIconRegistry } from './index.${ext}';\nexport declare const icons: Record<string, IconNode[]>;\nexport declare const filledIcons: Record<string, IconNode[]>;\nexport declare const defaultIcons: KjunIconRegistry;\n`);
    await writeFile(`${directory}/metadata.${ext}`, header + assign('iconMetadata', JSON.stringify(source.metadata)));
    await writeFile(`${directory}/metadata.${typeExt}`, `import type { KjunIconMetadata } from './index.${ext}';\nexport declare const iconMetadata: readonly KjunIconMetadata[];\n`);
    const imports = source.names.map((name, i) => format === 'esm' ? `import i${i} from './icons/${name}.js';` : `const i${i} = require('./icons/${name}.cjs');`).join('\n');
    await writeFile(`${directory}/all.${ext}`, header + imports + '\n' + assign('allIcons', '{' + source.names.map((name, i) => JSON.stringify(name) + ':i' + i).join(',') + '}'));
    await writeFile(`${directory}/all.${typeExt}`, `import type { KjunIconRegistry } from './index.${ext}';\nexport declare const allIcons: KjunIconRegistry;\n`);
  }
  await writeFile(directory + '/Tabler-LICENSE', source.license);
  await copyFile('LICENSE', directory + '/LICENSE');
  console.log(`Generated ${source.names.length} icon modules and ${Object.keys(source.filled).length} filled variants from verified Tabler ${source.version}.`);
}
if (process.argv[1] === import.meta.filename) await buildIcons();
