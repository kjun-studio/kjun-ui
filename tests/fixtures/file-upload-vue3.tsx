import { createApp, defineComponent, ref, type PropType } from 'vue';
import * as K from '@kjun-ui/vue3';
import { applyDemoColors } from '../../shared/demo-colors';
import { fuAccepted, fuAdvance, fuCases } from './file-upload-cases';
applyDemoColors('default');
// Same sections, logs and DOM as file-upload-cases.tsx (React/Native).
const Case = defineComponent({
  props: {
    caseId: { type: String, required: true }, options: { type: Object as PropType<Record<string, unknown>>, required: true },
    initial: { type: Array as PropType<any[]>, default: () => [] }, form: { type: Object as PropType<Record<string, unknown>>, default: undefined },
  },
  setup(props) {
    const files = ref<any[]>(props.initial), log = ref<Record<string, unknown>[]>([]);
    const push = (entry: Record<string, unknown>) => { log.value = [...log.value, entry]; };
    const field = () => <K.KjunFileUpload files={files.value} {...props.options}
      onSelect={(accepted: File[], rejected: { file: File; reason: string }[]) => {
        push({ select: { accepted: accepted.map(f => f.name), rejected: rejected.map(r => [r.file.name, r.reason]) } });
        files.value = fuAccepted(files.value, accepted);
      }}
      onRemove={(id: string) => { push({ remove: id }); files.value = files.value.filter(f => f.id !== id); }}
      onRetry={(id: string) => { push({ retry: id }); files.value = files.value.map(f => f.id === id ? { ...f, status: 'uploading', progress: 10 } : f); }} />;
    return () => <div data-testid={props.caseId} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      {props.form ? <K.KjunFormGroup {...props.form}>{{ default: field }}</K.KjunFormGroup> : field()}
      <button type="button" data-testid={props.caseId + '-advance'} onClick={() => { files.value = fuAdvance(files.value); }}>advance</button>
      <output data-testid={props.caseId + '-log'}>{JSON.stringify(log.value)}</output>
    </div>;
  },
});
const App = defineComponent(() => () => <K.KjunProvider>{{ default: () =>
  <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', padding: '16px', width: '360px' }}>
    {fuCases.map(c => <Case key={c.id} caseId={c.id} options={c.props} initial={c.initial ?? []} form={c.form} />)}
  </div> }}</K.KjunProvider>);
createApp(App).mount('#root');
