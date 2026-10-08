import { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { applyDemoColors, demoPalettes, demoFont } from '../../shared/demo-colors';
export const initialTabs = [
  { name: 'one', label: '첫 탭' }, { name: 'blocked', label: '비활성 탭', disabled: true },
  { name: 'two', label: '둘째 탭' }, { name: 'three', label: '마지막 탭' },
];
export function mount(ui: any, native = false) {
  applyDemoColors('default');
  function App() {
    const [state, update] = useState({ value: 'one', tabs: initialTabs, refuse: false, itemsOnly: false, interactive: false });
    const [events, event] = useState<string[]>([]);
    (window as any).configureTabs = (patch: any) => update(current => ({ ...current, ...patch }));
    const change = (value: string) => { event(current => [...current, value]); if (!state.refuse) update(current => ({ ...current, value })); };
    const { KjunProvider, DsTabs, DsTabPane, DsButton } = ui;
    const group = (secondary = false) => <DsTabs value={secondary ? 'one' : state.value} ariaLabel={secondary ? '두 번째 목록' : '탭 검사'}
      onValueChange={secondary ? undefined : change} items={state.itemsOnly ? state.tabs : undefined}>
      {!state.itemsOnly && state.tabs.map(tab => <DsTabPane key={tab.name} {...tab}>
        {state.interactive ? <DsButton {...(native ? { onPress: () => {} } : { onClick: () => {} })}>패널 행동</DsButton> : '내용 ' + tab.name}
      </DsTabPane>)}
    </DsTabs>;
    return <KjunProvider {...(native ? { colors: demoPalettes.default, fontFamily: demoFont } : {})}>
      <button id="before">앞</button><div style={{ maxWidth: 260 }} data-testid="primary">{group()}</div>
      <button id="after">뒤</button><div data-testid="secondary">{group(true)}</div>
      <output data-testid="events">{JSON.stringify(events)}</output><output data-testid="value">{state.value}</output>
    </KjunProvider>;
  }
  createRoot(document.getElementById('root')!).render(<App />);
}
