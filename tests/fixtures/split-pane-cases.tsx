import { useState } from 'react';
// KjunSplitPane cases for React and Native (Vue 3 mirrors this in split-pane-vue3.tsx).
export function SplitPaneCases({ K, native = false, providerProps = {} }: { K: any; native?: boolean; providerProps?: Record<string, any> }) {
  const [sizes, setSizes] = useState<number[]>([]);
  const [commits, setCommits] = useState<number[]>([]);
  const [controlled, setControlled] = useState(0.5);
  const [width, setWidth] = useState(700);
  const [pxWidth, setPxWidth] = useState(700);
  const [pxCommits, setPxCommits] = useState<number[]>([]);
  const [collapsed, setCollapsed] = useState(false);
  const [alone, setAlone] = useState(true);
  const press = (action: () => void) => ({ [native ? 'onPress' : 'onClick']: action });
  const pane = (label: string) => native ? <K.KjunText>{label}</K.KjunText> : <div>{label}</div>;
  const box = (id: string, w: number, h: number, node: any) => <div data-testid={id} style={{ display: 'flex', width: w, height: h }}>{node}</div>;
  return <K.KjunProvider {...providerProps}><div style={{ display: 'flex', flexDirection: 'column', gap: 24, padding: 16 }}>
    {box('basic', 700, 120, <K.KjunSplitPane ariaLabel="Basic" defaultSize={0.6} minSize={[200, 240]} first={pane('First')} second={pane('Second')}
      onSizeChange={(size: number) => setSizes(old => [...old, size])} onChangeCommit={(size: number) => setCommits(old => [...old, size])} />)}
    <output data-testid="sizes">{JSON.stringify(sizes)}</output>
    <output data-testid="commits">{JSON.stringify(commits)}</output>
    {box('controlled', 700, 120, <K.KjunSplitPane ariaLabel="Controlled" size={controlled} onSizeChange={setControlled} first={pane('First')} second={pane('Second')} />)}
    <K.KjunButton variant="secondary" {...press(() => setControlled(0.3))}>Set 30</K.KjunButton>
    <output data-testid="controlled-size">{controlled}</output>
    {box('vertical', 300, 300, <K.KjunSplitPane ariaLabel="Vertical" direction="vertical" minSize={[80, 80]} first={pane('Top')} second={pane('Bottom')} />)}
    {box('disabled', 700, 120, <K.KjunSplitPane ariaLabel="Disabled" disabled first={pane('First')} second={pane('Second')} />)}
    {box('narrow', 400, 120, <K.KjunSplitPane ariaLabel="Narrow" minSize={[200, 240]} first={pane('First')} second={pane('Second')} />)}
    {box('resizable', width, 120, <K.KjunSplitPane ariaLabel="Resizable" defaultSize={0.6} minSize={[200, 240]} first={pane('First')} second={pane('Second')} />)}
    <K.KjunButton variant="secondary" {...press(() => setWidth(420))}>Shrink</K.KjunButton>
    <K.KjunButton variant="secondary" {...press(() => setWidth(700))}>Grow</K.KjunButton>
    {box('capped', 700, 120, <K.KjunSplitPane ariaLabel="Capped" maxSize={[300, null]} first={pane('First')} second={pane('Second')} />)}
    {box('pixels', pxWidth, 120, <K.KjunSplitPane ariaLabel="Pixels" sizeUnit="px" defaultSize={240} minSize={[120, 200]} first={pane('First')} second={pane('Second')}
      onChangeCommit={(size: number) => setPxCommits(old => [...old, size])} />)}
    <K.KjunButton variant="secondary" {...press(() => setPxWidth(500))}>Narrow pixels</K.KjunButton>
    <output data-testid="px-commits">{JSON.stringify(pxCommits)}</output>
    {box('rail', 700, 120, <K.KjunSplitPane ariaLabel="Rail" defaultSize={0.4} minSize={[160, 200]} collapsible collapsedSize={48} collapsed={collapsed}
      onCollapsedChange={setCollapsed} first={pane(collapsed ? 'Rail' : 'List')} second={pane('Second')} />)}
    <output data-testid="collapsed">{String(collapsed)}</output>
    {box('folded', 700, 120, <K.KjunSplitPane ariaLabel="Folded" collapsible defaultCollapsed minSize={[160, 200]} first={pane('Hidden first')} second={pane('Second')} />)}
    {box('detail', 700, 120, <K.KjunSplitPane ariaLabel="Detail" secondHidden={alone} first={<input aria-label="Kept" />} second={pane('Detail pane')} />)}
    <K.KjunButton variant="secondary" {...press(() => setAlone(value => !value))}>Toggle detail</K.KjunButton>
  </div></K.KjunProvider>;
}
