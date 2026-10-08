import Vue from 'vue';
import * as api from '@kjun-ui/vue2';
import { cssPalette } from './typography-values';
cssPalette();
const Cases = Vue.extend({
  data: () => ({ checked: false, enabled: false, page: 1, text: '' }),
  render(h) {
    const box = (id: string, child: any) => h('div', { key: id, attrs: { 'data-testid': id }, style: { marginBottom: '20px' } }, [child]);
    return h('div', { style: { padding: '16px' } }, [
      h('div', { attrs: { 'data-testid': 'form' } }, [h(api.DsFormGroup, { props: { label: '입력 검사', hint: '안내 문구' } }, [h(api.DsInput, { props: { value: this.text, ariaLabel: '입력 검사' }, on: { input: (v: string) => this.text = v } })]), h('span', '다음 항목')]),
      box('button', h(api.DsButton, { props: { prefixIcon: 'check' } }, '실행 가능')),
      box('disabled', h(api.DsButton, { props: { disabled: true } }, '실행 불가')),
      box('checkbox', h(api.DsCheckbox, { props: { value: this.checked, size: 'sm', label: '작은 선택' }, on: { input: (v: boolean) => this.checked = v } })),
      box('switch', h(api.DsSwitch, { props: { value: this.enabled, label: '사용 설정' }, on: { input: (v: boolean) => this.enabled = v } })),
      box('signed', h(api.DsSignedValue, { props: { value: 12, tone: 'pill', showFreshness: false } })),
      box('progress', h(api.DsProgressCell, { props: { value: 30 } })),
      box('pagination', h(api.DsPagination, { props: { currentPage: this.page, totalPages: 3 }, on: { change: (v: number) => this.page = v } })),
      h('output', { attrs: { 'data-testid': 'values' } }, `${this.checked}/${this.enabled}/${this.page}`),
    ]);
  },
});
new Vue({ render: h => h(api.KjunProvider, [h(Cases)]) }).$mount('#root');
