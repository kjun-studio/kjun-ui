import ts from 'typescript';
import postcss from 'postcss';

// Follow local constants and size maps, but leave measured/user-supplied values
// and dimension arithmetic (e.g. diameter / 2) to rendered contract tests.
function scriptAudit(source, file, property, invalid) {
  const ast = ts.createSourceFile(file, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  const constants = new Map(), issues = [];
  function collect(node) {
    if (ts.isVariableDeclaration(node) && ts.isIdentifier(node.name) && node.initializer)
      constants.set(node.name.text, node.initializer);
    ts.forEachChild(node, collect);
  }
  collect(ast);
  function inspect(node, name, trail = new Set()) {
    if (ts.isNumericLiteral(node) || ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) {
      if (invalid(node.text, name)) issues.push(`${file}:${ast.getLineAndCharacterOfPosition(node.pos).line + 1} literal ${name}: ${node.text}`);
    } else if (ts.isIdentifier(node) && constants.has(node.text) && !trail.has(node.text)) {
      inspect(constants.get(node.text), name, new Set([...trail, node.text]));
    } else if (ts.isParenthesizedExpression(node) || ts.isPrefixUnaryExpression(node) || ts.isAsExpression(node)) {
      inspect(node.expression ?? node.operand, name, trail);
    } else if (ts.isConditionalExpression(node)) {
      inspect(node.whenTrue, name, trail); inspect(node.whenFalse, name, trail);
    } else if (ts.isElementAccessExpression(node)) inspect(node.expression, name, trail);
    else if (ts.isObjectLiteralExpression(node)) {
      for (const item of node.properties) if (ts.isPropertyAssignment(item)) inspect(item.initializer, name, trail);
    } else if (ts.isArrayLiteralExpression(node)) for (const item of node.elements) inspect(item, name, trail);
  }
  function visit(node) {
    if (ts.isPropertyAssignment(node) || ts.isShorthandPropertyAssignment(node)) {
      const name = node.name.text ?? node.name.getText(ast);
      if (property.test(name)) inspect(ts.isPropertyAssignment(node) ? node.initializer : node.name, name);
    }
    ts.forEachChild(node, visit);
  }
  visit(ast);
  return issues;
}

const typographyLiteral = (value, property) => property === 'fontWeight' || property === 'font-weight'
  ? /^(?:[1-9]\d*|normal|bold|bolder|lighter)$/.test(value)
  : /^-?(?:\d|\.\d)/.test(value) || value === 'normal';
export const auditTypographyScript = (source, file) => scriptAudit(source, file, /^(?:fontSize|lineHeight|fontWeight|letterSpacing)$/, typographyLiteral);

export function auditTypographyCss(source, file) {
  const issues = [];
  postcss.parse(source).walkDecls(d => {
    const literal = /^(?:font-size|line-height)$/.test(d.prop)
      ? /^-?[\d.]+(?:px|rem|em)$/.test(d.value)
      : /^(?:font-weight|letter-spacing)$/.test(d.prop) && typographyLiteral(d.value, d.prop);
    if (literal)
      issues.push(`${file}:${d.source.start.line} literal ${d.prop}: ${d.value}`);
  });
  return issues;
}

const dimension = /^(?:(?:min|max)?(?:Width|Height)|width|height|inlineSize|blockSize|minInlineSize|minBlockSize)$/;
const lengthLiteral = value => /^(?:[1-9]\d*(?:\.\d+)?)(?:px|rem)?$/.test(value);
export const auditControlDimensionsScript = (source, file) => scriptAudit(source, file, dimension, lengthLiteral);
export function auditControlDimensionsCss(source, file) {
  const issues = [];
  postcss.parse(source).walkDecls(d => {
    if (/^(?:(?:min|max)-)?(?:width|height|inline-size|block-size)$/.test(d.prop) && lengthLiteral(d.value))
      issues.push(`${file}:${d.source.start.line} literal ${d.prop}: ${d.value}`);
  });
  return issues;
}

// The minimum touch target exists already; repeating its default bypasses it.
export const auditTouchTargetScript = (source, file) => scriptAudit(source, file, /^min(?:Width|Height|InlineSize|BlockSize)$/, value => /^(?:44)(?:px|rem)?$/.test(value));
export function auditTouchTargetCss(source, file) {
  const issues = [];
  postcss.parse(source).walkDecls(d => {
    if (/^min-(?:width|height|inline-size|block-size)$/.test(d.prop) && d.value === '44px')
      issues.push(`${file}:${d.source.start.line} literal minimum touch target`);
  });
  return issues;
}
