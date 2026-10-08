import ts from 'typescript';
import postcss from 'postcss';

const geometryProperty = /^(?:(?:padding|margin)(?:Top|Bottom|Left|Right|Horizontal|Vertical|Start|End|Block|Inline|BlockStart|BlockEnd|InlineStart|InlineEnd)?|gap|rowGap|columnGap|border(?:TopLeft|TopRight|BottomLeft|BottomRight|StartStart|StartEnd|EndStart|EndEnd)?Radius)$/;
const cssGeometryProperty = /^(?:padding|margin)(?:-[a-z]+)?$|^(?:gap|row-gap|column-gap)$|^border(?:-[a-z]+)*-radius$/;

/** Inspect values, including size maps and conditional branches, rather than matching source text. */
export function auditGeometryScript(source, file) {
  const ast = ts.createSourceFile(file, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  const issues = [];
  function inspect(node, property) {
    if (ts.isNumericLiteral(node) && Number(node.text) !== 0)
      issues.push(`${file}:${ast.getLineAndCharacterOfPosition(node.pos).line + 1} ${property}: ${node.text}`);
    else if (ts.isStringLiteral(node) && /[1-9]\d*(?:\.\d+)?(?:px|rem)\b/.test(node.text))
      issues.push(`${file}:${ast.getLineAndCharacterOfPosition(node.pos).line + 1} ${property}: ${node.text}`);
    else if ((ts.isTemplateExpression(node) || ts.isNoSubstitutionTemplateLiteral(node)) &&
      /[1-9]\d*(?:\.\d+)?(?:px|rem)\b/.test(ts.isTemplateExpression(node) ? [node.head.text, ...node.templateSpans.map(span => span.literal.text)].join(' ') : node.text))
      issues.push(`${file}: literal length in ${property} template`);
    else if (ts.isParenthesizedExpression(node) || ts.isPrefixUnaryExpression(node)) inspect(node.expression ?? node.operand, property);
    else if (ts.isConditionalExpression(node)) { inspect(node.whenTrue, property); inspect(node.whenFalse, property); }
    else if (ts.isElementAccessExpression(node) && ts.isObjectLiteralExpression(node.expression)) {
      for (const item of node.expression.properties) if (ts.isPropertyAssignment(item)) inspect(item.initializer, property);
    }
  }
  function visit(node) {
    if (ts.isPropertyAssignment(node)) {
      const name = node.name.text ?? node.name.getText(ast);
      if (geometryProperty.test(name)) inspect(node.initializer, name);
    }
    ts.forEachChild(node, visit);
  }
  visit(ast);
  return issues;
}

export function auditStateScript(source, file) {
  const ast = ts.createSourceFile(file, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX), issues = [];
  function inspect(node, name) {
    if (ts.isNumericLiteral(node) && Number(node.text) !== 0 && (name !== 'opacity' || Number(node.text) !== 1))
      issues.push(`${file}: literal ${name} ${node.text}`);
    else if (ts.isConditionalExpression(node)) { inspect(node.whenTrue, name); inspect(node.whenFalse, name); }
  }
  function visit(node) {
    if (ts.isPropertyAssignment(node)) {
      const name = node.name.text ?? node.name.getText(ast), value = node.initializer;
      if (/^outline(?:Width|Offset)$/.test(name) || name === 'opacity' && /disabled|blocked|pressed|loading/.test(value.getText(ast))) inspect(value, name);
    }
    ts.forEachChild(node, visit);
  }
  visit(ast); return issues;
}

export function auditGeometryCss(source, file, declared) {
  const issues = [];
  postcss.parse(source).walkDecls(d => {
    // Accessibility hiding uses a 1px box and its cancelling -1px margin.
    const hiddenBox = file.endsWith('/controls.css') && d.parent.selector === '.kjun-sr-only' && d.prop === 'margin' && d.value === '-1px';
    if (!hiddenBox && cssGeometryProperty.test(d.prop) && /(?:^|[\s(])-?[1-9]\d*(?:\.\d+)?(?:px|rem)\b/.test(d.value))
      issues.push(`${file}:${d.source.start.line} ${d.parent.selector} ${d.prop}: ${d.value}`);
    for (const match of d.value.matchAll(/var\((--(?:extension|_kjun-geometry|_kjun-state|_kjun-border)-[\w-]+)/g))
      if (declared && !declared.has(match[1])) issues.push(`${file}: unresolved ${match[1]}`);
    if (/-var\(/.test(d.value)) issues.push(`${file}: invalid negative variable`);
  });
  return issues;
}
