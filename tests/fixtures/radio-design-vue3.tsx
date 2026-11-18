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
      <form data-testid="form" onSubmit={(event: Event) => event.preventDefault()}>
        <K.KjunFormGroup label="배송 방법" hint="도착일이 달라집니다." error={c.error ? '배송 방법을 골라 주세요.' : ''}>{{ default: () => (
          <K.KjunRadioGroup modelValue={c.shipping} name="shipping" size={c.size} disabled={c.groupDisabled} direction="vertical"
            onUpdate:modelValue={(value: any) => { c.shipping = value; }}>{{ default: () => [
            <K.KjunRadio val="normal" label="일반 배송" description="2~3일 · 무료" />,
            <K.KjunRadio val="fast" label="빠른 배송" description="내일 도착" />,
          ] }}</K.KjunRadioGroup>
        ) }}</K.KjunFormGroup>
        <K.KjunFormGroup label="수신 동의" error={c.error ? '동의해 주세요.' : ''}>{{ default: () => (
          <K.KjunCheckbox modelValue={c.agree} label="마케팅 수신" description="이벤트 소식을 받습니다" name="agree" formValue="yes"
            onUpdate:modelValue={(value: any) => { c.agree = value; }} />
        ) }}</K.KjunFormGroup>
      </form>
      <output data-testid="events">{state.events.join('|')}</output>
    </div>
  ) }}</K.KjunProvider>;
})).mount('#root');
