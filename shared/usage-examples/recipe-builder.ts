import { UsageBuilder, expr, vueCode, type Expression } from './builder';
const attr = (value: string) => vueCode(value).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');

export class RecipeBuilder extends UsageBuilder {
  node(name: string, props: Record<string, unknown> = {}, children = '', slots: Record<string, string> = {}) {
    // Vue 2 style bindings need explicit units; React adds them for dimensional values.
    if (this.vue && props.style && typeof props.style === 'object' && !('code' in props.style)) {
      const unitless = new Set(['flex', 'flexGrow', 'flexShrink', 'opacity', 'zIndex', 'order', 'fontWeight']);
      props = { ...props, style: Object.fromEntries(Object.entries(props.style).map(([key, value]) =>
        [key, typeof value === 'number' && !unitless.has(key) ? value + 'px' : value])) };
    }
    return super.node(name, props, children, slots);
  }
  paragraph(value: string | Expression) {
    return this.native ? this.text(value) : this.node('p', { style: { margin: 0 } }, this.text(value));
  }
  stack(children: string[], gap = 16) {
    return this.node(this.native ? 'View' : 'div', { style: { display: 'flex', flexDirection: 'column', gap } }, children.join('\n'));
  }
  row(children: string[]) {
    return this.node(this.native ? 'View' : 'div', { style: { display: 'flex', flexDirection: 'row', flexWrap: 'wrap', gap: 12 } }, children.join('\n'));
  }
  when(test: string, yes: string, no = '') {
    return this.vue ? `<template v-if="${attr(test)}">\n${yes}\n</template>${no ? `\n<template v-else>\n${no}\n</template>` : ''}`
      : `{${test} ? (\n${yes}\n) : (${no || 'null'})}`;
  }
  each(list: string, item: string, key: string, content: string) {
    return this.vue ? `<div v-for="${attr(item + " in " + list)}" :key="${attr(key)}">\n${content}\n</div>`
      : `{${list}.map(${item} => (\n${this.node(this.native ? 'View' : 'div', { key: expr(key) }, content)}\n))}`;
  }
  field(key: string, fallback: string, label: string, extra: Record<string, unknown> = {}) {
    return this.node('DsInput', { value: this.state(key, fallback), onValueChange: this.update(key), ariaLabel: label, ...extra });
  }
  message(name: string, text: string) { return this.handler(name, '', this.result(JSON.stringify(text))); }
}
