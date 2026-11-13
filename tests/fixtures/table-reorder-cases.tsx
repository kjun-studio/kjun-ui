import { useState } from 'react';
import { inOrder, reorderColumns, reorderRows } from './table-reorder-values';
// Reorderable KjunTable cases for React and Native (Vue 3 mirrors this in table-reorder-vue3.tsx).
export function TableReorderCases({ K, providerProps = {} }: { K: any; providerProps?: Record<string, any> }) {
  const ids = reorderRows.map(row => row.id);
  const [order, setOrder] = useState<(string | number)[]>(ids), [moves, setMoves] = useState<string[]>([]);
  const [cardOrder, setCardOrder] = useState<(string | number)[]>(ids);
  return <K.KjunProvider {...providerProps}><div style={{ display: 'flex', flexDirection: 'column', gap: 24, padding: 16, maxWidth: 640 }}>
    <div data-testid="grid"><K.KjunTable ariaLabel="순서 표" columns={reorderColumns} data={inOrder(order)} rowKey="id" responsive="none"
      reorderable order={order} onOrderChange={setOrder} onReorder={(move: any) => setMoves(old => [...old, `${move.value}:${move.from}>${move.to}`])} /></div>
    <output data-testid="order">{order.join(',')}</output>
    <output data-testid="moves">{moves.join(' ')}</output>
    <div data-testid="sorted"><K.KjunTable ariaLabel="정렬된 표" columns={reorderColumns} data={reorderRows} rowKey="id" responsive="none"
      sort={{ key: 'score', order: 'asc' }} reorderable order={ids} onOrderChange={() => {}} /></div>
    <div data-testid="cards"><K.KjunTable ariaLabel="순서 카드" columns={reorderColumns} data={inOrder(cardOrder)} rowKey="id" responsive="card"
      reorderable order={cardOrder} onOrderChange={setCardOrder} /></div>
    <output data-testid="card-order">{cardOrder.join(',')}</output>
  </div></K.KjunProvider>;
}
