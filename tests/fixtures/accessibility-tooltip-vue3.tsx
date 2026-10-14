import { createApp, defineComponent, reactive } from 'vue';
import { KjunProvider, KjunButton, KjunTooltip } from '@kjun-ui/vue3';
import { setRootValues } from './style-values';
setRootValues();
const state = reactive({ content: '이 버튼의 도움말', description: 'consumer-help', swapped: false, mountedTooltip: true });
Object.assign(window, { configureTooltip: (next: object) => Object.assign(state, next) });
createApp(defineComponent(() => () => {
  const button = <KjunButton key={state.swapped ? 'second' : 'first'} aria-describedby={state.description}>{state.swapped ? '다른 버튼' : '도움말'}</KjunButton>;
  return <KjunProvider>{{ default: () => [
    <p id="consumer-help">기존 도움말</p>,
    <p id="second-help">새 도움말</p>,
    state.mountedTooltip ? <KjunTooltip content={state.content}>{{ default: () => button }}</KjunTooltip> : button,
    <button id="outside">다음 행동</button>,
  ] }}</KjunProvider>;
})).mount('#root');
