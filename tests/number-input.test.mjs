import test from 'node:test';
import assert from 'node:assert/strict';
import { build } from 'esbuild';

// number-input.ts reads the message folder, which Node cannot import directly, so the test bundles it.
const output = await build({
  stdin: { contents: "export * from './shared/package-runtime/number-input.ts'; export { resolveMessageScope } from './shared/package-runtime/messages/index.ts';", resolveDir: process.cwd(), loader: 'ts' },
  bundle: true, write: false, format: 'esm', platform: 'node',
});
const {
  addsTooManyDigits, caretAfterEdit, caretForCount, commitNumber, deleteAcrossSeparator, formatNumber, isPasteEdit, numberKeyboard, rangeIssue, rangeMessage, readingAid, resolveMessageScope, resolveNumberInput, sameNumber, sanitizeNumber, significantCount, snapNumber, stepNumber,
} = await import('data:text/javascript;base64,' + Buffer.from(output.outputFiles[0].contents).toString('base64'));

const r = (o = {}) => resolveNumberInput(o);
const en = resolveMessageScope(undefined, 'en');

test('presets and overrides', () => {
  assert.deepEqual(
    (({ grouping, decimals, allowNegative, suffix }) => ({ grouping, decimals, allowNegative, suffix }))(r()),
    { grouping: true, decimals: 0, allowNegative: false, suffix: undefined },
  );
  const p = r({ format: 'percent' });
  assert.deepEqual({ g: p.grouping, d: p.decimals, n: p.allowNegative, s: p.suffix }, { g: false, d: 1, n: true, s: '%' });
  assert.equal(r({ decimals: 9 }).decimals, 6);
  assert.equal(r({ decimals: 2.7 }).decimals, 2);
  assert.equal(r({ decimals: 2 }).maxIntegerDigits, 13);
  assert.equal(r({ suffix: {} }).suffix, undefined);
  assert.equal(r({ format: 'percent', grouping: true }).grouping, true);
  // Only the three formats count; inherited object keys fall back to "number".
  assert.equal(r({ format: 'toString' }).format, 'number');
  assert.equal(r({ format: 'constructor' }).decimals, 0);
});

test('sanitize', () => {
  const amount = r({ format: 'amount' });
  const pct = r({ format: 'percent' });
  assert.equal(sanitizeNumber('₩1,234,000원', amount), '1234000');
  assert.equal(sanitizeNumber(' 12.5 % ', pct), '12.5');
  assert.equal(sanitizeNumber('3.5-', pct), '-3.5');
  assert.equal(sanitizeNumber('--5', pct), '-5');
  assert.equal(sanitizeNumber('-5', amount), '5');
  assert.equal(sanitizeNumber('007', r()), '7');
  assert.equal(sanitizeNumber('0.5', pct), '0.5');
  assert.equal(sanitizeNumber('.5', pct), '0.5');
  assert.equal(sanitizeNumber('12.', pct), '12.');
  assert.equal(sanitizeNumber('1.2.3', pct), '1.2');
  assert.equal(sanitizeNumber('1.27', pct), '1.2');
  assert.equal(sanitizeNumber('1.5', r()), '15');
  assert.equal(sanitizeNumber('1,000ㅁ', r()), '1000');
});

test('paste drops the fraction when no decimals are allowed', () => {
  const amount = r({ format: 'amount' });
  assert.equal(sanitizeNumber('1,234,000.00', amount, { pasted: true }), '1234000');
  assert.equal(sanitizeNumber('₩1,234,000.99원', amount, { pasted: true }), '1234000');
  assert.equal(sanitizeNumber('.5', amount, { pasted: true }), '');
  // A typed "." is still ignored.
  assert.equal(sanitizeNumber('1,234.', amount), '1234');
  assert.equal(sanitizeNumber('12.5', amount), '125');
  // With decimals the paste keeps its fraction as before.
  assert.equal(sanitizeNumber('1,234.567', r({ decimals: 2 }), { pasted: true }), '1234.56');
  assert.equal(isPasteEdit('1', '1.00', 'insertFromPaste'), true);
  assert.equal(isPasteEdit('1', '12', 'insertFromPaste'), true);
  assert.equal(isPasteEdit('', '5', 'insertFromDrop'), true);
  assert.equal(isPasteEdit('1', '12', 'insertText'), false);
  assert.equal(isPasteEdit('1', '123'), true);
  assert.equal(isPasteEdit('1,234', '1,23'), false);
});

test('minus sign and en dash read as minus', () => {
  const pct = r({ format: 'percent' });
  assert.equal(sanitizeNumber('\u22123.5', pct), '-3.5');
  assert.equal(sanitizeNumber('\u20133.5', pct), '-3.5');
  assert.equal(sanitizeNumber('\u22123', r({ format: 'amount' })), '3');
});

test('sameNumber compares an outside value with the draft', () => {
  assert.equal(sameNumber('12.', '12'), true);
  assert.equal(sameNumber('12.50', '12.5'), true);
  assert.equal(sameNumber('', ''), true);
  assert.equal(sameNumber('', '-'), true);
  assert.equal(sameNumber('', '0'), false);
  assert.equal(sameNumber('50000', '12'), false);
  assert.equal(sameNumber('-0', '0'), true);
});

test('integer digit cap', () => {
  assert.equal(sanitizeNumber('1234567890123456', r({ format: 'amount' })), '123456789012345');
  assert.equal(sanitizeNumber('12345678901.5', r({ decimals: 5 })), '1234567890.5');
  assert.equal(sanitizeNumber('12345678901.5', r({ decimals: 6 })), '123456789.5');
  // At the limit a typed digit is refused wherever it goes; removing digits or staying at the limit is not.
  const amount = r({ format: 'amount' });
  assert.equal(addsTooManyDigits('123,456,789,012,345', '1239,456,789,012,345', amount), true);
  assert.equal(addsTooManyDigits('123,456,789,012,345', '123,456,789,012,3459', amount), true);
  assert.equal(addsTooManyDigits('123,456,789,012,345', '123,456,789,012,34', amount), false);
  assert.equal(addsTooManyDigits('12,345', '123,345', amount), false);
  assert.equal(addsTooManyDigits('1,234,567,890,123.45', '123456789012345', r({ decimals: 2 })), true);
});

test('format', () => {
  assert.equal(formatNumber('1234567', r()), '1,234,567');
  assert.equal(formatNumber('-1234.5', r({ decimals: 1, allowNegative: true })), '-1,234.5');
  assert.equal(formatNumber('12345', r({ grouping: false })), '12345');
  assert.equal(formatNumber('12.', r({ decimals: 1 })), '12.');
});

test('commit', () => {
  const two = r({ decimals: 2, allowNegative: true });
  assert.equal(commitNumber('3.5', two), '3.50');
  for (const v of ['-', '']) assert.equal(commitNumber(v, two), '');
  for (const v of ['.', '-.', '0.']) assert.equal(commitNumber(v, two), '0.00');
  assert.equal(commitNumber('-0', two.allowNegative ? r({ allowNegative: true }) : two), '0');
  assert.equal(commitNumber('12.', r()), '12');
  assert.equal(commitNumber('-5', two), '-5.00');
  assert.equal(commitNumber('-0.00', two), '0.00');
  const pct = r({ format: 'percent' });
  // A leading dot types as "0." so ".5" can be entered; with decimals 0 the dot is ignored.
  assert.equal(sanitizeNumber('.', pct), '0.');
  assert.equal(sanitizeNumber('-.', pct), '-0.');
  assert.equal(sanitizeNumber('-.', r({ decimals: 1 })), '0.');
  assert.equal(sanitizeNumber('.', r()), '');
  assert.equal(sanitizeNumber('-', pct), '-');
  assert.equal(commitNumber(sanitizeNumber('.', pct), pct), '0.0');
  assert.equal(commitNumber(sanitizeNumber('-.', pct), pct), '0.0');
  assert.equal(commitNumber(sanitizeNumber('.', r()), r()), '');
  assert.equal(commitNumber('0.', r()), '0');
  assert.equal(commitNumber('-', pct), '');
  assert.equal(sanitizeNumber('.5', pct), '0.5');
});

test('caret keeps the significant count', () => {
  assert.equal(significantCount('1,234,567', 5), 4);
  assert.equal(caretForCount('12,345,678', 4), 5);
  assert.equal(caretForCount('1,234', 0), 0);
});

test('caretAfterEdit reads the caret from the text change alone', () => {
  assert.equal(caretAfterEdit('1,234', '1,2534'), 4);
  assert.equal(caretAfterEdit('1,234', '1,2345'), 6);
  assert.equal(caretAfterEdit('1,234', '91,234'), 1);
  assert.equal(caretAfterEdit('1,234', '1,23'), 4);
  assert.equal(caretAfterEdit('1,234', '1234'), 1);
  assert.equal(caretAfterEdit('1,234', '1,2x34'), 4);
  assert.equal(caretAfterEdit('1,234', '1,7'), 3);
  assert.equal(caretAfterEdit('', '5'), 1);
  assert.equal(caretAfterEdit('11', '111'), 3);
});

test('deleteAcrossSeparator', () => {
  assert.deepEqual(deleteAcrossSeparator('1,234', 2, 2, 'Backspace'), { text: '234', caret: 0 });
  assert.deepEqual(deleteAcrossSeparator('1,234', 1, 1, 'Delete'), { text: '134', caret: 1 });
  assert.equal(deleteAcrossSeparator('1,234', 3, 3, 'Backspace'), null);
  assert.equal(deleteAcrossSeparator('1,234', 0, 3, 'Backspace'), null);
});

test('rangeIssue and its message', () => {
  const pct = r({ format: 'percent', max: 100 });
  const amount = r({ format: 'amount', min: 1000, suffix: '원' });
  assert.equal(rangeIssue('120', pct), 'max');
  assert.equal(rangeIssue('999', amount), 'min');
  assert.equal(rangeIssue('', amount), null);
  assert.equal(rangeIssue('-', amount), null);
  assert.equal(rangeMessage('max', pct), '100% 이하로 입력해 주세요');
  assert.equal(rangeMessage('min', amount), '1,000원 이상 입력해 주세요');
  assert.equal(rangeMessage('min', amount, en), 'Enter 1,000원 or more');
});

test('readingAid', () => {
  const ko = r({ format: 'amount', suffix: '원' });
  assert.equal(readingAid('120035000', ko), '1억 2,003만 5,000 원');
  assert.equal(readingAid('100005000', ko), '1억 5,000 원');
  assert.equal(readingAid('1250000', r()), '125만');
  assert.equal(readingAid('9999', ko), '');
  assert.equal(readingAid('120035000', r({ format: 'percent' })), '');
  assert.equal(readingAid('120035000', ko, en), '');
});

test('numberKeyboard', () => {
  assert.equal(numberKeyboard(r({ format: 'percent' })).inputMode, 'text');
  assert.equal(numberKeyboard(r({ decimals: 1 })).inputMode, 'decimal');
  assert.equal(numberKeyboard(r({ format: 'amount' })).inputMode, 'numeric');
  assert.deepEqual(numberKeyboard(r({ allowNegative: true })), { inputMode: 'text', ios: 'numbers-and-punctuation', android: 'numeric' });
});

test('step resolves to a positive unit at the field decimals', () => {
  assert.equal(r().step, undefined);
  assert.equal(r({ step: 100 }).step, 100);
  assert.equal(r({ step: 0 }).step, undefined);
  assert.equal(r({ step: -5 }).step, undefined);
  assert.equal(r({ step: Number.NaN }).step, undefined);
  // A step finer than the decimals allow rounds to them, and is dropped when it rounds to 0.
  assert.equal(r({ step: 2.5 }).step, 3);
  assert.equal(r({ step: 0.4 }).step, undefined);
  assert.equal(r({ decimals: 1, step: 0.25 }).step, 0.3);
});

test('snapNumber moves a committed value to the nearest step from min, or 0', () => {
  const k = r({ step: 100 });
  assert.equal(snapNumber('4237', k), '4200');
  assert.equal(snapNumber('4250', k), '4300');
  assert.equal(snapNumber('', k), '');
  assert.equal(snapNumber('4237', r()), '4237');
  // Counted from min: 2700 + n * 100.
  assert.equal(snapNumber('4237', r({ step: 100, min: 2750 })), '4250');
  // The range is not enforced: a value past max stays past it.
  assert.equal(snapNumber('6537', r({ step: 100, max: 6500 })), '6500');
  assert.equal(snapNumber('6580', r({ step: 100, max: 6500 })), '6600');
  // Decimals: the value is written padded, with no float noise.
  assert.equal(snapNumber('0.33', r({ decimals: 1, step: 0.1 })), '0.3');
  assert.equal(snapNumber('1.27', r({ decimals: 2, step: 0.05 })), '1.25');
  // Negative values snap when allowed; "-0" is written as "0"; one that cannot be negative goes up a step.
  assert.equal(snapNumber('-7', r({ allowNegative: true, step: 5 })), '-5');
  assert.equal(snapNumber('-2', r({ allowNegative: true, step: 5 })), '0');
  assert.equal(snapNumber('3', r({ step: 10, min: -10 })), '0');
  assert.equal(snapNumber('1', r({ step: 10, min: -25 })), '5');
});

test('stepNumber moves by one step, onto the grid, within range', () => {
  const k = r({ step: 100, min: 2700, max: 6500 });
  assert.equal(stepNumber('4200', 1, k), '4300');
  assert.equal(stepNumber('4200', -1, k), '4100');
  // Between points: the next point in that direction.
  assert.equal(stepNumber('4237', 1, k), '4300');
  assert.equal(stepNumber('4237', -1, k), '4200');
  // Range: kept within min and max, an off-grid max included.
  assert.equal(stepNumber('6500', 1, k), '6500');
  assert.equal(stepNumber('2700', -1, k), '2700');
  assert.equal(stepNumber('9000', -1, k), '6500');
  assert.equal(stepNumber('6450', 1, r({ step: 100, max: 6480 })), '6480');
  // Empty: starts at min, or 0 within range.
  assert.equal(stepNumber('', 1, k), '2700');
  assert.equal(stepNumber('', -1, r({ step: 5 })), '0');
  assert.equal(stepNumber('-', 1, r({ step: 5, min: 10 })), '10');
  // A field that cannot be negative stops at 0; one that can goes below.
  assert.equal(stepNumber('0', -1, r({ step: 5 })), '0');
  assert.equal(stepNumber('0', -1, r({ step: 5, allowNegative: true })), '-5');
  // Decimals and float noise.
  assert.equal(stepNumber('0.2', 1, r({ decimals: 1, step: 0.1 })), '0.3');
  assert.equal(stepNumber('0.3', 1, r({ decimals: 2, step: 0.1 })), '0.40');
  // No step: no stepping.
  assert.equal(stepNumber('5', 1, r()), null);
});
