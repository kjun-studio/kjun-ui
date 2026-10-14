import { useState } from 'react';
import { createRoot } from 'react-dom/client';
import * as K from '@kjun-ui/react';
import { cssPalette } from './typography-values';
cssPalette();
const kind = new URLSearchParams(location.search).get('kind');
function Cases() {
  const [open, setOpen] = useState(false), [present, setPresent] = useState(true);
  Object.assign(window, { layerUnmount: { open: () => setOpen(true), close: () => setOpen(false), destroy: () => setPresent(false) } });
  const node = kind === 'modal' ? <K.KjunModal open={open} onOpenChange={setOpen} title="창"><p>본문</p></K.KjunModal>
    : kind === 'drawer' ? <K.KjunDrawer open={open} onOpenChange={setOpen} title="패널"><p>본문</p></K.KjunDrawer>
    : kind === 'popover' ? <K.KjunPopover open={open} onOpenChange={setOpen} ariaLabel="팝업" trigger={<K.KjunButton>열기</K.KjunButton>}><p>본문</p></K.KjunPopover>
    : <K.KjunSelect ariaLabel="선택" value="a" options={[{ value: 'a', label: 'Alpha' }, { value: 'b', label: 'Beta' }]} open={open} onOpenChange={setOpen} />;
  return <div>{present && node}</div>;
}
createRoot(document.getElementById('root')!).render(<K.KjunProvider><Cases /></K.KjunProvider>);
