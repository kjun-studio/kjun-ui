import { StrictMode, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { DsButton, DsDropdown, DsDropdownItem, DsModal, DsSelect, KjunProvider } from '@kjun/react';
import { setRootValues } from './style-values';

function App() {
  const [open, setOpen] = useState(false), [child, setChild] = useState(false);
  const [events, setEvents] = useState<string[]>([]);
  const record = (event: string) => setEvents(previous => [...previous, event]);
  return <KjunProvider>
    <DsButton onClick={() => setOpen(true)}>Open dialog</DsButton>
    <DsModal open={open} onOpenChange={setOpen} onClose={() => record('dialog-close')} title="Parent dialog">
      <DsSelect ariaLabel="Choose item" value="alpha" options={['alpha', 'beta']}
        onOpenChange={value => record(value ? 'select-open' : 'select-close')}
        menuHeader={<DsButton onClick={() => setChild(true)}>Open child</DsButton>} />
      <DsDropdown trigger={<DsButton>Open menu</DsButton>} onClose={() => record('menu-close')}>
        <DsDropdownItem>Menu item</DsDropdownItem>
      </DsDropdown>
    </DsModal>
    <DsModal open={child} onOpenChange={setChild} title="Child dialog"><p>Child content</p></DsModal>
    <output data-testid="events">{JSON.stringify(events)}</output>
  </KjunProvider>;
}
setRootValues();
createRoot(document.getElementById('root')!).render(<StrictMode><App /></StrictMode>);
