import { foundationNames } from "../shared/foundation-examples.ts";
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';
import ts from 'typescript';
import { transform } from 'esbuild';
import { exampleNames, exampleDefinition, presetConfig } from '../shared/example-registry.ts';
const root = resolve(import.meta.dirname, '..');
const read = path => readFile(resolve(root, path), 'utf8');
const helpers = new Map(), recipes = new Map();
const parse = (name, text) => ts.createSourceFile(name, text, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
function declarations(statement, file) {
  if (!ts.isVariableStatement(statement)) return;
  for (const declaration of statement.declarationList.declarations)
    if (ts.isIdentifier(declaration.name) && declaration.initializer)
      helpers.set(declaration.name.text, `const ${declaration.getText(file)};`);
}
const helperFile = parse('helpers.ts', await read('previews/catalog/example-tools.ts'));
for (const statement of helperFile.statements) {
  declarations(statement, helperFile);
  if (ts.isFunctionDeclaration(statement) && statement.name.text === 'createExampleTools')
    statement.body.statements.forEach(item => declarations(item, helperFile));
}
for (const path of ['previews/catalog/example-icons.ts', 'previews/catalog/example-interaction.ts', 'previews/catalog/example-accessibility.ts', 'previews/catalog/example-motion.ts', 'previews/catalog/example-card.ts', 'previews/catalog/example-controls.ts', 'previews/catalog/example-data.ts', 'previews/catalog/example-layouts.ts', 'previews/catalog/example-extensions.ts', 'previews/catalog/example-recipes.ts', 'previews/catalog/example-design-cases.ts', 'previews/catalog/example-foundations.ts']) {
  const file = parse(path, await read(path));
  const fn = file.statements.find(ts.isFunctionDeclaration);
  const block = fn.body.statements.find(ts.isSwitchStatement);
  let names = [];
  for (const clause of block.caseBlock.clauses) {
    if (ts.isDefaultClause(clause)) continue;
    names.push(clause.expression.text);
    if (clause.statements.length) {
      const body = clause.statements.map(s => s.getText(file)).join('\n');
      for (const name of names) {
        if (recipes.has(name)) throw Error('Duplicate example: ' + name);
        recipes.set(name, body);
      }
      names = [];
    }
  }
}
const referenceCache = new Map();
function identifiers(text) {
  if (referenceCache.has(text)) return referenceCache.get(text);
  const file = parse('snippet.ts', text);
  const options = { noLib: true, noResolve: true, target: ts.ScriptTarget.ESNext };
  const host = ts.createCompilerHost(options);
  host.getSourceFile = name => name === 'snippet.ts' ? file : undefined;
  const checker = ts.createProgram(['snippet.ts'], options, host).getTypeChecker();
  const names = new Set();
  const visit = node => {
    if (ts.isTypeNode(node)) return;
    if (ts.isIdentifier(node)) {
      const parent = node.parent;
      if ((ts.isPropertyAccessExpression(parent) && parent.name === node) ||
          (ts.isPropertyAssignment(parent) && parent.name === node && !ts.isComputedPropertyName(parent.name))) return;
      const symbol = ts.isShorthandPropertyAssignment(parent) ? checker.getShorthandAssignmentValueSymbol(parent) : checker.getSymbolAtLocation(node);
      if (!symbol?.declarations?.length) names.add(node.text);
    }
    ts.forEachChild(node, visit);
  };
  visit(file); referenceCache.set(text, names);
  return names;
}

function moduleFor(name, platform) {
  const body = recipes.get(name);
  if (!body) throw Error('Missing example: ' + name);
  const selected = [], seen = new Set();
  function use(key) {
    if (!helpers.has(key) || seen.has(key)) return;
    seen.add(key);
    for (const ref of identifiers(helpers.get(key))) if (ref !== key) use(ref);
    selected.push(key);
  }
  for (const key of identifiers(body)) use(key);
  const local = new Set(['h', 'values', 'set', 'feedback', 'settings', 'domainColors', 'platform', 'disabled', 'loading', 'error']);
  let changed = true;
  while (changed) {
    changed = false;
    for (const key of selected) if (!local.has(key) && [...identifiers(helpers.get(key))].some(ref => ref !== key && local.has(ref))) { local.add(key); changed = true; }
  }
  return `${selected.filter(key => !local.has(key)).map(key => helpers.get(key)).join('\n')}
function renderExample(h, values, set, feedback, settings, domainColors = {}) {
 const name = ${JSON.stringify(name)}, platform = ${JSON.stringify(platform)};
 const { disabled = false, loading = false, error = false } = settings;
 ${selected.filter(key => local.has(key)).map(key => helpers.get(key)).join('\n')}
 ${body}
}`;
}
export function previewSource(template, platform) {
  let source = template.replace('/* ICON_IMPORTS */', '').replace('/* ICON_PROVIDER */', platform === 'vue2' ? 'props: { icons: this.icons }' : 'icons={props.icons}').replace(/import "@kjun-ui\/(?:vue2|react)\/styles\.css";/g, '').replace('const settings = __KJUN_SETTINGS__;', platform === 'vue2' ? 'const settings = this.settings;' : '')
    .replaceAll('__KJUN_VALUES__', platform === 'vue2' ? 'this.initialValues || {}' : 'initialValues || {}')
    .replace('/* PARAMS */', '{ settings, initialValues, observer }')
    .replace('/* PAGE_PARAMS */', 'props')
    .replace('/* EXAMPLE_PROPS */', '{...props}')
    .replaceAll('/* VUE_PROPS */', 'props: ["settings", "initialValues", "observer", "icons"],')
    .replace('/* VUE_EXAMPLE_PROPS */', '{ props: this.$props }')
    .replace('/* VUE_OBSERVE */', 'mounted() { this.observer.snapshot(this.values); }, updated() { this.observer.snapshot(this.values); },')
    .replace('/* OBSERVE */', 'useEffect(() => { observer.snapshot(values); }, [values, settings, observer]);')
    .replace('createElement, useState', 'createElement, useState, useEffect')
    .replace('const h = visualH;', `const h = instrumentRenderer(visualH, ${platform === 'vue2' ? 'this.observer' : 'observer'}, ${JSON.stringify(platform)});`)
    .replace('const feedback = K.useKjunFeedback();', 'const feedback = instrumentFeedback(K.useKjunFeedback(), observer);')
    .replace('const feedback = this.kjunFeedback;', 'const feedback = instrumentFeedback(this.kjunFeedback, this.observer);')
    .replace(/import "\.\/kjun.css";/, '')
    .replace('import { appColors, appDomainColors, appFont } from "./kjun";', '')
    .replace('colors={appColors} domainColors={appDomainColors} fontFamily={appFont}', 'colors={props.colors} domainColors={props.domainColors} fontFamily={props.font}');
  if (platform === 'native') source = source.replace('return <View testID=', 'return <View testID=');
  return `import { instrumentRenderer, instrumentFeedback } from "../../../previews/catalog/telemetry";\n` + source;
}
export async function generateExamples() {
  const sourcesRoot = resolve(root, 'apps/docs/public/previews/sources');
  await mkdir(sourcesRoot, { recursive: true });
  const manifest = {};
  for (const platform of ['vue2', 'react', 'native']) {
    const directory = resolve(root, 'artifacts/examples', platform);
    await mkdir(directory, { recursive: true });
    const template = await read('previews/templates/' + platform + '.txt');
    const exports = [];
    for (const name of exampleNames) {
      const recipe = (await transform(moduleFor(name, platform), { loader: 'ts', target: 'es2020', charset: 'utf8' })).code;
      const foundation = foundationNames.includes(name)
        ? (await read('previews/templates/foundation-' + platform + '.txt')).replace('__KJUN_FOUNDATION_RULES__', (await read('shared/foundation-layout.json')).trim()) + '\n'
        : '';
      const iconImports = name.startsWith('GuideIcon') ? 'import { tokens } from "@kjun-ui/tokens";\nimport { filledIcons } from "@kjun-ui/tokens/icons";\n' : '';
      let source = template.replace('/* MODULE */', iconImports + foundation + recipe).replaceAll('__KJUN_NAME__', name);
      if (name === 'GuideIconSelection') {
        source = '/* ICON_IMPORTS */\n' + source;
        source = platform === 'vue2' ? source.replace('h(K.KjunProvider, [', 'h(K.KjunProvider, { /* ICON_PROVIDER */ }, [')
          : source.replace('<K.KjunProvider', '<K.KjunProvider /* ICON_PROVIDER */');
      }
      if (foundation) source = source.replaceAll('K[name]', '({ FoundationLayout, FoundationScreen }[name] || K[name])');
      manifest[name] ||= { sources: {}, events: /on[A-Z]|feedback\./.test(recipe), controls: exampleDefinition(name).controls.map(c => c.key) };
      manifest[name].sources[platform] = source;
      const extension = platform === 'vue2' ? 'js' : 'jsx';
      await writeFile(resolve(directory, `${name}.${extension}`), previewSource(source, platform));
      exports.push(`import ${name} from './${name}.${extension}';`);
    }
    await writeFile(resolve(directory, 'index.ts'), `// Generated from the same templates as copied examples.\n// @ts-nocheck\n${exports.join('\n')}\nexport default {${exampleNames.join(',')}};\n`);
  }
  for (const [name, data] of Object.entries(manifest)) {
    for (const preset of exampleDefinition(name).presets) presetConfig(name, preset.id);
    await writeFile(resolve(sourcesRoot, name + '.json'), JSON.stringify(data));
  }
  await writeFile(resolve(root, 'artifacts/examples/manifest.json'), JSON.stringify(manifest));
  console.log(`Generated ${exampleNames.length} example definitions for three packed platforms.`);
}
if (process.argv[1] === import.meta.filename) await generateExamples();
