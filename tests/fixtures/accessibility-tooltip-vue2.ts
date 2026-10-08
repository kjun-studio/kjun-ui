import Vue from 'vue';
import { KjunProvider, DsButton, DsTooltip } from '@kjun/vue2';
import { setRootValues } from './style-values';
setRootValues();
new Vue({
  data: { content: '이 버튼의 도움말', description: 'consumer-help', swapped: false, mountedTooltip: true },
  mounted() { Object.assign(window, { configureTooltip: (next: object) => Object.assign(this, next) }); },
  render(h) {
    const button = h(DsButton, { key: this.swapped ? 'second' : 'first', attrs: { 'aria-describedby': this.description } }, [this.swapped ? '다른 버튼' : '도움말']);
    return h(KjunProvider, [
      h('p', { attrs: { id: 'consumer-help' } }, '기존 도움말'),
      h('p', { attrs: { id: 'second-help' } }, '새 도움말'),
      this.mountedTooltip ? h(DsTooltip, { props: { content: this.content } }, [button]) : button,
      h('button', { attrs: { id: 'outside' } }, '다음 행동'),
    ]);
  },
}).$mount('#root');
