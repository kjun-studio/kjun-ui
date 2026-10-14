import { useLayoutEffect, useState } from 'react';
import { flushSync } from 'react-dom';
import { popoverConfig } from './popover-design-data';
export function PopoverDesignCases({ K }: { K: any }) {
  const [config, setConfig] = useState(popoverConfig), [open, setOpen] = useState(false);
  useLayoutEffect(() => { Object.assign(window, { configurePopover: (next: object) => flushSync(() => setConfig(old => ({ ...old, ...next }))) }); }, []);
  return <main>
    <div data-testid="anchor" style={{ position: 'absolute', left: config.left, top: config.top, width: config.width }}>
      <K.KjunPopover open={open} onOpenChange={setOpen} ariaLabel="팝오버 디자인" placement={config.placement} noPadding={config.noPadding} matchTriggerWidth={config.matchTriggerWidth} maxHeight={config.maxHeight} focusOnOpen
        trigger={<K.KjunButton block variant="ghost">팝오버 열기</K.KjunButton>}>{config.text}</K.KjunPopover>
    </div>
    <output data-testid="open">{String(open)}</output>
  </main>;
}
