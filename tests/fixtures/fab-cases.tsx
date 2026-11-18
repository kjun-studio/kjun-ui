import { useLayoutEffect, useState } from 'react';
import { applyDemoColors, demoFont, demoPalettes } from '../../shared/demo-colors';

export const fabConfig = { label: '일정 추가', collapsed: false };
export { applyDemoColors, demoFont, demoPalettes };

// The FAB sits in a fixed-size frame so its position and width do not depend on the viewport.
export const fabFrame = { position: 'relative' as const, transform: 'translateZ(0)', width: 320, height: 160 };
export function FabCases({ K, native = false }: { K: any; native?: boolean }) {
  const [config, setConfig] = useState<any>(fabConfig);
  const [presses, setPresses] = useState(0);
  useLayoutEffect(() => { Object.assign(window, { configureFab: (next: object) => setConfig((old: object) => ({ ...old, ...next })) }); }, []);
  return <div style={{ padding: 24 }}>
    <div data-testid="frame" style={fabFrame}>
      <K.KjunFab icon="plus" safeArea={false} avoidBottomBar={false} {...config} {...{ [native ? 'onPress' : 'onClick']: () => setPresses(n => n + 1) }} />
    </div>
    <output data-testid="presses">{presses}</output>
    <output data-testid="config" hidden>{JSON.stringify(config)}</output>
  </div>;
}
