import test from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';

// React Native throws "Text strings must be rendered within a <Text>" when an empty string reaches a View,
// and React Native Web hides it in production. Conditions on text-like values must be booleans.
const textName = /(label|title|hint|error|description|prefix|suffix|subtitle|message|icon|text|caption|placeholder)$/i;
const booleanName = /^(show|visible|has|is|can|should)[A-Z]/;
const operandIsText = operand => {
  const name = operand.trim().replace(/^\(+|\)+$/g, '').trim();
  if (name.startsWith('!') || !/^[A-Za-z_$][\w$]*(\??\.[\w$]+)*$/.test(name)) return false;
  const last = name.split(/\??\./).at(-1);
  return textName.test(last) && !booleanName.test(last);
};

test('Native JSX never renders a text-like value through a bare && condition', () => {
  const dir = new URL('../packages/native/src/', import.meta.url), offences = [];
  for (const file of readdirSync(dir).filter(name => name.endsWith('.tsx'))) {
    const source = readFileSync(new URL(file, dir), 'utf8');
    for (const match of source.matchAll(/\{\s*(\(?[^{}&]*?\)?)\s*&&/g)) {
      // Attribute values (={…}) are props, not children.
      if (source.slice(0, match.index).trimEnd().endsWith('=')) continue;
      if (match[1].trim().startsWith('!')) continue; // already a boolean
      const operands = match[1].replace(/^\(|\)$/g, '').split('||');
      if (operands.some(operandIsText)) offences.push(`${file}:${source.slice(0, match.index).split('\n').length} ${match[0]}`);
    }
  }
  assert.deepEqual(offences, []);
});
