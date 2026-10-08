import { test } from 'node:test';
import assert from 'node:assert/strict';
import ts from 'typescript';
import { unionPropTypes } from '../scripts/vue-prop-type.mjs';

const parse = type => ts.createSourceFile('prop.ts', `type Prop = ${type};`, ts.ScriptTarget.Latest, true).statements[0].type;
test('nullable callback props distinguish a nullable return from a nullable function', () => {
  const type = unionPropTypes(['(value: string) => string | null | undefined'], true);
  const node = parse(type);
  assert.ok(ts.isUnionTypeNode(node));
  assert.ok(ts.isParenthesizedTypeNode(node.types[0]));
  assert.ok(ts.isFunctionTypeNode(node.types[0].type));
  assert.equal(node.types[0].type.type.types.length, 3);
  assert.equal(node.types[1].literal.kind, ts.SyntaxKind.NullKeyword);
  assert.equal(unionPropTypes([type], true), type, 'nullable composition is idempotent');
});
test('function and string runtime alternatives remain top-level alternatives', () => {
  const node = parse(unionPropTypes(['(...args: any[]) => any', 'string'], true));
  assert.ok(ts.isUnionTypeNode(node));
  assert.equal(node.types.length, 3);
  assert.ok(ts.isFunctionTypeNode(node.types[0].type));
  assert.equal(node.types[1].kind, ts.SyntaxKind.StringKeyword);
  assert.equal(node.types[2].literal.kind, ts.SyntaxKind.NullKeyword);
  assert.equal(unionPropTypes(['"card" | "compact" | "none"'], true), '"card" | "compact" | "none" | null');
});
