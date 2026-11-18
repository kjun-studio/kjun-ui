import { createApp, defineComponent, reactive } from 'vue';
import * as K from '@kjun-ui/vue3';
import { applyDemoColors } from '../../shared/demo-colors';
applyDemoColors('default');
// Same sections, testids and DOM as number-input-cases.tsx (React/Native).
const App = defineComponent(() => {
  const values = reactive<Record<string, string>>({ disabled: '1234' }), commits = reactive<Record<string, string>>({});
  const bind = (id: string) => ({
    modelValue: values[id] ?? '',
    'onUpdate:modelValue': (next: string) => { values[id] = next; },
    onChange: (next: string) => { commits[id] = next; },
  });
  const section = (id: string, control: unknown) => <div data-testid={id} key={id} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
    {control}
    <output data-testid={id + '-value'}>{values[id] ?? ''}</output>
    <output data-testid={id + '-commit'}>{commits[id] ?? ''}</output>
    <button type="button" data-testid={id + '-set'} onClick={() => { values[id] = '777'; }}>{id} 777</button>
    <button type="button" data-testid={id + '-quick'} onMousedown={(event: MouseEvent) => event.preventDefault()} onClick={() => { values[id] = '50000'; }}>{id} 50000</button>
  </div>;
  return () => <K.KjunProvider>{{ default: () => <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', padding: '16px', width: '360px' }}>
    {section('amount', <K.KjunNumberInput {...bind('amount')} format="amount" suffix="원" readingAid max={5000000} ariaLabel="금액" />)}
    {section('percent', <K.KjunNumberInput {...bind('percent')} format="percent" min={-100} max={100} ariaLabel="비율" />)}
    {section('decimals', <K.KjunNumberInput {...bind('decimals')} suffix="kg" decimals={1} ariaLabel="무게" />)}
    {section('prefix', <K.KjunNumberInput {...bind('prefix')} prefix="$" decimals={2} ariaLabel="가격" />)}
    {section('grouped-off', <K.KjunNumberInput {...bind('grouped-off')} grouping={false} ariaLabel="번호" />)}
    {section('in-group', <K.KjunFormGroup label="보낼 금액" hint="잔액 3,420,000원">
      {{ default: () => <K.KjunNumberInput {...bind('in-group')} format="amount" suffix="원" readingAid max={3420000} name="amount" /> }}
    </K.KjunFormGroup>)}
    {section('group-error', <K.KjunFormGroup label="한도" error="직접 오류">
      {{ default: () => <K.KjunNumberInput {...bind('group-error')} max={10} /> }}
    </K.KjunFormGroup>)}
    {section('end', <K.KjunNumberInput {...bind('end')} format="amount" align="end" ariaLabel="오른쪽 정렬" />)}
    {section('disabled', <K.KjunNumberInput {...bind('disabled')} format="amount" disabled ariaLabel="비활성" />)}
    {section('reference', <K.KjunInput modelValue="1,234" ariaLabel="기준" />)}
  </div> }}</K.KjunProvider>;
});
createApp(App).mount('#root');
