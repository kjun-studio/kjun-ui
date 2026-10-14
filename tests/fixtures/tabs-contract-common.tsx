import { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { applyDemoColors, demoPalettes, demoFont } from '../../shared/demo-colors';
export function mount(ui: any, native = false) {
  applyDemoColors('default');
  const { KjunProvider, KjunTabs, KjunTabPane, KjunButton, KjunInput } = ui;
  const lifecycle = { mounts: 0, unmounts: 0 };
  (window as any).tabLifecycle = lifecycle;
  function Editor({ name }: { name: string }) {
    const [value, setValue] = useState('initial'), [count, setCount] = useState(0);
    useEffect(() => { lifecycle.mounts++; return () => { lifecycle.unmounts++; }; }, []);
    return <>
      <KjunInput ariaLabel={name + ' 초안'} value={value} {...(native ? { onChangeText: setValue } : { onValueChange: setValue })} />
      <KjunButton {...(native ? { onPress: () => setCount(count + 1) } : { onClick: () => setCount(count + 1) })}>{name + ' 카운터 ' + count}</KjunButton>
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
        {state.shown && <KjunTabs value={state.value} onValueChange={(value: string) => update(current => ({ ...current, value }))}
          onTabMenu={state.menu ? menu : undefined}>
          {!state.removeFirst && <KjunTabPane name="one" label="첫 탭" disabled={state.firstDisabled}><Editor name="첫" /></KjunTabPane>}
          <KjunTabPane name="two" label="둘째 탭"><Editor name="둘째" /></KjunTabPane>
          <KjunTabPane name="blocked" label="비활성 탭" disabled>비활성 내용</KjunTabPane>
        </KjunTabs>}
      </div>
      <button id="after">뒤</button><output data-testid="menus">{JSON.stringify(menus)}</output>
    </KjunProvider>;
  }
  createRoot(document.getElementById('root')!).render(<App />);
}
