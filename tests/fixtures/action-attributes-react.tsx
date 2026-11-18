import { StrictMode, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { KjunProvider, KjunIconToggle, KjunCopyButton } from '@kjun-ui/react';
import { setRootValues } from './style-values';
setRootValues();
// React IconToggle and CopyButton pass button attributes through, as Vue does with attrs.
function Cases() {
  const [events, setEvents] = useState<unknown[]>([]);
  const [referenced, setReferenced] = useState('Watch item');
  const push = (event: unknown) => setEvents(old => [...old, event]);
  Object.assign(window, { setReferenced });
  return <div style={{ padding: 32, display: 'flex', gap: 16, alignItems: 'center' }}>
    <KjunIconToggle data-testid="attribute" aria-label="Favorite" activeIcon="star" tooltipDelay={0} className="consumer-toggle" style={{ marginTop: 2 }}
      onToggle={() => push(['toggle'])} onClick={() => push(['click'])} />
    <KjunIconToggle data-testid="reference" aria-labelledby="toggle-label" activeIcon="star" tooltipDelay={0} />
    <span id="toggle-label">{referenced}</span>
    <KjunCopyButton data-testid="copy" className="consumer-copy" value="KJUN" text="복사" copyText={() => push(['copy'])} onClick={() => push(['copy-click'])} />
    <KjunCopyButton data-testid="blocked" value="KJUN" text="막힌 복사" copyText={() => push(['blocked-copy'])} onClick={event => event.preventDefault()} />
    <output data-testid="events">{JSON.stringify(events)}</output>
  </div>;
}
createRoot(document.getElementById('root')!).render(<StrictMode><KjunProvider><Cases /></KjunProvider></StrictMode>);
