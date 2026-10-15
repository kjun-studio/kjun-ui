import { createApp, defineComponent, reactive } from 'vue';
import * as K from '@kjun-ui/vue3';
import { applyDemoColors } from '../../shared/demo-colors';
applyDemoColors('default');
// Mirrors formConfig in form-actions-cases.tsx (a React module).
const formConfig = { width: 360, size: 'lg', cancelText: '취소', confirmText: '저장', variant: 'primary', cancelVariant: 'ghost', showCancel: true, showConfirm: true, cancelDisabled: false, confirmDisabled: false, loading: false, context: 'plain' };
const config = reactive<any>({ ...formConfig }), state = reactive({ events: [] as string[] });
const record = (event: string) => { state.events.push(event); };
Object.assign(window, { configureActions: (next: object) => Object.assign(config, next) });
createApp(defineComponent(() => () => {
  const { width, context, ...props } = config;
  const actions = <K.KjunFormActions {...props} onCancel={() => record('cancel')} onConfirm={() => record('confirm')} />;
  return <K.KjunProvider><div style={{ padding: '16px' }}>
    <div data-testid="container" style={{ width: width + 'px', maxWidth: '100%' }}>
      {context === 'bar' ? <K.KjunBottomActionBar description="변경 사항을 저장하세요.">{actions}</K.KjunBottomActionBar>
        : context === 'modal' ? <K.KjunModal open showFooter title="작업 확인" confirmText={config.confirmText} cancelText={config.cancelText} footerSize={config.size}
          onConfirm={() => record('confirm')} onCancel={() => record('cancel')}>내용</K.KjunModal> : actions}
    </div>
    <div data-testid="reference" style={{ marginTop: '24px' }}><K.KjunButton size={config.size} variant={config.variant}>{config.confirmText}</K.KjunButton></div>
    <output data-testid="events">{state.events.join(',')}</output>
    <output data-testid="config" hidden>{JSON.stringify(config)}</output>
  </div></K.KjunProvider>;
})).mount('#root');
