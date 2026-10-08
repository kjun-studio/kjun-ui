import ts from 'typescript';
import postcss from 'postcss';
import { readFile, readdir } from 'node:fs/promises';
import { resolve } from 'node:path';
import { readbackAliases } from './token-aliases.mjs';


// These values describe an actual platform distinction, not missing wiring.
export const platformSpecific = {
  'table.columnWidth': { excludes: ['react', 'vue2'], reason: 'Native numeric column fallback; HTML tables use content layout and explicit column widths.' },
  'extensions.chip.nativeRemoveSize': { excludes: ['react', 'vue2'], reason: 'Native removal touch target; Web consumes removeSize.' },
  'extensions.toast.minWidth': { excludes: ['native'], reason: 'Desktop Web minimum width; Native and narrow Web must fit the viewport.' },
  'extensions.choice.minimumHeight': { excludes: ['native'], reason: 'Desktop choice row; Native uses native.minimumTouchTarget.' },
  'table.selectionSize': { excludes: ['native'], reason: 'HTML checkbox footprint; Native composes the size-specific Checkbox and minimum touch target.' },
  'extensions.tooltip.arrowSize': { excludes: ['native'], reason: 'Tooltip arrow; Web and Native Web draw it, Native device tooltips use the modal panel without one.' },
  'extensions.scrollbar.width': { excludes: ['react', 'native'], reason: 'Vue window scrollbar skin; other platforms retain their system scrollbar.' },
  'extensions.scrollFade.width': { excludes: ['native'], reason: 'CSS edge mask; Native draws it only for the overflowing table grid, and DsScrollFade keeps the platform ScrollView.' },
  'extensions.calendar.minimumWidth': { excludes: ['react', 'vue2'], reason: 'Native seven-column calendar panel; Web uses the browser date picker.' },
  ...Object.fromEntries(['identityWidth', 'identityHeight'].map(key => ['extensions.skeleton.' + key, {
    excludes: ['react', 'native'], reason: 'Vue AssetIdentity loading adapter; other platforms render the supplied identity slot.',
  }])),
  ...Object.fromEntries(['titleSkeletonWidth', 'titleSkeletonHeight', 'badgeSkeletonWidth', 'fieldSkeletonHeight', 'actionSkeletonWidth', 'actionSkeletonHeight'].map(key => ['extensions.tableCard.' + key, {
    excludes: ['react', 'native'], reason: 'Vue section-aware table loading cards; React and Native compose the general Card skeleton.',
  }])),
  ...Object.fromEntries([
    'financial.signedSkeletonHeight',
    'kpiHero.secondarySkeletonWidth', 'kpiHero.descriptionSkeletonWidth',
    ...['value', 'segment', 'description'].map(part => 'kpiRow.' + part + 'SkeletonWidth'),
  ].map(path => ['extensions.' + path, {
    excludes: ['react', 'vue2'], reason: 'Native logical-unit placeholder; Web uses intrinsic em/ch/lh text-relative dimensions.',
  }])),
};

// Read-only inventory. Object reads are reported separately from leaf reads:
// handing a component an object does not prove it consumes every property.
export function tokenReads(source, filename, imports = {}) {
  const file = resolve(filename + '.audit.tsx');
  const ast = ts.createSourceFile(file, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  const host = ts.createCompilerHost({ noResolve: true, noLib: true });
  host.getSourceFile = name => name === file ? ast : undefined;
  const program = ts.createProgram([file], { noResolve: true, noLib: true }, host);
  const checker = program.getTypeChecker();
  function paths(node, trail = new Set()) {
    if (!node || trail.has(node)) return [];
    const next = new Set([...trail, node]);
    if (ts.isIdentifier(node)) {
      if (node.text === 'tokens') return [''];
      const symbol = checker.getSymbolAtLocation(node);
      const declaration = symbol?.valueDeclaration ?? symbol?.declarations?.[0];
      if (declaration && ts.isImportSpecifier(declaration)) {
        const imported = declaration.propertyName?.text ?? declaration.name.text;
        if (imports[imported]) return ['.' + imports[imported]];
      }
      if (declaration && ts.isVariableDeclaration(declaration)) return paths(declaration.initializer, next);
      if (declaration && ts.isBindingElement(declaration)) {
        const binding = declaration.parent.parent;
        const parentPaths = ts.isVariableDeclaration(binding) ? paths(binding.initializer, next) : [];
        return parentPaths.map(p => p + '.' + (declaration.propertyName?.text ?? declaration.name.text));
      }
    }
    if (ts.isPropertyAccessExpression(node)) return paths(node.expression, next).map(p => p + '.' + node.name.text);
    if (ts.isElementAccessExpression(node)) {
      const index = node.argumentExpression;
      const keys = ts.isStringLiteral(index) || ts.isNumericLiteral(index) ? [index.text]
        : ts.isConditionalExpression(index) && ts.isStringLiteral(index.whenTrue) && ts.isStringLiteral(index.whenFalse)
          ? [index.whenTrue.text, index.whenFalse.text] : ['*'];
      return paths(node.expression, next).flatMap(p => keys.map(key => p + '.' + key));
    }
    if (ts.isConditionalExpression(node)) return [...paths(node.whenTrue, next), ...paths(node.whenFalse, next)];
    if (ts.isParenthesizedExpression(node) || ts.isAsExpression(node) || ts.isNonNullExpression(node)) return paths(node.expression, next);
    return [];
  }
  const reads = new Set();
  function visit(node) {
    if (ts.isImportDeclaration(node) || ts.isExportDeclaration(node) || ts.isTypeNode(node)) return;
    if (ts.isPropertyAccessExpression(node) || ts.isElementAccessExpression(node) || ts.isIdentifier(node)) {
      const parent = node.parent;
      const chain = (ts.isPropertyAccessExpression(parent) || ts.isElementAccessExpression(parent)) && parent.expression === node;
      const alias = ts.isVariableDeclaration(parent) && parent.initializer === node;
      const name = (ts.isVariableDeclaration(parent) || ts.isBindingElement(parent) || ts.isPropertyAccessExpression(parent) || ts.isPropertyAssignment(parent)) && parent.name === node;
      if (!chain && !alias && !name) for (const path of paths(node)) if (path) reads.add(path.slice(1));
    }
    ts.forEachChild(node, visit);
  }
  visit(ast);
  return [...reads].sort();
}

export async function sourceInventory(root) {
  const files = [];
  for (const directory of ['packages/react/src', 'packages/native/src', 'packages/vue2/src', 'packages/tokens/src', 'shared/package-runtime']) {
    for (const name of await readdir(resolve(root, directory), { recursive: true })) {
      if (!/\.(?:tsx?|js|vue|css)$/.test(name) || /(?:^|\/)(?:index\.ts|.*\.d\.ts|bindings\.css|typography\.css|color-roles\.ts)$/.test(name)) continue;
      const file = directory + '/' + name, source = await readFile(resolve(root, file), 'utf8');
      const script = name.endsWith('.vue') ? [...source.matchAll(/<script[^>]*>([\s\S]*?)<\/script>/g)].map(m => m[1]).join('\n') : name.endsWith('.css') ? '' : source;
      files.push({ file, source, script });
    }
  }
  const imports = Object.fromEntries(files.flatMap(({ script }) => [...script.matchAll(/export const (\w+)\s*=\s*tokens\.([\w.]+)\s*;/g)].map(m => [m[1], m[2]])));
  return files.map(({ file, source, script }) => ({ file, source, reads: script ? tokenReads(script, file, imports) : [] }));
}

export function connectedCss(source, consumerSource) {
  const rules = [];
  postcss.parse(source).walkRules(rule => {
    const classes = [...rule.selector.matchAll(/\.([_a-zA-Z][\w-]*)/g)].map(m => m[1]).filter(name => name !== 'kjun-scope');
    if (classes.some(name => consumerSource.includes(name))) rules.push(rule.toString());
  });
  return rules.join('\n');
}

export async function auditTokenConsumption(root) {
  const tokens = JSON.parse(await readFile(resolve(root, 'packages/tokens/src/tokens.json'), 'utf8'));
  const leaves = [];
  function flatten(value, path = []) {
    if (typeof value === 'number') leaves.push(path.join('.'));
    else if (value && typeof value === 'object' && !Array.isArray(value)) for (const [key, child] of Object.entries(value)) flatten(child, [...path, key]);
  }
  flatten(tokens);
  const files = await sourceInventory(root);
  const kebab = value => value.replace(/[A-Z]/g, c => '-' + c.toLowerCase());
  const report = { componentRoles: leaves.filter(p => /^(?:button|modal|input|table|card|extensions)\./.test(p) && !readbackAliases[p]).length, readbackAliases: Object.keys(readbackAliases).length, platforms: {} };
  for (const platform of ['react', 'vue2', 'native']) {
    const selected = files.filter(({ file }) => file.startsWith('shared/') || file.startsWith('packages/' + platform + '/') || platform !== 'native' && (file.startsWith('packages/tokens/') || file === 'packages/vue2/src/styles/forms.css'));
    const reads = selected.flatMap(f => f.reads).map(p => new RegExp('^' + p.split('.').map(x => x === '*' ? '[^.]+' : x).join('\\.') + '(?:\\.|$)'));
    const ownSource = selected.filter(f => !f.file.startsWith('packages/tokens/')).map(f => f.source).join('\n');
    // Shipping React CSS alongside Vue does not establish a Vue connection.
    const sharedCss = selected.filter(f => f.file.startsWith('packages/tokens/') && f.file.endsWith('.css')).map(f => connectedCss(f.source, ownSource));
    const text = ownSource + '\n' + sharedCss.join('\n');
    const dynamicCss = [...text.matchAll(/var\((--[\w-]*(?:\$\{[^}]+\}[\w-]*)+)/g)].map(m => new RegExp('^' + m[1].replace(/\$\{[^}]+\}/g, '[\\w-]+') + '$'));
    const missing = leaves.filter(path => {
      if (!/^(?:button|modal|input|table|card|extensions)\./.test(path)) return false;
      if (readbackAliases[path] || platformSpecific[path]?.excludes.includes(platform)) return false;
      const css = path.startsWith('extensions.') ? '--extension-' + kebab(path.slice(11).replaceAll('.', '-')) : '--_kjun-geometry-' + kebab(path.replaceAll('.', '-'));
      const utility = kebab((path.startsWith('extensions.') ? path.slice(11) : path).replaceAll('.', '-'));
      return !reads.some(r => r.test(path)) && !(platform !== 'native' && (text.includes('var(' + css) || dynamicCss.some(r => r.test(css)))) &&
        !(platform === 'vue2' && new RegExp('(?:p[xytrbl]?|m[xytrbl]?|gap|rounded|w|h|min-w|min-h|max-w|max-h)-' + utility + '\\b').test(text));
    });
    const objectReferences = selected.flatMap(({ file, reads }) => reads.filter(path => {
      if (!/^(?:button|modal|input|table|card|extensions)\./.test(path)) return false;
      const value = path.split('.').reduce((node, key) => key === '*' ? node?.[Object.keys(node ?? {})[0]] : node?.[key], tokens);
      return value && typeof value === 'object';
    }).map(path => ({ file, path })));
    report.platforms[platform] = { missing, objectReferences, exclusions: Object.entries(platformSpecific).filter(([, rule]) => rule.excludes.includes(platform)).map(([path, rule]) => ({ path, reason: rule.reason })) };
  }
  return report;
}

if (process.argv[1] && resolve(process.argv[1]) === resolve(import.meta.filename)) {
  const report = await auditTokenConsumption(resolve(import.meta.dirname, '..'));
  console.log(JSON.stringify(report, null, 2));
  if (Object.values(report.platforms).some(platform => platform.missing.length)) process.exitCode = 1;
}
