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
        h(K.KjunFeedbackProvider, [h('div', { attrs: { 'data-testid': 'inside-feedback' } }, [app()])]),
        h('span', { attrs: { 'data-testid': 'icon-host' }, style: { color: 'rgb(1, 2, 3)', fontSize: '30px' } }, [h(K.KjunIcon, { props: { name: 'star' } })]),
        h('div', { attrs: { 'data-testid': 'kjun' }, style: { display: 'grid', gap: '16px', width: '360px' } }, [
          h(K.KjunButton, { props: { variant: 'primary' } }, '저장'),
          h(K.KjunInput, { props: { value: '값', ariaLabel: '입력' } }),
          h(K.KjunAlert, { props: { type: 'info', title: '알림' } }, '본문'),
          h(K.KjunCard, { props: { title: '카드' } }, '내용'),
          h(K.KjunModal, { props: { value: true, title: '모달' } }, '모달 본문'),
        ]),
      ]),
    ]);
  },
}).$mount('#root');
