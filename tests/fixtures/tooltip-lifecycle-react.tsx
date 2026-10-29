import { createRoot } from 'react-dom/client';
import { useLayoutEffect, useState } from 'react';
import { KjunProvider, KjunTooltip } from '@kjun-ui/react';
import { applyDemoColors } from '../../shared/demo-colors';

function Cases() {
  const [config, configure] = useState({ open: false, content: '제어 설명', title: '', controlled: true });
  const [changes, setChanges] = useState<boolean[]>([]);
  useLayoutEffect(() => {
    Object.assign(window, { configureTooltipLifecycle: (next: object) => configure(old => ({ ...old, ...next })) });
  }, []);
  return <div style={{ padding: 80, display: 'flex', gap: 80 }}>
    <KjunTooltip content="B 설명"><button data-testid="b">B</button></KjunTooltip>
    <KjunTooltip content="A 설명"><button data-testid="a">A</button></KjunTooltip>
    <KjunTooltip content={config.content} title={config.title} open={config.controlled ? config.open : undefined}
      onOpenChange={next => setChanges(old => [...old, next])}>
      <button data-testid="controlled">제어 대상</button>
    </KjunTooltip>
    <button data-testid="outside">바깥</button>
    <output data-testid="config" hidden>{JSON.stringify(config)}</output>
    <output data-testid="changes" hidden>{JSON.stringify(changes)}</output>
  </div>;
}
applyDemoColors('default');
createRoot(document.getElementById('root')!).render(<KjunProvider><Cases /></KjunProvider>);
