import { createApp, defineComponent, reactive } from 'vue';
import * as K from '@kjun-ui/vue3';
import { cssPalette } from './typography-values';

cssPalette();
const query = new URLSearchParams(location.search), bare = query.has('bare'), custom = query.has('custom'), long = query.has('long');
// A Modal whose confirm starts a save (loading) and a body button that ends it; ?bare drops the title, ?custom puts a
// button in the header slot, ?long overflows the body.
const App = defineComponent(() => {
  const s = reactive({ open: false, loading: false, edits: 0 });
  return () => <K.KjunProvider>
    <K.KjunButton onClick={() => s.open = true}>열기</K.KjunButton>
    <output data-testid="state">{s.open ? 'open' : 'closed'}</output><output data-testid="edits">{s.edits}</output>
    <K.KjunModal open={s.open} onUpdate:open={(v: boolean) => s.open = v} showFooter confirmText="저장" loading={s.loading}
      onConfirm={() => s.loading = true} title={bare || custom ? '' : '편집'}>
      {{
        default: () => [<K.KjunButton variant="secondary" onClick={() => s.loading = false}>진행 끝</K.KjunButton>,
          ...(long ? Array.from({ length: 40 }, (_, i) => <p>본문 {i + 1}</p>) : [])],
        ...(custom ? { header: () => <span style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>맞춤 제목<K.KjunButton variant="ghost" size="sm" onClick={() => s.edits++}>이름 바꾸기</K.KjunButton></span> } : {}),
      }}
    </K.KjunModal>
  </K.KjunProvider>;
});
createApp(App).mount('#root');
