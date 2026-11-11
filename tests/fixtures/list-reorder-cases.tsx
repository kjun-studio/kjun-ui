import { useState } from 'react';
// Reorderable KjunListSection cases for React and Native (Vue 3 mirrors this in list-reorder-vue3.tsx).
export const models = [['opus', 'Opus'], ['sonnet', 'Sonnet'], ['haiku', 'Haiku'], ['fable', 'Fable']] as const;
export const titleOf = (id: string) => models.find(([key]) => key === id)![1];
export function ListReorderCases({ K, native = false, providerProps = {} }: { K: any; native?: boolean; providerProps?: Record<string, any> }) {
  const [order, setOrder] = useState<string[]>(models.map(([id]) => id));
  const [moves, setMoves] = useState<string[]>([]);
  const [chosen, setChosen] = useState('sonnet');
  const [picked, setPicked] = useState<string[]>(models.map(([id]) => id));
  const [stuck] = useState<string[]>(models.map(([id]) => id));
  const [held, setHeld] = useState<string[]>(models.map(([id]) => id));
  const [drops, setDrops] = useState<string[]>([]);
  const press = (action: () => void) => ({ [native ? 'onPress' : 'onClick']: action });
  const rows = (ids: string[]) => ids.map(id => <K.KjunListRow key={id} value={id} title={titleOf(id)} />);
  return <K.KjunProvider {...providerProps}><div style={{ display: 'flex', flexDirection: 'column', gap: 24, padding: 16, width: 480 }}>
    <div data-testid="basic"><K.KjunListSection title="Models" reorderable order={order} onOrderChange={setOrder}
      onReorder={(move: any) => setMoves(old => [...old, `${move.value}:${move.from}>${move.to}`])}>{rows(order)}</K.KjunListSection></div>
    <output data-testid="order">{order.join(',')}</output>
    <output data-testid="moves">{moves.join(' ')}</output>
    <div data-testid="choice"><K.KjunListSection title="Default model" selectionMode="single" value={chosen} onValueChange={setChosen} reorderable order={picked} onOrderChange={setPicked}>
      {rows(picked)}</K.KjunListSection></div>
    <output data-testid="chosen">{chosen}</output>
    <output data-testid="picked">{picked.join(',')}</output>
    <div data-testid="sorted"><K.KjunListSection title="By price" reorderable order={stuck} reorderDisabled reorderDisabledText="가격순으로 정렬 중이라 순서를 바꿀 수 없습니다.">{rows(stuck)}</K.KjunListSection></div>
    <div data-testid="rejected"><K.KjunListSection title="Fixed" reorderable order={stuck} onOrderChange={() => {}}>{rows(stuck)}</K.KjunListSection></div>
    <div data-testid="partial"><K.KjunListSection title="Partial" reorderable order={['opus', 'sonnet']} onOrderChange={() => {}}>
      {rows(['opus', 'sonnet'])}<K.KjunListRow title="Pinned" /><K.KjunListRow value="ghost" title="Unlisted" /></K.KjunListSection></div>
    <div data-testid="handle"><K.KjunListSection title="Handle" reorderable reorderControls="handle" order={held} onOrderChange={setHeld}
      onReorder={(move: any) => setDrops(old => [...old, `${move.value}:${move.from}>${move.to}`])}>{rows(held)}</K.KjunListSection></div>
    <output data-testid="held">{held.join(',')}</output>
    <output data-testid="drops">{drops.join(' ')}</output>
    <div data-testid="both"><K.KjunListSection title="Both" reorderable reorderControls="both" order={held} onOrderChange={setHeld}>{rows(held)}</K.KjunListSection></div>
    <div data-testid="plain"><K.KjunListSection title="Plain">{rows(stuck)}</K.KjunListSection></div>
    <K.KjunButton variant="secondary" {...press(() => setOrder(models.map(([id]) => id).reverse()))}>Reverse</K.KjunButton>
  </div></K.KjunProvider>;
}
