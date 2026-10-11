import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { rootClassModule } from '../scripts/vue-root-class.mjs';
const compiler = createRequire(import.meta.url)('vue-template-compiler');
const render = template => { const out = compiler.compile(template, { modules: [rootClassModule] }); return [out.render, ...out.staticRenderFns].join("\n"); };

test('every template root, including v-if branches, carries kjun-root', () => {
  assert.match(render('<div class="a"><span class="b"/></div>'), /staticClass:"a kjun-root"/);
  assert.match(render('<button/>'), /staticClass:"kjun-root"/);
  const branches = render('<div v-if="x" class="a"/><span v-else/>');
  assert.match(branches, /staticClass:"a kjun-root"/);
  assert.match(branches, /_c\('span',\{staticClass:"kjun-root"\}\)/);
  assert.doesNotMatch(render('<div><span class="b"/></div>'), /"b kjun-root"/);
});
