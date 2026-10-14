import { createApp, defineComponent, reactive } from 'vue';
import * as K from '@kjun-ui/vue3';
import { cssPalette } from './typography-values';
cssPalette();
const kind = new URLSearchParams(location.search).get('kind');
const s = reactive({ open: false, present: true });
Object.assign(window, { layerUnmount: { open: () => s.open = true, close: () => s.open = false, destroy: () => s.present = false } });
const change = (v: boolean) => { s.open = v; };
const node = () => kind === 'modal' ? <K.KjunModal open={s.open} onUpdate:open={change} title="창"><p>본문</p></K.KjunModal>
  : kind === 'drawer' ? <K.KjunDrawer open={s.open} onUpdate:open={change} title="패널"><p>본문</p></K.KjunDrawer>
  : kind === 'popover' ? <K.KjunPopover open={s.open} onUpdate:open={change} ariaLabel="팝업">{{ trigger: () => <K.KjunButton>열기</K.KjunButton>, default: () => <p>본문</p> }}</K.KjunPopover>
  : <K.KjunSelect ariaLabel="선택" modelValue="a" options={[{ value: 'a', label: 'Alpha' }, { value: 'b', label: 'Beta' }]} open={s.open} onUpdate:open={change} />;
createApp(defineComponent(() => () => <K.KjunProvider><div>{s.present && node()}</div></K.KjunProvider>)).mount('#root');
