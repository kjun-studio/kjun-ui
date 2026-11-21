import { Fragment, useLayoutEffect, useRef, useState } from 'react';
export const alertConfig = { size: 'md', title: 'Alert title', body: 'Alert body', variant: 'info', closable: true, action: false, actions: false, actionSize: undefined as string | undefined, width: 360, generation: 0, icon: undefined as string | false | undefined, link: false, extra: false };
export function AlertCases({ K, native = false }: { K: any; native?: boolean }) {
  const [config, setConfig] = useState<any>(alertConfig);
  const [events, setEvents] = useState({ close: 0, action: 0 });
  const root = useRef<any>(null);
  useLayoutEffect(() => { Object.assign(window, { configureAlert: (next: object) => setConfig((old: object) => ({ ...old, ...next })), alertRoot: () => root.current }); }, []);
  // Root attributes a page sets to point at the alert or move focus to it; Native takes a test id and style.
  const extra = !config.extra ? {} : native ? { testID: 'alert-root', style: { marginTop: 4 } }
    : { id: 'alert-root', style: { marginTop: 4 }, tabIndex: -1, 'data-extra': 'yes' };
  const title = config.emptyFragment ? <Fragment>{false}{' '}</Fragment> : config.title;
  const body = config.emptyFragment ? <Fragment>{null}</Fragment> : config.link && !native
    ? <>Terms changed. <a href="#terms">Read changes</a><ul><li>First change</li></ul></> : config.body;
  const count = () => setEvents(e => ({ ...e, action: e.action + 1 }));
  const button = () => <K.KjunButton size="sm" variant="secondary" onClick={count} onPress={count}>Retry</K.KjunButton>;
  const action = <K.KjunButton size={config.actionSize} variant="secondary" onClick={count} onPress={count}>Slot action</K.KjunButton>;
  return <div style={{ padding: 24, display: 'grid', gap: 24, justifyItems: 'start' }}>
    <button data-testid="before">Before</button>
    <div data-testid="alert" style={{ width: config.width }}>
      <K.KjunAlert ref={root} {...extra} key={config.generation} variant={config.variant} size={config.size} title={title} closable={config.closable} icon={config.icon}
        actions={config.actions ? action : undefined}
        onClose={() => setEvents(e => ({ ...e, close: e.close + 1 }))}>
        {config.action ? button() : body}
      </K.KjunAlert>
    </div>
    <div data-testid="reference">{button()}</div>
    <output data-testid="events">{events.close}/{events.action}</output>
  </div>;
}
