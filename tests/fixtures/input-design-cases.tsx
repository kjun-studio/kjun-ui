import { useLayoutEffect, useState, type ComponentType } from 'react';
import { demoPalettes } from '../../shared/demo-colors';
import { cssValues } from './style-values';
export const inputDesignColors = demoPalettes[(new URLSearchParams(location.search).get('palette') || 'default') as keyof typeof demoPalettes];
export function setInputDesignColors() {
  for (const [key, value] of Object.entries(cssValues(inputDesignColors))) document.documentElement.style.setProperty(key, value);
  document.body.style.background = inputDesignColors.background;
  document.documentElement.style.colorScheme = new URLSearchParams(location.search).get('palette') === 'dark' ? 'dark' : 'light';
}
export const designOptions = [{ value: 'team', label: '팀에 공개' }, { value: 'private', label: '나만 보기' }, { value: 'blocked', label: '선택 불가', disabled: true }];
export function InputDesignCases({ K, Affix = 'span', native = false }: { K: any; Affix?: ComponentType<any> | 'span'; native?: boolean }) {
  const [config, setConfig] = useState({ size: 'md', disabled: false, readOnly: false, error: false });
  const [value, setValue] = useState('장기 보유 자산');
  const [changes, setChanges] = useState(0);
  const [selected, setSelected] = useState<string | null>('team');
  const [quantity, setQuantity] = useState(5);
  const [time, setTime] = useState('09:30');
  useLayoutEffect(() => { Object.assign(window, { configureInputDesign: (next: object) => setConfig(old => ({ ...old, ...next })) }); }, []);
  const recordChange = (next: string) => { setChanges(count => count + 1); setValue(next); };
  const change = native ? { onChangeText: recordChange } : { onValueChange: recordChange };
  const text = { value, ...change, ...config };
  return <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 20, maxWidth: 400 }}>
    <div data-testid="input"><K.DsFormGroup label="목록 이름" hint="공유할 이름을 입력하세요." error={config.error ? '이름을 확인해 주세요.' : ''}>
      <K.DsInput {...text} clearable />
    </K.DsFormGroup></div>
    <div data-testid="affix"><K.DsInput {...text} ariaLabel="금액" clearable
      prefix={<Affix style={{ fontSize: 16, color: native ? inputDesignColors.textSecondary : undefined }}>합계 금액</Affix>}
      suffix={<Affix style={{ fontSize: 16, color: native ? inputDesignColors.textSecondary : undefined }}>KRW</Affix>} /></div>
    <div data-testid="textarea"><K.DsTextarea {...text} readonly={native ? config.readOnly : undefined} rows={3} ariaLabel="목록 설명" /></div>
    <div data-testid="select"><K.DsSelect {...config} value={selected} options={designOptions} onValueChange={setSelected} clearable ariaLabel="공개 범위" /></div>
    <div data-testid="combo"><K.DsCombobox {...config} value={selected} options={designOptions} onValueChange={setSelected} clearable ariaLabel="범위 검색" /></div>
    <div data-testid="search"><K.DsSearchInput {...config} value="" onValueChange={() => {}} loadOptions={async () => designOptions} ariaLabel="자산 검색" /></div>
    <div data-testid="date"><K.DsDatePicker {...config} value="2026-09-20" onValueChange={() => {}} ariaLabel="시작일" /></div>
    <div data-testid="quantity"><K.DsQuantityStepper {...config} value={quantity} onValueChange={setQuantity} min={1} max={20} ariaLabel="수량" /></div>
    <div data-testid="time"><K.DsTimePicker {...config} value={time} onValueChange={setTime} ariaLabel="알림 시각" /></div>
    <div data-testid="button"><K.DsButton size={config.size}>저장</K.DsButton></div>
    <div data-testid="skeleton"><K.DsFormSkeleton fields={['목록 이름']} size={config.size} /></div>
    <output data-testid="value">{value}</output>
    <output data-testid="changes">{changes}</output>
  </div>;
}
