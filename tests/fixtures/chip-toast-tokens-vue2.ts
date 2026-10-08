import Vue from 'vue';
import { KjunProvider, KjunFeedbackProvider, DsChip } from '@kjun-ui/vue2';
import { cssPalette } from './typography-values';
import { chipSizes, toastMessage } from './chip-toast-tokens-common';
cssPalette();
const Cases = Vue.extend({
  inject: ['kjunFeedback'],
  data: () => ({ removed: [] as string[], actions: 0 }),
  render(h) {
    return h('div', { style: { padding: '16px' } }, [
      ...chipSizes.map(size => h('div', { key: size, attrs: { 'data-testid': `chip-${size}` }, style: { display: 'flex', alignItems: 'flex-start' } },
        this.removed.includes(size) ? [] : [h(DsChip, { props: { size, label: `칩 ${size}`, removable: true,
          removeLabel: `삭제 ${size}` }, on: { remove: () => { this.removed.push(size); } } })])),
      h('div', { attrs: { 'data-testid': 'disabled-chip' }, style: { display: 'flex', alignItems: 'flex-start' } }, [h(DsChip, { props: { label: '비활성 칩', removable: true,
        disabled: true, removeLabel: '비활성 삭제' }, on: { remove: () => { this.actions += 100; } } })]),
      h('button', { on: { click: () => (this as any).kjunFeedback.toast.info(toastMessage, { title: '토큰 알림',
        duration: 60000, action: { label: '알림 실행', onClick: () => { this.actions++; } } }) } }, '알림 열기'),
      h('output', { attrs: { 'data-testid': 'removed' } }, this.removed.join(',')),
      h('output', { attrs: { 'data-testid': 'actions' } }, String(this.actions)),
    ]);
  },
});
new Vue({ render: h => h(KjunProvider, [h(KjunFeedbackProvider, [h(Cases)])]) }).$mount('#root');
