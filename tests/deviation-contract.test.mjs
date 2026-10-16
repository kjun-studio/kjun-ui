import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { tokens, deviationThresholds, deviationLevel } from '../packages/tokens/dist/index.js';

test('deviation steps are one exported contract', () => {
  assert.deepEqual(deviationThresholds, { neutral: 0.1, medium: 0.5, strong: 1 });
  assert.deepEqual([0, 0.09, -0.1, 0.49, 0.5, -0.99, 1, 3].map(deviationLevel),
    ['neutral', 'neutral', 'low', 'low', 'medium', 'medium', 'strong', 'strong']);
  assert.deepEqual([tokens.states.opacity.deviationLow, tokens.states.opacity.deviationMedium, tokens.states.opacity.deviationStrong], [0.08, 0.14, 0.22]);
});

test('every platform Deviation reads the shared steps instead of its own numbers', async () => {
  for (const file of ['packages/react/src/financial-display.tsx', 'packages/vue3/src/financial-display.tsx', 'packages/native/src/financial-display.tsx']) {
    const source = await readFile(file, 'utf8');
    const deviation = source.slice(source.indexOf('KjunDeviation'), source.indexOf('KjunDeviation') + 4000);
    assert.doesNotMatch(deviation, /abs\s*[<>]=?\s*(?:0\.1|0\.5|1)\b|0\.(?:08|14|22)\b/, file);
    assert.match(deviation, /deviationLevel\(/, file);
  }
});
