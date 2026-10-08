import Vue from 'vue';
import { KjunProvider, DsCard, DsButton, DsImage } from '@kjun/vue2';
import { applyDemoColors } from '../../shared/demo-colors';
import { cardMediaSource } from '../../previews/catalog/example-tools';
applyDemoColors('default');
new Vue({
  data: () => ({ options: {} as Record<string, any>, parts: { title: true, custom: false, media: false }, actions: 0 }),
  mounted() { Object.assign(window, { setCardContract: (next: Record<string, any>, content = {}) => { this.options = next; this.parts = { ...this.parts, ...content }; } }); },
  render(h) {
    const slot = (name: string, child: any) => h('template', { slot: name }, [child]);
    return h(KjunProvider, [h('div', { attrs: { 'data-testid': 'contract-card' }, style: { width: '280px', maxWidth: '100%' } }, [
      h(DsCard, { props: { ...this.options, title: this.parts.title ? '카드 제목' : undefined, subtitle: this.parts.title ? '카드 설명' : undefined } }, [
        '카드 본문', slot('footer', '카드 푸터'),
        slot('header-actions', h(DsButton, { props: { size: 'sm' }, on: { click: () => this.actions++ } }, '실행')),
        ...(this.parts.custom ? [slot('header', '사용자 헤더')] : []),
        ...(this.parts.media ? [slot('media', h(DsImage, { props: { src: cardMediaSource, alt: '카드 이미지', aspectRatio: 2.5 } }))] : []),
      ]),
    ]), h('output', { attrs: { 'data-testid': 'actions' } }, String(this.actions))]);
  },
}).$mount('#root');
