import { createApp, defineComponent, reactive } from 'vue';
import * as K from '@kjun-ui/vue3';
import { applyDemoColors } from '../../shared/demo-colors';
applyDemoColors(location.search.includes('dark') ? 'dark' : 'default');
const dataStateConfig = { width: 360, size: 'md', queryKey: 'a', resultKey: 'a', loading: false, error: null, empty: false, preserveContent: true, customEmpty: false, customError: false, customLoading: false, related: '' };
const relatedProps = {
  columns: [{ key: 'name', label: 'Name', type: 'text' }, { key: 'price', label: 'Price', type: 'price' }],
  metricConfig: { price: { label: 'Price', format: 'price' } }, storageNamespace: 'data-state-design',
  primaryLabel: (row: any) => row.name, priceValue: () => 100, changeValue: () => 1, priceFormatter: (value: number) => String(value),
  showActions: false, emitSortOnMount: false, emptyMessage: 'Empty title', emptySubMessage: 'Empty description',
};
const s = reactive({ c: { ...dataStateConfig } as any, events: { retry: 0, empty: 0, export: 0 } });
Object.assign(window, { configureDataState: (next: object) => { s.c = { ...s.c, ...next }; } });
const action = (key: 'retry' | 'empty' | 'export') => () => { s.events[key]++; };
// The design-only keys stay out of the component props.
const stateProps = ({ width, related, customEmpty, customError, customLoading, ...rest }: any) => rest;
createApp(defineComponent(() => () => {
  const c = s.c, Related: any = c.related ? (K as any)[c.related] : null;
  const rowsFor = c.empty ? [] : [{ id: 'a', name: 'Result row', price: 100 }];
  const retry = () => <K.KjunButton size="sm" variant="secondary" onClick={action('retry')}>{c.retryText || 'Retry'}</K.KjunButton>;
  const { queryKey, resultKey, loading, error } = c;
  return <K.KjunProvider><div style={{ padding: '24px' }}>
    <div data-testid="region" style={{ width: c.width + 'px' }}>
      {Related ? (
        Related === K.KjunTable
          ? <K.KjunTable columns={relatedProps.columns as any} data={rowsFor} queryKey={queryKey} resultKey={resultKey} loading={loading} error={error} onRetry={action('retry')} />
          : <Related {...relatedProps} queryKey={queryKey} resultKey={resultKey} loading={loading} error={error} rows={rowsFor} onRetry={action('retry')} />
      ) : (
        <K.KjunDataState {...stateProps(c)} onRetry={action('retry')} onEmpty-action={action('empty')}>
          {{
            default: () => <K.KjunCard title="Result title" surface="muted">
              {{
                headerActions: () => <K.KjunButton size="sm" variant="secondary" onClick={action('export')}>Export</K.KjunButton>,
                default: () => <div data-testid="scroll" style={{ height: '96px', overflow: 'auto' }}>
                  <input aria-label="Retained input" ref={(el: any) => { if (el && !el.dataset.initial) { el.value = "original"; el.dataset.initial = "true"; } }} />
                  <div style={{ height: '600px' }}>Result body</div>
                </div>,
              }}
            </K.KjunCard>,
            ...(c.customEmpty ? { empty: () => <K.KjunEmpty text="Empty title" description="Empty description">{c.emptyActionText && retry()}</K.KjunEmpty> } : {}),
            ...(c.customError ? { error: () => <K.KjunAlert title="Custom error">{retry()}</K.KjunAlert> } : {}),
            ...(c.customLoading ? { loading: () => <K.KjunSkeleton type="block" height={64} /> } : {}),
          }}
        </K.KjunDataState>
      )}
    </div>
    <output data-testid="events">{s.events.retry}/{s.events.empty}/{s.events.export}</output>
  </div></K.KjunProvider>;
})).mount('#root');
