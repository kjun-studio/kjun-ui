import ts from 'typescript';
import postcss from 'postcss';
import { readFile, readdir } from 'node:fs/promises';
import { resolve } from 'node:path';

const dimension = /^(?:(?:min|max|minimum|maximum)?(?:Width|Height)|width|height|inlineSize|blockSize|size|iconSize|avatarSize|logoSize|diameter|dimension)$/;
const cssDimension = /^(?:(?:min|max)-)?(?:width|height|inline-size|block-size)$|^border(?:-[a-z]+)?(?:-width)?$|^outline(?:-width)?$/;
const absolute = /(?:^|[^\w.])-?(?:[1-9]\d*(?:\.\d+)?|0?\.\d*[1-9]\d*)(?:px|rem)\b/;
const numericSize = value => /^\d*\.?\d+$/.test(value) && Number(value) > 0;
const vectorTags = new Set(['rect', 'Rect', 'circle', 'Circle', 'path', 'Path', 'line', 'Line', 'ellipse', 'Ellipse', 'polygon', 'Polygon', 'polyline', 'Polyline']);

/** ViewBox artwork and relative layout are not physical component dimensions. */
export function auditSizeScript(source, file) {
  const ast = ts.createSourceFile(file + '.tsx', source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  const host = ts.createCompilerHost({ noResolve: true, noLib: true });
  host.getSourceFile = name => name === ast.fileName ? ast : undefined;
  const checker = ts.createProgram([ast.fileName], { noResolve: true, noLib: true }, host).getTypeChecker();
  const issues = new Set();
  const report = (node, property) => issues.add(`${file}:${ast.getLineAndCharacterOfPosition(node.getStart(ast)).line + 1} ${property}: ${node.getText(ast)}`);
  function inspect(node, property, trail = new Set()) {
    if (!node || trail.has(node)) return;
    const next = new Set([...trail, node]);
    if (ts.isNumericLiteral(node)) { if (Number(node.text) !== 0) report(node, property); }
    else if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) {
      if (absolute.test(node.text) || numericSize(node.text)) report(node, property);
    } else if (ts.isIdentifier(node)) {
      const declaration = checker.getSymbolAtLocation(node)?.valueDeclaration;
      if (declaration && ts.isVariableDeclaration(declaration)) inspect(declaration.initializer, property, next);
    } else if (ts.isArrowFunction(node)) {
      if (ts.isBlock(node.body)) {
        for (const statement of node.body.statements) if (ts.isReturnStatement(statement)) inspect(statement.expression, property, next);
      } else inspect(node.body, property, next);
    } else if (ts.isParenthesizedExpression(node) || ts.isAsExpression(node) || ts.isNonNullExpression(node)) inspect(node.expression, property, next);
    else if (ts.isPrefixUnaryExpression(node)) inspect(node.operand, property, next);
    else if (ts.isConditionalExpression(node)) { inspect(node.whenTrue, property, next); inspect(node.whenFalse, property, next); }
    else if (ts.isElementAccessExpression(node)) inspect(node.expression, property, next);
    else if (ts.isObjectLiteralExpression(node)) {
      for (const entry of node.properties) if (ts.isPropertyAssignment(entry)) inspect(entry.initializer, property, next);
    } else if (ts.isArrayLiteralExpression(node)) for (const child of node.elements) inspect(child, property, next);
    else if (ts.isBinaryExpression(node) && ts.isStringLiteral(node.right) && /^(?:%|em|ch|lh)$/.test(node.right.text)) return;
    else if (ts.isBinaryExpression(node) && [ts.SyntaxKind.BarBarToken, ts.SyntaxKind.QuestionQuestionToken, ts.SyntaxKind.PlusToken, ts.SyntaxKind.MinusToken].includes(node.operatorToken.kind)) {
      inspect(node.left, property, next); inspect(node.right, property, next);
    } else if (ts.isTemplateExpression(node)) {
      if (absolute.test([node.head.text, ...node.templateSpans.map(span => span.literal.text)].join(' '))) report(node, property);
      for (const span of node.templateSpans) if (/^(?:px|rem)\b/.test(span.literal.text)) inspect(span.expression, property, next);
    } else if (ts.isCallExpression(node) && /^Math\.(?:min|max)$/.test(node.expression.getText(ast))) {
      for (const argument of node.arguments) inspect(argument, property, next);
    }
  }
  function visit(node) {
    if (ts.isPropertyAssignment(node) || ts.isShorthandPropertyAssignment(node)) {
      const name = node.name.text;
      // A nonzero denominator before the first pointer measurement is not a UI size.
      const measurement = file.endsWith('/range-input.tsx') && ['{ x: 0, width: 1 }', '{ x: pageX, width: Math.max(1, width) }'].includes(node.parent.getText(ast));
      if (dimension.test(name) && !measurement && !(ts.isPropertyAssignment(node) && ts.isObjectLiteralExpression(node.initializer)))
        inspect(ts.isPropertyAssignment(node) ? node.initializer : node.name, name);
      if (name === 'default' && ts.isPropertyAssignment(node)) {
        const prop = node.parent.parent;
        if (ts.isPropertyAssignment(prop) && dimension.test(prop.name.text)) inspect(node.initializer, prop.name.text);
      }
    }
    if ((ts.isBindingElement(node) || ts.isParameter(node)) && ts.isIdentifier(node.name) && dimension.test(node.name.text)) inspect(node.initializer, node.name.text);
    if (ts.isJsxAttribute(node) && dimension.test(node.name.text)) {
      const tag = node.parent.parent.tagName?.getText(ast);
      if (!vectorTags.has(tag)) inspect(node.initializer && ts.isJsxExpression(node.initializer) ? node.initializer.expression : node.initializer, node.name.text);
    }
    // Skeleton drawing helpers take physical sizes, unlike chart viewBox primitives.
    if (ts.isCallExpression(node) && ts.isIdentifier(node.expression)) {
      if (node.expression.text === 'block') for (const argument of node.arguments.slice(0, 2)) inspect(argument, 'skeleton block');
      if (node.expression.text === 'line') inspect(node.arguments[2], 'skeleton line height');
    }
    ts.forEachChild(node, visit);
  }
  visit(ast);
  return [...issues];
}

export function auditSizeCss(source, file) {
  const issues = [];
  postcss.parse(source).walkDecls(declaration => {
    // Screen-reader-only content deliberately occupies a 1px clipped box.
    const hidden = file.endsWith('/controls.css') && declaration.parent.selector === '.kjun-sr-only';
    if (!hidden && cssDimension.test(declaration.prop) && absolute.test(declaration.value))
      issues.push(`${file}:${declaration.source.start.line} ${declaration.prop}: ${declaration.value}`);
  });
  return issues;
}

export function auditSizeVue(template, file) {
  const issues = [];
  const clean = template.replace(/<!--[\s\S]*?-->/g, '');
  for (const tag of clean.matchAll(/<([\w-]+)\b([^<>]*?)>/g)) {
    if (vectorTags.has(tag[1])) continue;
    for (const attribute of tag[2].matchAll(/(?:^|\s)(:?(?:(?:min-|max-)?(?:width|height)|size|avatar-size|logo-size))="([^"]+)"/g)) {
      const value = attribute[2];
      if (absolute.test(value) || numericSize(value)) issues.push(`${file} ${tag[1]} ${attribute[1]}="${value}"`);
    }
    for (const style of tag[2].matchAll(/(?:^|\s)style="([^"]+)"/g)) issues.push(...auditSizeCss(`a { ${style[1]} }`, file));
  }
  // Include static, conditional and JavaScript-built Tailwind class strings.
  for (const match of clean.matchAll(/\b(?:w|h|min-w|min-h|max-w|max-h|size)-(?:[1-9]\d*(?:\.\d+)?|0\.\d+|\[[^\]]*\d+(?:px|rem)[^\]]*\])\b/g))
    issues.push(`${file} dimension utility: ${match[0]}`);
  return issues;
}

export async function auditPackageSizes(root) {
  const issues = [];
  for (const directory of ['packages/react/src', 'packages/native/src', 'packages/vue2/src', 'packages/tokens/src', 'shared/package-runtime']) {
    for (const entry of await readdir(resolve(root, directory), { recursive: true })) {
      if (!/\.(?:tsx?|js|vue|css)$/.test(entry) || /(?:^|\/)(?:index\.ts|.*\.d\.ts|bindings\.css|typography\.css|color-roles\.ts)$/.test(entry)) continue;
      const file = directory + '/' + entry, source = await readFile(resolve(root, file), 'utf8');
      if (entry.endsWith('.css')) issues.push(...auditSizeCss(source, file));
      else if (entry.endsWith('.vue')) {
        for (const part of source.matchAll(/<script[^>]*>([\s\S]*?)<\/script>/g)) issues.push(...auditSizeScript(part[1], file));
        for (const part of source.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/g)) issues.push(...auditSizeCss(part[1], file));
        for (const part of source.matchAll(/(?::style|v-bind:style)="([^"]*)"/g)) issues.push(...auditSizeScript(`const style = (${part[1]});`, file));
        issues.push(...auditSizeVue(source, file));
      } else issues.push(...auditSizeScript(source, file));
    }
  }
  return [...new Set(issues)];
}

if (process.argv[1] && resolve(process.argv[1]) === resolve(import.meta.filename)) {
  const issues = await auditPackageSizes(resolve(import.meta.dirname, '..'));
  console.log(issues.join('\n') || 'No unclassified absolute component sizes.');
  if (issues.length) process.exitCode = 1;
}
