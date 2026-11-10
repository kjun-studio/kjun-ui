import test from 'node:test';
import assert from 'node:assert/strict';
import { build } from 'esbuild';

// KjunColorPicker rules shared by Vue 3, React and Native: commits, the hex and % fields, recent colors, eyedropper, area actions.
const load = async entry => {
  const out = await build({ entryPoints: [entry], bundle: true, write: false, format: 'esm', platform: 'node' });
  return import('data:text/javascript;base64,' + Buffer.from(out.outputFiles[0].contents).toString('base64'));
};
const {
  alphaFieldLive, alphaPercentHex, colorAlphaHex, colorAreaActionKey, colorAreaActions, createCommitSession, eyeDropperSupported, hexFieldCommit, hexFieldLive,
  hexFieldText, nextRecentColors, pickScreenColor, recentColorItems, recentColorLimit,
} = await load('shared/package-runtime/color-picker-model.ts');
const { colorName, createPickerWarnings, initialFocusTarget, pickerSummary, selectedSwatchIndex, swatchItems, thumbOffset, trackFraction } = await load('shared/package-runtime/color-picker.ts');
const { kjunMessagesKo: ko, kjunMessagesEn: en } = await load('shared/package-runtime/messages/index.ts');

test('a commit session reports one change for many moves, and nothing when the value came back', () => {
  let value = '#000000';
  const session = createCommitSession(() => value);
  assert.equal(session.end(), false, 'no session, nothing to commit');
  session.begin(); value = '#111111'; session.begin(); value = '#222222';
  assert.equal(session.end(), true);
  assert.equal(session.end(), false, 'a second end commits nothing');
  session.begin(); value = '#333333'; value = '#222222';
  assert.equal(session.end(), false);
});

test('the hex field changes only on a complete code and keeps the opacity', () => {
  assert.equal(hexFieldText('#3B82F680'), '3B82F6');
  assert.equal(hexFieldText(null), '');
  assert.equal(hexFieldLive('3b8', false, '#000000'), null);
  assert.equal(hexFieldLive('3b82f6', false, '#000000'), '#3B82F6');
  assert.equal(hexFieldLive('3b82f6', true, '#00000080'), '#3B82F680');
  assert.equal(hexFieldLive('3b82f6cc', true, '#00000080'), '#3B82F6CC');
  assert.equal(hexFieldLive('3b8', true, '#00000080'), null, 'a short code waits for the commit');
});

test('the hex field commit expands short codes, reverts bad ones and clears only when clearable', () => {
  assert.equal(hexFieldCommit('3B8', false, '#000000', false), '#33BB88');
  assert.equal(hexFieldCommit('3B8', true, '#00000080', false), '#33BB8880');
  assert.equal(hexFieldCommit('xyz', false, '#000000', false), 'revert');
  assert.equal(hexFieldCommit('', false, '#000000', false), 'revert');
  assert.equal(hexFieldCommit('', false, '#000000', true), null);
});

test('the % field sets the AA of a color and nothing without one', () => {
  assert.equal(alphaPercentHex(80), 'CC');
  assert.equal(alphaPercentHex(0), '00');
  assert.equal(colorAlphaHex('#3B82F680'), '80');
  assert.equal(colorAlphaHex('#3B82F6'), 'FF');
  assert.equal(alphaFieldLive('80', '#3B82F680'), '#3B82F6CC');
  assert.equal(alphaFieldLive('101', '#3B82F680'), null);
  assert.equal(alphaFieldLive('8a', '#3B82F680'), null);
  assert.equal(alphaFieldLive('50', null), null);
});

test('recent colors put the new value first, once, and keep one row', () => {
  assert.equal(recentColorLimit, 8);
  assert.deepEqual(nextRecentColors(['#111111', '#222222'], '#222222', false), ['#222222', '#111111']);
  assert.deepEqual(nextRecentColors([], '#3b82f6', false), ['#3b82f6']);
  assert.equal(nextRecentColors(['#222222', '#111111'], '#222222', false), null, 'already first: no change');
  assert.equal(nextRecentColors(['#111111'], null, false), null, 'no color is not remembered');
  const nine = ['#000001', '#000002', '#000003', '#000004', '#000005', '#000006', '#000007', '#000008'];
  assert.deepEqual(nextRecentColors(nine, '#FFFFFF', false), ['#FFFFFF', ...nine.slice(0, 7)]);
  assert.deepEqual(recentColorItems(['nope', '#fff', { value: '#FFFFFF', label: '흰색' }, { value: '#000', label: '검정' }], false),
    [{ value: '#FFFFFF', label: '#FFFFFF' }, { value: '#000000', label: '검정' }], 'invalid and repeated entries are left out, labels stay');
  assert.deepEqual(nextRecentColors(['#3B82F6'], '#3B82F680', true), ['#3B82F680', '#3B82F6FF']);
});

test('the recent row leaves out colors the swatches already offer', () => {
  const swatches = [{ value: '#EF4444', label: '빨강' }];
  assert.deepEqual(recentColorItems(['#ef4444', '#0EA5E9'], false, swatches).map(i => i.value), ['#0EA5E9']);
  assert.deepEqual(recentColorItems(['#EF4444'], false, swatches), [], 'nothing left: the row is not drawn');
  // Hidden colors stay in the app's list: the next list still carries them.
  assert.deepEqual(nextRecentColors(['#EF4444', '#0EA5E9'], '#7C3AED', false), ['#7C3AED', '#EF4444', '#0EA5E9']);
});

test('the eyedropper exists only with window.EyeDropper and keeps the opacity', async () => {
  assert.equal(eyeDropperSupported(), false);
  assert.equal(await pickScreenColor(false, null), null);
  globalThis.window = { EyeDropper: class { open() { return Promise.resolve({ sRGBHex: '#0ea5e9' }); } } };
  try {
    assert.equal(eyeDropperSupported(), true);
    assert.equal(await pickScreenColor(false, null), '#0EA5E9');
    assert.equal(await pickScreenColor(true, '#00000080'), '#0EA5E980');
    window.EyeDropper = class { open() { return Promise.reject(new DOMException('cancelled', 'AbortError')); } };
    assert.equal(await pickScreenColor(false, null), null, 'cancelling picks nothing');
  } finally {
    delete globalThis.window;
  }
});

test('area actions reach saturation and brightness like the arrow keys', () => {
  const actions = colorAreaActions(ko);
  assert.deepEqual(actions.map(a => a.name), ['increment', 'decrement', 'increaseBrightness', 'decreaseBrightness']);
  assert.deepEqual(actions.map(a => a.label), ['채도 올리기', '채도 내리기', '명도 올리기', '명도 내리기']);
  assert.deepEqual(['increment', 'decrement', 'increaseBrightness', 'decreaseBrightness', 'activate'].map(colorAreaActionKey), ['ArrowRight', 'ArrowLeft', 'ArrowUp', 'ArrowDown', null]);
  assert.equal(en.increaseBrightness, 'Increase brightness');
  assert.equal(ko.recentColors, '최근 사용 색');
  assert.equal(ko.eyeDropper, '화면에서 색 고르기');
});

test('swatch items, selection, summary and first focus are computed once for every platform', () => {
  const swatches = [{ value: '#111111', label: '#111111' }, { value: '#222222', label: '#222222' }];
  assert.deepEqual(swatchItems(swatches, true, '색 없음').map(i => i.value), [null, '#111111', '#222222']);
  assert.equal(selectedSwatchIndex('#222222', swatches, true), 2);
  assert.equal(selectedSwatchIndex(null, swatches, true), 0);
  assert.equal(selectedSwatchIndex(null, swatches, false), -1);
  assert.equal(selectedSwatchIndex('#333333', swatches, false), -1);
  assert.deepEqual(pickerSummary('#3B82F680', true, ko), { hex: '#3B82F6', percent: 50, opacity: 0.5, name: undefined, spoken: '#3B82F6, 투명도 50%' });
  assert.deepEqual(pickerSummary(null, false, ko), { hex: '', percent: undefined, opacity: 1, name: undefined, spoken: '색 없음' });
  // A named swatch names the trigger; the code follows it.
  assert.deepEqual(pickerSummary('#EF4444', false, ko, '빨강'), { hex: '#EF4444', percent: undefined, opacity: 1, name: '빨강', spoken: '빨강, #EF4444' });
  const named = [{ value: '#EF4444', label: '빨강' }, { value: '#22C55E', label: '#22C55E' }];
  assert.equal(colorName('#EF4444', [named]), '빨강');
  assert.equal(colorName('#22C55E', [named]), undefined, 'a label that only repeats the code is no name');
  assert.equal(colorName('#0EA5E9', [[], named]), undefined);
  assert.equal(colorName('#0EA5E9', [[{ value: '#0EA5E9', label: '하늘' }], named]), '하늘', 'recent colors can carry names too');
  assert.equal(colorName(null, [named]), undefined);
  const targets = { swatches: ['s0', 's1'], area: 'area', hex: 'hex' };
  assert.equal(initialFocusTarget(targets, { selected: 1, custom: true, input: true }), 's1');
  assert.equal(initialFocusTarget(targets, { selected: -1, custom: true, input: true }), 'area');
  assert.equal(initialFocusTarget({ ...targets, area: null, swatches: [] }, { selected: -1, custom: false, input: false }), null);
});

test('picker warnings are said once each, only in development', () => {
  const said = [], warn = console.warn, env = process.env.NODE_ENV;
  console.warn = message => said.push(message); process.env.NODE_ENV = 'development';
  try {
    const check = createPickerWarnings();
    for (let i = 0; i < 3; i++) check({ raw: '#3B82F680', alpha: false, swatches: ['nope'], nothing: true });
    check({ raw: '#3B82F6', alpha: false, swatches: [], nothing: false });
    assert.equal(said.length, 3);
    assert.ok(said.every(message => message.startsWith('[KJUN] KjunColorPicker: ')));
  } finally {
    console.warn = warn; process.env.NODE_ENV = env;
  }
});

test('thumbs stay inside their track: the ends sit half a thumb in, and pointers map back the same way', () => {
  // A 216px track with a 20px thumb: the thumb center runs from 10px to 206px.
  assert.equal(thumbOffset(0, 20), 0);
  assert.equal(thumbOffset(1, 20), -20);
  assert.equal(thumbOffset(0.5, 20), -10);
  assert.equal(trackFraction(10, 0, 216, 20), 0);
  assert.equal(trackFraction(206, 0, 216, 20), 1);
  assert.equal(trackFraction(108, 0, 216, 20), 0.5);
  assert.equal(trackFraction(2, 0, 216, 20), 0, 'the half-thumb margin picks the first value');
  assert.equal(trackFraction(500, 0, 216, 20), 1);
  assert.equal(trackFraction(5, 0, 0, 20), 0, 'an unmeasured track reads as the start');
});

test('the area hint reads in both languages', () => {
  assert.equal(ko.colorAreaHint, '여기서 색을 고르세요');
  assert.equal(en.colorAreaHint, 'Pick a color here');
});
