import { build } from 'esbuild';
import { readFile, readdir } from 'node:fs/promises';
import { resolve } from 'node:path';
export async function presentationFiles(root, consumer) {
  const modules = resolve(consumer.directory, 'node_modules');
  const output = await build({ entryPoints: [resolve(root, 'previews/presentation/index.tsx')], bundle: true, write: false,
    format: 'esm', platform: 'browser', target: 'es2020', jsx: 'automatic', minify: true,
    alias: { react: modules + '/react', 'react-dom': modules + '/react-dom', '@kjun-ui/react': modules + '/@kjun-ui/react', '@kjun-ui/tokens': modules + '/@kjun-ui/tokens', '@kjun-ui/tokens/icons': modules + '/@kjun-ui/tokens/dist/icons.js' },
    define: { 'process.env.NODE_ENV': '"production"' },
  });
  const files = {
    'presentation.js': output.outputFiles[0].contents,
    'presentation.css': await readFile(resolve(root, 'previews/presentation/presentation.css')),
    'presentation-components.css': await readFile(modules + '/@kjun-ui/tokens/dist/styles.css'),
    'presentation.html': Buffer.from('<!doctype html><html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>KJUN 대표 이미지 촬영</title><link rel="stylesheet" href="/fonts/fonts.css"><link rel="stylesheet" href="./presentation-components.css"><link rel="stylesheet" href="./presentation.css"></head><body><div id="root"></div><script type="module" src="./presentation.js"></script></body></html>'),
  };
  return files;
}
export async function fingerprintDirectory(hash, path) {
  for (const entry of (await readdir(path, { withFileTypes: true })).sort((a, b) => a.name.localeCompare(b.name))) {
    const file = resolve(path, entry.name); hash.update(entry.name + '\0');
    if (entry.isDirectory()) await fingerprintDirectory(hash, file); else hash.update(await readFile(file));
  }
}
export function pngSize(bytes) {
  if (!bytes || !bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))) return null;
  return { width: bytes.readUInt32BE(16), height: bytes.readUInt32BE(20) };
}
