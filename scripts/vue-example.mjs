import compiler from 'vue-template-compiler';
import transpile from 'vue-template-es2015-compiler';
import { compileScript, compileTemplate, parse } from '@vue/compiler-sfc';

// Use the same compiler and render-function transpiler as the package build.
// Executing only script content would leave valid-looking SFC exports unrendered.
export function compileVueExample(code, name) {
  const sfc = compiler.parseComponent(code);
  if (!sfc.script || sfc.errors?.length) throw Error(`Invalid Vue SFC: ${name}`);
  if (!sfc.template) return sfc.script.content;
  const compiled = compiler.compile(sfc.template.content, { whitespace: 'condense' });
  if (compiled.errors.length) throw Error(`Invalid Vue template: ${name}\n${compiled.errors.join('\n')}`);
  const render = transpile('var render = function(){' + compiled.render + '};var staticRenderFns=[' + compiled.staticRenderFns.map(s => 'function(){' + s + '}').join(',') + '];');
  return sfc.script.content.replace('export default', 'const __component =') + '\n' + render +
    '\n__component.render = render;\n__component.staticRenderFns = staticRenderFns;\nexport default __component;';
}

// Vue 3 examples are SFCs (<script setup> or a render-function <script>), compiled like a Vite app would.
export function compileVue3Example(code, name) {
  const { descriptor, errors } = parse(code, { filename: name + '.vue' });
  if (errors.length || !(descriptor.script || descriptor.scriptSetup)) throw Error(`Invalid Vue SFC: ${name}\n${errors.join('\n')}`);
  if (descriptor.scriptSetup) return compileScript(descriptor, { id: name, inlineTemplate: true }).content;
  if (!descriptor.template) return descriptor.script.content;
  const template = compileTemplate({ source: descriptor.template.content, filename: name + '.vue', id: name });
  if (template.errors.length) throw Error(`Invalid Vue template: ${name}\n${template.errors.join('\n')}`);
  return descriptor.script.content.replace('export default', 'const __component =') + '\n' + template.code +
    '\n__component.render = render;\nexport default __component;';
}
