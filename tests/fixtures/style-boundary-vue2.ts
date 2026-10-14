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
        // An app wrapper that opts form groups into its own flex spacing with the layout attribute.
        h('div', { attrs: { 'data-testid': 'form-layout', 'data-kjun-layout': 'form' }, style: { display: 'flex', flexDirection: 'column', gap: '16px', width: '360px' } }, [
          h('h2', { attrs: { 'data-probe': 'heading' } }, '공지'),
          h('p', { attrs: { 'data-probe': 'paragraph' } }, '본문'),
          h(K.KjunFormGroup, { props: { label: '이름' } }, [h(K.KjunInput, { props: { value: '', ariaLabel: '이름' } })]),
          h(K.KjunFormGroup, { props: { label: '메모' } }, [h(K.KjunInput, { props: { value: '', ariaLabel: '메모' } })]),
        ]),
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
