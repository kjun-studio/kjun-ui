import Vue from 'vue';
import * as K from '@kjun-ui/vue2';
import { formConfig, applyDemoColors } from './form-actions-cases';
applyDemoColors('default');
const vm = new Vue({
  data: () => ({ config: { ...formConfig } as any, events: [] as string[] }),
  render(h) {
    const c = this.config, handlers = { confirm: () => this.events.push('confirm'), cancel: () => this.events.push('cancel') };
    const actions = h(K.DsFormActions, { props: c, on: handlers });
    return h(K.KjunProvider, [h('div', { style: { padding: '16px' } }, [
      h('div', { attrs: { 'data-testid': 'container' }, style: { width: c.width + 'px', maxWidth: '100%' } }, [
        c.context === 'bar' ? h(K.DsBottomActionBar, { props: { description: '변경 사항을 저장하세요.' } }, [actions]) : c.context === 'modal'
          ? h(K.DsModal, { props: { value: true, showFooter: true, title: '작업 확인', confirmText: c.confirmText, cancelText: c.cancelText, footerSize: c.size }, on: handlers }, ['내용']) : actions,
      ]),
      h('div', { attrs: { 'data-testid': 'reference' }, style: { marginTop: '24px' } }, [h(K.DsButton, { props: { size: c.size, variant: c.variant } }, c.confirmText)]),
      h('output', { attrs: { 'data-testid': 'events' } }, this.events.join(',')),
      h('output', { attrs: { 'data-testid': 'config', hidden: true } }, JSON.stringify(c)),
    ])]);
  },
}).$mount('#root');
Object.assign(window, { configureActions: (next: object) => { vm.config = { ...vm.config, ...next }; } });
