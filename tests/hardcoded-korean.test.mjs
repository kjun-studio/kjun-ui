import test from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

// User-facing copy lives in the message packs so KjunProvider locale/messages can replace it.
// Developer console warnings stay Korean (KJUN docs are Korean) and are allowed below.
export const scanned = ['shared/package-runtime', 'packages/react/src', 'packages/vue3/src'];
const packs = new Set(['shared/package-runtime/messages/ko.ts']);
const developerWarning = /console\.(warn|error)\(/;

function files(dir) {
  return readdirSync(dir).flatMap(name => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return files(path);
    return /\.(ts|tsx)$/.test(name) ? [path] : [];
  });
}
// Blank comments but keep line numbers.
const stripComments = source => source
  .replace(/\/\*[\s\S]*?\*\//g, match => match.replace(/[^\n]/g, ' '))
  .replace(/(^|[^:'"`\\])\/\/.*$/gm, '$1');

test('package sources keep user-facing Korean only in the message packs', () => {
  const offences = [];
  for (const file of scanned.flatMap(files)) {
    if (packs.has(file)) continue;
    stripComments(readFileSync(file, 'utf8')).split('\n').forEach((line, index) => {
      if (/[가-힣]/.test(line) && !developerWarning.test(line)) offences.push(`${file}:${index + 1} ${line.trim()}`);
    });
  }
  assert.deepEqual(offences, []);
});
