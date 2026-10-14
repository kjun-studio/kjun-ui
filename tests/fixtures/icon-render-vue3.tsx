import { createApp, defineComponent, ref } from 'vue';
import * as K from '@kjun-ui/vue3';
import { allIcons } from '@kjun-ui/icons/all';
import { setup } from './icon-toggle-values';
setup();
const cases = Object.entries(allIcons).flatMap(([name, icon]) => [{ name, filled: false }, ...(icon.filled ? [{ name, filled: true }] : [])]);
const offset = ref(0);
Object.assign(window, { renderIconBatch: (next: number) => { offset.value = next; } });
createApp(defineComponent(() => () => (
  <K.KjunProvider icons={allIcons}>{{ default: () => (
    <div data-testid="icon-batch" data-offset={offset.value} style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
      {cases.slice(offset.value, offset.value + 120).map(({ name, filled }) => (
        <div key={name + filled} data-icon={name} data-filled={String(filled)}><K.KjunIcon name={name} filled={filled} size="24px" /></div>
      ))}
    </div>
  ) }}</K.KjunProvider>
))).mount('#root');
