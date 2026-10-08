import { useLayoutEffect, useState } from 'react';
import { appColors, cssValues } from './style-values';

export const dropdownColors = { ...appColors, surface: '#FFFFFF', secondary: '#F4F4F5',
  text: '#18181B', textSecondary: '#52525B', border: '#D4D4D8', hover: '#E4E4E7',
  active: '#D4D4D8', selectedBg: '#E0EDFF', focusRing: '#6655DD', brand: '#245CC2',
  danger: '#B42332', dangerBg: '#FCE7EA' };
export const darkDropdownColors = { ...dropdownColors, surface: '#18181B', secondary: '#27272A',
  text: '#FAFAFA', textSecondary: '#A1A1AA', border: '#52525B', hover: '#3F3F46',
  active: '#52525B', selectedBg: '#213A61', focusRing: '#B6A3FF', brand: '#8DB4FF' };
export const longMenuLabel = '현재 작업 공간의 전체 항목을 보관함으로 이동';
export const menuLabel = (long: boolean) => long ? longMenuLabel : '첫 항목';
export function setDropdownColors(dark = false) {
  for (const [key, value] of Object.entries(cssValues(dark ? darkDropdownColors : dropdownColors, 'sans-serif')))
    document.documentElement.style.setProperty(key, value);
}
export const dropdownConfig = { disabled: false, loading: false, long: false, dark: false, mixed: false };
export function DropdownDesignCases({ K, native = false }: { K: any; native?: boolean }) {
  const [config, setConfig] = useState(dropdownConfig);
  const [selected, setSelected] = useState('first');
  const [events, setEvents] = useState(0);
  useLayoutEffect(() => {
    Object.assign(window, { configureDropdown: (next: object) => setConfig(c => ({ ...c, ...next })) });
    setDropdownColors(config.dark);
  }, [config.dark]);
  const action = (value: string) => ({ [native ? 'onPress' : 'onClick']: () => { setSelected(value); setEvents(n => n + 1); } });
  const items = () => <>
    <K.DsDropdownItem selected={selected === 'first'} icon="check" {...action('first')}>{menuLabel(config.long)}</K.DsDropdownItem>
    <K.DsDropdownItem selected={selected === 'second'} icon={config.mixed ? undefined : 'copy'} {...action('second')}>둘째 항목</K.DsDropdownItem>
    <K.DsDropdownDivider />
    <K.DsDropdownItem disabled icon="lock" {...action('disabled')}>비활성 항목</K.DsDropdownItem>
    <K.DsDropdownItem variant="danger" icon="trash" {...action('delete')}>삭제</K.DsDropdownItem>
  </>;
  return <K.KjunProvider {...(native ? { colors: config.dark ? darkDropdownColors : dropdownColors, fontFamily: 'sans-serif' } : {})}>
    <div style={{ padding: 24, display: 'flex', alignItems: 'flex-start', gap: 16, flexWrap: 'wrap' }}>
      <div data-testid="plain"><K.DsDropdown disabled={config.disabled}
        trigger={<K.DsButton variant="secondary" suffixIcon="chevron-down">기본 메뉴</K.DsButton>}>{items()}</K.DsDropdown></div>
      <div data-testid="menu-button"><K.DsMenuButton label="작업 메뉴" disabled={config.disabled} loading={config.loading}>{items()}</K.DsMenuButton></div>
      <div data-testid="button"><K.DsButton variant="secondary">일반 버튼</K.DsButton></div>
      <K.DsButtonGroup value="first" options={[{ value: 'first', label: '첫 항목' }, { value: 'second', label: '둘째 항목' }]} />
      <output data-testid="events">{events}</output>
    </div>
  </K.KjunProvider>;
}
