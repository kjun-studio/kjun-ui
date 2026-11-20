import { createRoot } from 'react-dom/client';
import { useLayoutEffect, useState } from 'react';
import { KjunProvider, KjunRefreshButton, KjunTooltip } from '@kjun-ui/react';
import { applyDemoColors } from '../../shared/demo-colors';

// Tooltip triggers first drawn inside a hidden section (an app's view that is not shown yet), then shown.
function Cases() {
  const [shown, setShown] = useState(false);
  useLayoutEffect(() => { Object.assign(window, { showHiddenSection: () => setShown(true) }); }, []);
  return <div style={{ padding: 80 }}>
    <section data-testid="section" hidden={!shown} style={{ display: shown ? 'flex' : undefined, gap: 40 }}>
      <KjunTooltip content="숨김 설명"><button data-testid="trigger">숨김</button></KjunTooltip>
      <span data-testid="refresh"><KjunRefreshButton mode="icon" tooltip="목록 새로고침" onRefresh={() => {}} /></span>
    </section>
  </div>;
}
applyDemoColors('default');
createRoot(document.getElementById('root')!).render(<KjunProvider><Cases /></KjunProvider>);
