import { createApp, defineComponent, reactive } from 'vue';
import * as K from '@kjun-ui/vue3';
import { applyDemoColors } from '../../shared/demo-colors';
applyDemoColors('default');
const initialTabs = [
  { name: 'one', label: '첫 탭' }, { name: 'blocked', label: '비활성 탭', disabled: true },
  { name: 'two', label: '둘째 탭' }, { name: 'three', label: '마지막 탭' },
];
const state = reactive({ value: 'one', tabs: initialTabs as any[], refuse: false, itemsOnly: false, interactive: false, events: [] as string[] });
(window as any).configureTabs = (patch: any) => Object.assign(state, patch);
const change = (value: string) => { state.events.push(value); if (!state.refuse) state.value = value; };
const group = (secondary = false) => <K.KjunTabs modelValue={secondary ? 'one' : state.value} ariaLabel={secondary ? '두 번째 목록' : '탭 검사'}
  {...(secondary ? {} : { 'onUpdate:modelValue': change })} items={state.itemsOnly ? state.tabs : undefined}>
  {!state.itemsOnly && state.tabs.map(tab => <K.KjunTabPane key={tab.name} {...tab}>
    {state.interactive ? <K.KjunButton onClick={() => {}}>패널 행동</K.KjunButton> : '내용 ' + tab.name}
  </K.KjunTabPane>)}
</K.KjunTabs>;
createApp(defineComponent(() => () => <K.KjunProvider>
  <button id="before">앞</button><div style={{ maxWidth: '260px' }} data-testid="primary">{group()}</div>
  <button id="after">뒤</button><div data-testid="secondary">{group(true)}</div>
  <output data-testid="events">{JSON.stringify(state.events)}</output><output data-testid="value">{state.value}</output>
</K.KjunProvider>)).mount('#root');
