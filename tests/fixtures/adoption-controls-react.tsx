import { createRoot } from 'react-dom/client';
import { forwardRef, useLayoutEffect, useRef, useState, type ComponentProps } from 'react';
import { KjunProvider, KjunTabs, KjunTabPane, KjunSelect, KjunDropdown, KjunDropdownItem,
  KjunPopover, KjunTooltip, KjunButton, KjunCheckbox, KjunSlider, KjunRangeSlider } from '@kjun-ui/react';
import { applyDemoColors } from '../../shared/demo-colors';

const query = new URLSearchParams(location.search);
function useConfig<T extends object>(initial: T) {
  const [config, setConfig] = useState(initial);
  useLayoutEffect(() => { Object.assign(window, {
    configureAdoptionControls: (next: Partial<T>) => setConfig(old => ({ ...old, ...next })),
  }); }, []);
  return [config, setConfig] as const;
}
function TabsCase({ nested = false }: { nested?: boolean }) {
  const [tab, setTab] = useState('first'), [value, setValue] = useState('one');
  const [showActions, setShowActions] = useState(true), [menuCount, setMenuCount] = useState(0);
  const actions = <div data-testid="actions" style={{ display: 'flex', gap: 8 }}>
    <KjunSelect ariaLabel="작업 필터" value={value} options={['one', 'two']} onValueChange={next => setValue(String(next))} />
    <KjunDropdown trigger={<KjunButton>작업 메뉴</KjunButton>}>
      <KjunDropdownItem onClick={() => setMenuCount(n => n + 1)}>실행</KjunDropdownItem>
    </KjunDropdown>
  </div>;
  const tabs = <KjunTabs value={tab} onValueChange={setTab} ariaLabel="작업 탭" actions={showActions ? actions : undefined}>
    <KjunTabPane name="first" label="첫 탭"><p>첫 내용</p></KjunTabPane>
    <KjunTabPane name="second" label="둘째 탭"><p>둘째 내용</p></KjunTabPane>
  </KjunTabs>;
  return <>
    {nested ? <KjunTabs value="outer" ariaLabel="바깥 탭">
      <KjunTabPane name="outer" label="바깥">{tabs}</KjunTabPane>
    </KjunTabs> : tabs}
    <button onClick={() => setShowActions(old => !old)}>도구 모음 전환</button>
    <output data-testid="selection">{value}</output><output data-testid="menu-count">{menuCount}</output>
  </>;
}
const CustomButton = forwardRef<HTMLButtonElement, ComponentProps<'button'>>((props, ref) => <button {...props} ref={ref} />);
function PopoverCase() {
  const [config, setConfig] = useConfig({ open: false, controlled: false, manual: false, disabled: false });
  const [clicks, setClicks] = useState(0), [changes, setChanges] = useState<boolean[]>([]);
  const ref = useRef<HTMLButtonElement>(null);
  useLayoutEffect(() => { Object.assign(window, { adoptionTriggerRef: ref }); });
  const props = { ref, id: 'original-trigger', disabled: config.disabled, onClick: () => setClicks(n => n + 1), children: '열기' };
  const kind = query.get('kind');
  let trigger = kind === 'kjun' ? <KjunButton {...props} tooltip="버튼 설명" /> :
    kind === 'custom' ? <CustomButton {...props} /> : <button {...props} />;
  if (kind === 'tooltip') trigger = <KjunTooltip content="버튼 설명">{trigger}</KjunTooltip>;
  if (kind === 'wrapped') trigger = <><span>{trigger}</span></>;
  return <>
    <KjunPopover ariaLabel="상세 정보" focusOnOpen open={config.controlled ? config.open : undefined}
      manualTrigger={config.manual} trigger={kind === 'function' ? () => trigger : trigger}
      onOpenChange={open => { setChanges(old => [...old, open]); if (config.controlled) setConfig(old => ({ ...old, open })); }}>
      {close => <button onClick={close}>닫기</button>}
    </KjunPopover>
    <button data-testid="outside">외부</button>
    <output data-testid="clicks">{clicks}</output><output data-testid="changes">{JSON.stringify(changes)}</output>
  </>;
}
function CheckboxCase() {
  const [config, setConfig] = useConfig({ value: false as boolean | string[], indeterminate: true, disabled: false, accept: true });
  const [changes, setChanges] = useState<(boolean | string[])[]>([]);
  return <>
    <KjunCheckbox value={config.value} val="one" label="전체 선택" indeterminate={config.indeterminate} disabled={config.disabled}
      onValueChange={value => {
        setChanges(old => [...old, value]);
        if (config.accept) setConfig(old => ({ ...old, value, indeterminate: false }));
      }} />
    <output data-testid="changes">{JSON.stringify(changes)}</output>
  </>;
}
function SliderCase() {
  const [config, setConfig] = useConfig({ value: 10, range: [20, 80] as [number, number], formatted: true, prefix: '10월 30일', disabled: false, accept: true });
  const [changes, setChanges] = useState<unknown[]>([]);
  const formatValue = config.formatted ? (value: number) => `${config.prefix} ${value}시` : undefined;
  return <>
    <div data-testid="single"><KjunSlider value={config.value} ariaLabel="기록 시간" formatValue={formatValue} disabled={config.disabled}
      onValueChange={value => { setChanges(old => [...old, { change: value }]); if (config.accept) setConfig(old => ({ ...old, value })); }}
      onChangeCommit={value => setChanges(old => [...old, { commit: value }])} /></div>
    <div data-testid="range"><KjunRangeSlider value={config.range} thumbLabels={['시작 시간', '끝 시간']} formatValue={formatValue} disabled={config.disabled}
      onValueChange={range => { setChanges(old => [...old, { change: range }]); if (config.accept) setConfig(old => ({ ...old, range })); }}
      onChangeCommit={range => setChanges(old => [...old, { commit: range }])} /></div>
    <output data-testid="changes">{JSON.stringify(changes)}</output>
  </>;
}
applyDemoColors('default');
const mode = query.get('mode');
createRoot(document.getElementById('root')!).render(<KjunProvider><main style={{ padding: 40, width: 600 }}>
  {mode === 'tabs' ? <TabsCase nested={query.has('nested')} /> : mode === 'popover' ? <PopoverCase /> : mode === 'checkbox' ? <CheckboxCase /> : <SliderCase />}
</main></KjunProvider>);
