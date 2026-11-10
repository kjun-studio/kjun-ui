import { createApp, defineComponent, ref } from 'vue';
import * as K from '@kjun-ui/vue3';
import { applyDemoColors } from '../../shared/demo-colors';
import { models, titleOf } from './list-reorder-cases';
applyDemoColors('default');
// Same sections and DOM as list-reorder-cases.tsx (React/Native).
const ids = () => models.map(([id]) => id as string);
const rows = (list: string[]) => list.map(id => <K.KjunListRow key={id} value={id} title={titleOf(id)} />);
const App = defineComponent(() => {
  const order = ref(ids()), moves = ref<string[]>([]), chosen = ref('sonnet'), picked = ref(ids()), stuck = ids();
  return () => <K.KjunProvider>{{ default: () => <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', padding: '16px', width: '480px' }}>
    <div data-testid="basic"><K.KjunListSection title="Models" reorderable order={order.value} onUpdate:order={(next: any) => { order.value = next; }}
      onReorder={(move: any) => { moves.value = [...moves.value, `${move.value}:${move.from}>${move.to}`]; }}>{{ default: () => rows(order.value) }}</K.KjunListSection></div>
    <output data-testid="order">{order.value.join(',')}</output>
    <output data-testid="moves">{moves.value.join(' ')}</output>
    <div data-testid="choice"><K.KjunListSection title="Default model" selectionMode="single" modelValue={chosen.value} onUpdate:modelValue={(next: any) => { chosen.value = next; }}
      reorderable order={picked.value} onUpdate:order={(next: any) => { picked.value = next; }}>{{ default: () => rows(picked.value) }}</K.KjunListSection></div>
    <output data-testid="chosen">{chosen.value}</output>
    <output data-testid="picked">{picked.value.join(',')}</output>
    <div data-testid="sorted"><K.KjunListSection title="By price" reorderable order={stuck} reorderDisabled reorderDisabledText="가격순으로 정렬 중이라 순서를 바꿀 수 없습니다.">{{ default: () => rows(stuck) }}</K.KjunListSection></div>
    <div data-testid="rejected"><K.KjunListSection title="Fixed" reorderable order={stuck}>{{ default: () => rows(stuck) }}</K.KjunListSection></div>
    <div data-testid="partial"><K.KjunListSection title="Partial" reorderable order={['opus', 'sonnet']}>{{ default: () => [
      ...rows(['opus', 'sonnet']), <K.KjunListRow title="Pinned" />, <K.KjunListRow value="ghost" title="Unlisted" />] }}</K.KjunListSection></div>
    <div data-testid="plain"><K.KjunListSection title="Plain">{{ default: () => rows(stuck) }}</K.KjunListSection></div>
    <K.KjunButton variant="secondary" onClick={() => { order.value = ids().reverse(); }}>Reverse</K.KjunButton>
  </div> }}</K.KjunProvider>;
});
createApp(App).mount('#root');
