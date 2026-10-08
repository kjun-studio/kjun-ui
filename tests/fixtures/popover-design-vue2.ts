import Vue from 'vue';
import * as K from '@kjun/vue2';
import { popoverConfig, setupPopoverColors } from './popover-design-data';
setupPopoverColors();
const vm = new Vue({
  data: () => ({ config: { ...popoverConfig }, open: false }),
  render(h) {
    const c = this.config;
    return h(K.KjunProvider, [h('main', [
      h('div', { attrs: { 'data-testid': 'anchor' }, style: { position: 'absolute', left: c.left + 'px', top: c.top + 'px', width: c.width + 'px' } }, [
        h(K.DsPopover, { props: { manualTrigger: true, value: this.open, ariaLabel: '팝오버 디자인', placement: c.placement, noPadding: c.noPadding, matchTriggerWidth: c.matchTriggerWidth, maxHeight: c.maxHeight + 'px', focusOnOpen: true }, on: { input: (value: boolean) => { this.open = value; } } }, [
          h(K.DsButton, { slot: 'trigger', props: { block: true, variant: 'ghost' }, on: { click: () => { this.open = !this.open; } } }, '팝오버 열기'), c.text,
        ]),
      ]),
      h('output', { attrs: { 'data-testid': 'open' } }, String(this.open)),
    ])]);
  },
}).$mount('#root');
Object.assign(window, { configurePopover: async (next: object) => { vm.config = { ...vm.config, ...next }; await Vue.nextTick(); } });
