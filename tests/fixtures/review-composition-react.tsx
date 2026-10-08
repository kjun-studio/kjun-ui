import { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { KjunProvider, DsButton, DsInput, DsPopover, DsMarketSimpleList, DsMarketCards, DsSearchInput } from '@kjun-ui/react';
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
    renderNameSuffix: () => <DsButton onClick={() => log('action')}>Action</DsButton>,
  };
  return <>
    {mode === 'focus' && <DsPopover trigger={<DsButton>Open</DsButton>} focusOnOpen ariaLabel="Editor"
      open={open} onOpenChange={setOpen}>
      <DsInput value={value} ariaLabel="Edit value" onValueChange={setValue} />
    </DsPopover>}
    {mode === 'list' && <DsMarketSimpleList {...market} />}
    {mode === 'cards' && <DsMarketCards {...market} storageNamespace="review-composition" metricConfig={{ current_price: { label: 'Price' } }} columns={[{ key: 'current_price', label: 'Price' }]} />}
    {!mode && <SearchContracts Search={DsSearchInput} />}
    {mode && <><output data-testid="value">{value}</output><output data-testid="events">{JSON.stringify(events)}</output></>}
  </>;
}
createRoot(document.getElementById('root')!).render(<KjunProvider><Cases /></KjunProvider>);
