import { createApp, defineComponent, ref } from 'vue';
import * as K from '@kjun-ui/vue3';
import { applyDemoColors } from '../../shared/demo-colors';
import { inOrder, reorderColumns, reorderRows } from './table-reorder-values';
applyDemoColors('default');
// Same sections and DOM as table-reorder-cases.tsx (React/Native).
createApp(defineComponent(() => {
  const ids = reorderRows.map(row => row.id);
  const order = ref<(string | number)[]>([...ids]), moves = ref<string[]>([]), cardOrder = ref<(string | number)[]>([...ids]);
  return () => <K.KjunProvider>{{ default: () => <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', padding: '16px', maxWidth: '640px' }}>
    <div data-testid="grid"><K.KjunTable ariaLabel="순서 표" columns={reorderColumns as any} data={inOrder(order.value)} rowKey="id" responsive="none"
      reorderable order={order.value} onUpdate:order={(next: any) => { order.value = next; }} onReorder={(move: any) => { moves.value = [...moves.value, `${move.value}:${move.from}>${move.to}`]; }} /></div>
    <output data-testid="order">{order.value.join(',')}</output>
    <output data-testid="moves">{moves.value.join(' ')}</output>
    <div data-testid="sorted"><K.KjunTable ariaLabel="정렬된 표" columns={reorderColumns as any} data={reorderRows} rowKey="id" responsive="none"
      sort={{ key: 'score', order: 'asc' }} reorderable order={ids} /></div>
    <div data-testid="cards"><K.KjunTable ariaLabel="순서 카드" columns={reorderColumns as any} data={inOrder(cardOrder.value)} rowKey="id" responsive="card"
      reorderable order={cardOrder.value} onUpdate:order={(next: any) => { cardOrder.value = next; }} /></div>
    <output data-testid="card-order">{cardOrder.value.join(',')}</output>
  </div> }}</K.KjunProvider>;
})).mount('#root');
