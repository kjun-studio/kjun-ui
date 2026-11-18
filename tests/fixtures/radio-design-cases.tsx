import { useLayoutEffect, useState } from 'react';
import { demoPalettes } from '../../shared/demo-colors';
import { cssValues } from './style-values';

export const radioColors = demoPalettes[(new URLSearchParams(location.search).get('palette') || 'default') as keyof typeof demoPalettes];
export const radioConfig = { value: 'a', standalone: false, disabled: false, direction: 'horizontal', width: 300,
  // The form section: a RadioGroup and a Checkbox inside FormGroups.
  shipping: null as string | null, agree: false, error: false, size: 'md', groupDisabled: false };
export const radioOptions = [{ value: 'a', label: '사과' }, { value: 'b', label: '배', disabled: true }, { value: 'c', label: '체리' }];
export function setupRadioColors() {
  for (const [key, value] of Object.entries(cssValues(radioColors, 'Arial'))) document.documentElement.style.setProperty(key, value);
  document.body.style.background = radioColors.background;
}
export function RadioDesignCases({ K }: { K: any }) {
  const [config, setConfig] = useState(radioConfig);
  const [events, setEvents] = useState<string[]>([]);
  useLayoutEffect(() => { Object.assign(window, { configureRadio: (next: object) => { setConfig(old => ({ ...old, ...next })); setEvents([]); } }); }, []);
  const change = (value: string) => { setConfig(old => ({ ...old, value })); setEvents(old => [...old, 'value:' + value]); };
  const notify = (value: string) => setEvents(old => [...old, 'change:' + value]);
  return <div style={{ padding: 24, width: config.width, display: 'grid', gap: 24 }}>
    <div data-testid="group"><K.KjunRadioGroup value={config.value} direction={config.direction} ariaLabel="과일"
      options={radioOptions.map(option => ({ ...option, disabled: config.disabled || option.disabled }))}
      onValueChange={change} onChange={notify} /></div>
    <div data-testid="standalone"><K.KjunRadio value={config.standalone} val={true} label="개별 항목" disabled={config.disabled}
      onValueChange={(standalone: boolean) => setConfig(old => ({ ...old, standalone }))} /></div>
    <div data-testid="checkbox"><K.KjunCheckbox value={false} label="체크박스" /></div>
    <form data-testid="form" onSubmit={event => event.preventDefault()}>
      <K.KjunFormGroup label="배송 방법" hint="도착일이 달라집니다." error={config.error ? '배송 방법을 골라 주세요.' : ''}>
        <K.KjunRadioGroup value={config.shipping} name="shipping" size={config.size} disabled={config.groupDisabled} direction="vertical"
          onValueChange={(shipping: string) => setConfig(old => ({ ...old, shipping }))}>
          <K.KjunRadio val="normal" label="일반 배송" description="2~3일 · 무료" />
          <K.KjunRadio val="fast" label="빠른 배송" description="내일 도착" />
        </K.KjunRadioGroup>
      </K.KjunFormGroup>
      <K.KjunFormGroup label="수신 동의" error={config.error ? '동의해 주세요.' : ''}>
        <K.KjunCheckbox value={config.agree} label="마케팅 수신" description="이벤트 소식을 받습니다" name="agree" formValue="yes"
          onValueChange={(agree: boolean) => setConfig(old => ({ ...old, agree }))} />
      </K.KjunFormGroup>
    </form>
    <output data-testid="events">{events.join('|')}</output>
  </div>;
}
