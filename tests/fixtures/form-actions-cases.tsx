import { useLayoutEffect, useState } from 'react';
import { applyDemoColors, demoFont, demoPalettes } from '../../shared/demo-colors';
export { applyDemoColors, demoFont, demoPalettes };
export const formConfig = { width: 360, size: 'lg', cancelText: '취소', confirmText: '저장', variant: 'primary', cancelVariant: 'ghost', showCancel: true, showConfirm: true, cancelDisabled: false, confirmDisabled: false, loading: false, context: 'plain' };
export function FormActionsCases({ K, native = false }: { K: any; native?: boolean }) {
  const [config, setConfig] = useState<any>({ ...formConfig }), [events, setEvents] = useState<string[]>([]);
  const record = (event: string) => setEvents(old => [...old, event]);
  useLayoutEffect(() => { Object.assign(window, { configureActions: (next: object) => setConfig((old: object) => ({ ...old, ...next })) }); }, []);
  const actions = <K.KjunFormActions {...config} onCancel={() => record('cancel')} onConfirm={() => record('confirm')} />;
  return <div style={{ padding: 16 }}>
    <div data-testid="container" style={{ width: config.width, maxWidth: '100%' }}>
      {config.context === 'bar' ? <K.KjunBottomActionBar description="변경 사항을 저장하세요.">{actions}</K.KjunBottomActionBar> : config.context === 'modal' ? <K.KjunModal open showFooter title="작업 확인" confirmText={config.confirmText} cancelText={config.cancelText} footerSize={config.size} onConfirm={() => record('confirm')} onCancel={() => record('cancel')}>내용</K.KjunModal> : actions}
    </div>
    <div data-testid="reference" style={{ marginTop: 24 }}><K.KjunButton size={config.size} variant={config.variant}>{config.confirmText}</K.KjunButton></div>
    <output data-testid="events">{events.join(',')}</output>
    <output data-testid="config" hidden>{JSON.stringify(config)}</output>
  </div>;
}
