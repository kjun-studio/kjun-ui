import Vue from 'vue';
import * as K from '@kjun-ui/vue2';
import { applyDemoColors } from '../../shared/demo-colors';
import { appHtml, installAppCss } from './style-boundary-cases';
applyDemoColors('default');
installAppCss();
new Vue({
  render(h) {
    const app = () => h('div', { domProps: { innerHTML: appHtml } });
    return h('div', [
      h('div', { attrs: { 'data-testid': 'outside' } }, [app()]),
      h(K.KjunProvider, [
        h('div', { attrs: { 'data-testid': 'inside' } }, [app()]),
        h('div', { attrs: { 'data-testid': 'kjun' }, style: { display: 'grid', gap: '16px', width: '360px' } }, [
          h(K.DsButton, { props: { variant: 'primary' } }, '저장'),
          h(K.DsInput, { props: { value: '값', ariaLabel: '입력' } }),
          h(K.DsAlert, { props: { type: 'info', title: '알림' } }, '본문'),
          h(K.DsCard, { props: { title: '카드' } }, '내용'),
          h(K.DsModal, { props: { value: true, title: '모달' } }, '모달 본문'),
        ]),
      ]),
    ]);
  },
}).$mount('#root');
