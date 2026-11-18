import { useState } from 'react';
import { appBox, body, nested, projects, widths } from './tiles-values';
// Same sections and DOM as tiles-vue3.tsx.
export function TilesCases({ K, native = false }: { K: any; native?: boolean }) {
  const [wide, setWide] = useState(true), [keepWide, setKeepWide] = useState(true);
  const press = native ? { onPress: () => {} } : { onClick: () => {} };
  const cards = (count: number, pressable = false) => projects.slice(0, count).map((name, i) =>
    <K.KjunCard key={name} title={name} pressable={pressable} {...(pressable ? press : {})}><K.KjunText>{body(i)}</K.KjunText></K.KjunCard>);
  const box = (id: string, width: number, node: any) => <div key={id} data-testid={id} style={{ width }}>{node}</div>;
  return <div style={{ display: 'flex', flexDirection: 'column', gap: 24, padding: 16 }}>
    {Object.entries(widths).map(([id, width]) => box(id, width, <K.KjunTiles>{cards(7)}</K.KjunTiles>))}
    {box('sm3', 800, <K.KjunTiles minItem="sm" maxColumns={3}>{cards(5)}</K.KjunTiles>)}
    {box('panel', 360, <K.KjunTiles gap="auto">{cards(3)}</K.KjunTiles>)}
    {box('wide-auto', 1100, <K.KjunTiles gap="auto">{cards(4)}</K.KjunTiles>)}
    {box('fixed-compact', 1100, <K.KjunTiles gap="compact">{cards(4)}</K.KjunTiles>)}
    {box('empty', 800, <K.KjunTiles />)}
    {box('one', 800, <K.KjunTiles>{cards(1)}</K.KjunTiles>)}
    {box('conditional', 800, <K.KjunTiles>{false}{null}{''}{cards(1)}<>{cards(4).slice(1)}</></K.KjunTiles>)}
    {box('app-child', 800, <K.KjunTiles>{[false, true, false].map((tall, i) => <div key={i} className="app-child" style={appBox(tall)} />)}</K.KjunTiles>)}
    {box('pressable', 800, <K.KjunTiles>{cards(3, true)}</K.KjunTiles>)}
    <div key="in-flex" data-testid="in-flex" style={{ display: 'flex', width: 800 }}><div style={{ flex: 1 }}><K.KjunTiles>{cards(3)}</K.KjunTiles></div></div>
    <div key="center-column" data-testid="center-column" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: 800 }}><K.KjunTiles>{cards(3)}</K.KjunTiles></div>
    {!native && <div key="flex-row" data-testid="flex-row" style={{ display: 'flex', width: 800 }}><div style={{ width: 120, flexShrink: 0 }} /><K.KjunTiles>{cards(3)}</K.KjunTiles></div>}
    {box('padded', 800, <K.KjunTiles style={{ padding: 16 }}>{cards(3)}</K.KjunTiles>)}
    {box('mixed', 800, <K.KjunTiles>{null}{cards(1)[0]}{'메모'}</K.KjunTiles>)}
    {box('nested', 800, <K.KjunTiles maxColumns={2}><K.KjunCard title="묶음"><K.KjunInline>{nested.map(title => <K.KjunCard key={title} title={title} />)}</K.KjunInline></K.KjunCard></K.KjunTiles>)}
    {box('string-max', 1100, <K.KjunTiles minItem="sm" maxColumns={3}>{cards(5)}</K.KjunTiles>)}
    {box('blank', 800, <K.KjunTiles>{' '}{cards(1)}{'  '}</K.KjunTiles>)}
    <div key="keep" data-testid="keep" style={{ width: keepWide ? 1100 : 360 }}>
      <button type="button" data-testid="keep-button" onClick={() => setKeepWide(false)}>좁게</button>
      <K.KjunTiles {...(native ? { testID: 'keep-list' } : { 'data-testid': 'keep-list' })}>
        {[0, 1, 2].map(i => <input key={i} aria-label={'메모 ' + i} defaultValue="" />)}
      </K.KjunTiles>
    </div>
    {box('labelled', 800, <K.KjunTiles {...(native ? { ariaLabel: '프로젝트' } : { 'aria-label': '프로젝트', id: 'tiles-id', className: 'app-tiles' })}>{cards(2)}</K.KjunTiles>)}
    <div key="resize" data-testid="resize" style={{ width: wide ? 1100 : 360 }}>
      <button type="button" data-testid="resize-button" onClick={() => setWide(false)}>좁게</button>
      <K.KjunTiles>{cards(4)}</K.KjunTiles>
    </div>
  </div>;
}
