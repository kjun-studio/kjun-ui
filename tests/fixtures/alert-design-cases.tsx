import { Fragment, useLayoutEffect, useState } from 'react';
export const alertConfig = { size: 'md', title: 'Alert title', body: 'Alert body', variant: 'info', closable: true, action: false, actions: false, actionSize: undefined as string | undefined, width: 360, generation: 0 };
export function AlertCases({ K }: { K: any }) {
  const [config, setConfig] = useState<any>(alertConfig);
  const [events, setEvents] = useState({ close: 0, action: 0 });
  useLayoutEffect(() => { Object.assign(window, { configureAlert: (next: object) => setConfig((old: object) => ({ ...old, ...next })) }); }, []);
  const title = config.emptyFragment ? <Fragment>{false}{' '}</Fragment> : config.title;
  const body = config.emptyFragment ? <Fragment>{null}</Fragment> : config.body;
  const count = () => setEvents(e => ({ ...e, action: e.action + 1 }));
  const button = () => <K.DsButton size="sm" variant="secondary" onClick={count} onPress={count}>Retry</K.DsButton>;
  const action = <K.DsButton size={config.actionSize} variant="secondary" onClick={count} onPress={count}>Slot action</K.DsButton>;
  return <div style={{ padding: 24, display: 'grid', gap: 24, justifyItems: 'start' }}>
    <button data-testid="before">Before</button>
    <div data-testid="alert" style={{ width: config.width }}>
      <K.DsAlert key={config.generation} variant={config.variant} size={config.size} title={title} closable={config.closable}
        actions={config.actions ? action : undefined}
        onClose={() => setEvents(e => ({ ...e, close: e.close + 1 }))}>
        {config.action ? button() : body}
      </K.DsAlert>
    </div>
    <div data-testid="reference">{button()}</div>
    <output data-testid="events">{events.close}/{events.action}</output>
  </div>;
}
