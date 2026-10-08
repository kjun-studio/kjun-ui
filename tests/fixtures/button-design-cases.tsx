import { useLayoutEffect, useState, type ComponentType } from 'react';
import { appColors, cssValues } from './style-values';
export const buttonColors = { ...appColors, danger: '#CF3F66', dangerBg: '#FBE1E8', dangerDark: '#AF1F46', dangerActive: '#8F0F36', focusRing: '#4F46E5',
  secondary: '#EEF2F6', buttonSecondary: '#D8E0E8', buttonSecondaryHover: '#C8D0D8', buttonSecondaryActive: '#B8C0C8', textDisabled: '#8899AA' };
export function setButtonColors() {
  for (const [name, value] of Object.entries(cssValues(buttonColors))) document.documentElement.style.setProperty(name, value);
}
export const buttonItems = [
  { id: 'text', label: '변경 사항 저장', props: {} },
  { id: 'prefix', label: '항목 추가', props: { prefixIcon: 'plus' } },
  { id: 'suffix', label: 'Save changes', props: { suffixIcon: 'arrow-right' } },
  { id: 'both', label: '추가하고 이동', props: { prefixIcon: 'plus', suffixIcon: 'arrow-right' } },
  { id: 'icon', label: undefined, props: { prefixIcon: 'plus', ariaLabel: '항목 추가' } },
  { id: 'suffix-icon', label: undefined, props: { suffixIcon: 'arrow-right', ariaLabel: '다음' } },
];
export function ButtonDesignCases({ Button, native = false }: { Button: ComponentType<any>; native?: boolean }) {
  const [config, setConfig] = useState({ size: 'md', variant: 'primary', disabled: false, loading: location.search.includes('loading'), block: false });
  const [count, setCount] = useState(0);
  useLayoutEffect(() => { Object.assign(window, { configureButton: (next: object) => setConfig(old => ({ ...old, ...next })) }); }, []);
  return <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 20 }}>
    {buttonItems.map(item => <div key={item.id} data-testid={item.id} style={{ display: 'flex', gap: 12, alignItems: 'center', width: 300, maxWidth: '100%' }}>
      <Button {...config} {...item.props} {...{ [native ? 'onPress' : 'onClick']: () => setCount(n => n + 1) }}>{item.label}</Button>
      {!config.block && <Button variant="ghost" size={config.size}>취소</Button>}
    </div>)}
    <output data-testid="events">{count}</output>
    <output data-testid="config" hidden>{JSON.stringify(config)}</output>
  </div>;
}
