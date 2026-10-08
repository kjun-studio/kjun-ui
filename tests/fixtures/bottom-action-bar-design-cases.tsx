import { useLayoutEffect, useState } from 'react';
import { flushSync } from 'react-dom';
import { actionBarConfig } from './bottom-action-bar-design-data';
export function BottomActionBarDesignCases({ K, native = false }: { K: any; native?: boolean }) {
  const [config, setConfig] = useState(actionBarConfig), [events, setEvents] = useState<string[]>([]);
  useLayoutEffect(() => { Object.assign(window, { configureActionBar: (next: object) => flushSync(() => { setConfig(old => ({ ...old, ...next })); setEvents([]); }) }); }, []);
  const action = (name: string) => ({ [native ? 'onPress' : 'onClick']: () => setEvents(old => [...old, name]) });
  return <main style={{ padding: 16 }}>
    <div data-testid="bar" style={{ width: config.width, maxWidth: '100%' }}>
      <K.DsBottomActionBar description={config.description} safeAreaBottom={config.safeAreaBottom} keyboardVisible={config.keyboardVisible} hideOnKeyboard={config.hideOnKeyboard}>
        {config.direct ? <>
          {config.showCancel && <K.DsButton size="lg" variant="ghost" disabled={config.disabled} {...action('cancel')}>취소</K.DsButton>}
          {config.showConfirm && <K.DsButton size="lg" variant={config.variant} disabled={config.disabled} loading={config.loading} {...action('save')}>변경 사항 저장</K.DsButton>}
        </> : <K.DsFormActions confirmText="변경 사항 저장" variant={config.variant} showCancel={config.showCancel} showConfirm={config.showConfirm} loading={config.loading} confirmDisabled={config.disabled} cancelDisabled={config.disabled} onConfirm={() => setEvents(old => [...old, 'save'])} onCancel={() => setEvents(old => [...old, 'cancel'])} />}
      </K.DsBottomActionBar>
    </div>
    <div data-testid="outside" style={{ width: 320 }}><K.DsFormActions confirmText="일반 저장" /></div>
    <output data-testid="events">{events.join('|')}</output>
  </main>;
}
