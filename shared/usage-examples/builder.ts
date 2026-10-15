import type { PlatformName } from '../demo-config';
import type { Settings, Values } from '../example-registry';

export interface UsageInput { name: string; platform: PlatformName; settings: Settings; values: Values }
export interface UsageExample { code: string; provider: true; domainColors: boolean; feedback: boolean }
export type UsageGenerator = (input: UsageInput) => UsageExample;
export const literal = (value: unknown): string => value === undefined ? 'undefined' : JSON.stringify(value, null, 2)
  .replace(/</g, '\\u003c').replace(/\u2028/g, '\\u2028').replace(/\u2029/g, '\\u2029');
const attribute = (value: string) => value.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/\n/g, ' ');
// Vue attributes are double-quoted, so bound JS uses single-quoted strings instead of &quot; entities.
export const vueCode = (code: string) => {
  let out = '', quote = '';
  for (let i = 0; i < code.length; i++) {
    const c = code[i];
    if (!quote) {
      if (c === '"' || c === "'" || c === '`') quote = c;
      out += c === '"' ? "'" : c;
    } else if (c === '\\') {
      const next = code[++i];
      out += quote === '"' && next === '"' ? '"' : c + next;
    } else if (c === quote) {
      out += quote === '"' ? "'" : c;
      quote = '';
    } else out += quote === '"' && c === "'" ? "\\'" : c;
  }
  return out;
};
const identifier = /^[A-Za-z_$][\w$]*$/;
const vueLiteral = (value: unknown): string => {
  if (Array.isArray(value)) return `[${value.map(item => vueLiteral(item ?? null)).join(', ')}]`;
  if (!value || typeof value !== 'object') return vueCode(literal(value));
  const entries = Object.entries(value).filter(([, item]) => item !== undefined);
  return entries.length ? `{ ${entries.map(([key, item]) => `${identifier.test(key) ? key : vueCode(literal(key))}: ${vueLiteral(item)}`).join(', ')} }` : '{}';
};
const indent = (text: string, spaces = 2) => text.split('\n').map(line => ' '.repeat(spaces) + line).join('\n');
const kebab = (name: string) => name.replace(/[A-Z]/g, c => '-' + c.toLowerCase());
export class Expression { constructor(public code: string) {} }
/** Vue 3 components whose value is v-model (modelValue / update:modelValue). */
export const vueModelComponents = new Set(['KjunInput', 'KjunTextarea', 'KjunCheckbox', 'KjunSwitch', 'KjunRadio', 'KjunRadioGroup', 'KjunButtonGroup', 'KjunFilterGroup',
  'KjunSlider', 'KjunRangeSlider', 'KjunQuantityStepper', 'KjunSelect', 'KjunCombobox', 'KjunSearchInput', 'KjunDatePicker', 'KjunTimePicker', 'KjunTabs']);
class Handler extends Expression {}
export const expr = (code: string) => new Expression(code);

// This authoring helper emits direct package API calls. It is never included in copied code.
export class UsageBuilder {
  readonly vue: boolean;
  readonly native: boolean;
  private imports = new Set<string>();
  private nativeImports = new Set<string>();
  private initial: Values = {};
  private declarations: string[] = [];
  private exposed: string[] = [];
  private methods: string[] = [];
  private setup: string[] = [];
  feedback = false;
  domainColors = false;
  constructor(public input: UsageInput) {
    this.vue = input.platform === 'vue3';
    this.native = input.platform === 'native';
  }
  state(key: string, fallback: unknown) {
    this.initial[key] = Object.prototype.hasOwnProperty.call(this.input.values, key) ? this.input.values[key] : fallback;
    return expr('state.' + key);
  }
  read(key: string) { return 'state.' + key; }
  set(key: string, value: string) {
    return this.vue ? `state.${key} = ${value};` : `setState(state => ({ ...state, ${key}: ${value} }));`;
  }
  update(key: string) {
    return new Handler(this.vue ? `state.${key} = $event` : `value => setState(state => ({ ...state, ${key}: value }))`);
  }
  handler(name: string, args: string, body: string, async = false) {
    this.methods.push(`${async ? 'async ' : ''}function ${name}(${args}) {\n${indent(body)}\n}`);
    return new Handler(name);
  }
  call(handler: Expression, args: string) {
    return new Handler(`${this.vue ? '' : '() => '}${handler.code}(${args})`);
  }
  result(value: string) {
    if (!('result' in this.initial)) this.initial.result = '';
    return this.set('result', value);
  }
  data(name: string, value: unknown) { return this.declare(name, `const ${name} = ${literal(value)};`); }
  declare(name: string, code: string) {
    this.declarations.push(code);
    this.exposed.push(name);
    return expr(name);
  }
  props(...keys: string[]) { return Object.fromEntries(keys.filter(key => key in this.input.settings).map(key => [key, this.input.settings[key]])); }
  nativeTextStyle(fontSize: number, lineHeight: number) {
    this.imports.add('useKjunStyles');
    if (!this.setup.length) this.setup.push('const { colors, fontFamily } = useKjunStyles();');
    return expr(`{ fontFamily, color: colors.textSecondary, fontSize: ${fontSize}, lineHeight: ${lineHeight} }`);
  }
  button(label: string, handler?: Expression, props: Record<string, unknown> = {}) {
    return this.node('KjunButton', { ...props, ...(handler ? { [this.native ? 'onPress' : 'onClick']: handler } : {}) }, this.text(label));
  }
  text(value: string | Expression) {
    const content = value instanceof Expression ? (this.vue ? `{{ ${value.code} }}` : `{${value.code}}`) : this.vue ? attribute(value) : `{${literal(value)}}`;
    if (this.native) { this.nativeImports.add('Text'); return `<Text>${content}</Text>`; }
    return content;
  }
  group(children: string[]) { return this.node(this.native ? 'View' : 'div', {}, children.join('\n')); }
  node(name: string, props: Record<string, unknown> = {}, children = '', slots: Record<string, string> = {}) {
    if (name.startsWith('Kjun')) this.imports.add(name);
    if (['View', 'Text', 'ScrollView'].includes(name)) this.nativeImports.add(name);
    const attributes: string[] = [];
    if (this.vue) {
      // v-model pairs a state value with the update handler that writes it back.
      for (const [valueKey, eventKey, model] of [['value', 'onValueChange', 'v-model'], ['open', 'onOpenChange', 'v-model:open']] as const) {
        const value = props[valueKey], handler = props[eventKey];
        if (value instanceof Expression && handler instanceof Handler && handler.code === `${value.code} = $event` && (valueKey === 'open' || vueModelComponents.has(name))) {
          attributes.push(`${model}="${attribute(vueCode(value.code))}"`);
          props = Object.fromEntries(Object.entries(props).filter(([key]) => key !== valueKey && key !== eventKey));
        }
      }
    }
    for (let [key, value] of Object.entries(props)) {
      if (value === undefined) continue;
      if (this.vue) {
        if (['renderExpand', 'renderCell', 'renderSelectionToolbar'].includes(key)) continue;
        if (key === 'value' && vueModelComponents.has(name)) key = 'modelValue';
        if (value instanceof Handler) {
          const events: Record<string, string> = { onValueChange: vueModelComponents.has(name) ? 'update:model-value' : 'update:value', onOpenChange: 'update:open', onChangeCommit: 'change',
            onSelectionChange: 'update:selected', onExpandedRowsChange: 'update:expanded-rows', onSortChange: 'update:sort', onPageSizeChange: 'update:page-size' };
          if (name === 'KjunPagination') events.onPageChange = 'update:page';
          attributes.push(`@${events[key] || kebab(key.slice(2)).slice(1)}="${attribute(vueCode(value.code))}"`);
        } else if (typeof value === 'string' && !/[\n\r]/.test(value)) attributes.push(`${kebab(key)}="${attribute(value)}"`);
        else attributes.push(`:${kebab(key)}="${attribute(value instanceof Expression ? vueCode(value.code) : vueLiteral(value))}"`);
      } else {
        if (this.native && ['KjunInput', 'KjunTextarea'].includes(name) && key === 'onValueChange') key = 'onChangeText';
        attributes.push(`${key}={${value instanceof Expression ? value.code : literal(value)}}`);
      }
    }
    for (const [slot, content] of Object.entries(slots)) {
      // Vue 3 keeps slot names as written: KJUN slots are camelCase, column slots are cell-<key>.
      if (this.vue) children += `\n<template #${slot}${slot === 'expand' || slot.startsWith('cell-') ? '="{ row }"' : ''}>\n${indent(content)}\n</template>`;
      else if (slot !== 'expand') attributes.push(`${slot}={<>\n${indent(content)}\n</>}`);
    }
    const attributesText = attributes.length ? (attributes.join(' ').length < 100 ? ' ' + attributes.join(' ') : '\n' + indent(attributes.join('\n'))) : '';
    return children ? `<${name}${attributesText}>\n${indent(children)}\n</${name}>` : `<${name}${attributesText} />`;
  }
  finish(content: string): UsageExample {
    if ('result' in this.initial) content = this.group([content, this.node(this.native ? 'Text' : 'output', {}, this.native ? '{state.result}' : this.text(expr('state.result')))]);
    const imports = [...this.imports].join(', '), declarations = this.declarations.join('\n\n');
    let code: string;
    if (this.vue) {
      const vueImports = [Object.keys(this.initial).length ? 'reactive' : ''].filter(Boolean);
      code = `<template>\n${indent(content)}\n</template>\n\n<script setup>\n`;
      if (vueImports.length) code += `import { ${vueImports.join(', ')} } from "vue";\n`;
      code += `import { ${imports}${this.feedback ? ', useKjunFeedback' : ''} } from "@kjun-ui/vue3";\n`;
      if (declarations) code += '\n' + declarations + '\n';
      if (Object.keys(this.initial).length) code += `\nconst state = reactive(${literal(this.initial)});\n`;
      if (this.feedback) code += 'const feedback = useKjunFeedback();\n';
      if (this.methods.length) code += '\n' + this.methods.join('\n\n') + '\n';
      code += '</script>\n';
    } else {
      code = `${Object.keys(this.initial).length ? 'import { useState } from "react";\n' : ''}import { ${imports}${this.feedback ? ', useKjunFeedback' : ''} } from "@kjun-ui/${this.input.platform}";\n`;
      if (this.nativeImports.size) code += `import { ${[...this.nativeImports].join(', ')} } from "react-native";\n`;
      if (declarations) code += '\n' + declarations + '\n';
      code += '\nexport default function Example() {\n';
      if (Object.keys(this.initial).length) code += `  const [state, setState] = useState(${indent(literal(this.initial)).trimStart()});\n`;
      if (this.feedback) code += '  const feedback = useKjunFeedback();\n';
      if (this.setup.length) code += indent(this.setup.join('\n')) + '\n';
      if (this.methods.length) code += indent(this.methods.join('\n')) + '\n';
      code += `  return (\n${indent(content, 4)}\n  );\n}\n`;
    }
    return { code, provider: true, domainColors: this.domainColors, feedback: this.feedback };
  }
}
