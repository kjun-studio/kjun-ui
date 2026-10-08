import { useLayoutEffect, useState } from 'react';
export const refreshConfig = { size: 'sm', variant: 'ghost', disabled: false, loading: false, block: false };
export const refreshStyle = { padding: '24px', display: 'flex', flexDirection: 'column' as const, gap: '24px', alignItems: 'flex-start' };
export function RefreshButtonCases({ K }: { K: any }) {
  const [config, setConfig] = useState<any>({ ...refreshConfig, loading: location.search.includes('loading') });
  const [events, setEvents] = useState(0);
  useLayoutEffect(() => { Object.assign(window, { configureRefresh: (next: object) => setConfig((old: object) => ({ ...old, ...next })) }); }, []);
  const box = (id: string, children: any) => <div data-testid={id} style={{ width: config.block ? 300 : undefined }}>{children}</div>;
  return <div style={refreshStyle}>
    {box('icon', <K.DsRefreshButton {...config} targetName="목록" onRefresh={() => setEvents(n => n + 1)} />)}
    {box('text', <K.DsRefreshButton {...config} mode="text" targetName="목록" onRefresh={() => setEvents(n => n + 1)} />)}
    {box('reference', <K.DsButton {...config} prefixIcon="refresh">새로고침</K.DsButton>)}
    <button data-testid="outside">바깥 버튼</button>
    <output data-testid="events">{events}</output>
    <output data-testid="config" hidden>{JSON.stringify(config)}</output>
  </div>;
}
