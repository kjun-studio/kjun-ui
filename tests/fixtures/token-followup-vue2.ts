import Vue from 'vue';
import * as api from '@kjun/vue2';
import { cssPalette } from './typography-values';
import { selectionSizes, choiceSizes, selectionOptions, tabItems } from './token-followup-common';
cssPalette();
const Cases = Vue.extend({
  data: () => ({ values: {} as Record<string, any> }),
  render(h) {
    const value = (id: string, fallback: any) => this.values[id] ?? fallback;
    const change = (id: string) => (next: any) => this.$set(this.values, id, next);
    const box = (id: string, child: any) => h('div', { key: id, attrs: { 'data-testid': id }, style: { marginBottom: '16px' } }, Array.isArray(child) ? child : [child]);
    return h('div', { style: { padding: '16px' } }, [
      box('empty', h(api.DsEmpty, { props: { text: '빈 상태 제목', description: '빈 상태 설명' } })),
      ...selectionSizes.flatMap(size => ['group', 'filter'].map(family => {
        const id = `${family}-${size}`;
        return box(id, [h(family === 'group' ? api.DsButtonGroup : api.DsFilterGroup, {
          props: { size, options: selectionOptions, value: value(id, 'a'), ariaLabel: id }, on: { input: change(id) },
        }), h('output', value(id, 'a'))]);
      })),
      box('tabs', h(api.DsTabs, { props: { items: tabItems, value: value('tabs', 'a') }, on: { input: change('tabs') } })),
      ...choiceSizes.flatMap(size => [
        box(`checkbox-${size}`, h(api.DsCheckbox, { props: { size, value: value(`checkbox-${size}`, false), label: `선택 ${size}` }, on: { input: change(`checkbox-${size}`) } })),
        box(`switch-${size}`, h(api.DsSwitch, { props: { size, value: value(`switch-${size}`, false), label: `설정 ${size}` }, on: { input: change(`switch-${size}`) } })),
      ]),
      box('input', h(api.DsInput, { props: { value: value('input', ''), ariaLabel: '터치 입력' }, on: { input: change('input') } })),
      box('utilities', [h('span', { class: 'font-medium' }, '중간 굵기'), h('span', { class: 'font-semibold' }, '강조 굵기')]),
    ]);
  },
});
new Vue({ render: h => h(api.KjunProvider, [h(Cases)]) }).$mount('#root');
