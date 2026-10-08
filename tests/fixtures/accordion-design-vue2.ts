import Vue from 'vue';
import * as K from '@kjun/vue2';
import { accordionConfig, setupAccordionColors } from './accordion-design-data';
setupAccordionColors();
const vm = new Vue({
  data: () => ({ config: { ...accordionConfig } }),
  render(h) {
    return h(K.KjunProvider, [h('main', { style: { padding: '16px' } }, [
      h('div', { attrs: { 'data-testid': 'frame' } }, [h(K.DsAccordion, { props: { tone: this.config.tone, multiple: this.config.multiple } }, [
        h(K.DsAccordionItem, { props: { title: this.config.title, disabled: this.config.disabled } }, this.config.action ? [h(K.DsButton, { props: { variant: 'ghost', size: 'sm' } }, '본문 행동')] : this.config.body),
        h(K.DsAccordionItem, { props: { title: '알림 설정' } }, '알림을 받을 방식을 선택하세요.'),
      ])]),
    ])]);
  },
}).$mount('#root');
Object.assign(window, { configureAccordion: (next: object) => { vm.config = { ...vm.config, ...next }; } });
