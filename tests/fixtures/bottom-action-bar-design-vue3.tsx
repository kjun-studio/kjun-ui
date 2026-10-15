import { createApp, defineComponent, reactive } from 'vue';
import * as K from '@kjun-ui/vue3';
import { actionBarConfig, setupActionBarColors } from './bottom-action-bar-design-data';
setupActionBarColors();
const s = reactive({ config: { ...actionBarConfig } as any, events: [] as string[] });
Object.assign(window, { configureActionBar: (next: object) => { s.config = { ...s.config, ...next }; s.events = []; } });
const action = (name: string) => () => s.events.push(name);
createApp(defineComponent(() => () => {
  const config = s.config;
  return <K.KjunProvider><main style={{ padding: '16px' }}>
    <div data-testid="bar" style={{ width: typeof config.width === 'number' ? config.width + 'px' : config.width, maxWidth: '100%' }}>
      <K.KjunBottomActionBar description={config.description} safeAreaBottom={config.safeAreaBottom} keyboardVisible={config.keyboardVisible} hideOnKeyboard={config.hideOnKeyboard}>
        {config.direct ? <>
          {config.showCancel && <K.KjunButton size="lg" variant="ghost" disabled={config.disabled} onClick={action('cancel')}>취소</K.KjunButton>}
          {config.showConfirm && <K.KjunButton size="lg" variant={config.variant} disabled={config.disabled} loading={config.loading} onClick={action('save')}>변경 사항 저장</K.KjunButton>}
        </> : <K.KjunFormActions confirmText="변경 사항 저장" variant={config.variant} showCancel={config.showCancel} showConfirm={config.showConfirm} loading={config.loading}
          confirmDisabled={config.disabled} cancelDisabled={config.disabled} onConfirm={action('save')} onCancel={action('cancel')} />}
      </K.KjunBottomActionBar>
    </div>
    <div data-testid="outside" style={{ width: '320px' }}><K.KjunFormActions confirmText="일반 저장" /></div>
    <output data-testid="events">{s.events.join('|')}</output>
  </main></K.KjunProvider>;
})).mount('#root');
