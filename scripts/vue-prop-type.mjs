import ts from 'typescript';

// Parse each runtime alternative separately: a function's return union belongs
// inside that function, while nullable props need a union outside the function.
export function unionPropTypes(sources, nullable = false) {
  const file = ts.createSourceFile('prop.ts', sources.map((source, i) =>
    `type Prop${i} = ${source};`).join('\n'), ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
  if (file.parseDiagnostics.length) throw Error('Invalid prop type: ' + sources.join(', '));
  const unwrap = node => ts.isParenthesizedTypeNode(node) ? unwrap(node.type) : node;
  const members = file.statements.flatMap(statement => {
    const node = unwrap(statement.type);
    return ts.isUnionTypeNode(node) ? [...node.types] : [node];
  });
  const isNull = node => ts.isLiteralTypeNode(unwrap(node)) && unwrap(node).literal.kind === ts.SyntaxKind.NullKeyword;
  if (nullable && !members.some(isNull)) members.push(ts.factory.createLiteralTypeNode(ts.factory.createNull()));
  const node = members.length === 1 ? members[0] : ts.factory.createUnionTypeNode(members);
  return ts.createPrinter().printNode(ts.EmitHint.Unspecified, node, file);
}
