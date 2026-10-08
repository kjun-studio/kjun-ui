import Vue from 'vue';
import { KjunProvider, DsButton } from '@kjun-ui/vue2';
import { buttonItems, setButtonColors } from './button-design-cases';
setButtonColors();
const vm = new Vue({
  data: () => ({ config: { size: 'md', variant: 'primary', disabled: false, loading: location.search.includes('loading'), block: false }, count: 0 }),
  render(h) {
    return h(KjunProvider, [h('div', { style: { padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' } }, [
      ...buttonItems.map(item => h('div', { attrs: { 'data-testid': item.id }, style: { display: 'flex', gap: '12px', alignItems: 'center', width: '300px', maxWidth: '100%' } }, [
        h(DsButton, { props: { ...this.config, ...item.props }, on: { click: () => this.count++ } }, item.label),
        ...(!this.config.block ? [h(DsButton, { props: { variant: 'ghost', size: this.config.size } }, '취소')] : []),
      ])), h('output', { attrs: { 'data-testid': 'events' } }, String(this.count)),
      h('output', { attrs: { 'data-testid': 'config', hidden: true } }, JSON.stringify(this.config)),
    ])]);
  },
}).$mount('#root');
Object.assign(window, { configureButton: (next: object) => { vm.config = { ...vm.config, ...next }; } });
