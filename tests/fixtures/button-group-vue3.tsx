import { createApp, defineComponent, reactive } from 'vue';
import { KjunProvider, KjunButtonGroup } from '@kjun-ui/vue3';
import { setRootValues } from './style-values';
setRootValues();
const state = reactive({ value: 'a', accept: true, disabled: false, fullWidth: false, width: 480, size: 'md', dir: 'ltr',
  options: [{ value: 'a', label: '일간' }, { value: 'b', label: '주간' }, { value: 'c', label: '전체 기간' }], events: [] as unknown[] });
Object.assign(window, { configureGroup: (next: object) => Object.assign(state, next) });
createApp(defineComponent(() => () => (
  <KjunProvider>{{ default: () => [
    <div data-testid="frame" dir={state.dir} style={{ width: state.width + 'px', maxWidth: '100%', margin: '24px' }}>
      <KjunButtonGroup modelValue={state.value} disabled={state.disabled} options={state.options} fullWidth={state.fullWidth} size={state.size as never} ariaLabel="Period"
        onUpdate:modelValue={(value: unknown) => { if (state.accept) state.value = value as string; state.events.push(['value', value]); }}
        onChange={(value: unknown) => state.events.push(['change', value])} />
    </div>,
    <output data-testid="value">{String(state.value)}</output>,
    <output data-testid="events">{JSON.stringify(state.events)}</output>,
  ] }}</KjunProvider>
))).mount('#root');
