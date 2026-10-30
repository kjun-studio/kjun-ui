import { createApp, defineComponent, reactive } from 'vue';
import { KjunProvider, KjunButton, KjunIcon, KjunRefreshButton, KjunTooltip } from '@kjun-ui/vue3';
import { setRootValues } from './style-values';
setRootValues();
const state = reactive({ content: '이 버튼의 도움말', description: 'consumer-help', swapped: false, mountedTooltip: true,
  trigger: 'component', open: undefined as boolean | undefined });
const FragmentTrigger = defineComponent({ inheritAttrs: false, setup: () => () => [<button>Fragment</button>, <span>Other root</span>] });
const TextTrigger = defineComponent({ inheritAttrs: false, setup: () => () => 'Text root' });
const errors: string[] = [];
Object.assign(window, { configureTooltip: (next: object) => Object.assign(state, next), tooltipErrors: errors });
const app = createApp(defineComponent(() => () => {
  const props = { key: state.swapped ? 'second' : 'first', 'aria-describedby': state.description };
  const button = state.trigger === 'fragment' ? <FragmentTrigger {...props} />
    : state.trigger === 'text' ? <TextTrigger {...props} />
    : state.trigger === 'refresh' ? <KjunRefreshButton {...props} tooltip="" />
    : state.trigger === 'icon' ? <KjunIcon {...props} name="info-circle" size={40} role="button" tabindex={0} aria-label="도움말" />
    : state.trigger === 'svg' ? <svg {...props} width="40" height="40" role="button" tabindex={0} aria-label="도움말"><circle cx="20" cy="20" r="10" /></svg>
    : state.trigger === 'element' ? <button {...props}>도움말</button>
    : <KjunButton {...props}>{state.swapped ? '다른 버튼' : '도움말'}</KjunButton>;
  return <KjunProvider>{{ default: () => [
    <p id="consumer-help">기존 도움말</p>,
    <p id="second-help">새 도움말</p>,
    state.mountedTooltip ? <KjunTooltip content={state.content} open={state.open}>{{ default: () => button }}</KjunTooltip> : button,
    <button id="outside">다음 행동</button>,
  ] }}</KjunProvider>;
}));
app.config.errorHandler = error => errors.push(String(error));
app.mount('#root');
