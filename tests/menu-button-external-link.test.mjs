import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { menuButtonChevron, menuButtonIcon } from '../shared/package-runtime/menu-button.ts';
import { externalLinkIconName, safeExternalUrl } from '../shared/package-runtime/external-link.ts';

const read = (path) => readFileSync(new URL('../' + path, import.meta.url), 'utf8');
const platforms = ['react', 'vue3', 'native'];

test('a MenuButton shows the app icon, dots only when nothing else shows, and a chevron only after a visible label', () => {
  assert.equal(menuButtonIcon(undefined, false, '작업'), undefined);
  assert.equal(menuButtonIcon(undefined, true, '작업'), 'dots-vertical');
  assert.equal(menuButtonIcon(undefined, false, undefined), 'dots-vertical');
  assert.equal(menuButtonIcon('plus', false, '추가'), 'plus');
  assert.equal(menuButtonIcon('arrows-sort', true, '정렬'), 'arrows-sort');
  assert.equal(menuButtonChevron(true, false, '작업', false), 'chevron-down');
  assert.equal(menuButtonChevron(true, false, '작업', true), 'chevron-up');
  assert.equal(menuButtonChevron(false, false, '정렬', true), undefined);
  assert.equal(menuButtonChevron(true, true, '작업', false), undefined);
  assert.equal(menuButtonChevron(true, false, undefined, false), undefined);
  for (const platform of platforms) {
    const source = read(`packages/${platform}/src/dropdown.tsx`);
    assert.match(source, /menuButtonIcon\(/, platform);
    assert.match(source, /menuButtonChevron\(/, platform);
  }
  // Like Web, Native wraps the button in a tooltip only when there is one.
  assert.match(read('packages/native/src/dropdown.tsx'), /tooltip \? \(\s*<KjunTooltip/);
});

test('external links open only http(s) URLs, from one shared check', () => {
  assert.equal(safeExternalUrl('https://example.com/docs'), 'https://example.com/docs');
  assert.equal(safeExternalUrl('http://example.com'), 'http://example.com/');
  for (const value of ['javascript:alert(1)', '/relative', 'mailto:a@b.c', '', 'not a url']) assert.equal(safeExternalUrl(value), '', value);
  assert.equal(externalLinkIconName(undefined, '외부 링크'), '외부 링크');
  assert.equal(externalLinkIconName('문서', '외부 링크'), '문서');
  for (const platform of platforms) assert.doesNotMatch(read(`packages/${platform}/src/actions.tsx`), /function safeExternalUrl/, platform);
});

test('a text link is named by its text and the new-window cue; only an icon link takes aria-label and title', () => {
  for (const platform of ['react', 'vue3']) {
    const source = read(`packages/${platform}/src/actions.tsx`);
    assert.match(source, /name = icon \? externalLinkIconName/, platform);
    assert.match(source, /\{!icon && <span (class|className)="kjun-sr-only">\{m(\.value)?\.newWindow\}<\/span>\}/, platform);
    // The plain-text fallback keeps an icon's name as readable text, not as aria-label on a span.
    assert.match(source, /\{name && <span (class|className)="kjun-sr-only">\{name\}<\/span>\}<\/span>/, platform);
    assert.match(source, /event\.stopPropagation\(\); (onClick\?\.\(event\)|emit\("click", event\))/, platform);
  }
  const native = read('packages/native/src/actions.tsx');
  assert.match(native, /const linkName = name \? name \+ m\.newWindow : \(plain !== undefined \? plain \+ m\.newWindow : undefined\)/);
  assert.match(native, /accessibilityHint=\{linkName === undefined \? m\.newWindow\.trim\(\) : undefined\}/);
  assert.match(native, /onPress\?\.\(event\); void openUrl\(url\)/);
  // React passes other anchor attributes through, as Vue's fallthrough does.
  assert.match(read('packages/react/src/actions.tsx'), /KjunExternalLinkProps extends Omit<AnchorHTMLAttributes<HTMLAnchorElement>/);
});

test('a Native text link draws its underline as a 1px line, since Native cannot offset a text underline', () => {
  const native = read('packages/native/src/actions.tsx');
  assert.match(native, /borderBottomWidth: tokens\.border\.defaultWidth, borderColor: colors\.text \}\}>\{content\(text, \{ marginBottom: -tokens\.dimension\.value3 \}\)\}/);
  assert.doesNotMatch(native, /textDecorationLine: "underline"/);
});
