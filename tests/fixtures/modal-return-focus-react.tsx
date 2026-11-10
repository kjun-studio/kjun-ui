import { useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import * as K from '@kjun-ui/react';
import { setRootValues } from './style-values';

setRootValues();
const query = new URLSearchParams(location.search);
function Cases() {
  const [state, setState] = useState({ open: false, mounted: true, parent: false, generation: 0, target: true,
    opener: true, custom: query.get('target') !== 'default', afterClose: 0 });
  const target = useRef<HTMLButtonElement | null>(null);
  const configure = (next: Partial<typeof state>) => setState(old => ({ ...old, ...next }));
  Object.assign(window, { configureFocus: configure });
  const open = () => configure({ open: true });
  const close = (value: boolean) => configure({ open: value,
    ...(query.has('replace-on-close') && !value ? { generation: state.generation + 1 } : {}) });
  const resolve = () => document.querySelector<HTMLElement>('[data-testid="target"]');
  const returnFocus = !state.custom ? undefined : query.get('target') === 'ref' ? target
    : query.get('target') === 'element' ? target.current : resolve;
  const body = <>
    {state.opener && <button data-testid="opener" onClick={open}>Open editor</button>}
    {query.has('menu') && <K.KjunDropdown key={'menu-' + state.generation} trigger={<K.KjunButton>Actions</K.KjunButton>}>
      <K.KjunDropdownItem onClick={open}>Edit</K.KjunDropdownItem>
    </K.KjunDropdown>}
    {state.target && <button key={'target-' + state.generation} ref={target} data-testid="target">Return {state.generation}</button>}
    {state.mounted && <K.KjunModal open={state.open} onOpenChange={close} title="Editor" returnFocus={returnFocus ?? undefined}
      onAfterClose={() => setState(old => ({ ...old, afterClose: old.afterClose + 1 }))}>
      <K.KjunInput ariaLabel="Edit value" value="Value" onValueChange={() => {}} />
      <K.KjunButton onClick={() => close(false)}>Finish</K.KjunButton>
    </K.KjunModal>}
  </>;
  return <K.KjunProvider><div style={{ padding: 32 }}>
    {query.has('nested') ? <>
      <button onClick={() => configure({ parent: true })}>Open parent</button>
      <K.KjunModal open={state.parent} onOpenChange={parent => configure({ parent })} title="Parent">{body}</K.KjunModal>
    </> : body}
    <output data-testid="after-close">{state.afterClose}</output>
  </div></K.KjunProvider>;
}
createRoot(document.getElementById('root')!).render(<Cases />);
