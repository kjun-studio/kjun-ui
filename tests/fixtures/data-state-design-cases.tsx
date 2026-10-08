import { useLayoutEffect, useState } from 'react';
export const dataStateConfig = { width: 360, size: 'md', queryKey: 'a', resultKey: 'a', loading: false, error: null, empty: false, preserveContent: true, customEmpty: false, customError: false, customLoading: false, related: '' };
export const relatedProps = {
  columns: [{ key: 'name', label: 'Name', type: 'text' }, { key: 'price', label: 'Price', type: 'price' }],
  metricConfig: { price: { label: 'Price', format: 'price' } }, storageNamespace: 'data-state-design',
  primaryLabel: (row: any) => row.name, priceValue: () => 100, changeValue: () => 1,
  showActions: false, emitSortOnMount: false, emptyMessage: 'Empty title', emptySubMessage: 'Empty description',
};
export function DataStateCases({ K }: { K: any }) {
  const [c, setConfig] = useState<any>(dataStateConfig);
  const [events, setEvents] = useState({ retry: 0, empty: 0, export: 0 });
  useLayoutEffect(() => { Object.assign(window, { configureDataState: (next: object) => setConfig((old: object) => ({ ...old, ...next })) }); }, []);
  const action = (key: keyof typeof events) => () => setEvents(e => ({ ...e, [key]: e[key] + 1 }));
  const retry = () => <K.DsButton size="sm" variant="secondary" onClick={action('retry')} onPress={action('retry')}>{c.retryText || 'Retry'}</K.DsButton>;
  const Related = K[c.related];
  return <div style={{ padding: 24 }}>
    <div data-testid="region" style={{ width: c.width }}>
      {Related ? <Related {...relatedProps} {...c} data={c.empty ? [] : [{ id: 'a', name: 'Result row', price: 100 }]} rows={c.empty ? [] : [{ id: 'a', name: 'Result row', price: 100 }]} onRetry={action('retry')} /> :
      <K.DsDataState {...c} onRetry={action('retry')} onEmptyAction={action('empty')}
        emptyContent={c.customEmpty ? <K.DsEmpty text="Empty title" description="Empty description">{c.emptyActionText && retry()}</K.DsEmpty> : undefined}
        errorContent={c.customError ? <K.DsAlert title="Custom error">{retry()}</K.DsAlert> : undefined}
        loadingContent={c.customLoading ? <K.DsSkeleton type="block" height={64} /> : undefined}>
        <K.DsCard title="Result title" surface="muted" headerActions={<K.DsButton size="sm" variant="secondary" onClick={action('export')} onPress={action('export')}>Export</K.DsButton>}>
          <div data-testid="scroll" style={{ height: 96, overflow: 'auto' }}>
            <input aria-label="Retained input" defaultValue="original" />
            <div style={{ height: 600 }}>Result body</div>
          </div>
        </K.DsCard>
      </K.DsDataState>}
    </div>
    <output data-testid="events">{events.retry}/{events.empty}/{events.export}</output>
  </div>;
}
