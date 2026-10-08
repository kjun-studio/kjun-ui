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
    this.vue = input.platform === 'vue2';
    this.native = input.platform === 'native';
  }
  state(key: string, fallback: unknown) {
    this.initial[key] = Object.prototype.hasOwnProperty.call(this.input.values, key) ? this.input.values[key] : fallback;
    return expr('state.' + key);
  }
  read(key: string) { return (this.vue ? 'this.' : '') + 'state.' + key; }
  set(key: string, value: string) {
    return this.vue ? `this.state.${key} = ${value};` : `setState(state => ({ ...state, ${key}: ${value} }));`;
  }
  update(key: string) {
    return new Handler(this.vue ? `state.${key} = $event` : `value => setState(state => ({ ...state, ${key}: value }))`);
  }
  handler(name: string, args: string, body: string, async = false) {
    this.methods.push(`${async ? 'async ' : ''}${this.vue ? '' : 'function '}${name}(${args}) {\n${indent(body)}\n}`);
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
    return this.node('DsButton', { ...props, ...(handler ? { [this.native ? 'onPress' : 'onClick']: handler } : {}) }, this.text(label));
  }
  text(value: string | Expression) {
    const content = value instanceof Expression ? (this.vue ? `{{ ${value.code} }}` : `{${value.code}}`) : this.vue ? attribute(value) : `{${literal(value)}}`;
    if (this.native) { this.nativeImports.add('Text'); return `<Text>${content}</Text>`; }
    return content;
  }
  group(children: string[]) { return this.node(this.native ? 'View' : 'div', {}, children.join('\n')); }
  node(name: string, props: Record<string, unknown> = {}, children = '', slots: Record<string, string> = {}) {
    if (name.startsWith('Ds')) this.imports.add(name);
    if (['View', 'Text', 'ScrollView'].includes(name)) this.nativeImports.add(name);
    const attributes: string[] = [];
    for (let [key, value] of Object.entries(props)) {
      if (value === undefined) continue;
      if (this.vue) {
        if (key === 'renderExpand') continue;
        if (['DsModal', 'DsDrawer', 'DsPopover'].includes(name) && key === 'open') key = 'value';
        if (name === 'DsInput' && key === 'readOnly') key = 'readonly';
        if (name === 'DsIcon' && key === 'size') value = String(value);
        if (value instanceof Handler) {
          const events: Record<string, string> = { onValueChange: 'input', onOpenChange: name === 'DsSelect' ? 'update:open' : 'input', onChangeCommit: 'change', onSelectionChange: 'selection-change', onExpandedRowsChange: 'update:expandedRows' };
          if (name === 'DsPagination') Object.assign(events, { onPageChange: 'update:currentPage', onPageSizeChange: 'update:page-size' });
          attributes.push(`@${events[key] || kebab(key.slice(2)).slice(1)}="${attribute(vueCode(value.code))}"`);
        } else if (typeof value === 'string' && !/[\n\r]/.test(value)) attributes.push(`${kebab(key)}="${attribute(value)}"`);
        else attributes.push(`:${kebab(key)}="${attribute(value instanceof Expression ? vueCode(value.code) : vueLiteral(value))}"`);
      } else {
        if (this.native && ['DsInput', 'DsTextarea'].includes(name) && key === 'onValueChange') key = 'onChangeText';
        attributes.push(`${key}={${value instanceof Expression ? value.code : literal(value)}}`);
      }
    }
    for (const [slot, content] of Object.entries(slots)) {
      if (this.vue) children += `\n<template #${kebab(slot)}${slot === 'expand' ? '="{ row }"' : ''}>\n${indent(content)}\n</template>`;
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
      code = `<template>\n${indent(content)}\n</template>\n\n<script>\nimport { ${imports} } from "@kjun/vue2";\n`;
      if (declarations) code += '\n' + declarations + '\n';
      code += `\nexport default {\n  components: { ${imports} },\n`;
      if (this.feedback) code += '  inject: ["kjunFeedback"],\n';
      code += `  data() {\n    return { state: ${indent(literal(this.initial), 4).trimStart()}${this.exposed.length ? ', ' + this.exposed.join(', ') : ''} };\n  },\n`;
      if (this.methods.length) code += `  methods: {\n${indent(this.methods.join(',\n'), 4)}\n  },\n`;
      code += '};\n</script>\n';
    } else {
      code = `${Object.keys(this.initial).length ? 'import { useState } from "react";\n' : ''}import { ${imports}${this.feedback ? ', useKjunFeedback' : ''} } from "@kjun/${this.input.platform}";\n`;
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
