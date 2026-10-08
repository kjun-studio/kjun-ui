import Vue from 'vue';
import { KjunProvider, DsCard, DsButton, DsBadge } from '@kjun-ui/vue2';
import { applyDemoColors } from '../../shared/demo-colors';
applyDemoColors('default');
new Vue({
  data: () => ({ actions: 0, body: false }),
  render(h) {
    const button = (label: string) => h(DsButton, { on: { click: () => this.actions++ } }, label);
    const badge = () => h(DsBadge, { props: { variant: 'success' } }, '검토 완료');
    const slot = (name: string, children: any) => h('template', { slot: name }, Array.isArray(children) ? children : [children]);
    const box = (id: string, props: any, children: any[] = []) => h('div', { attrs: { 'data-case': id } }, [h(DsCard, { props }, children)]);
    return h(KjunProvider, [h('main', { style: { display: 'grid', gap: '24px', width: '240px', maxWidth: '100%', background: '#f4f4f4' } }, [
      box('short-header', {}, [slot('header', badge()), slot('header-actions', button('상세 보기')), '카드 본문']),
      box('title-only', { title: '제목만 있는 카드', dividers: true }),
      box('media-only', { radius: 'lg' }, [slot('media', h('div', { style: { height: '96px', background: '#7ba796' } }))]),
      box('long-action', {}, [slot('header', badge()), slot('header-actions', button('전체 프로젝트 변경 내역 확인하기')), '카드 본문']),
      box('two-actions', { title: '프로젝트 현황' }, [slot('header-actions', [button('문서 추가'), button('전체 보기')]), '카드 본문']),
      box('actions-only', {}, [slot('header-actions', button('상세 보기')), '카드 본문']),
      box('footer-only', { dividers: true }, [slot('footer', button('저장'))]),
      box('header-footer', { title: '카드 제목', dividers: true }, [slot('footer', button('저장'))]),
      box('empty-fragment', { title: '제목만 있는 카드' }, [h(), '   ']),
      box('body-toggle', { title: '카드 제목' }, this.body ? ['카드 본문'] : []),
      box('zero', {}, ['0']),
    ]), h(DsButton, { on: { click: () => { this.body = !this.body; } } }, '본문 전환'),
    h('output', { attrs: { 'data-testid': 'actions' } }, String(this.actions))]);
  },
}).$mount('#root');
