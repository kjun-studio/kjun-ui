import { StrictMode, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { KjunButton, KjunDropdown, KjunDropdownItem, KjunModal, KjunSelect, KjunProvider } from '@kjun-ui/react';
import { setRootValues } from './style-values';

function App() {
  const [open, setOpen] = useState(false), [child, setChild] = useState(false);
  const [events, setEvents] = useState<string[]>([]);
  const record = (event: string) => setEvents(previous => [...previous, event]);
  return <KjunProvider>
    <KjunButton onClick={() => setOpen(true)}>Open dialog</KjunButton>
    <KjunModal open={open} onOpenChange={setOpen} onClose={() => record('dialog-close')} title="Parent dialog">
      <KjunSelect ariaLabel="Choose item" value="alpha" options={['alpha', 'beta']}
        onOpenChange={value => record(value ? 'select-open' : 'select-close')}
        menuHeader={<KjunButton onClick={() => setChild(true)}>Open child</KjunButton>} />
      <KjunDropdown trigger={<KjunButton>Open menu</KjunButton>} onClose={() => record('menu-close')}>
        <KjunDropdownItem>Menu item</KjunDropdownItem>
      </KjunDropdown>
    </KjunModal>
    <KjunModal open={child} onOpenChange={setChild} title="Child dialog"><p>Child content</p></KjunModal>
    <output data-testid="events">{JSON.stringify(events)}</output>
  </KjunProvider>;
}
setRootValues();
createRoot(document.getElementById('root')!).render(<StrictMode><App /></StrictMode>);
