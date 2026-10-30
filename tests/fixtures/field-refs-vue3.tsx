import { createApp, defineComponent, ref } from 'vue';
import { KjunProvider, KjunInput, KjunTextarea } from '@kjun-ui/vue3';
import { setRootValues } from './style-values';
setRootValues();
const input = ref<InstanceType<typeof KjunInput> | null>(null);
const textarea = ref<InstanceType<typeof KjunTextarea> | null>(null);
Object.assign(window, {
  focusField: (kind: 'input' | 'textarea') => {
    const field = kind === 'input' ? input.value : textarea.value;
    field!.focus();
    return field!.el === document.activeElement;
  },
});
createApp(defineComponent(() => () => <KjunProvider>
  <KjunInput ref={input} ariaLabel="Input ref" modelValue="input" />
  <KjunTextarea ref={textarea} ariaLabel="Textarea ref" modelValue="textarea" />
</KjunProvider>)).mount('#root');
