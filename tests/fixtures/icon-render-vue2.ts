import Vue from 'vue';
import * as K from '@kjun/vue2';
import { allIcons } from '@kjun/icons/all';
import { setup } from './icon-toggle-values';
setup();
const cases = Object.entries(allIcons).flatMap(([name, icon]) => [{ name, filled: false }, ...(icon.filled ? [{ name, filled: true }] : [])]);
const vm = new Vue({ data: () => ({ offset: 0 }), render(h) {
  return h(K.KjunProvider, { props: { icons: allIcons } }, [h('div', { attrs: { 'data-testid': 'icon-batch', 'data-offset': this.offset }, style: { display: 'flex', flexWrap: 'wrap', gap: '8px' } },
    cases.slice(this.offset, this.offset + 120).map(({ name, filled }) => h('div', { key: name + filled, attrs: { 'data-icon': name, 'data-filled': String(filled) } }, [h(K.DsIcon, { props: { name, filled, size: '24px' } })])))]);
} }).$mount('#root');
Object.assign(window, { renderIconBatch: (offset: number) => { vm.offset = offset; } });
