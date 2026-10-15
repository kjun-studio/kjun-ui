import { compileScript, compileTemplate, parse } from '@vue/compiler-sfc';

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
