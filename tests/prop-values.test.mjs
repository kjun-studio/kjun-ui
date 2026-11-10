import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { collectPropValues, propValuesSource } from '../scripts/prop-values.mjs';
import { requireVue3Package } from '../scripts/vue3-runtime.mjs';

test('every finite Vue prop choice is generated from the current public type', async () => {
  const values = collectPropValues();
  assert.equal(await readFile('packages/vue3/src/prop-values.ts', 'utf8'), propValuesSource(values));
  const ui = requireVue3Package();
  assert.deepEqual(ui.kjunPropValues, values);
  assert.deepEqual(values.KjunButton.size, ['xs', 'sm', 'md', 'lg', 'xl']);
  assert.deepEqual(values.KjunInput.size, ['sm', 'md', 'lg']);
  assert.equal(values.KjunInput.modelValue, undefined);
  assert.equal(values.KjunButton.disabled, undefined);
  assert.equal(values.KjunButton.key, undefined);
  assert.ok(Object.keys(values).length > 60, 'cover all public components with finite choices');
  for (const [name, props] of Object.entries(values)) for (const [prop, allowed] of Object.entries(props)) {
    const option = ui[name].props[prop], label = `${name}.${prop}`;
    assert.equal(typeof option.validator, 'function', label);
    for (const value of allowed) assert.equal(option.validator(value, {}), true, label + '=' + value);
    assert.equal(option.validator('\u0000invalid', {}), false, label);
    // Vue skips optional null/undefined before invoking validators; these are not enumerated choices.
    if (option.default != null) assert.ok(allowed.includes(option.default), label + ' default must be allowed');
    assert.ok(Object.isFrozen(ui.kjunPropValues[name][prop]), label);
  }
  assert.ok(Object.isFrozen(ui.kjunPropValues));
});
