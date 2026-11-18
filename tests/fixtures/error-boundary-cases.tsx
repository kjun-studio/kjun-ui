import { useLayoutEffect, useState } from 'react';
// One broken child that throws while `broken` is set; the page toggles it, the reset key and the fallback form.
export function ErrorBoundaryCases({ K }: { K: any }) {
  const [c, setConfig] = useState<any>({ broken: true, key: 'a', custom: false, size: 'md' });
  const [log, setLog] = useState<string[]>([]);
  useLayoutEffect(() => { Object.assign(window, { configureBoundary: (next: object) => setConfig((old: object) => ({ ...old, ...next })) }); }, []);
  const Broken = () => { if (c.broken) throw new Error('child failed'); return <K.KjunText>Recovered</K.KjunText>; };
  const fallback = c.custom ? ({ error, reset }: { error: Error; reset: () => void }) =>
    <K.KjunButton onClick={reset} onPress={reset}>{'Custom ' + error.message}</K.KjunButton> : undefined;
  return <div style={{ padding: 24, width: 360 }}>
    <div data-testid="boundary">
      <K.KjunErrorBoundary size={c.size} resetKeys={[c.key]} fallback={fallback} onReset={() => setLog(l => [...l, 'reset'])}><Broken /></K.KjunErrorBoundary>
    </div>
    <output data-testid="log">{log.join(',')}</output>
  </div>;
}
