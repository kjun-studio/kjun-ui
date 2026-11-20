import { useState, type ReactNode } from 'react';
// KjunNumberInput cases for React and Native (Vue 3 mirrors this in number-input-vue3.tsx).
// Each section shows the last onValueChange value, the last onChangeCommit value, a button that sets the value to "777"
// and a quick-amount button that sets "50000" without taking the focus.
export const numberInputInitial: Record<string, string> = { disabled: '1234' };
export function NumberInputCases({ K, native = false, providerProps = {} }: { K: any; native?: boolean; providerProps?: Record<string, any> }) {
  const [values, setValues] = useState<Record<string, string>>(numberInputInitial);
  const [commits, setCommits] = useState<Record<string, string>>({});
  const bind = (id: string) => ({
    value: values[id] ?? '',
    onValueChange: (next: string) => setValues(old => ({ ...old, [id]: next })),
    onChangeCommit: (next: string) => setCommits(old => ({ ...old, [id]: next })),
  });
  const section = (id: string, control: ReactNode) => <div data-testid={id} key={id} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
    {control}
    <output data-testid={id + '-value'}>{values[id] ?? ''}</output>
    <output data-testid={id + '-commit'}>{commits[id] ?? ''}</output>
    <button type="button" data-testid={id + '-set'} onClick={() => setValues(old => ({ ...old, [id]: '777' }))}>{id} 777</button>
    {/* A quick-amount button: it keeps the focus in the field, so the value arrives while the edit is still open. */}
    <button type="button" data-testid={id + '-quick'} onMouseDown={event => event.preventDefault()} onClick={() => setValues(old => ({ ...old, [id]: '50000' }))}>{id} 50000</button>
  </div>;
  return <K.KjunProvider {...providerProps}><div style={{ display: 'flex', flexDirection: 'column', gap: 16, padding: 16, width: 360 }}>
    {section('amount', <K.KjunNumberInput {...bind('amount')} format="amount" suffix="원" readingAid max={5000000} ariaLabel="금액" />)}
    {section('percent', <K.KjunNumberInput {...bind('percent')} format="percent" min={-100} max={100} ariaLabel="비율" />)}
    {section('decimals', <K.KjunNumberInput {...bind('decimals')} suffix="kg" decimals={1} ariaLabel="무게" />)}
    {section('prefix', <K.KjunNumberInput {...bind('prefix')} prefix="$" decimals={2} ariaLabel="가격" />)}
    {section('grouped-off', <K.KjunNumberInput {...bind('grouped-off')} grouping={false} ariaLabel="번호" />)}
    {section('in-group', <K.KjunFormGroup label="보낼 금액" hint="잔액 3,420,000원">
      <K.KjunNumberInput {...bind('in-group')} format="amount" suffix="원" readingAid max={3420000} name="amount" />
    </K.KjunFormGroup>)}
    {section('group-error', <K.KjunFormGroup label="한도" error="직접 오류">
      <K.KjunNumberInput {...bind('group-error')} max={10} />
    </K.KjunFormGroup>)}
    {section('end', <K.KjunNumberInput {...bind('end')} format="amount" align="end" ariaLabel="오른쪽 정렬" />)}
    {section('disabled', <K.KjunNumberInput {...bind('disabled')} format="amount" disabled ariaLabel="비활성" />)}
    {section('stepped', <K.KjunNumberInput {...bind('stepped')} step={100} min={2700} max={6500} suffix="K" ariaLabel="색온도" />)}
    {section('reference', native
      ? <K.KjunInput value="1,234" ariaLabel="기준" onChangeText={() => {}} />
      : <K.KjunInput value="1,234" ariaLabel="기준" onValueChange={() => {}} />)}
  </div></K.KjunProvider>;
}
