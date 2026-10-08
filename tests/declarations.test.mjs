import { test } from 'node:test';
import assert from 'node:assert/strict';
import { normalizeDeclaration } from '../scripts/declarations.mjs';

test('declaration AST rewrites imports, re-exports and import types without changing ordinary strings or external packages', () => {
  const input = `import { A } from './a'; export type { B } from '../b';
export * from './folder'; export type C = import('./a').A;
export type D = import('@kjun/tokens').InputSize;
export type Literal = './a'; import React from 'react';`;
  const files = new Set(['/types/src/a.d.ts', '/types/b.d.ts', '/types/src/folder/index.d.ts']);
  for (const extension of ['.js', '.cjs']) {
    const output = normalizeDeclaration(input, '/types/src/index.d.ts', extension, files);
    for (const path of ['./a', '../b', './folder/index']) assert.ok(output.includes('"' + path + extension + '"'));
    assert.ok(output.includes('import("./a' + extension + '").A'));
    assert.ok(output.includes('import("@kjun/tokens").InputSize'));
    assert.match(output, /Literal = ['"]\.\/a['"]/);
    assert.match(output, /from "react"/);
    assert.equal(normalizeDeclaration(output, '/types/src/index.d.ts', extension, files), output);
  }
});
