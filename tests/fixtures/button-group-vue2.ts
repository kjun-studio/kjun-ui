import Vue from 'vue';
import { KjunProvider, DsButtonGroup } from '@kjun-ui/vue2';
import { setRootValues } from './style-values';
setRootValues();
const vm = new Vue({
  data: () => ({ value: 'a', accept: true, disabled: false, fullWidth: false, width: 480, size: 'md', dir: 'ltr',
    options: [{ value: 'a', label: '일간' }, { value: 'b', label: '주간' }, { value: 'c', label: '전체 기간' }], events: [] as unknown[] }),
  render(h) {
    return h(KjunProvider, [h('div', { attrs: { 'data-testid': 'frame', dir: this.dir }, style: { width: this.width + 'px', maxWidth: '100%', margin: '24px' } }, [
      h(DsButtonGroup, { props: { value: this.value, disabled: this.disabled, options: this.options, fullWidth: this.fullWidth, size: this.size, ariaLabel: 'Period' },
        on: { input: (value: string) => { if (this.accept) this.value = value; this.events.push(['value', value]); }, change: (value: string) => this.events.push(['change', value]) },
      }),
    ]), h('output', { attrs: { 'data-testid': 'value' } }, String(this.value)), h('output', { attrs: { 'data-testid': 'events' } }, JSON.stringify(this.events))]);
  },
}).$mount('#root');
Object.assign(window, { configureGroup: (next: object) => Object.assign(vm, next) });
