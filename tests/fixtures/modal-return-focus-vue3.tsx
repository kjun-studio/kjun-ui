import { createApp, defineComponent, reactive, ref } from 'vue';
import * as K from '@kjun-ui/vue3';
import { setRootValues } from './style-values';

setRootValues();
const query = new URLSearchParams(location.search);
const Cases = defineComponent(() => {
  const state = reactive({ open: false, mounted: true, parent: false, generation: 0, target: true,
    opener: true, custom: query.get('target') !== 'default', afterClose: 0 });
  const target = ref<HTMLButtonElement | null>(null);
  Object.assign(window, { configureFocus: (next: Partial<typeof state>) => Object.assign(state, next) });
  const open = () => { state.open = true; };
  const close = (value: boolean) => {
    state.open = value;
    if (query.has('replace-on-close') && !value) state.generation++;
  };
  const resolve = () => document.querySelector<HTMLElement>('[data-testid="target"]');
  const openerButton = () => <button data-testid="opener" onClick={open}>Open editor</button>;
  const returnButton = () => <button key={'target-' + state.generation} ref={target} data-testid="target">Return {state.generation}</button>;
  const body = () => <>
    {state.opener && (query.has('hint')
      ? <K.KjunTooltip content="Opener hint">{openerButton()}</K.KjunTooltip> : openerButton())}
    {query.has('menu') && <K.KjunDropdown key={'menu-' + state.generation}>
      {{ trigger: () => <K.KjunButton>Actions</K.KjunButton>,
        default: () => <K.KjunDropdownItem onClick={open}>Edit</K.KjunDropdownItem> }}
    </K.KjunDropdown>}
    {state.target && (query.has('hint')
      ? <K.KjunTooltip key={'hint-' + state.generation} content="Return hint">{returnButton()}</K.KjunTooltip> : returnButton())}
    {state.mounted && <K.KjunModal open={state.open} onUpdate:open={close} title="Editor"
      returnFocus={!state.custom ? undefined : query.get('target') === 'ref' ? target
        : query.get('target') === 'element' ? target.value ?? undefined : resolve}
      onAfter-close={() => { state.afterClose++; }}>
      <K.KjunInput ariaLabel="Edit value" modelValue="Value" />
      <K.KjunButton onClick={() => close(false)}>Finish</K.KjunButton>
    </K.KjunModal>}
  </>;
  return () => <K.KjunProvider><div style={{ padding: '32px' }}>
    {query.has('nested') ? <>
      <button onClick={() => { state.parent = true; }}>Open parent</button>
      <K.KjunModal open={state.parent} onUpdate:open={(value: boolean) => { state.parent = value; }} title="Parent">{body()}</K.KjunModal>
    </> : body()}
    <output data-testid="after-close">{state.afterClose}</output>
  </div></K.KjunProvider>;
});
createApp(Cases).mount('#root');
