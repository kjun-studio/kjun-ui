import { createApp, defineComponent, reactive } from 'vue';
import * as K from '@kjun-ui/vue3';
import { radioOptions, radioConfig, setupRadioColors } from './radio-design-cases';
setupRadioColors();
const state = reactive({ config: { ...radioConfig } as any, events: [] as string[] });
Object.assign(window, { configureRadio: (next: object) => { state.config = { ...state.config, ...next }; state.events = []; } });
createApp(defineComponent(() => () => {
  const c = state.config;
  return <K.KjunProvider>{{ default: () => (
    <div style={{ padding: '24px', width: c.width + 'px', display: 'grid', gap: '24px' }}>
      <div data-testid="group">
        <K.KjunRadioGroup modelValue={c.value} direction={c.direction} ariaLabel="과일"
          options={radioOptions.map(option => ({ ...option, disabled: c.disabled || option.disabled }))}
          onUpdate:modelValue={(value: any) => { c.value = value; state.events.push('value:' + value); }}
          onChange={(value: any) => state.events.push('change:' + value)} />
      </div>
      <div data-testid="standalone">
        <K.KjunRadio modelValue={c.standalone} val={true} label="개별 항목" disabled={c.disabled} onUpdate:modelValue={(value: any) => { c.standalone = value; }} />
      </div>
      <div data-testid="checkbox"><K.KjunCheckbox modelValue={false} label="체크박스" /></div>
      <output data-testid="events">{state.events.join('|')}</output>
    </div>
  ) }}</K.KjunProvider>;
})).mount('#root');
