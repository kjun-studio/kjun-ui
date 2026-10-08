import { useLayoutEffect, useState } from 'react';
import { applyDemoColors, demoFont, demoPalettes } from '../../shared/demo-colors';

export const menuConfig = { label: '작업 메뉴', disabled: false, loading: false, compact: false, tooltip: '' };
export const menuChoices = [{ value: 'day', label: '일' }, { value: 'week', label: '주' }, { value: 'month', label: '월' }];
export { applyDemoColors, demoFont, demoPalettes };
export const fixtureStyle = { padding: 24, display: 'flex', flexDirection: 'column' as const, gap: 24, alignItems: 'flex-start' };

export function MenuButtonCases({ K, native = false }: { K: any; native?: boolean }) {
  const [config, setConfig] = useState<any>(menuConfig);
  const [events, setEvents] = useState<string[]>([]);
  const record = (event: string) => setEvents(old => [...old, event]);
  useLayoutEffect(() => { Object.assign(window, { configureMenu: (next: object) => setConfig((old: object) => ({ ...old, ...next })) }); }, []);
  return <div style={fixtureStyle}>
    <div data-testid="menu"><K.DsMenuButton {...config} onOpen={() => record('open')} onClose={() => record('close')}>
      <K.DsDropdownItem icon="edit" {...{ [native ? 'onPress' : 'onClick']: () => record('action') }}>수정하기</K.DsDropdownItem>
      <K.DsDropdownItem disabled>비활성 항목</K.DsDropdownItem>
      <K.DsDropdownItem icon="copy">복제하기</K.DsDropdownItem>
    </K.DsMenuButton></div>
    <div data-testid="reference"><K.DsButton size={config.size} variant={config.variant || 'secondary'}
      loading={config.loading} disabled={config.disabled}
      prefixIcon={config.compact || !config.label ? 'dots-vertical' : undefined}
      suffixIcon={!config.compact && config.label ? 'chevron-down' : undefined}>
      {config.compact ? undefined : config.label}
    </K.DsButton></div>
    <div data-testid="group"><K.DsButtonGroup size={config.size} value="week" options={menuChoices} ariaLabel="조회 기간" /></div>
    <button data-testid="outside">바깥 버튼</button>
    <output data-testid="events">{events.join(',')}</output>
    <output data-testid="config" hidden>{JSON.stringify(config)}</output>
  </div>;
}
