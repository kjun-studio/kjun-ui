import { createApp, defineComponent, inject, nextTick, provide, reactive, ref } from 'vue';
import * as K from '@kjun-ui/vue3';
import { cssPalette } from './typography-values';
cssPalette();
const query = new URLSearchParams(location.search);
const First: any = query.get('kind') === 'drawer' ? K.KjunDrawer : K.KjunModal;
const button = (label: string, action: () => void) => <K.KjunButton onClick={action}>{label}</K.KjunButton>;
const Editor = defineComponent(() => {
  const draft = ref('Original'), count = ref(0);
  const context = inject('draftContext', 'missing context');
  return () => <div>
    <K.KjunTextarea ariaLabel="Draft" modelValue={draft.value} onUpdate:modelValue={(value: string) => draft.value = value} />
    {button('Edit count ' + count.value, () => count.value++)}
    <span data-testid="draft-context">{context}</span>
  </div>;
});
const DraftContext = defineComponent((_, { slots }) => { provide('draftContext', 'Project context'); return () => slots.default?.(); });
const Cases = defineComponent(() => {
  const s = reactive({ first: false, second: false, actions: 0, mounted: true });
  const feedback = K.useKjunFeedback();
  Object.assign(window, { retention: {
    reopen: async () => { s.first = false; if (query.has('interleaved')) setTimeout(() => s.second = true, 20); setTimeout(() => s.first = true, query.has('interleaved') ? 60 : 30); await nextTick(); },
    toast: () => feedback.toast.info('Retained result', { duration: 0, action: { label: 'Toast action', onClick: () => s.actions++ } }),
    unmount: () => s.mounted = false,
  } });
  return () => <div>
    {button('Open first', () => s.first = true)}{button('Page action', () => s.actions++)}
    <output data-testid="actions">{s.actions}</output>
    {s.mounted && <DraftContext><First open={s.first} onUpdate:open={(v: boolean) => s.first = v} title="First window"><Editor /></First></DraftContext>}
    {s.mounted && <K.KjunProvider><K.KjunModal open={s.second} onUpdate:open={(v: boolean) => s.second = v} title="Second window">{button('Second action', () => s.actions++)}</K.KjunModal></K.KjunProvider>}
  </div>;
});
createApp(defineComponent(() => () => <K.KjunProvider><K.KjunFeedbackProvider><Cases /></K.KjunFeedbackProvider></K.KjunProvider>)).mount('#root');
