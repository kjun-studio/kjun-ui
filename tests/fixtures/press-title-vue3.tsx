import { createApp, defineComponent, ref } from 'vue';
import * as K from '@kjun-ui/vue3';
import { applyDemoColors } from '../../shared/demo-colors';
import { pressFilters, pressTabs } from './press-title-cases';
applyDemoColors('default');
// Same sections and DOM as press-title-cases.tsx (React/Native); the rows' titles use the title slot.
const names: Record<string, [string, string]> = { eth: ['Ethereum', 'ETH'], sol: ['Solana', 'SOL'] };
createApp(defineComponent(() => {
  const filter = ref<any>('all'), tab = ref('all'), order = ref(['eth', 'sol']);
  return () => <K.KjunProvider>{{ default: () => <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', padding: '24px', width: '420px' }}>
    <div data-testid="chips"><K.KjunFilterGroup options={pressFilters} modelValue={filter.value} onUpdate:modelValue={(next: any) => { filter.value = next; }} ariaLabel="등락" /></div>
    <div data-testid="pills"><K.KjunTabs variant="pills" items={pressTabs} modelValue={tab.value} onUpdate:modelValue={(next: string) => { tab.value = next; }} /></div>
    <div data-testid="menu"><K.KjunMenuButton label="정렬">{{ default: () => [
      <K.KjunDropdownItem>최신순</K.KjunDropdownItem>, <K.KjunDropdownItem>이름순</K.KjunDropdownItem>] }}</K.KjunMenuButton></div>
    <div data-testid="titles"><K.KjunListSection ariaLabel="체인" reorderable order={order.value} onUpdate:order={(next: string[]) => { order.value = next; }}>{{ default: () =>
      order.value.map(id => <K.KjunListRow key={id} value={id} description="메인넷">{{ title: () => [names[id][0] + ' ', <span data-ticker="">{names[id][1]}</span>] }}</K.KjunListRow>) }}</K.KjunListSection></div>
    <output data-testid="order">{order.value.join(',')}</output>
  </div> }}</K.KjunProvider>;
})).mount('#root');
