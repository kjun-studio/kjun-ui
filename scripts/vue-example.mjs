import compiler from 'vue-template-compiler';
import transpile from 'vue-template-es2015-compiler';

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
