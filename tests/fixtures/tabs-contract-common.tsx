import { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { applyDemoColors, demoPalettes, demoFont } from '../../shared/demo-colors';
export function mount(ui: any, native = false) {
  applyDemoColors('default');
  const { KjunProvider, DsTabs, DsTabPane, DsButton, DsInput } = ui;
  const lifecycle = { mounts: 0, unmounts: 0 };
  (window as any).tabLifecycle = lifecycle;
  function Editor({ name }: { name: string }) {
    const [value, setValue] = useState('initial'), [count, setCount] = useState(0);
    useEffect(() => { lifecycle.mounts++; return () => { lifecycle.unmounts++; }; }, []);
    return <>
      <DsInput ariaLabel={name + ' 초안'} value={value} {...(native ? { onChangeText: setValue } : { onValueChange: setValue })} />
      <DsButton {...(native ? { onPress: () => setCount(count + 1) } : { onClick: () => setCount(count + 1) })}>{name + ' 카운터 ' + count}</DsButton>
    </>;
  }
  function App() {
    const [state, update] = useState({ value: 'one', firstDisabled: false, removeFirst: false, shown: true, menu: true });
    const [menus, setMenus] = useState<string[]>([]);
    (window as any).configureTabContract = (patch: any) => update(current => ({ ...current, ...patch }));
    const menu = (event: { name: string }) => setMenus(current => [...current, event.name]);
    return <KjunProvider {...(native ? { colors: demoPalettes.default, fontFamily: demoFont } : {})}>
      <button id="before">앞</button>
      <div data-testid="tabs" data-menu={String(state.menu)}>
        {state.shown && <DsTabs value={state.value} onValueChange={(value: string) => update(current => ({ ...current, value }))}
          onTabMenu={state.menu ? menu : undefined}>
          {!state.removeFirst && <DsTabPane name="one" label="첫 탭" disabled={state.firstDisabled}><Editor name="첫" /></DsTabPane>}
          <DsTabPane name="two" label="둘째 탭"><Editor name="둘째" /></DsTabPane>
          <DsTabPane name="blocked" label="비활성 탭" disabled>비활성 내용</DsTabPane>
        </DsTabs>}
      </div>
      <button id="after">뒤</button><output data-testid="menus">{JSON.stringify(menus)}</output>
    </KjunProvider>;
  }
  createRoot(document.getElementById('root')!).render(<App />);
}
