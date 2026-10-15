import { createApp, defineComponent, reactive } from 'vue';
import * as K from '@kjun-ui/vue3';
import { demoPalettes } from '../../shared/demo-colors';
import { cssValues } from './style-values';
const palette = new URLSearchParams(location.search).get('palette') || 'default';
const colors = demoPalettes[palette as keyof typeof demoPalettes];
for (const [key, value] of Object.entries(cssValues(colors))) document.documentElement.style.setProperty(key, value);
document.body.style.background = colors.background;
document.documentElement.style.colorScheme = palette === 'dark' ? 'dark' : 'light';
const designOptions = [{ value: 'team', label: '팀에 공개' }, { value: 'private', label: '나만 보기' }, { value: 'blocked', label: '선택 불가', disabled: true }];
const s = reactive({ config: { size: 'md', disabled: false, readOnly: false, error: false } as Record<string, any>,
  value: '장기 보유 자산', changes: 0, selected: 'team' as string | null, quantity: 5, time: '09:30' });
Object.assign(window, { configureInputDesign: (next: object) => { s.config = { ...s.config, ...next }; } });
// React components ignore config keys they do not declare; Vue would pass them on as attributes.
const own = (component: any) => Object.fromEntries(Object.entries(s.config).filter(([key]) => key in component.props));
const recordChange = (next: string) => { s.changes++; s.value = next; };
createApp(defineComponent(() => () => {
  const text = (component: any) => ({ ...own(component), modelValue: s.value, 'onUpdate:modelValue': recordChange });
  return <K.KjunProvider><div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '20px', maxWidth: '400px' }}>
    <div data-testid="input"><K.KjunFormGroup label="목록 이름" hint="공유할 이름을 입력하세요." error={s.config.error ? '이름을 확인해 주세요.' : ''}>
      <K.KjunInput {...text(K.KjunInput)} clearable />
    </K.KjunFormGroup></div>
    <div data-testid="affix"><K.KjunInput {...text(K.KjunInput)} ariaLabel="금액" clearable>
      {{ prefix: () => <span style={{ fontSize: '16px' }}>합계 금액</span>, suffix: () => <span style={{ fontSize: '16px' }}>KRW</span> }}
    </K.KjunInput></div>
    <div data-testid="textarea"><K.KjunTextarea {...text(K.KjunTextarea)} rows={3} ariaLabel="목록 설명" /></div>
    <div data-testid="select"><K.KjunSelect {...own(K.KjunSelect)} modelValue={s.selected} options={designOptions} onUpdate:modelValue={(v: any) => { s.selected = v; }} clearable ariaLabel="공개 범위" /></div>
    <div data-testid="combo"><K.KjunCombobox {...own(K.KjunCombobox)} modelValue={s.selected} options={designOptions} onUpdate:modelValue={(v: any) => { s.selected = v; }} clearable ariaLabel="범위 검색" /></div>
    <div data-testid="search"><K.KjunSearchInput {...own(K.KjunSearchInput)} modelValue="" loadOptions={async () => designOptions} ariaLabel="자산 검색" /></div>
    <div data-testid="date"><K.KjunDatePicker {...own(K.KjunDatePicker)} modelValue="2026-09-20" ariaLabel="시작일" /></div>
    <div data-testid="quantity"><K.KjunQuantityStepper {...own(K.KjunQuantityStepper)} modelValue={s.quantity} onUpdate:modelValue={(v: number) => { s.quantity = v; }} min={1} max={20} ariaLabel="수량" /></div>
    <div data-testid="time"><K.KjunTimePicker {...own(K.KjunTimePicker)} modelValue={s.time} onUpdate:modelValue={(v: any) => { s.time = v; }} ariaLabel="알림 시각" /></div>
    <div data-testid="button"><K.KjunButton size={s.config.size}>저장</K.KjunButton></div>
    <div data-testid="skeleton"><K.KjunFormSkeleton fields={['목록 이름']} size={s.config.size} /></div>
    <output data-testid="value">{s.value}</output>
    <output data-testid="changes">{s.changes}</output>
  </div></K.KjunProvider>;
})).mount('#root');
