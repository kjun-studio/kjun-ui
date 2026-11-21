// R-05 press fills (FilterGroup, pills Tabs, menu items) and R-06 node titles on ListRow, for React and Native
// (Vue 3 mirrors this in press-title-vue3.tsx).
import { useState } from 'react';
export const pressFilters = [{ value: 'all', label: '전체' }, { value: 'up', label: '상승' }, { value: 'down', label: '하락' }];
export const pressTabs = [{ name: 'all', label: '전체' }, { name: 'watch', label: '관심' }, { name: 'hold', label: '보유' }];
export function PressTitleCases({ K, native = false, providerProps = {} }: { K: any; native?: boolean; providerProps?: Record<string, any> }) {
  const [filter, setFilter] = useState<any>('all');
  const [tab, setTab] = useState('all');
  const [order, setOrder] = useState(['eth', 'sol']);
  const ticker = (text: string) => native ? <K.KjunText key="t">{text}</K.KjunText> : <span key="t" data-ticker="">{text}</span>;
  const titles: Record<string, any> = { eth: ['Ethereum ', ticker('ETH')], sol: ['Solana ', ticker('SOL')] };
  return <K.KjunProvider {...providerProps}><div style={{ display: 'flex', flexDirection: 'column', gap: 24, padding: 24, width: 420 }}>
    <div data-testid="chips"><K.KjunFilterGroup options={pressFilters} value={filter} onValueChange={setFilter} ariaLabel="등락" /></div>
    <div data-testid="pills"><K.KjunTabs variant="pills" items={pressTabs} value={tab} onValueChange={setTab} /></div>
    <div data-testid="menu"><K.KjunMenuButton label="정렬">
      <K.KjunDropdownItem>최신순</K.KjunDropdownItem>
      <K.KjunDropdownItem>이름순</K.KjunDropdownItem>
    </K.KjunMenuButton></div>
    <div data-testid="titles"><K.KjunListSection ariaLabel="체인" reorderable order={order} onOrderChange={setOrder}>
      {order.map(id => <K.KjunListRow key={id} value={id} title={titles[id]} description="메인넷" />)}
    </K.KjunListSection></div>
    <output data-testid="order">{order.join(',')}</output>
  </div></K.KjunProvider>;
}
