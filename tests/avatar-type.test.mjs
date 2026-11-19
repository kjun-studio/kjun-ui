import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { avatarCompactType, avatarType } from '../shared/package-runtime/avatar-type.ts';

const css = readFileSync(new URL('../packages/tokens/src/extensions.css', import.meta.url), 'utf8');
const kebab = (role) => role.replace(/[A-Z]/g, (c) => '-' + c.toLowerCase());
const sizeOf = (selector) => css.match(new RegExp(selector.replace(/[[\]().="]/g, '\\$&') + '\\{[^}]*?font-size:var\\(--_kjun-type-([a-z-]+)-size\\)'))?.[1];

test('Native avatar initials use the type steps Web CSS sets per size', () => {
  for (const [size, role] of Object.entries(avatarType)) {
    const selector = size === 'md' ? '.kjun-avatar .kjun-image-fallback' : `.kjun-avatar[data-size=${size}] .kjun-image-fallback`;
    assert.equal(sizeOf(selector), kebab(role), size);
  }
});

test('Native AvatarGroup overflow uses the Web short and two-digit type steps', () => {
  for (const size of Object.keys(avatarType)) {
    assert.equal(sizeOf(`.kjun-avatar-group[data-size=${size}] .kjun-avatar-group-overflow`), kebab(avatarType[size]), size);
    // Where the compact step equals the short one (xs) CSS writes no separate three-character rule.
    const compact = sizeOf(`.kjun-avatar-group[data-size=${size}] .kjun-avatar-group-overflow[data-digits="2"]`) ?? (avatarCompactType[size] === avatarType[size] ? kebab(avatarType[size]) : undefined);
    assert.equal(compact, kebab(avatarCompactType[size]), size);
  }
});
