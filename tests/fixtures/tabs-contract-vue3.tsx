import { createApp, defineComponent, onMounted, onUnmounted, reactive, ref } from 'vue';
import * as K from '@kjun-ui/vue3';
import { applyDemoColors } from '../../shared/demo-colors';
applyDemoColors('default');
const lifecycle = { mounts: 0, unmounts: 0 };
(window as any).tabLifecycle = lifecycle;
const Editor = defineComponent({ props: { name: { type: String, required: true } }, setup(props) {
  const value = ref('initial'), count = ref(0);
  onMounted(() => lifecycle.mounts++); onUnmounted(() => lifecycle.unmounts++);
  return () => <>
    <K.KjunInput ariaLabel={props.name + ' 초안'} modelValue={value.value} onUpdate:modelValue={(v: string) => value.value = v} />
    <K.KjunButton onClick={() => count.value++}>{props.name + ' 카운터 ' + count.value}</K.KjunButton>
  </>;
} });
const state = reactive({ value: 'one', firstDisabled: false, removeFirst: false, shown: true, menu: true, menus: [] as string[] });
(window as any).configureTabContract = (patch: any) => Object.assign(state, patch);
const menu = (event: { name: string }) => state.menus.push(event.name);
createApp(defineComponent(() => () => <K.KjunProvider>
  <button id="before">앞</button>
  <div data-testid="tabs" data-menu={String(state.menu)}>
    {state.shown && <K.KjunTabs modelValue={state.value} onUpdate:modelValue={(v: string) => state.value = v} onTabMenu={state.menu ? menu : undefined}>
      {!state.removeFirst && <K.KjunTabPane name="one" label="첫 탭" disabled={state.firstDisabled}><Editor name="첫" /></K.KjunTabPane>}
      <K.KjunTabPane name="two" label="둘째 탭"><Editor name="둘째" /></K.KjunTabPane>
      <K.KjunTabPane name="blocked" label="비활성 탭" disabled>비활성 내용</K.KjunTabPane>
    </K.KjunTabs>}
  </div>
  <button id="after">뒤</button><output data-testid="menus">{JSON.stringify(state.menus)}</output>
</K.KjunProvider>)).mount('#root');
