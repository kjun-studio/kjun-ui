import { execFileSync } from 'node:child_process';
import { readFile, readdir, writeFile } from 'node:fs/promises';
import { dirname, resolve, relative } from 'node:path';
import ts from 'typescript';

export async function emitDeclarations(name, entry) {
  const dir = `packages/${name}`;
  const shared = name === 'react' || name === 'native';
  execFileSync('npx', [
    'tsc', entry, '--declaration', '--emitDeclarationOnly',
    '--outDir', dir + (shared ? '/dist/types' : '/dist'),
    '--rootDir', shared ? '.' : dir + '/src',
    '--target', 'ES2018', '--module', 'ESNext', '--moduleResolution', 'Bundler',
    '--jsx', 'react-jsx', '--esModuleInterop', '--skipLibCheck', '--strict',
  ], { stdio: 'inherit' });
  if (shared) await writeFile(dir + '/dist/index.d.ts',
    `export * from "./types/packages/${name}/src/index";\n`);
}

// Walk the declaration graph, including import() type references. Rewriting only
// the public barrel hides broken internal references behind skipLibCheck.
export function normalizeDeclaration(source, filename, extension, files) {
  const tree = ts.createSourceFile(filename, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
  const rewrite = specifier => {
    if (!specifier.startsWith('./') && !specifier.startsWith('../')) return specifier;
    if (/\.(json|css)$/.test(specifier)) return specifier;
    const base = resolve(dirname(filename), specifier.replace(/(?:\.d)?\.(?:[cm]?ts|[cm]?js)$/, ''));
    const target = files.has(base + '.d.ts') ? base : files.has(base + '/index.d.ts') ? base + '/index' : base;
    const path = relative(dirname(filename), target).replaceAll('\\', '/');
    return (path.startsWith('.') ? path : './' + path) + extension;
  };
  const result = ts.transform(tree, [context => {
    const visit = node => {
      if (ts.isStringLiteral(node)) {
        const parent = node.parent;
        const moduleReference = ((ts.isImportDeclaration(parent) || ts.isExportDeclaration(parent)) && parent.moduleSpecifier === node)
          || ts.isExternalModuleReference(parent)
          || (ts.isLiteralTypeNode(parent) && ts.isImportTypeNode(parent.parent) && parent.parent.argument === parent);
        if (moduleReference) return ts.factory.createStringLiteral(rewrite(node.text));
      }
      return ts.visitEachChild(node, visit, context);
    };
    return node => ts.visitNode(node, visit);
  }]);
  try { return ts.createPrinter().printFile(result.transformed[0]); }
  finally { result.dispose(); }
}

export async function finalizeDeclarations(name) {
  const dist = resolve('packages', name, 'dist');
  const files = new Set();
  async function collect(dir) {
    for (const entry of await readdir(dir, { withFileTypes: true })) {
      const path = resolve(dir, entry.name);
      if (entry.isDirectory()) await collect(path);
      else if (path.endsWith('.d.ts')) files.add(path);
    }
  }
  await collect(dist);
  for (const file of [...files].sort()) {
    const source = await readFile(file, 'utf8');
    await writeFile(file, normalizeDeclaration(source, file, '.js', files));
    const commonjs = name === 'vue2' && file === resolve(dist, 'plugin.d.ts')
      ? 'import { default as plugin } from "./index.cjs";\nexport = plugin;\n'
      : normalizeDeclaration(source, file, '.cjs', files);
    await writeFile(file.replace(/\.d\.ts$/, '.d.cts'), commonjs);
  }
}
