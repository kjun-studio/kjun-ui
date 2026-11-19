import test from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';

// React Native throws "Text strings must be rendered within a <Text>" when an empty string reaches a View,
// and React Native Web hides it in production. Conditions on text-like values must be booleans.
const textName = /(label|title|hint|error|description|desc|prefix|suffix|subtitle|message|icon|text|caption|placeholder|header|footer|leading|trailing|actions|aside|children)$/i;
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

test('Native JSX renders ReactNode slots through content(), never bare or as a || fallback', () => {
  const dir = new URL('../packages/native/src/', import.meta.url), offences = [];
  const slot = '(header|footer|leading|trailing|actions|aside)';
  for (const file of readdirSync(dir).filter(name => name.endsWith('.tsx'))) {
    const source = readFileSync(new URL(file, dir), 'utf8');
    for (const match of source.matchAll(new RegExp(`\\{\\s*${slot}\\s*(\\}|\\|\\|)`, 'g'))) {
      if (source.slice(0, match.index).trimEnd().endsWith('=')) continue;
      offences.push(`${file}:${source.slice(0, match.index).split('\n').length} ${match[0]}`);
    }
  }
  assert.deepEqual(offences, []);
});

// Yoga treats flex: 1 as a zero flex basis, so an auto-sized time segment once ignored its digits and clipped "19" to "·"
// on devices. React Native Web measures the content, so only this source check catches it.
test('Native time segments size to their digits (no zero flex basis around them)', () => {
  const source = readFileSync(new URL('../packages/native/src/time-picker.tsx', import.meta.url), 'utf8');
  const start = source.indexOf('<Pressable ref={view => { segmentViews.current[index]'), end = source.indexOf('</Pressable>', start);
  assert.ok(start > 0 && end > start, 'time segment not found');
  const segment = source.slice(start, end);
  assert.match(segment, /minWidth:\s*geometry\.segmentMinimumWidth/);
  assert.doesNotMatch(segment, /\bflex:\s*1\b|flexBasis:\s*0/);
});

// Per-weight font families resolve where KJUN renders text; a raw Text or TextInput would skip that.
test('Native text renders through the font resolver (KText, FontText, FieldTextInput)', () => {
  const dir = new URL('../packages/native/src/', import.meta.url), offences = [];
  for (const file of readdirSync(dir).filter(name => /\.tsx?$/.test(name) && !['internal.tsx', 'field-surface.ts'].includes(name))) {
    const source = readFileSync(new URL(file, dir), 'utf8');
    // JSX only: a type argument such as useRef<TextInput> is not a render.
    if (/(^|[\s({>])<(Text|TextInput)[\s/>]/m.test(source)) offences.push(file + ': raw Text/TextInput');
    if (/Animated\.Text/.test(source) && !/useResolveFont\(/.test(source)) offences.push(file + ': Animated.Text without useResolveFont');
  }
  assert.deepEqual(offences, []);
});

// A literal space between JSX children is a string child too; React Native throws on it inside a View on devices,
// while React Native Web renders it, so the browser tests never see it.
test('Native JSX never places a literal space such as {" "} between children', () => {
  const dir = new URL('../packages/native/src/', import.meta.url), offences = [];
  for (const file of readdirSync(dir).filter(name => name.endsWith('.tsx'))) {
    const source = readFileSync(new URL(file, dir), 'utf8');
    for (const match of source.matchAll(/\{\s*(["'`])\s*\1\s*\}/g)) {
      if (source.slice(0, match.index).trimEnd().endsWith('=')) continue;
      offences.push(`${file}:${source.slice(0, match.index).split('\n').length} ${match[0]}`);
    }
  }
  assert.deepEqual(offences, []);
});
