import { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { KjunProvider, KjunButton, KjunInput, KjunPopover, KjunMarketSimpleList, KjunMarketCards, KjunSearchInput } from '@kjun-ui/react';
import { setRootValues } from './style-values';
import { SearchContracts } from './review-composition-search';
setRootValues();
const params = new URLSearchParams(location.search), mode = params.get('case');
function Cases() {
  const [value, setValue] = useState('Alpha');
  const [open, setOpen] = useState(params.has('initial'));
  const [events, setEvents] = useState<string[]>([]);
  const log = (event: string) => setEvents(old => [...old, event]);
  const market = {
    rows: [{ id: 1, name: 'Alpha', current_price: 1 }], primaryLabel: (row: { name: string }) => row.name,
    priceValue: () => 1, changeValue: () => null, priceFormatter: String,
    onRowClick: params.has('passive') ? undefined : () => log('row'),
    renderNameSuffix: () => <KjunButton onClick={() => log('action')}>Action</KjunButton>,
  };
  return <>
    {mode === 'focus' && <KjunPopover trigger={<KjunButton>Open</KjunButton>} focusOnOpen ariaLabel="Editor"
      open={open} onOpenChange={setOpen}>
      <KjunInput value={value} ariaLabel="Edit value" onValueChange={setValue} />
    </KjunPopover>}
    {mode === 'list' && <KjunMarketSimpleList {...market} />}
    {mode === 'cards' && <KjunMarketCards {...market} storageNamespace="review-composition" metricConfig={{ current_price: { label: 'Price' } }} columns={[{ key: 'current_price', label: 'Price' }]} />}
    {!mode && <SearchContracts Search={KjunSearchInput} />}
    {mode && <><output data-testid="value">{value}</output><output data-testid="events">{JSON.stringify(events)}</output></>}
  </>;
}
createRoot(document.getElementById('root')!).render(<KjunProvider><Cases /></KjunProvider>);
