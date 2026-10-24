import { createApp, defineComponent, ref } from 'vue';
import * as K from '@kjun-ui/vue3';
import { applyDemoColors } from '../../shared/demo-colors';
applyDemoColors('default');
// Same regions and DOM as i18n-cases.tsx (React/Native).
const regions = [
  { id: 'en', locale: 'en-US' },
  { id: 'ja', locale: 'ja-JP', messages: { cancel: 'キャンセル' } },
  { id: 'props', locale: 'en-US', cancelText: '그만' },
  { id: 'invalid', locale: 'xx_!!' },
  { id: 'none' },
] as const;
const Region = defineComponent({
  props: { id: { type: String, required: true }, cancelText: { type: String, default: undefined } },
  setup(props) {
    const feedback = K.useKjunFeedback();
    const modal = ref(false);
    return () => <div data-testid={'region-' + props.id}>
      <K.KjunButton onClick={() => feedback.confirm({ message: 'Proceed ' + props.id, cancelText: props.cancelText })}>{'confirm ' + props.id}</K.KjunButton>
      <K.KjunButton onClick={() => { modal.value = true; }}>{'modal ' + props.id}</K.KjunButton>
      <K.KjunModal open={modal.value} onUpdate:open={(v: boolean) => { modal.value = v; }} title={'Modal ' + props.id}>
        <K.KjunButton onClick={() => { modal.value = false; }}>{'done ' + props.id}</K.KjunButton>
      </K.KjunModal>
      <K.KjunPagination totalPages={3} currentPage={2} />
      <K.KjunEmpty />
      <K.KjunDatePicker modelValue="2026-10-23" />
    </div>;
  },
});
createApp(() => <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', padding: '16px' }}>
  {regions.map(({ id, ...rest }: any) => {
    const { cancelText, ...provider } = rest;
    return <K.KjunProvider key={id} {...provider}><K.KjunFeedbackProvider><Region id={id} cancelText={cancelText} /></K.KjunFeedbackProvider></K.KjunProvider>;
  })}
</div>).mount('#root');
